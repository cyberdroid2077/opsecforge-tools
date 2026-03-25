#!/usr/bin/env python3
import os, json, glob, re

repo = "/home/dingw/opsecforge-tools/content/blog"
index_path = "/home/dingw/opsecforge-tools/ai-seo/state/blog_index.json"

def get_slug(filename):
    return filename.replace(".md", "")

def update_index():
    index = {}
    if os.path.exists(index_path):
        with open(index_path, 'r') as f:
            index = json.load(f)

    for md_file in glob.glob(os.path.join(repo, "*.md")):
        filename = os.path.basename(md_file)
        slug = get_slug(filename)
        
        with open(md_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Extract title from frontmatter
            match = re.search(r'title: "(.*?)"', content)
            if match:
                title = match.group(1).lower()
                # Heuristic: Add key mappings based on title keywords
                potential_keywords = ["JWT", "Webhook", "Base64", "JSON", "Env variables", "Privacy", "Security"]
                for kw in potential_keywords:
                    if kw.lower() in title:
                        index[kw] = slug
    
    with open(index_path, 'w') as f:
        json.dump(index, f, indent=2)
    print("Index updated.")

if __name__ == "__main__":
    update_index()
