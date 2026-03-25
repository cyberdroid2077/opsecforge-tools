#!/usr/bin/env python3
"""
run_qa_verifier.py - QA Verifier Node for the SEO pipeline.

Reads published article metadata from queue/published_urls/, waits for the live
URL to return HTTP 200, asks the `fred` agent to inspect the rendered content,
sends a Discord embed, and removes the queue item when finished.
"""
import glob
import html
import json
import os
import re
import subprocess
import time

import requests

from file_lock import acquire_lock, release_lock

base = "/home/dingw/opsecforge-tools/ai-seo"
log_file = f"{base}/logs/qa_verifier.log"
OPENCLAW = "/home/dingw/.npm-global/bin/openclaw"
FETCH_TIMEOUT_SECONDS = 20
FETCH_INTERVAL_SECONDS = 15
FETCH_DEADLINE_SECONDS = 180


def log(msg):
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"[{time.ctime()}] {msg}\n")


def get_webhook_url():
    url = os.getenv("DISCORD_WEBHOOK_URL")
    if url:
        return url

    env_path = os.path.join(base, ".env")
    if not os.path.exists(env_path):
        return None

    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("DISCORD_WEBHOOK_URL="):
                    return line.split("=", 1)[1].strip().strip("'\"")
    except Exception as exc:
        log(f"ERROR: Failed reading .env for webhook URL: {exc}")
    return None


def extract_text_from_html(raw_html):
    cleaned = re.sub(r"(?is)<script.*?>.*?</script>", " ", raw_html)
    cleaned = re.sub(r"(?is)<style.*?>.*?</style>", " ", cleaned)
    cleaned = re.sub(r"(?is)<noscript.*?>.*?</noscript>", " ", cleaned)
    cleaned = re.sub(r"(?i)<br\s*/?>", "\n", cleaned)
    cleaned = re.sub(r"(?i)</p\s*>", "\n\n", cleaned)
    cleaned = re.sub(r"(?i)</(div|section|article|h1|h2|h3|h4|h5|h6|li)>", "\n", cleaned)
    cleaned = re.sub(r"(?s)<[^>]+>", " ", cleaned)
    cleaned = html.unescape(cleaned)
    cleaned = cleaned.replace("\ufeff", "")
    cleaned = re.sub(r"\r\n?", "\n", cleaned)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def fetch_live_url(url):
    deadline = time.time() + FETCH_DEADLINE_SECONDS
    last_error = None

    while time.time() < deadline:
        try:
            response = requests.get(
                url,
                timeout=FETCH_TIMEOUT_SECONDS,
                headers={
                    "User-Agent": "OpSecForge-QA-Verifier/1.0",
                    "Accept": "text/html,application/xhtml+xml",
                },
            )
            if response.status_code == 200:
                return response.text, extract_text_from_html(response.text)
            last_error = f"HTTP {response.status_code}"
            log(f"INFO: Live URL not ready for {url}: {last_error}")
        except requests.RequestException as exc:
            last_error = str(exc)
            log(f"INFO: Live URL fetch failed for {url}: {exc}")

        if time.time() + FETCH_INTERVAL_SECONDS >= deadline:
            break
        time.sleep(FETCH_INTERVAL_SECONDS)

    raise RuntimeError(f"Timed out waiting for HTTP 200 from {url}. Last result: {last_error}")


def build_qa_prompt(url, live_text, live_html):
    text_excerpt = live_text[:12000]
    html_excerpt = live_html[:12000]
    return f"""You are a strict QA verifier reviewing a live blog page.

Check the rendered page content for:
- tool callouts or internal AI workflow leakage such as mentions of agents, prompts, system messages, XML wrappers, TODOs, or placeholders
- broken formatting, malformed markdown remnants, raw HTML leakage, or obviously bad rendering
- overall publish quality issues that are visible on the live page

Reply with exactly two concise lines in this format:
STATUS: PASS|WARN
REASON: <short reason under 220 characters>

Return PASS only if the page looks clean and publishable. Return WARN if you see any visible issue or possible issue.

URL: {url}

LIVE TEXT:
\"\"\"
{text_excerpt}
\"\"\"

LIVE HTML EXCERPT:
\"\"\"
{html_excerpt}
\"\"\"
"""


def parse_openclaw_response(stdout):
    stdout = stdout.strip()
    if not stdout:
        raise ValueError("Empty response from openclaw")

    payload_text = stdout
    if stdout.startswith("{") or stdout.startswith("["):
        data = json.loads(stdout)
        if isinstance(data, dict):
            payloads = data.get("result", {}).get("payloads")
            if payloads and isinstance(payloads, list):
                payload_text = payloads[0].get("text", "") or stdout
            else:
                payload_text = data.get("text") or data.get("message") or stdout

    payload_text = payload_text.strip()
    status_match = re.search(r"STATUS:\s*(PASS|WARN)", payload_text, re.IGNORECASE)
    reason_match = re.search(r"REASON:\s*(.+)", payload_text, re.IGNORECASE | re.DOTALL)

    status = status_match.group(1).upper() if status_match else "WARN"
    reason = reason_match.group(1).strip() if reason_match else payload_text
    reason = re.sub(r"\s+", " ", reason)[:220]
    return status, reason, payload_text


def run_live_qa(task_id, url, live_text, live_html):
    prompt = build_qa_prompt(url, live_text, live_html)
    cmd = [
        OPENCLAW,
        "agent",
        "--agent",
        "fred",
        "--session-id",
        f"seo-live-qa-{task_id}",
        "--json",
        "--message",
        prompt,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f"openclaw failed: {result.stderr.strip() or result.stdout.strip()}")
    return parse_openclaw_response(result.stdout)


def send_discord_embed(webhook_url, short_id, task_id, url, status, reason):
    color = 0x2ECC71 if status == "PASS" else 0xF1C40F
    payload = {
        "embeds": [
            {
                "title": f"✅ QA Verification (ID: {short_id})",
                "color": color,
                "fields": [
                    {"name": "Task ID", "value": task_id, "inline": True},
                    {"name": "URL", "value": url, "inline": False},
                    {"name": "Status", "value": status, "inline": True},
                    {"name": "Reason", "value": reason or "No reason provided.", "inline": False},
                ],
            }
        ]
    }
    response = requests.post(webhook_url, json=payload, timeout=20)
    if response.status_code not in (200, 204):
        raise RuntimeError(f"Discord webhook returned {response.status_code}: {response.text}")


def process_queue_file(queue_file):
    task_id = os.path.basename(queue_file).replace(".json", "")
    if not acquire_lock(task_id):
        log(f"Skipping {task_id}: could not acquire lock")
        return

    try:
        with open(queue_file, "r", encoding="utf-8") as jf:
            data = json.load(jf)

        slug = data.get("published_slug")
        if not slug:
            raise ValueError("Missing published_slug in queue payload")

        short_id = task_id[-8:] if len(task_id) >= 8 else task_id
        url = f"https://opsecforge.com/blog/{slug}"

        webhook_url = get_webhook_url()
        if not webhook_url:
            raise RuntimeError("DISCORD_WEBHOOK_URL not set in env or .env")

        log(f"INFO: Waiting for live URL for {task_id}: {url}")
        live_html, live_text = fetch_live_url(url)
        log(f"INFO: Live URL ready for {task_id}; running QA agent")

        status, reason, raw_response = run_live_qa(task_id, url, live_text, live_html)
        log(f"INFO: QA result for {task_id}: {status} - {reason}")
        log(f"DEBUG: QA raw response for {task_id}: {raw_response}")

        send_discord_embed(webhook_url, short_id, task_id, url, status, reason)
        log(f"SUCCESS: QA webhook sent for {task_id}")

        os.remove(queue_file)
        log(f"SUCCESS: QA completed and removed queue item for {task_id}")
    except subprocess.TimeoutExpired:
        log(f"ERROR: QA agent timed out for {task_id}")
    except Exception as exc:
        log(f"ERROR: Exception for {task_id}: {exc}")
    finally:
        release_lock(task_id)


def main():
    for queue_file in glob.glob(f"{base}/queue/published_urls/*.json"):
        process_queue_file(queue_file)
    log("QA Verifier run complete.")


if __name__ == "__main__":
    main()
