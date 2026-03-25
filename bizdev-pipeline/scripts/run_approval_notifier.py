import json, os, glob, requests, time

base = "/home/dingw/opsecforge-tools/ai-seo"
MAP_PATH = f"{base}/state/approval_map.json"
LOG_PATH = f"{base}/logs/approval_notifier.log"

def log(msg):
    with open(LOG_PATH, "a") as f: f.write(f"[{time.ctime()}] {msg}\n")

if not os.path.exists(MAP_PATH):
    if not os.path.exists(os.path.dirname(MAP_PATH)):
        os.makedirs(os.path.dirname(MAP_PATH))
    with open(MAP_PATH, 'w') as f: json.dump({"tasks": {}, "last_id": 0}, f)

def get_webhook_url():
    url = os.getenv('DISCORD_WEBHOOK_URL')
    if not url:
        try:
            env_path = os.path.join(base, '.env')
            if os.path.exists(env_path):
                with open(env_path, 'r') as f:
                    for line in f:
                        if line.startswith('DISCORD_WEBHOOK_URL='):
                            url = line.split('=', 1)[1].strip()
                            break
        except Exception as e:
            log(f"Error reading .env: {e}")
    return url

def notify():
    webhook_url = get_webhook_url()
    if not webhook_url:
        log("Error: DISCORD_WEBHOOK_URL not set in env or .env")
        return

    with open(MAP_PATH, 'r') as f: m = json.load(f)
    updated = False
    for review_file in glob.glob(f"{base}/queue/publish_ready/*.ai_review.json"):
        tid = os.path.basename(review_file).replace('.ai_review.json', '')
        if tid not in m['tasks']:
            m['last_id'] += 1
            m['tasks'][tid] = {"short_id": m['last_id'], "status": "pending", "notified": False}
            updated = True
            
    for tid, info in m['tasks'].items():
        if info['status'] == "pending" and not info.get('notified'):
            if not os.path.exists(f"{base}/queue/publish_ready/{tid}.ai_review.json"): continue
            
            task_data = {}
            if os.path.exists(f"{base}/queue/publish_ready/{tid}.json"):
                with open(f"{base}/queue/publish_ready/{tid}.json") as f: task_data = json.load(f)
            title = task_data.get('outline_data', {}).get('title', 'N/A')
            
            with open(f"{base}/queue/publish_ready/{tid}.ai_review.json") as f: data = json.load(f)
            red_flags = ", ".join(data.get('red_flags', [])) if data.get('red_flags') else "None"
            
            payload = {
                "content": f"🔔 **Pending Approval (ID: {info['short_id']})**\n"
                           f"**Task:** ...{tid[-8:]}\n**Title:** {title}\n"
                           f"**Score:** {data.get('total_score')}/100 | **Rec:** {data.get('recommendation', 'N/A')}\n"
                           f"**Reason:** {data.get('short_reason', 'N/A')}\n"
                           f"**Red Flags:** {red_flags}\n\n"
                           f"Commands:\n`approve {info['short_id']}`\n`reject {info['short_id']}`"
            }
            try:
                res = requests.post(webhook_url, json=payload)
                if res.status_code == 204:
                    info['notified'] = True
                    updated = True
                    log(f"Notified {tid}")
            except Exception as e:
                log(f"Webhook error {tid}: {e}")
                
    if updated:
        with open(MAP_PATH, 'w') as f: json.dump(m, f, indent=2)

if __name__ == "__main__": notify()
