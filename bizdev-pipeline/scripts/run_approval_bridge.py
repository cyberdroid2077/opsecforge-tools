import sys, json, os, subprocess, time, shutil

base = "/home/dingw/opsecforge-tools/ai-seo"
MAP_PATH = f"{base}/state/approval_map.json"
LOG_PATH = f"{base}/logs/approval.log"

def log(msg):
    with open(LOG_PATH, "a") as f: f.write(f"[{time.ctime()}] {msg}\n")

def bridge(action, sid=None, notes=""):
    if action not in ["approve", "reject", "rework"]: return "Error: Invalid action"
    
    with open(MAP_PATH, 'r') as f: m = json.load(f)
    pending = [tid for tid, info in m['tasks'].items() if info['status'] in ['pending', 'rejected']]
    tid = None
    if not sid:
        if len(pending) != 1: return f"Error: Ambiguous task (pending {len(pending)})"
        tid = pending[0]
    else:
        for t, i in m['tasks'].items():
            if str(i['short_id']) == str(sid): tid = t; break
    
    if not tid or m['tasks'][tid]['status'] not in ['pending', 'rejected']: return "Error: Task invalid or not pending/rejected"
    
    # Handle Rework
    if action == "rework":
        if not os.path.exists(f"{base}/queue/publish_ready/{tid}.md"): return "Error: Source markdown missing"
        os.rename(f"{base}/queue/publish_ready/{tid}.md", f"{base}/queue/draft_ready/{tid}.md")
        if os.path.exists(f"{base}/queue/publish_ready/{tid}.json"):
            os.rename(f"{base}/queue/publish_ready/{tid}.json", f"{base}/queue/draft_ready/{tid}.json")
        with open(f"{base}/queue/draft_ready/{tid}.notes.txt", 'w') as f: f.write(notes)
        m['tasks'][tid]['status'] = "pending"
        with open(MAP_PATH, 'w') as f: json.dump(m, f, indent=2)
        log(f"Rework triggered for {tid}: {notes}"); subprocess.Popen(["/home/dingw/opsecforge-tools/ai-seo/venv/bin/python3", f"{base}/scripts/run_seo_polish.py"])
        return f"Success: Rework triggered for {tid}"

    review_path = f"{base}/queue/publish_ready/{tid}.review.md"
    if os.path.exists(review_path): return "Error: Review gate already exists"

    req_files = [f"{base}/queue/publish_ready/{tid}.{ext}" for ext in ['md', 'json', 'ai_review.json']]
    print(f'DEBUG: Checking files: {req_files}')
    if not all(os.path.exists(f) for f in req_files):
        log(f"Error: Missing files for {tid}"); return "Error: Missing source files"

    # 生成完整 Review Template
    review_content = (
        f"# Task Review: {tid}\n"
        f"Reviewer: Discord Approval Bridge\n"
        f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Final Decision: {'Publish Now' if action == 'approve' else 'Reject'}\n\n"
        f"{'[x] Publish Now' if action == 'approve' else '[ ] Publish Now'}\n"
        f"{'[x] Reject' if action == 'reject' else '[ ] Reject'}\n"
    )
    with open(review_path, 'w') as f: f.write(review_content)
    
    # Update Status
    status = "approved" if action == "approve" else "rejected"
    m['tasks'][tid]['status'] = status
    with open(MAP_PATH, 'w') as f: json.dump(m, f, indent=2)
    
    with open(f"{base}/queue/publish_ready/{tid}.ai_review.json", 'r+') as f:
        rev = json.load(f)
        rev.update({"approved": (action == "approve"), "status": status})
        f.seek(0); json.dump(rev, f, indent=2); f.truncate()

    if action == "approve":
        # Flow: approved articles go to enhance_ready for beautification + tool injection
        # before being moved to publish_ready for publishing.

        src_md = f"{base}/queue/publish_ready/{tid}.md"
        src_json = f"{base}/queue/publish_ready/{tid}.json"

        # Ensure enhance_ready queue exists
        os.makedirs(f"{base}/queue/enhance_ready", exist_ok=True)

        # Copy markdown to enhance_ready
        dest_md = f"{base}/queue/enhance_ready/{tid}.md"
        shutil.copy2(src_md, dest_md)

        # Copy and update JSON to point to the local draft
        with open(src_json, 'r') as sf:
            data = json.load(sf)
        data['draft_file'] = dest_md
        data['status'] = 'enhance_ready'
        dest_json = f"{base}/queue/enhance_ready/{tid}.json"
        with open(dest_json, 'w') as df:
            json.dump(data, df, indent=2)

        log(f"Approved {tid} -> enhance_ready")

        # Trigger the enhancer (in the background, so Discord doesn't timeout)
        subprocess.Popen(["/usr/bin/python3", f"{base}/scripts/run_enhancer.py"])
        log(f"Enhancer triggered for {tid}")

    return f"Success: {action} task {tid}"

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(1)
    print(bridge(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None, sys.argv[3] if len(sys.argv) > 3 else ""))
