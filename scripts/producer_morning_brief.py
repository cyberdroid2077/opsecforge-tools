#!/usr/bin/env python3
"""
Producer Morning Brief - X/Twitter Hot Topics
Daily briefing for Boss
"""

import subprocess
import json
import re
from datetime import datetime

def search_x_trends():
    """Search for X/Twitter trending topics via SearXNG"""
    
    # Search for X trending/top topics
    queries = [
        "X trending today",
        "Twitter hot topics now", 
        "what is trending on X"
    ]
    
    all_results = []
    for query in queries[:1]:  # Just use first query to avoid rate limits
        try:
            result = subprocess.run(
                ["/usr/bin/python3", "/home/dingw/.local/bin/searx_search.py", 
                 "--max-results", "5", query],
                capture_output=True,
                text=True,
                timeout=30
            )
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                for line in lines[:5]:
                    if line.strip() and 'http' in line:
                        all_results.append(line.strip())
        except Exception as e:
            print(f"Search error: {e}")
    
    return all_results

def fetch_hackernews_for_context():
    """Fetch HN top stories as backup context"""
    import requests
    try:
        resp = requests.get(
            "https://hacker-news.firebaseio.com/v0/topstories.json",
            timeout=10
        )
        top_ids = resp.json()[:5]
        
        stories = []
        for story_id in top_ids:
            try:
                story_resp = requests.get(
                    f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json",
                    timeout=5
                )
                story = story_resp.json()
                if story and story.get("type") == "story":
                    stories.append({
                        "title": story.get("title", ""),
                        "score": story.get("score", 0)
                    })
            except:
                continue
        return stories
    except Exception as e:
        print(f"HN error: {e}")
        return []

def generate_briefing():
    """Generate morning briefing"""
    
    today = datetime.now().strftime("%Y年%m月%d日")
    
    lines = []
    lines.append(f"老板，早上好！今天是{today}，Producer为您播报晨报。")
    lines.append("")
    
    # X Trends (via search)
    lines.append("📱 **X平台热门话题**")
    x_results = search_x_trends()
    if x_results:
        for i, result in enumerate(x_results[:3], 1):
            # Parse title from search result
            parts = result.split(' - ')
            if len(parts) >= 2:
                title = parts[0]
                lines.append(f"{i}. {title}")
    else:
        lines.append("（X趋势获取中，先给您看下其他科技热点...）")
    
    lines.append("")
    
    # HN Backup
    lines.append("💡 **Hacker News热议**")
    hn_stories = fetch_hackernews_for_context()
    for i, story in enumerate(hn_stories[:3], 1):
        lines.append(f"{i}. {story['title']} ({story['score']}👍)")
    
    lines.append("")
    lines.append("以上就是今天的晨报，老板有什么想深入了解的，随时告诉我。")
    
    return "\n".join(lines)

if __name__ == "__main__":
    briefing = generate_briefing()
    print(briefing)
    
    # Save for TTS
    with open("/tmp/producer_briefing.txt", "w", encoding="utf-8") as f:
        f.write(briefing)
