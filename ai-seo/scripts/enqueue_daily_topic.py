#!/usr/bin/env python3
import json, time, uuid, os, random, subprocess

base = "/home/dingw/opsecforge-tools/ai-seo"
topics_file = f"{base}/keywords/topics.json"
index_file = f"{base}/state/blog_index.json"

# Load topics pool
if os.path.exists(topics_file):
    with open(topics_file, "r") as f:
        all_topics = json.load(f)
else:
    all_topics = ["Cybersecurity tools and utilities"]

# Load already used topics
used_topics = []
if os.path.exists(index_file):
    with open(index_file, "r") as f:
        used_topics = list(json.load(f).keys())

# Find unused topics
unused_topics = [t for t in all_topics if t not in used_topics]

# Fallback: if all topics are used, just rotate through the whole pool
if not unused_topics:
    topic = random.choice(all_topics)
else:
    topic = random.choice(unused_topics)

# Fix: use %Y%m%d for stable 8-digit date format
task_id = f"{time.strftime('%Y%m%d')}_{str(uuid.uuid4())[:8]}"
data = {
    "task_id": task_id, "topic": topic, "created_at": time.time(), 
    "updated_at": time.time(), "status": "queued", "retries": 0
}

os.makedirs(f"{base}/queue", exist_ok=True)
with open(f"{base}/queue/{task_id}.json", "w") as f: json.dump(data, f)
print(f"Enqueued {task_id} with topic: {topic}")

# Event-driven: trigger the next pipeline step
subprocess.Popen(['/usr/bin/python3', '/home/dingw/opsecforge-tools/ai-seo/scripts/run_keyword_scout.py'])
