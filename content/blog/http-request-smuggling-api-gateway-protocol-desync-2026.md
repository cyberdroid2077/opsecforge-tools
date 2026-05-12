---
title: "HTTP Request Smuggling in API Gateways: How a Protocol Quirk Became a Critical Threat"
date: "2026-05-12"
description: "CVE-2026-2332 in Jetty and CVE-2026-40175 in Axios prove HTTP request smuggling is back. Here's why your API gateway might be silently forwarding attacker-controlled requests to your backend."
category: "API Security"
tags: ["HTTP Request Smuggling", "API Gateway", "CVE-2026-2332", "CVE-2026-40175", "Protocol Desync", "DevSecOps", "API Security"]
---

<h1 class="text-3xl font-bold text-slate-100 mb-6">HTTP Request Smuggling in API Gateways: How a Protocol Quirk Became a Critical Threat</h1>

<!-- Threat Badge -->
<div class="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/20 mb-6">
  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>
  <span>Critical: Protocol Desync Enabling Request Injection & Authentication Bypass</span>
</div>

On April 14, 2026, the Eclipse Foundation pushed a security advisory for Jetty. CVE-2026-2332: the HTTP/1.1 parser was vulnerable to request smuggling when chunk extensions contained unclosed quoted strings. An attacker could inject a second, attacker-controlled HTTP request into a single packet. The backend would process it as a legitimate follow-up request—complete with whatever headers, cookies, or authorization tokens the attacker chose to prepend.

Four days later, CVE-2026-40175 hit Axios, the most downloaded HTTP client on npm. Unsanitized CRLF characters in header values let attackers split the request stream and inject a second request—straight to the AWS metadata service. Same vulnerability class. Different layer. Same result.

HTTP request smuggling is not a relic of 2005. In 2026, it is a precision weapon against API gateways, and your infrastructure is probably vulnerable.

<!-- Section Header: The Mechanics -->
<div class="flex items-center gap-3 mb-4">
  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  </div>
  <h2 class="text-xl font-bold text-slate-100">The Mechanics: Why Two Servers See One Request Differently</h2>
</div>

HTTP request smuggling exploits a parsing discrepancy between two servers that handle the same request. Typically: an API gateway or reverse proxy (the frontend) and your application server (the backend). When those two servers disagree on where one request ends and the next begins, the leftover bytes in the connection buffer become a second request—one the attacker crafted, not your user.

The attack vectors fall into three categories:

**CL.TE:** The frontend uses `Content-Length`. The backend uses `Transfer-Encoding: chunked`. The frontend forwards N bytes. The backend terminates at the chunked terminator and treats everything after as a new request.

**TE.CL:** The frontend uses `Transfer-Encoding: chunked`. The backend uses `Content-Length`. The backend reads only the `Content-Length` bytes and leaves the remainder in the buffer.

**TE.TE:** Both servers support `Transfer-Encoding: chunked`, but one is tricked into ignoring the header via obfuscation—tabs, line folding, or garbage values.

The Jetty vulnerability (CVE-2026-2332) is a TE.TE variant. Chunk extensions with unclosed quoted strings caused the parser to terminate early, leaving the rest of the payload as a valid, attacker-controlled request on a reused connection.

Here is a classic CL.TE payload:

```http
POST /api/v1/health HTTP/1.1
Host: api.example.com
Content-Length: 6
Transfer-Encoding: chunked

0

X
```

The gateway reads 6 bytes. The backend sees the chunked terminator and treats `X` as the start of the next request. Swap `X` for a crafted `GET /admin/users` request and you have bypassed gateway authentication—the backend thinks the smuggled request arrived on an already-authenticated connection.

<!-- Section Header: Real-World Impact -->
<div class="flex items-center gap-3 mb-4">
  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  </div>
  <h2 class="text-xl font-bold text-slate-100">Real-World Impact: When the Gatekeeper Becomes the Tunnel</h2>
</div>

Request smuggling is not an academic exercise. PortSwigger has documented viable chains against AWS API Gateway, Akamai, and Cloudflare. GitHub patched a smuggling vulnerability in its API infrastructure in 2020. Confirmed findings routinely pay $10,000–$25,000+ in bug bounties.

The 2026 attack surface is larger. Modern microservice meshes route every request through proxies, sidecars, WAFs, and gateways. Each hop is a potential parsing mismatch.

<!-- Case Study Box -->
<div class="my-6 border-l-4 border-amber-500 bg-slate-900/50 p-6 rounded-r-xl">
  <h4 class="mb-2 text-lg font-bold text-amber-400">Case Study: The Axios → AWS Metadata Chain (CVE-2026-40175)</h4>
  <p class="m-0 text-slate-300 text-sm">In April 2026, security researchers disclosed that Axios versions below 1.15.0 did not sanitize header values for CRLF characters. If an attacker could achieve prototype pollution through another library in the application, Axios would merge the polluted values into outgoing headers. A header value containing <code>\r\n</code> effectively split the HTTP request stream, allowing the attacker to inject a second request. The advisory's proof-of-concept demonstrated a smuggled request to the AWS IMDSv2 metadata service (<code>169.254.169.254</code>), which returned a session token. From there, the attacker could pivot to IAM role credentials and assume control of the EC2 instance. No zero-day in AWS was required. The exploit chain used your own application's HTTP client against you.</p>
</div>

The Jetty case is equally instructive. A single malformed chunk extension could turn a legitimate upload into a vehicle for smuggling administrative commands—bypassing per-request authentication checks at the gateway level.

<!-- Section Header: Detection and Defense -->
<div class="flex items-center gap-3 mb-4">
  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
    </svg>
  </div>
  <h2 class="text-xl font-bold text-slate-100">Detection and Defense: Close the Parsing Gap</h2>
</div>

Defending against request smuggling requires making the frontend and backend agree on request boundaries—or eliminating the ambiguity entirely.

**Option 1: Disable backend connection reuse.** Every request on a fresh TCP connection means no shared buffer to poison. The latency cost is worth it for sensitive APIs.

**Option 2: Enforce HTTP/2 end-to-end.** HTTP/2's framing eliminates the `Content-Length` vs `Transfer-Encoding` ambiguity. Beware of HTTP/2 → HTTP/1.1 downgrades—they reintroduce the problem.

**Option 3: Normalize ambiguous requests.** Drop any request containing both `Content-Length` and `Transfer-Encoding`. Strip obfuscated header variations. In Nginx:

```nginx
if ($http_transfer_encoding) {
    return 400;
}
proxy_hide_header Transfer-Encoding;
```

**Option 4: Test your stack.** Conventional scanners miss desyncs. Send probes and observe backend behavior. Here is a Python probe:

```python
import socket, ssl

def probe_desync(host, port, payload, use_ssl=False):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    if use_ssl:
        sock = ssl.create_default_context().wrap_socket(sock, server_hostname=host)
    sock.connect((host, port))
    sock.sendall(payload.encode())
    sock.settimeout(5)
    try:
        return sock.recv(4096).decode(errors='replace')
    except socket.timeout:
        return "TIMEOUT"
    finally:
        sock.close()

PAYLOAD = """POST /api/v1/health HTTP/1.1\r
Host: target.example.com\r
Content-Length: 6\r
Transfer-Encoding: chunked\r
\r
0\r
\r
X"""

print(probe_desync("target.example.com", 443, PAYLOAD, use_ssl=True))
```

Two responses or a timeout on the second read means your stack is vulnerable.

<!-- Feature/Data Grid -->
<div class="my-8 grid gap-4 sm:grid-cols-2">
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
    <h4 class="mb-1 font-bold text-emerald-400">$10K–$25K+</h4>
    <p class="text-sm text-slate-400">Typical bug bounty payout for confirmed request smuggling with cache poisoning or session hijacking chains.</p>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
    <h4 class="mb-1 font-bold text-emerald-400">3 Attack Vectors</h4>
    <p class="text-sm text-slate-400">CL.TE, TE.CL, and TE.TE (header obfuscation). Each targets a different frontend/backend parsing mismatch.</p>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
    <h4 class="mb-1 font-bold text-emerald-400">April 2026</h4>
    <p class="text-sm text-slate-400">Both Jetty (CVE-2026-2332) and Axios (CVE-2026-40175) disclosed request smuggling flaws within days of each other.</p>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
    <h4 class="mb-1 font-bold text-emerald-400">Zero Auth Bypass</h4>
    <p class="text-sm text-slate-400">Smuggled requests ride on reused, authenticated connections. The backend processes them without re-checking credentials.</p>
  </div>
</div>

<!-- Section Header: The Bottom Line -->
<div class="flex items-center gap-3 mb-4">
  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
    </svg>
  </div>
  <h2 class="text-xl font-bold text-slate-100">The Bottom Line</h2>
</div>

Request smuggling punishes architectural complexity. Every proxy, gateway, and load balancer is a potential parsing mismatch. In 2026, with microservice meshes proliferating, the odds of a desync have never been higher.

The fix is architectural. You cannot patch this with a WAF rule. You need consistent HTTP handling across your stack, or eliminate connection reuse for sensitive paths. Test your infrastructure. The probes are simple. The consequences are not.

Your API gateway is the gatekeeper. Make sure it is not also the tunnel.

<!-- Warning Box -->
<div class="my-6 border-l-4 border-red-500 bg-slate-900/50 p-6 rounded-r-xl">
  <h4 class="mb-2 text-lg font-bold text-red-400">⚠️ Critical Warning</h4>
  <p class="m-0 text-slate-300 text-sm">Smuggling testing in production can corrupt requests and poison caches. Always test in staging first. If you must test production, use read-only endpoints like <code>/health</code> and coordinate with ops.</p>
</div>

<!-- Tool Spotlight: URL Encoder -->
<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Encode URLs Locally</h3>
  <p class="mb-8 text-slate-400 text-lg">Working with query parameters or URL paths? Encode and decode URI components securely in your browser without sending data to external servers.</p>
  <a href="/tools/url-encoder" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
    Open URL Encoder →
  </a>
</div>
