#!/usr/bin/env python3
import os, glob, json, subprocess, time, re

def strip_markdown_fence(text):
    text = re.sub(r'^```(markdown)?\s*\n', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'\n```\s*$', '', text, flags=re.MULTILINE)
    return text.strip()

def normalize_text(text):
    text = text.replace('cafM-CM-)', '').replace('M-bM-^@M-^T', '')
    return text.encode('utf-8', 'ignore').decode('utf-8')

from file_lock import acquire_lock, release_lock
base = "/home/dingw/opsecforge-tools/ai-seo"
for f in glob.glob(f"{base}/queue/outline_ready/*.json"):
    task_id = os.path.basename(f).replace('.json', '')
    if not acquire_lock(task_id): continue
    try:
        with open(f, 'r') as jf: data = json.load(jf)
        outline = json.dumps(data['outline_data'])
        kw = data['keyword_data'].get('selected', '')
        with open(f"{base}/prompts/writer.txt") as pf: 
            prompt = pf.read().replace('{outline}', outline).replace('{keyword}', kw).replace('{research}', data['keyword_data'].get('research_summary', '')).replace('{date}', time.strftime('%Y-%m-%d')).replace('{title}', data['outline_data'].get('title', ''))
        cmd = [
            "/home/dingw/.npm-global/bin/openclaw", "agent", 
            "--agent", "nova", 
            "--session-id", f"seo-writer-{task_id}",
            "--json",
            "--message", prompt
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Agent failed: {result.stderr}")
        output_json = json.loads(result.stdout)
        try:
            clean_response = output_json['result']['payloads'][0]['text']
            clean_response = strip_markdown_fence(clean_response)
            clean_response = normalize_text(clean_response)
        except Exception as e:
            raise ValueError(f"Failed to extract text from agent JSON: {e}")
            
        if clean_response.lower() in ["null", "none", "{}", "[]", ""]:
            raise ValueError("Agent returned invalid/empty content")
        md_path = f"{base}/queue/draft_ready/{task_id}.md"
        with open(md_path, "w") as mf: mf.write(clean_response)
        data['draft_file'] = md_path
        data['status'] = 'draft_ready'
        with open(f"{base}/queue/draft_ready/{task_id}.json", "w") as outf: json.dump(data, outf)
        os.remove(f)
        with open(f"{base}/logs/writer.log", "a") as lf:
            lf.write(f"[{time.ctime()}] Wrote {task_id} successfully\n")
    except Exception as e:
        print(f"Failed {task_id}: {e}")
    finally:
        release_lock(task_id)

# Event-driven: trigger the next pipeline step
import subprocess
subprocess.Popen(['/usr/bin/python3', '/home/dingw/opsecforge-tools/ai-seo/scripts/run_seo_polish.py'])
