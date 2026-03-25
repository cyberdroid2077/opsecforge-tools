import json

with open("../opsecforge_tools_catalog.json", "r") as f:
    catalog = json.load(f)

def build_cta(title, desc, url, btn_text):
    return f"""
<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">{title}</h3>
  <p class="mb-8 text-slate-400 text-lg">{desc}</p>
  <a href="{url}" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
    {btn_text} →
  </a>
</div>
"""

# EnvShare
catalog[0]["tool_spotlight_template"] = build_cta(
    "Stop Leaking Secrets in Slack", 
    "Need to share a .env file? Use EnvShare to create a secure, expiring link. Zero server logs, zero database storage. Client-side encryption ensures only your teammate can read it.",
    "https://opsecforge.tools/envshare",
    "Share a Secret Securely"
)

# OpSec Vault
catalog[1]["tip_template"] = build_cta(
    "Centralize Your API Secrets",
    "Stop hardcoding credentials in your repositories. OpSec Vault provides enterprise-grade secret management, automated rotation, and comprehensive audit logs for modern development teams.",
    "https://opsecforge.tools/vault",
    "Try OpSec Vault Free"
)

# GitScan
catalog[2]["tool_spotlight_template"] = build_cta(
    "Catch Leaked Keys Before Committing",
    "Over 10 million secrets were leaked on GitHub last year. Run GitScan locally to identify hardcoded keys, .env files, and dangerous patterns before they reach your remote repository.",
    "https://opsecforge.tools/gitscan",
    "Install GitScan CLI"
)

# Newsletter
catalog[3]["tool_spotlight_template"] = build_cta(
    "Stay Ahead of the Threat Landscape",
    "Join 10,000+ security-conscious developers. Get our weekly technical deep-dives into API vulnerabilities, DevSecOps pipelines, and zero-trust architectures.",
    "https://opsecforge.com/newsletter",
    "Subscribe to Threat Intel"
)

# API Scanner
catalog[4]["tool_spotlight_template"] = build_cta(
    "Audit Your API in Seconds",
    "Don't wait for a penetration test to find your misconfigurations. Use our automated scanner to detect CORS flaws, weak JWT implementations, and Broken Object Level Authorization (BOLA).",
    "https://opsecforge.tools/api-scanner",
    "Run Free API Audit"
)

with open("../opsecforge_tools_catalog.json", "w") as f:
    json.dump(catalog, f, indent=2)

