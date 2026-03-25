#!/usr/bin/env python3
import os, glob, json, subprocess, time, re
from file_lock import acquire_lock, release_lock

base = "/home/dingw/opsecforge-tools/ai-seo"

def strip_markdown_fence(text):
    match = re.search(r'(---\n(?:.*?\n)?---\n.*)', text, re.DOTALL)
    if match:
        text = match.group(1)
    text = re.sub(r'^```(markdown)?\s*\n', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'\n```\s*$', '', text, flags=re.MULTILINE)
    return text.strip()

def normalize_text(text):
    text = text.replace('cafM-CM-)', '').replace('M-bM-^@M-^T', '')
    return text.encode('utf-8', 'ignore').decode('utf-8')

def cleanup_spam_links(text):
    return re.sub(r'\[Security\]\(/blog/zero-trust-identity-centric-security-utilities-for-2026\)', 'Security', text, flags=re.IGNORECASE)

for f in glob.glob(f"{base}/queue/draft_ready/*.json"):
    if f.endswith(".ai_review.json"): continue
    print(f"DEBUG: Found file {f}")
    task_id = os.path.basename(f).replace('.json', '')
    if not acquire_lock(task_id): 
        print(f"DEBUG: Lock failed for {task_id}")
        continue
    print(f"DEBUG: Processing {task_id}")
    try:
        with open(f, 'r') as jf: data = json.load(jf)
        source_md_path = f.replace('.json', '.md')
        with open(source_md_path, 'r') as mf: draft = mf.read()
        
        notes_path = f"{base}/queue/draft_ready/{task_id}.notes.txt"
        if not os.path.exists(notes_path):
             notes_path = f"{base}/queue/publish_ready/{task_id}.notes.txt"
        
        if os.path.exists(notes_path):
            with open(notes_path, 'r') as nf: 
                notes = nf.read()
            if notes.strip():
                draft += f"\n\n[CRITICAL FEEDBACK FROM REVIEWER]: {notes}"
            os.remove(notes_path)

        draft = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', draft)

        with open(f"{base}/prompts/polish.txt") as pf: prompt = pf.read().replace('{draft}', draft)
        
        cmd = [
            "/home/dingw/.npm-global/bin/openclaw", "agent", 
            "--agent", "producer", 
            "--session-id", f"seo-polish-{task_id}",
            "--json",
            "--message", prompt
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Agent failed: {result.stderr}")
            
        output_json = json.loads(result.stdout)
        
        with open(f"{base}/logs/polish.raw.log", "w") as rf:
            rf.write(result.stdout)

        try:
            clean_content = output_json.get('result', output_json).get('payloads', [{}])[0].get('text', '')
        except Exception as e:
            raise ValueError(f"Failed to extract text from agent JSON: {e}")
            
        clean_content = strip_markdown_fence(clean_content)
        clean_content = normalize_text(clean_content)
        clean_content = cleanup_spam_links(clean_content)
        
        if clean_content.lower() in ["null", "none", "{}", "[]", ""]:
            raise ValueError("Invalid agent response: Content is null/none/empty")
            
        md_path = f"{base}/queue/publish_ready/{task_id}.md"
        with open(md_path, "w") as mf: mf.write(clean_content)
        data['publish_file'] = md_path
        data['status'] = 'publish_ready'
        with open(f"{base}/queue/publish_ready/{task_id}.json", "w") as outf: json.dump(data, outf)
        
        if f != f"{base}/queue/publish_ready/{task_id}.json":
            os.remove(f)
        if source_md_path != md_path and os.path.exists(source_md_path):
            os.remove(source_md_path)
        
        with open(f"{base}/logs/polish.log", "a") as lf:
            lf.write(f"[{time.ctime()}] Polished {task_id} successfully\n")
    except Exception as e:
        print(f"Failed {task_id}: {e}")
    finally:
        release_lock(task_id)

import subprocess
subprocess.Popen(['/usr/bin/python3', '/home/dingw/opsecforge-tools/ai-seo/scripts/run_ai_review.py'])
