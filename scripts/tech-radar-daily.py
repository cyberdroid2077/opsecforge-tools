#!/usr/bin/env python3
"""
Tech-Radar Daily Intelligence Pipeline
Fetches from GitHub Trending, Hacker News, and ArXiv AI papers
Filters PR content, extracts niche opportunities
Sends human-readable brief to Discord + logs to memory
"""

import requests
import json
import re
from datetime import datetime
from bs4 import BeautifulSoup
import time

# Configuration
DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1480729824430653632/YOUR_WEBHOOK_TOKEN"
MEMORY_DIR = "/home/dingw/.openclaw/workspace/writers-studio/memory"
ARXIV_CATEGORIES = ["cs.AI", "cs.CL", "cs.LG", "cs.CV", "cs.RO"]

# Big companies to filter out (PR noise)
BIG_TECH_KEYWORDS = [
    "google", "microsoft", "amazon", "meta", "facebook", "apple",
    "nvidia", "tesla", "openai", "anthropic", "deepmind",
    "alibaba", "tencent", "baidu", "bytedance"
]

def log_memory(content: str):
    """Write to daily memory log"""
    today = datetime.now().strftime("%Y-%m-%d")
    memory_file = f"{MEMORY_DIR}/{today}.md"
    timestamp = datetime.now().strftime("%H:%M")
    
    entry = f"\n## Tech-Radar [{timestamp}]\n\n{content}\n"
    
    try:
        with open(memory_file, "a", encoding="utf-8") as f:
            f.write(entry)
    except FileNotFoundError:
        # Create memory dir if needed
        import os
        os.makedirs(MEMORY_DIR, exist_ok=True)
        with open(memory_file, "w", encoding="utf-8") as f:
            f.write(entry)

def send_discord(content: str):
    """Send briefing to Discord"""
    # For now, just log it - actual webhook needs to be configured
    print(f"[DISCORD] Would send to channel:\n{content}")
    return True

def fetch_github_trending():
    """Fetch GitHub Trending repositories"""
    url = "https://github.com/trending"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        repos = []
        for article in soup.find_all('article', class_='Box-row')[:10]:
            try:
                link = article.find('h2', class_='h3').find('a')
                full_name = link.get_text(strip=True).replace(' ', '').replace('\n', '')
                desc_elem = article.find('p', class_='col-9')
                description = desc_elem.get_text(strip=True) if desc_elem else "No description"
                
                # Filter big tech
                if any(big in full_name.lower() for big in BIG_TECH_KEYWORDS):
                    continue
                
                repos.append({
                    "name": full_name,
                    "description": description[:120],
                    "url": f"https://github.com{link['href']}"
                })
            except:
                continue
        
        return repos[:5]  # Top 5 after filtering
    except Exception as e:
        print(f"GitHub error: {e}")
        return []

def fetch_hackernews():
    """Fetch Hacker News Top Stories"""
    try:
        # Get top story IDs
        top_resp = requests.get(
            "https://hacker-news.firebaseio.com/v0/topstories.json",
            timeout=10
        )
        top_ids = top_resp.json()[:50]  # Top 50
        
        stories = []
        for story_id in top_ids[:15]:  # Process first 15
            try:
                story_resp = requests.get(
                    f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json",
                    timeout=5
                )
                story = story_resp.json()
                
                if not story or story.get("type") != "story":
                    continue
                
                title = story.get("title", "")
                url = story.get("url", f"https://news.ycombinator.com/item?id={story_id}")
                score = story.get("score", 0)
                
                # Filter big tech PR
                if any(big in title.lower() or big in url.lower() for big in BIG_TECH_KEYWORDS):
                    continue
                
                # Only high-engagement stories
                if score < 50:
                    continue
                
                stories.append({
                    "title": title,
                    "url": url,
                    "score": score
                })
            except:
                continue
        
        return stories[:5]
    except Exception as e:
        print(f"HN error: {e}")
        return []

def fetch_arxiv_papers():
    """Fetch latest ArXiv AI papers (last 7 days)"""
    try:
        from urllib.parse import quote
        from datetime import datetime, timedelta
        
        # Last 7 days window
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        # Build query for AI-related categories
        categories = " OR ".join([f"cat:{c}" for c in ARXIV_CATEGORIES])
        query = f"({categories}) AND submittedDate:[{start_date.strftime('%Y%m%d')} TO {end_date.strftime('%Y%m%d')}]"
        
        url = f"http://export.arxiv.org/api/query?search_query={quote(query)}&sortBy=submittedDate&sortOrder=descending&max_results=20"
        
        resp = requests.get(url, timeout=30)
        soup = BeautifulSoup(resp.text, 'xml')
        
        papers = []
        for entry in soup.find_all('entry')[:10]:
            try:
                title = entry.find('title').get_text(strip=True)
                summary = entry.find('summary').get_text(strip=True)[:200]
                link = entry.find('id').get_text(strip=True)
                
                # Filter big company research
                if any(big in title.lower() or big in summary.lower() for big in BIG_TECH_KEYWORDS):
                    continue
                
                papers.append({
                    "title": title,
                    "summary": summary,
                    "url": link
                })
            except:
                continue
        
        return papers[:3]
    except Exception as e:
        print(f"ArXiv error (falling back to recent): {e}")
        # Fallback: just get recent papers without date filter
        try:
            from urllib.parse import quote
            categories = " OR ".join([f"cat:{c}" for c in ARXIV_CATEGORIES])
            url = f"http://export.arxiv.org/api/query?search_query={quote(categories)}&sortBy=submittedDate&sortOrder=descending&max_results=30"
            resp = requests.get(url, timeout=30)
            soup = BeautifulSoup(resp.text, 'xml')
            papers = []
            for entry in soup.find_all('entry')[:15]:
                try:
                    title = entry.find('title').get_text(strip=True)
                    summary = entry.find('summary').get_text(strip=True)[:200]
                    link = entry.find('id').get_text(strip=True)
                    if any(big in title.lower() or big in summary.lower() for big in BIG_TECH_KEYWORDS):
                        continue
                    papers.append({"title": title, "summary": summary, "url": link})
                except:
                    continue
            return papers[:3]
        except Exception as e2:
            print(f"ArXiv fallback also failed: {e2}")
            return []

def generate_briefing(github, hackernews, arxiv):
    """Generate human-readable briefing"""
    lines = []
    lines.append("📡 **Tech-Radar Daily** | " + datetime.now().strftime("%Y-%m-%d"))
    lines.append("")
    
    # GitHub Section
    if github:
        lines.append("🚀 **GitHub Trending (Niche Picks)**")
        for i, repo in enumerate(github, 1):
            lines.append(f"{i}. **{repo['name']}** — {repo['description']}")
            lines.append(f"   <{repo['url']}>")
        lines.append("")
    
    # HN Section
    if hackernews:
        lines.append("💡 **Hacker News Highlights**")
        for i, story in enumerate(hackernews, 1):
            lines.append(f"{i}. {story['title']} ({story['score']}👍)")
            lines.append(f"   <{story['url']}>")
        lines.append("")
    
    # ArXiv Section
    if arxiv:
        lines.append("🧠 **ArXiv AI Papers (Fresh)**")
        for i, paper in enumerate(arxiv, 1):
            lines.append(f"{i}. **{paper['title']}**")
            lines.append(f"   {paper['summary']}...")
            lines.append(f"   <{paper['url']}>")
        lines.append("")
    
    lines.append("— *Filtered for indie/oss relevance, big tech PR excluded*")
    
    return "\n".join(lines)

def main():
    print("🔍 Tech-Radar: Fetching intelligence...")
    
    # Fetch all sources
    github = fetch_github_trending()
    print(f"  GitHub: {len(github)} repos")
    
    hackernews = fetch_hackernews()
    print(f"  HN: {len(hackernews)} stories")
    
    arxiv = fetch_arxiv_papers()
    print(f"  ArXiv: {len(arxiv)} papers")
    
    # Generate briefing
    briefing = generate_briefing(github, hackernews, arxiv)
    
    # Output
    print("\n" + "="*60)
    print(briefing)
    print("="*60)
    
    # Send to Discord
    send_discord(briefing)
    
    # Log to memory
    log_memory(briefing)
    
    # Save structured data for Jarvis
    structured_data = {
        "timestamp": datetime.now().isoformat(),
        "github": github,
        "hackernews": hackernews,
        "arxiv": arxiv
    }
    
    memory_structured = f"{MEMORY_DIR}/tech-radar-{datetime.now().strftime('%Y-%m-%d')}.json"
    with open(memory_structured, "w") as f:
        json.dump(structured_data, f, indent=2)
    
    print(f"\n✅ Logged to memory: {memory_structured}")

if __name__ == "__main__":
    main()
