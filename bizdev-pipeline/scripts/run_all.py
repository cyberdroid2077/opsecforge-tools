#!/usr/bin/env python3
import subprocess
import os
import time

# Pipeline excluding the publisher, which is triggered by the approval bridge
scripts = [
    "run_index_updater.py",
    "enqueue_daily_topic.py",
    "run_keyword_scout.py",
    "run_outline_editor.py",
    "run_writer_qwen.py",
    "run_seo_polish.py",
    "run_ai_review.py",
    "run_approval_notifier.py" 
]

base_dir = "/home/dingw/opsecforge-tools/ai-seo/scripts"

def run_pipeline():
    for script in scripts:
        script_path = os.path.join(base_dir, script)
        print(f"--- Running {script} ---")
        try:
            # Execute with source environment
            subprocess.run(["/usr/bin/python3", script_path], check=True)
            print(f"--- Finished {script} ---")
            time.sleep(2)
        except subprocess.CalledProcessError as e:
            print(f"Pipeline failed at {script}: {e}")
            break

if __name__ == "__main__":
    run_pipeline()
