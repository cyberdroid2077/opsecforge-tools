#!/usr/bin/env python3
import os, glob, json, subprocess, shutil, time, re
from file_lock import acquire_lock, release_lock
base = "/home/dingw/opsecforge-tools/ai-seo"
repo = "/home/dingw/opsecforge-tools"

log_file = f"{base}/logs/publisher.log"

for f in glob.glob(f"{base}/queue/publish_ready/*.json"):
    if f.endswith('.ai_review.json'): continue
    task_id = os.path.basename(f).replace('.json', '')
    if not acquire_lock(task_id): continue
    try:
        with open(f, 'r') as jf: data = json.load(jf)
        
        # 1. Robust Review Check
        review_path = os.path.join(base, "queue/publish_ready", f"{task_id}.review.md")
        if not os.path.exists(review_path):
            with open(log_file, "a") as log: log.write(f"{time.ctime()} - Task {task_id} skipped: Review file missing\n")
            continue
        
        publish_checked = False
        reject_checked = False
        with open(review_path, 'r') as rf:
            for line in rf:
                clean_line = line.strip()
                if clean_line == "[x] Publish Now":
                    publish_checked = True
                elif clean_line == "[x] Reject":
                    reject_checked = True
        
        if publish_checked and reject_checked:
            with open(log_file, "a") as log: log.write(f"{time.ctime()} - Task {task_id} skipped: Conflicting review decisions\n")
            continue
        if reject_checked:
            with open(log_file, "a") as log: log.write(f"{time.ctime()} - Task {task_id} skipped: Explicitly Rejected\n")
            continue
        if not publish_checked:
            with open(log_file, "a") as log: log.write(f"{time.ctime()} - Task {task_id} skipped: Not marked 'Publish Now'\n")
            continue

        if data.get('publish_status') == 'published':
            print(f"Task {task_id} already published. Skipping.")
            os.remove(f)
            continue
            
        md_file = data['publish_file']
        slug = re.sub(r'[^a-z0-9]+', '-', data['keyword_data'].get('selected', task_id).lower()).strip('-')
        dest = os.path.join(repo, f"content/blog/{slug}.md")
        
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy(md_file, dest)
        
        # Git ops
        subprocess.run(["git", "add", dest], cwd=repo, check=True)
        # Attempt to commit, but don't fail if nothing to commit
        subprocess.run(["git", "commit", "-m", f"Auto-publish: {slug}"], cwd=repo)
        
        # Enable full automation: push to remote
        subprocess.run(["git", "push", "origin", "main"], cwd=repo, check=True)
        
        # Write to published_urls queue for QA verification
        pub_url_file = f"{base}/queue/published_urls/{task_id}.json"
        with open(pub_url_file, 'w') as pf:
            json.dump({
                "task_id": task_id,
                "published_file": dest,
                "published_slug": slug
            }, pf)
        
        # Update metadata
        data['published_at'] = time.time()
        data['publish_status'] = 'published'
        data['published_slug'] = slug
        
        with open(f, 'w') as outf: json.dump(data, outf)
        print(f"Published {slug}")
        os.remove(f)
    except Exception as e:
        print(f"Failed publisher for {task_id}: {e}")
    finally:
        release_lock(task_id)
