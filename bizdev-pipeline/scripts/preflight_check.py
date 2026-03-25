#!/usr/bin/env python3
import sys, subprocess, os, re

def check_cli():
    try:
        subprocess.run(["openclaw", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except:
        print("ERROR: openclaw CLI not found or broken")
        sys.exit(1)

def check_agents():
    required = ["fred", "producer", "old-fred"]
    try:
        res = subprocess.check_output(["openclaw", "agents", "list"], text=True)
        # Robust parsing: extract everything after "Agents:" and find all lines starting with "- "
        if "Agents:" not in res:
            print("ERROR: Could not find 'Agents:' section")
            sys.exit(1)
            
        agent_section = res.split("Agents:", 1)[1]
        # Regex matches lines starting with "- " followed by ID, stops at end of line
        found_agents = re.findall(r"^- ([a-zA-Z0-9_-]+)", agent_section, re.MULTILINE)
        
        missing = [a for a in required if a not in found_agents]
        if missing:
            print(f"ERROR: Missing agents: {missing}")
            print(f"Found: {found_agents}")
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to list agents: {e}")
        sys.exit(1)

def check_qwen():
    try:
        res = subprocess.check_output(["curl", "-s", "http://127.0.0.1:11434/api/tags"], text=True)
        if "qwen2.5:32b" not in res:
            print("ERROR: qwen2.5:32b not found in local Ollama")
            sys.exit(1)
    except:
        print("ERROR: Cannot connect to local Ollama (127.0.0.1:11434)")
        sys.exit(1)

def check_git():
    repo = "/home/dingw/opsecforge-tools"
    if not os.path.isdir(os.path.join(repo, ".git")):
        print(f"ERROR: Not a git repo: {repo}")
        sys.exit(1)

if __name__ == "__main__":
    check_cli()
    check_agents()
    check_qwen()
    check_git()
    print("Preflight checks passed.")
