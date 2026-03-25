import os, time
def acquire_lock(task_id):
    lock_path = f"/home/dingw/opsecforge-tools/ai-seo/locks/{task_id}.lock"
    # If lock is older than 1 hour, assume stale and remove it
    if os.path.exists(lock_path):
        if time.time() - os.path.getmtime(lock_path) > 3600:
            os.remove(lock_path)
        else:
            return False
    with open(lock_path, "w") as f: f.write(str(time.time()))
    return True
def release_lock(task_id):
    lock_path = f"/home/dingw/opsecforge-tools/ai-seo/locks/{task_id}.lock"
    if os.path.exists(lock_path): os.remove(lock_path)
