#!/usr/bin/env python3
import os, glob, json, subprocess
base = "/home/dingw/opsecforge-tools/ai-seo"
files = glob.glob(f"{base}/queue/outline_ready/*.json")
print(f"Files found: {files}")
for f in files:
    task_id = os.path.basename(f).replace('.json', '')
    print(f"Processing {task_id}")
    with open(f, 'r') as jf: data = json.load(jf)
    print("Data loaded")
