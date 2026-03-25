#!/usr/bin/env python3
import os, glob, json, subprocess, time
from file_lock import acquire_lock, release_lock
base = "/home/dingw/opsecforge-tools/ai-seo"
log_path = f"{base}/logs/outline.log"

def log(msg):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{ts}] {msg}"
    print(line)
    with open(log_path, "a") as lf:
        lf.write(line + "\n")

for f in glob.glob(f"{base}/queue/keyword_ready/*.json"):
    task_id = os.path.basename(f).replace('.json', '')
    if not acquire_lock(task_id): continue
    try:
        with open(f, 'r') as jf: data = json.load(jf)
        kw = data['keyword_data'].get('selected', 'security tool')
        with open(f"{base}/prompts/outline.txt") as pf: 
            prompt = pf.read().replace('{keyword}', kw).replace('{research}', data['keyword_data'].get('research_summary', ''))
        # Use subprocess.run with stderr redirect + timeout (consistent with run_ai_review.py)
        result = subprocess.run(
            ["/home/dingw/.npm-global/bin/openclaw", "agent",
             "--agent", "fred", "--message", prompt],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            raise RuntimeError(f"openclaw agent exited {result.returncode}: {result.stderr[:300]}")
        res = result.stdout
        start = res.find('{')
        end = res.rfind('}') + 1
        if start == -1 or end == 0:
            log(f"JSON not found for {task_id}: {res[:500]}")
            raise ValueError(f"No JSON in agent output for {task_id}")
        json_str = res[start:end]
        try:
            data['outline_data'] = json.loads(json_str)
        except json.JSONDecodeError as je:
            log(f"JSON parse error for {task_id}: {je} | snippet: {json_str[:300]}")
            raise
        data['status'] = 'outline_ready'
        with open(f"{base}/queue/outline_ready/{task_id}.json", "w") as outf: json.dump(data, outf)
        os.remove(f)
        log(f"Outline OK: {task_id}")
    except subprocess.TimeoutExpired:
        log(f"Timeout for {task_id} (60s) — releasing lock for retry")
        release_lock(task_id)
        continue
    except Exception as e:
        log(f"Failed {task_id}: {e}")
    finally:
        release_lock(task_id)

# Event-driven: trigger the next pipeline step
import subprocess
subprocess.Popen(['/usr/bin/python3', '/home/dingw/opsecforge-tools/ai-seo/scripts/run_writer_qwen.py'])
