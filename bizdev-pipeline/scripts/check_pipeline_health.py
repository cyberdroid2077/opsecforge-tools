#!/usr/bin/env python3
import json, sys, os
state_file = "/home/dingw/opsecforge-tools/ai-seo/state/daily_status.json"
if not os.path.exists(state_file):
    print("State file not found.")
    sys.exit(1)

with open(state_file, 'r') as f:
    status = json.load(f)

# Basic check based on watchdog findings. If watchdog isn't running, this might be stale, 
# but it serves as a fast read-only probe.
if not status.get("preflight_ok", False):
    sys.exit(2)
if len(status.get("stuck_tasks", [])) > 0:
    sys.exit(3)
    
print("Health check passed.")
sys.exit(0)
