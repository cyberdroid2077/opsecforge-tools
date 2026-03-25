import json, subprocess, os, time
task_id = "202603d_162a6646"
base = "/home/dingw/opsecforge-tools/ai-seo"
# Read outline
data = json.load(open(f"{base}/queue/outline_ready/{task_id}.json"))
outline = json.dumps(data['outline_data'])
kw = data['keyword_data'].get('selected', '')
prompt = open(f"{base}/prompts/writer.txt").read().replace('{outline}', outline).replace('{keyword}', kw)
# Run writer
res = subprocess.run(["/home/dingw/.npm-global/bin/openclaw", "agent", "--agent", "nova", "--json", "--message", prompt], capture_output=True, text=True)
output = json.loads(res.stdout)
draft = output.get("result", {}).get("payloads", [{}])[0].get("text", "").strip()
with open(f"{base}/queue/draft_ready/{task_id}.md", "w") as f: f.write(draft)
# Polish
prompt = open(f"{base}/prompts/polish.txt").read().replace('{draft}', draft)
res = subprocess.run(["/home/dingw/.npm-global/bin/openclaw", "agent", "--agent", "nova", "--json", "--message", prompt], capture_output=True, text=True)
output = json.loads(res.stdout)
polished = output.get("result", {}).get("payloads", [{}])[0].get("text", "").strip()
with open(f"{base}/queue/publish_ready/{task_id}.md", "w") as f: f.write(polished)
# Review
prompt = open(f"{base}/prompts/review.txt").read().replace('{content}', polished)
res = subprocess.run(["/home/dingw/.npm-global/bin/openclaw", "agent", "--agent", "nova", "--json", "--message", prompt], capture_output=True, text=True)
output = json.loads(res.stdout)
review_str = output.get("result", {}).get("payloads", [{}])[0].get("text", "").strip()
json_str = review_str[review_str.find('{'):review_str.rfind('}')+1]
review_data = json.loads(json_str)
with open(f"{base}/queue/publish_ready/{task_id}.ai_review.json", "w") as f: json.dump(review_data, f)
