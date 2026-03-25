import json

with open("../opsecforge_tools_catalog.json", "r") as f:
    catalog = json.load(f)

# Revert to clean Markdown syntax! The frontend will handle the styling now.
catalog[0]["tool_spotlight_template"] = "> **🛠️ Tool Spotlight: EnvShare**  \n> Need to share a `.env` file with a teammate fast? [EnvShare](https://opsecforge.tools/envshare) lets you create a secure, temporary link that expires after a set time — no Git history, no clipboard leaks, no risk.\n"
catalog[1]["tip_template"] = "> **💡 Pro Tip — Use OpSec Vault**  \n> Stop hardcoding secrets in `.env` files. [OpSec Vault](https://opsecforge.tools/vault) centralizes your credentials, rotates them automatically, and gives you a full audit trail of who accessed what and when.\n"
catalog[2]["tool_spotlight_template"] = "> **🛠️ Tool Spotlight: GitScan**  \n> Catch exposed secrets before they become incidents. [GitScan](https://opsecforge.tools/gitscan) proactively scans your repos for `.env` leaks, hardcoded keys, and risky commit patterns — and alerts you before the damage is done.\n"
catalog[3]["tool_spotlight_template"] = "> **📬 Stay Ahead of Threats**  \n> Want more actionable security guides like this? Join 10,000+ developers in the [OpSecForge Newsletter](https://opsecforge.com/newsletter) for weekly deep-dives into API security and DevSecOps.\n"
catalog[4]["tool_spotlight_template"] = "> **🛡️ Proactive API Defense**  \n> Don't wait for a breach to find your API misconfigurations. Use the [OpSecForge API Scanner](https://opsecforge.tools/api-scanner) to automatically audit your endpoints for CORS, JWT, and authentication flaws in seconds.\n"

with open("../opsecforge_tools_catalog.json", "w") as f:
    json.dump(catalog, f, indent=2)
