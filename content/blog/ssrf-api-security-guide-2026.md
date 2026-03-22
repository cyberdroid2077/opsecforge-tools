---
title: "SSRF Attacks in Modern APIs: How a Single Request Can Expose Your Entire Infrastructure"
date: "2026-03-22"
description: "A technical deep-dive into Server-Side Request Forgery (SSRF) vulnerabilities in REST and GraphQL APIs, including exploitation techniques, real-world case studies, and defensive coding patterns."
category: "API Security"
---

# SSRF Attacks in Modern APIs: How a Single Request Can Expose Your Entire Infrastructure

<div class="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold tracking-widest text-red-400 uppercase">
  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
  THREAT BRIEFING
</div>

In February 2024, a misconfigured webhook endpoint at a major fintech company allowed attackers to forge internal requests, pivoting from a public API to their AWS metadata service. Within hours, the attacker extracted IAM credentials, accessed S3 buckets containing 2TB of customer data, and established persistent access to the Kubernetes control plane. The total cost of the breach: $4.2 million in damages, regulatory fines, and remediation.

The vulnerability? **Server-Side Request Forgery (SSRF)**—a deceptively simple flaw that continues to rank among OWASP's most dangerous API vulnerabilities.

SSRF occurs when an API endpoint accepts a user-supplied URL and makes an HTTP request to it from the server side without proper validation. What starts as a "fetch metadata from this URL" feature becomes a tunnel directly into your internal infrastructure.

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">The Mechanics of SSRF Exploitation</h2>
</div>

At its core, SSRF exploits trust boundaries. Your API server typically has network access that external users don't—internal microservices, cloud metadata endpoints, database admin interfaces, and Kubernetes APIs. When user input drives outbound requests, that network topology becomes attackable.

Consider this vulnerable Express.js endpoint:

```javascript
app.post('/fetch-metadata', async (req, res) => {
  const { url } = req.body;
  // DANGEROUS: No validation on the URL
  const response = await fetch(url);
  res.json({ success: true, data: await response.json() });
});
```

An attacker sends `"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/admin-role"`. On AWS EC2, `169.254.169.254` is the Instance Metadata Service (IMDS). The server dutifully fetches its own IAM credentials. Game over.

<div class="my-6 border-l-4 border-rose-500 bg-slate-900/50 p-6 rounded-r-xl">
  <h4 class="mb-2 text-lg font-bold text-rose-400">The Capital One Breach (2019)</h4>
  <p class="m-0 text-slate-300 text-sm">A former AWS employee exploited an SSRF vulnerability in Capital One's web application firewall. By crafting requests to the AWS metadata service, the attacker obtained IAM role credentials with broad S3 access. Over 100 million customer records were exfiltrated. The vulnerability existed because the WAF could be coerced into forwarding requests to arbitrary internal endpoints—a misconfiguration that cost the company $190 million in settlement costs.</p>
</div>

<div class="my-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
  <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
    <strong class="block text-slate-200 mb-1">Basic SSRF</strong>
    <span class="text-sm text-slate-400">Attacker provides a URL to internal services like localhost, 169.254.169.254, or internal DNS names. Direct access to cloud metadata, admin panels, or unauthenticated internal APIs.</span>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
    <strong class="block text-slate-200 mb-1">Blind SSRF</strong>
    <span class="text-sm text-slate-400">Server makes the request but doesn't return the response. Detected through side channels: timing differences, DNS callbacks, or out-of-band interactions via Burp Collaborator or Interactsh.</span>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
    <strong class="block text-slate-200 mb-1">Protocol Smuggling</strong>
    <span class="text-sm text-slate-400">Using alternative schemes like file://, gopher://, or ftp:// to access local files, Redis commands, or internal services that speak different protocols.</span>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
    <strong class="block text-slate-200 mb-1">DNS Rebinding</strong>
    <span class="text-sm text-slate-400">Bypassing URL validation by controlling a domain that resolves to different IPs over time—first to a safe external IP, then to internal addresses like 127.0.0.1.</span>
  </div>
</div>

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Common Vulnerable Patterns</h2>
</div>

SSRF typically hides in features that seem harmless: webhooks, PDF generators, thumbnail fetchers, URL previews, and analytics integrations. Anytime your server fetches a user-supplied resource, you're in the danger zone.

**The PDF Generator Trap:**
```python
@app.route('/export-pdf', methods=['POST'])
def export_pdf():
    url = request.json.get('url')
    
    # Using headless Chrome to render PDF
    subprocess.run([
        'chrome', '--headless', 
        '--print-to-pdf=output.pdf',
        url  # User-controlled URL
    ])
    
    return send_file('output.pdf')
```

An attacker sends `file:///etc/passwd` as the URL. Chrome happily renders the local file as a PDF. Now scale that up: `file:///proc/self/environ` to dump environment variables, `file:///var/run/secrets/kubernetes.io/serviceaccount/token` to steal Kubernetes service account tokens in containerized environments.

**GraphQL Introspection Abuse:**
```graphql
query {
  fetchRemoteContent(url: "http://localhost:8080/admin/users") {
    body
    statusCode
  }
}
```

GraphQL resolvers that proxy to external URLs often lack SSRF protections, allowing attackers to enumerate internal services through the schema's introspection capabilities.

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Defensive Implementation</h2>
</div>

Effective SSRF defense requires layered controls: input validation, network segmentation, and least-privilege architecture.

**Layer 1: URL Parsing and Validation**

```python
import ipaddress
import re
from urllib.parse import urlparse

class SSRFValidator:
    BLOCKED_SCHEMES = {'file', 'gopher', 'ftp', 'dict', 'ldap', 'ldaps'}
    BLOCKED_HOSTS = {
        'localhost', '127.0.0.1', '0.0.0.0',
        '169.254.169.254',  # Cloud metadata
        '[::1]', '[::]'
    }
    
    @staticmethod
    def is_internal_ip(hostname):
        """Check if resolved IP is in private ranges."""
        try:
            ip = ipaddress.ip_address(hostname)
            return ip.is_private or ip.is_loopback or ip.is_link_local
        except ValueError:
            # Not an IP, resolve it
            import socket
            try:
                resolved = socket.getaddrinfo(hostname, None)
                for family, _, _, _, sockaddr in resolved:
                    ip = ipaddress.ip_address(sockaddr[0])
                    if ip.is_private or ip.is_loopback or ip.is_link_local:
                        return True
                return False
            except socket.gaierror:
                return True  # Fail closed
    
    @classmethod
    def validate_url(cls, url):
        parsed = urlparse(url)
        
        # Block dangerous schemes
        if parsed.scheme not in {'http', 'https'}:
            raise ValueError(f"Scheme '{parsed.scheme}' not allowed")
        
        # Block internal hostnames
        hostname = parsed.hostname.lower() if parsed.hostname else ''
        if hostname in cls.BLOCKED_HOSTS:
            raise ValueError(f"Hostname '{hostname}' is blocked")
        
        # Block IP-based internal addresses
        if cls.is_internal_ip(hostname):
            raise ValueError(f"IP address '{hostname}' is in private range")
        
        # Block attempts to bypass with URL encoding
        decoded = re.sub(r'%([0-9A-Fa-f]{2})', 
                        lambda m: chr(int(m.group(1), 16)), 
                        url)
        if decoded != url:
            cls.validate_url(decoded)  # Recursive validation
        
        return True

# Usage
@app.route('/webhook', methods=['POST'])
def webhook():
    url = request.json.get('url')
    
    try:
        SSRFValidator.validate_url(url)
        response = requests.get(url, timeout=5)
        return {'status': 'success'}
    except ValueError as e:
        return {'error': str(e)}, 400
```

**Layer 2: Network Segmentation**

Even with validation, assume SSRF will happen. Architect your infrastructure to limit the blast radius:

```yaml
# Kubernetes NetworkPolicy restricting egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-server-policy
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: external-services
    ports:
    - protocol: TCP
      port: 443
```

**Layer 3: Cloud Metadata Protection**

AWS, GCP, and Azure all provide mechanisms to mitigate IMDS abuse:

```bash
# AWS: Require IMDSv2 with session tokens
aws ec2 modify-instance-metadata-options \
    --instance-id i-1234567890abcdef0 \
    --http-tokens required \
    --http-endpoint enabled

# GCP: Disable legacy metadata endpoints
gcloud compute instances add-metadata instance-name \
    --metadata=disable-legacy-endpoints=TRUE
```

IMDSv2 requires a PUT request to obtain a session token before accessing metadata, making SSRF exploitation significantly harder since attackers can't easily forge the token retrieval request.

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Catch Leaked Keys Before Committing</h3>
  <p class="mb-8 text-slate-400 text-lg">Over 10 million secrets were leaked on GitHub last year. Run GitScan locally to identify hardcoded keys, .env files, and dangerous patterns before they reach your remote repository.</p>
  <a href="https://opsecforge.tools/gitscan" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
    Install GitScan CLI →
  </a>
</div>

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Detection and Testing</h2>
</div>

Automate SSRF detection in your CI pipeline:

```python
def test_webhook_endpoint_ssrf_protection():
    blocked_urls = [
        'http://localhost:8080/admin',
        'http://169.254.169.254/latest/meta-data/',
        'file:///etc/passwd',
        'http://0x7f000001/',
    ]
    
    for url in blocked_urls:
        response = client.post('/webhook', json={'url': url})
        assert response.status_code == 400
```

Use Burp Collaborator or interactsh to detect blind SSRF through DNS/HTTP callbacks.

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Key Takeaways</h2>
</div>

SSRF exploits the fundamental trust between services—your API server trusts internal network calls, and attackers exploit that trust through carefully crafted requests.

**Defense Checklist:**
- [ ] Parse and validate URLs against allowlists, not blocklists
- [ ] Resolve hostnames to IPs and validate against private ranges
- [ ] Implement network policies restricting egress from API servers
- [ ] Enable IMDSv2 on cloud instances to protect metadata endpoints
- [ ] Include SSRF payloads in automated security tests

SSRF isn't going away. As long as APIs fetch remote resources, attackers will turn those features into tunnels into your infrastructure. Build your defenses accordingly.
