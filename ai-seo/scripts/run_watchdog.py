#!/usr/bin/env python3
import os, glob, json, time, datetime

base = "/home/dingw/opsecforge-tools/ai-seo"
# Configuration: Set to True when fully automated publisher is active
AUTO_PUBLISH_ENABLED = False 

queues = ['queue', 'queue/keyword_ready', 'queue/outline_ready', 'queue/draft_ready', 'queue/publish_ready', 'queue/failed']

today_str = time.strftime('%Y-%m-%d')
now = time.time()
now_dt = datetime.datetime.now()

status = {
    "date": today_str,
    "preflight_ok": True,
    "enqueued": False,
    "keyword_done": False,
    "outline_done": False,
    "writer_done": False,
    "polish_done": False,
    "published": False,
    "failed_tasks": [],
    "stuck_tasks": [],
    "queue_counts": {os.path.basename(q) if q != 'queue' else 'queue': 0 for q in queues},
    "last_error_summary": ""
}

# 1. Check Preflight
preflight_log = f"{base}/logs/preflight.log"
if os.path.exists(preflight_log):
    with open(preflight_log, 'r') as f:
        log_content = f.read()
        if "ERROR" in log_content.upper() and os.path.getmtime(preflight_log) > time.mktime(time.strptime(today_str, "%Y-%m-%d")):
            status["preflight_ok"] = False

# 2. Status inference
for q in queues:
    q_name = os.path.basename(q) if q != 'queue' else 'queue'
    files = glob.glob(f"{base}/{q}/*.json")
    status["queue_counts"][q_name] = len(files)
    
    for f in files:
        if q_name in ['keyword_ready', 'outline_ready', 'draft_ready', 'publish_ready']:
            status["keyword_done"] = True
        if q_name in ['outline_ready', 'draft_ready', 'publish_ready']:
            status["outline_done"] = True
        if q_name in ['draft_ready', 'publish_ready']:
            status["writer_done"] = True
        if q_name == 'publish_ready':
            status["polish_done"] = True
            
        # Stuck check: mtime > 2 hours
        if now - os.path.getmtime(f) > 7200:
            status["stuck_tasks"].append(os.path.basename(f))

# Check enqueued status
if sum(status["queue_counts"].values()) > 0:
    status["enqueued"] = True

# 3. Check published
pub_log = f"{base}/logs/publisher.log"
if os.path.exists(pub_log) and os.path.getmtime(pub_log) > time.mktime(time.strptime(today_str, "%Y-%m-%d")):
     with open(pub_log, 'r') as f:
         if any("Published" in l for l in f.readlines()[-50:]):
             status["published"] = True

# 4. Error Logging
error_lines = []
for log_file in glob.glob(f"{base}/logs/*.log"):
    if os.path.exists(log_file) and os.path.getmtime(log_file) > now - 86400:
        with open(log_file, 'r') as f:
            for line in f:
                if any(x in line.lower() for x in ["error", "failed", "exception"]):
                    error_lines.append(f"{os.path.basename(log_file)}: {line.strip()}")
status["last_error_summary"] = "\n".join(error_lines[-5:])

with open(f"{base}/state/daily_status.json", "w") as f:
    json.dump(status, f, indent=2)

# Evaluation
errors = []
warnings = []
if not status["preflight_ok"]: errors.append("Preflight failed")

# Smart evaluation for published status
if now_dt.hour >= 10 and now_dt.minute >= 30 and not status["published"]:
    if AUTO_PUBLISH_ENABLED:
        errors.append("10:30 passed, nothing published (Auto-Publish ON)")
    elif status["queue_counts"]["publish_ready"] > 0:
        warnings.append("10:30 passed, tasks in publish_ready but not published (Semi-Auto Mode)")

if status["stuck_tasks"]: errors.append(f"Stuck: {len(status['stuck_tasks'])}")
if status["failed_tasks"] or status["queue_counts"]["failed"] > 0: warnings.append("Items in failed queue")

overall = "ERROR" if errors else ("WARNING" if warnings else "OK")

# Reports
md = f"# Watchdog {today_str}\nStatus: {overall}\n\n"
md += "".join([f"- {k}: {v}\n" for k,v in status['queue_counts'].items()])
if warnings: md += f"\n## Warnings\n- " + "\n- ".join(warnings) + "\n"
if errors: md += f"\n## Errors\n- " + "\n- ".join(errors) + "\n"

with open(f"{base}/reports/daily_watchdog_{today_str}.md", "w") as f: f.write(md)
with open(f"{base}/reports/discord_alert_{today_str}.txt", "w") as f: f.write(f"{overall} | Published: {status['published']}")
print(f"Watchdog Status: {overall}")
