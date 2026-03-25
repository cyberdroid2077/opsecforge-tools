#!/usr/bin/env python3
import subprocess
import os
import time
import sys

# Pipeline excluding the enqueuer and approval/publisher
scripts = [
    "run_keyword_scout.py",
    "run_outline_editor.py",
    "run_writer_qwen.py",
    "run_seo_polish.py",
    "run_ai_review.py",
    "run_approval_notifier.py",
    "run_publisher.py",
    "run_qa_verifier.py"
]

base_dir = "/home/dingw/opsecforge-tools/ai-seo/scripts"
LOCK_FILE = "/tmp/ai_seo_processor.lock"

def run_processor():
    # Prevent concurrent execution
    if os.path.exists(LOCK_FILE):
        print("Processor already running. Skipping.")
        return
    
    with open(LOCK_FILE, "w") as f:
        f.write(str(os.getpid()))

    try:
        for script in scripts:
            script_path = os.path.join(base_dir, script)
            try:
                # Execute with venv python
                subprocess.run(["/home/dingw/opsecforge-tools/ai-seo/venv/bin/python3", script_path], check=True)
                time.sleep(2)
            except subprocess.CalledProcessError as e:
                # We don't want to break the whole loop if one task fails
                print(f"Processor failed at {script}: {e}")
    finally:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)

if __name__ == "__main__":
    run_processor()
