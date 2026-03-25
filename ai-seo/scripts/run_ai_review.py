#!/usr/bin/env python3
import os, glob, json, subprocess, time, re

base = "/home/dingw/opsecforge-tools/ai-seo"

def sanitize_content(text):
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    text = ansi_escape.sub('', text)
    markers = ["Waiting for agent reply", "does not support thinking", "I'd be happy to review", "Please paste the actual"]
    for m in markers:
        if m.lower() in text.lower():
            raise ValueError(f"Content contaminated with marker: {m}")
    return text.strip()

for md_path in glob.glob(f"{base}/queue/publish_ready/*.md"):
    if md_path.endswith('.review.md') or md_path.endswith('.ai_review.md'): continue
    
    review_json_path = md_path.replace(".md", ".ai_review.json")
    task_id = os.path.basename(md_path).replace('.md', '')
    
    # If a notes.txt exists, it's a rework, so delete the old review to force re-review
    notes_path = md_path.replace(".md", ".notes.txt")
    if os.path.exists(notes_path) and os.path.exists(review_json_path):
        os.remove(review_json_path)
        print(f"Rework detected, deleted old review for {task_id}")

    if os.path.exists(review_json_path): continue
    
    with open(md_path, 'r') as f: content = f.read()
    
    # Check for contamination before review
    try:
        sanitize_content(content)
    except ValueError:
        print(f"Skipping {task_id}: source markdown contaminated")
        continue

    # Load task data
    json_path = os.path.join(base, "queue/publish_ready", f"{task_id}.json")
    if not os.path.exists(json_path):
        print(f"Skipping review: No JSON for {task_id}")
        continue
    with open(json_path, 'r') as jf: task_data = json.load(jf)
        
    with open(f"{base}/prompts/review.txt") as pf:
        prompt = pf.read().replace('{content}', content)
        
    try:
        cmd = [
            "openclaw", "agent", 
            "--agent", "fred", 
            "--session-id", f"seo-review-{task_id}",
            "--json",
            "--message", prompt
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Agent failed: {result.stderr}")
            
        output_json = json.loads(result.stdout)
        # Log raw response
        with open(f"{base}/logs/ai_review.raw.log", "w") as rf:
            rf.write(result.stdout)

        try:
            review_str = output_json['result']['payloads'][0]['text'].strip()
        except (KeyError, IndexError) as e:
            # Try to handle potential structure variations
            print(f"Extraction error for {task_id}: {e}")
            continue
            
        if review_str.lower() in ["null", "none", "{}", "[]", ""]:
             raise ValueError("Agent returned invalid/empty review content")
             
        try:
            # Look for JSON block if not direct text
            if '{' in review_str and '}' in review_str:
                json_str = review_str[review_str.find('{'):review_str.rfind('}')+1]
            else:
                json_str = review_str
            review_data = json.loads(json_str)
        except Exception as e:
            print(f"Failed to parse JSON for {task_id}: {e}\nRaw: {review_str}")
            continue
        
        scores = review_data['scores']
        review_data['total_score'] = int((sum(scores.values()) / 60) * 100)
        review_data['reviewed_at'] = time.strftime('%Y-%m-%dT%H:%M:%S')
        review_data['model'] = 'gemini-3.1-flash-lite-preview'
        
        with open(review_json_path, "w") as jf:
            json.dump(review_data, jf, indent=2)
            
        md_summary = f"# AI Review Summary - {task_id}\n"
        md_summary += f"- **Recommendation**: {review_data['recommendation'].upper()}\n"
        md_summary += f"- **Total Score**: {review_data['total_score']}\n"
        md_summary += f"- **Reason**: {review_data['short_reason']}\n"
        md_summary += f"- **Red Flags**: {', '.join(review_data['red_flags'])}\n"
        
        with open(md_path.replace(".md", ".ai_review.md"), "w") as mf:
            mf.write(md_summary)
            
        with open(f"{base}/logs/ai_review.log", "a") as lf:
            lf.write(f"[{time.ctime()}] Reviewed {task_id}: {review_data['recommendation']}\n")
    except Exception as e:
        print(f"Failed review for {task_id}: {e}")
        with open(f"{base}/logs/ai_review.log", "a") as lf:
            lf.write(f"[{time.ctime()}] Failed review for {task_id}: {e}\n")

# Event-driven: trigger the next pipeline step
import subprocess
subprocess.Popen(['/usr/bin/python3', '/home/dingw/opsecforge-tools/ai-seo/scripts/run_approval_notifier.py'])
