#!/usr/bin/env python3
"""
run_enhancer.py — Enhancer Node for the SEO pipeline.

Takes approved articles from queue/enhance_ready, beautifies them with proper
formatting, and injects relevant OpSecForge tool callouts, then moves them
to queue/publish_ready for publishing.

Runs after approval, before publishing.
"""
import os, glob, json, subprocess, time, re

base = "/home/dingw/opsecforge-tools/ai-seo"

def log(msg):
    log_path = f"{base}/logs/enhancer.log"
    with open(log_path, "a") as f:
        f.write(f"[{time.ctime()}] {msg}\n")

def strip_markdown_fence(text):
    text = re.sub(r'^```(markdown)?\s*\n', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'\n```\s*$', '', text, flags=re.MULTILINE)
    return text.strip()

def normalize_text(text):
    text = text.replace('\ufeff', '')
    return text.encode('utf-8', 'ignore').decode('utf-8')

def extract_article(text):
    match = re.search(r'<article>\s*(.*?)\s*</article>', text, flags=re.DOTALL | re.IGNORECASE)
    if not match:
        return ""
    return match.group(1).strip()

from file_lock import acquire_lock, release_lock

# Load tools catalog
catalog_path = f"{base}/opsecforge_tools_catalog.json"
with open(catalog_path, 'r') as f:
    tools_catalog = json.load(f)
tools_json = json.dumps(tools_catalog, indent=2)

# Load prompt template
prompt_path = f"{base}/prompts/enhancer.txt"
with open(prompt_path, 'r') as pf:
    prompt_template = pf.read()

for f in glob.glob(f"{base}/queue/enhance_ready/*.json"):
    task_id = os.path.basename(f).replace('.json', '')
    if not acquire_lock(task_id):
        log(f"Skipping {task_id}: could not acquire lock")
        continue

    try:
        with open(f, 'r') as jf:
            data = json.load(jf)

        # Read the draft markdown
        md_path = data.get('draft_file', f"{base}/queue/enhance_ready/{task_id}.md")
        if not os.path.exists(md_path):
            # Try finding it alongside the JSON
            alt_path = f"{base}/queue/enhance_ready/{task_id}.md"
            if os.path.exists(alt_path):
                md_path = alt_path
            else:
                log(f"ERROR: Draft markdown not found for {task_id}: {md_path}")
                continue

        with open(md_path, 'r', encoding='utf-8') as mf:
            draft_content = mf.read()

        # Build the prompt
        prompt = prompt_template.replace('{tool_catalog}', tools_json).replace('{draft}', draft_content)

        log(f"Enhancing {task_id}...")

        cmd = [
            "/home/dingw/.npm-global/bin/openclaw", "agent",
            "--agent", "nova",
            "--session-id", f"seo-enhancer-{task_id}",
            "--message", prompt
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5-minute timeout
        )

        if result.returncode != 0:
            log(f"ERROR: Enhancer agent failed for {task_id}: {result.stderr}")
            # Don't remove — leave for retry
            continue

        output = result.stdout.strip()

        # Extract markdown from response (handle plain text responses)
        if output.startswith('{') or output.startswith('['):
            try:
                output_json = json.loads(output)
                # Try to find text in common response shapes
                if isinstance(output_json, dict):
                    if 'text' in output_json:
                        enhanced = output_json['text']
                    elif 'message' in output_json:
                        enhanced = output_json['message']
                    elif 'result' in output_json and isinstance(output_json['result'], dict):
                        text_field = output_json['result'].get('text') or output_json['result'].get('message') or output_json['result'].get('content', '')
                        enhanced = text_field
                    else:
                        enhanced = json.dumps(output_json)
                else:
                    enhanced = str(output_json)
            except json.JSONDecodeError:
                enhanced = output
        else:
            enhanced = output

        enhanced = normalize_text(enhanced)
        enhanced = extract_article(enhanced)
        enhanced = strip_markdown_fence(enhanced)

        if not enhanced or enhanced.lower() in ["null", "none", "{}", "[]"]:
            log(f"ERROR: Enhancer returned empty or unwrapped article content for {task_id}")
            continue

        # Save enhanced markdown to publish_ready
        out_md_path = f"{base}/queue/publish_ready/{task_id}.md"
        with open(out_md_path, "w", encoding='utf-8') as mf:
            mf.write(enhanced)

        # Copy the JSON metadata to publish_ready
        out_json_path = f"{base}/queue/publish_ready/{task_id}.json"
        data['draft_file'] = md_path
        data['enhanced_file'] = out_md_path
        data['status'] = 'publish_ready'
        with open(out_json_path, 'w', encoding='utf-8') as jf:
            json.dump(data, jf, indent=2)

        log(f"SUCCESS: Enhanced {task_id} -> publish_ready")

        # Remove from enhance_ready
        os.remove(f)
        if os.path.exists(md_path):
            os.remove(md_path)

    except subprocess.TimeoutExpired:
        log(f"ERROR: Enhancer timed out for {task_id}")
    except Exception as e:
        log(f"ERROR: Exception for {task_id}: {e}")
    finally:
        release_lock(task_id)

log("Enhancer run complete.")
