---
title: "HTTP Request Smuggling in API Gateways: Prevention and Testing"
date: "2026-05-12"
updated: "2026-08-11"
description: "Understand HTTP request smuggling, assess proxy-to-origin parsing boundaries, patch Jetty and Axios advisories, and test safely in an authorized environment."
category: "API Security"
tags: ["HTTP Request Smuggling", "API Gateway", "CVE-2026-2332", "CVE-2026-40175", "Protocol Desync", "API Security"]
source_reviewed: "2026-08-11"
primary_source: "https://github.com/jetty/jetty.project/security/advisories/GHSA-355h-qmc2-wpwf"
---

# HTTP Request Smuggling in API Gateways: Prevention and Testing

HTTP request smuggling is a message-framing problem. It occurs when two HTTP components that process the same connection disagree about where one request ends and the next begins. A gateway, reverse proxy, application server, or HTTP client may accept a message that another component interprets differently, allowing leftover bytes to affect a later request.

The risk depends on the exact chain of products, versions, protocols, normalization rules, and connection-reuse behavior. The presence of a gateway or HTTP/1.1 hop does not by itself prove a vulnerability. Confirm exposure from the deployed architecture and vendor advisories, then test only in an environment you own or are authorized to assess.

## Why framing disagreements happen

HTTP/1.1 uses message framing rules such as `Content-Length` and `Transfer-Encoding`. RFC 9112 requires recipients to handle conflicting or invalid framing carefully because request smuggling primarily exploits differences in how implementations parse those messages.

Common labels describe which hop follows which framing signal:

- **CL.TE:** one component uses `Content-Length` while the next uses `Transfer-Encoding`;
- **TE.CL:** the first component uses `Transfer-Encoding` while the next uses `Content-Length`;
- **TE.TE:** both recognize transfer encoding, but one accepts an obfuscated or malformed form that the other rejects or interprets differently.

These labels are useful for analysis, but they are not a complete model. HTTP/2-to-HTTP/1 translation, malformed chunk extensions, duplicated fields, and product-specific parsing can create other disagreement paths.

## What the 2026 Jetty advisory establishes

[Jetty's advisory for CVE-2026-2332](https://github.com/jetty/jetty.project/security/advisories/GHSA-355h-qmc2-wpwf) describes an HTTP/1.1 request-smuggling flaw in its handling of quoted strings inside chunk extensions. A carriage-return/line-feed sequence inside an unclosed quoted string could terminate parsing instead of causing the malformed request to be rejected.

The vendor lists affected releases through 9.4.59, 10.0.27, 11.0.27, 12.0.32, and 12.1.6. Fixed releases are 9.4.60, 10.0.28, 11.0.28, 12.0.33, and 12.1.7. Check the [current Jetty security table](https://jetty.org/security.html) before remediation because supported branches and later fixes can change.

This advisory does not mean every Jetty deployment was exploitable from the internet. A successful chain still depends on the other HTTP component accepting and forwarding a message that Jetty frames differently. The reliable first action is to identify the deployed Jetty version and upgrade to a fixed, supported release.

## What the Axios advisory establishes

[The GitHub-reviewed advisory for CVE-2026-40175](https://github.com/advisories/GHSA-fvcv-3m26-pcqx) describes Axios as a gadget in a higher-complexity chain. Prototype pollution must occur elsewhere, after which inherited or attacker-influenced header values may introduce carriage-return/line-feed characters into an outbound Node.js request. In an affected deployment, that can enable limited request manipulation or metadata access.

The advisory rates the issue Moderate and fixes the supported 1.x line in Axios 1.15.0. Do not describe the condition as an automatic remote-code-execution or cloud-takeover path: exploitability depends on another prototype-pollution primitive, application data flow, adapter behavior, network reachability, and the target metadata service's controls.

Upgrade affected Axios versions and eliminate the upstream prototype-pollution path. Also treat outbound destination and header construction as a trust boundary: validate destinations, reject control characters, avoid merging untrusted objects into request configuration, and restrict workload access to link-local metadata endpoints where the platform permits it.

## Map the full HTTP chain

Before changing gateway rules, document every component that parses or translates the request:

1. CDN, edge proxy, load balancer, and web application firewall;
2. API gateway, ingress controller, or service-mesh proxy;
3. protocol transitions such as HTTP/2 or HTTP/3 at the edge to HTTP/1.1 upstream;
4. application server, framework, and HTTP client libraries;
5. connection pooling and reuse between each pair of hops.

Record product versions and configuration from the deployed environment rather than a dependency manifest alone. Managed services may patch or normalize traffic independently, while container images can contain a different server version from the application lockfile.

## Prevention priorities

### Patch the parsers

Apply vendor fixes to every affected hop. A gateway rule can reduce exposure, but it is not a substitute for correcting the parser that disagrees with its peer. Include transitive server and client libraries in dependency inventory and image scanning.

### Reject ambiguous HTTP/1.1 framing

RFC 9112 says a server must not apply a request's `Content-Length` when `Transfer-Encoding` is present and treats certain combinations as errors because they can indicate request smuggling. Prefer standards-compliant rejection of malformed or ambiguous messages at the first trusted hop. Avoid ad hoc header rewriting that produces a message the next hop interprets differently.

### Keep protocol translation explicit

HTTP/2 uses binary framing rather than HTTP/1.1 chunked transfer coding, but translating a request to HTTP/1.1 creates a new framing boundary. Inventory downgrade points and follow each gateway vendor's hardening guidance. “HTTP/2 enabled” alone is not evidence that an end-to-end chain is safe.

### Reduce cross-request impact

Connection isolation or disabling upstream reuse can limit some smuggling chains, but it carries availability and latency costs and does not repair an invalid parser. Use it only as a vendor-recommended temporary mitigation or a deliberately tested control for a sensitive boundary.

### Preserve authorization at the origin

Do not assume a request is authorized merely because it arrived from a trusted proxy connection. Authenticate and authorize each request at the application boundary using validated identity context. Strip client-supplied internal identity headers at the edge, then set trusted values through a documented mechanism.

### Monitor parser disagreements

Look for rejected requests with conflicting framing fields, malformed chunk syntax, unexpected multiple responses on one connection, upstream resets, and mismatched edge/origin request counts. Logs should capture safe request metadata and correlation IDs, not authorization headers, cookies, or request bodies containing secrets.

## Test without harming production

Request-smuggling tests can desynchronize shared connections, affect another user's request, or poison a cache. A timeout or unusual response is not sufficient proof of a vulnerability; it can also reflect buffering, rate limits, network loss, or deliberate rejection.

Use a staging stack that reproduces the production proxy-to-origin versions and settings. Send vendor-provided regression cases or established scanner checks only under written authorization, with synthetic accounts, isolated upstream connections, cache disabled, and backend request logging enabled. Confirm a finding by correlating what each hop parsed, not by relying on client timing alone.

For production assurance, prefer version and configuration evidence plus passive telemetry. If an active production test is necessary, define the exact target, payload class, observation method, stop conditions, and incident owner before sending traffic.

## Response checklist

1. Identify the affected parser and every adjacent hop.
2. Compare deployed versions with the current vendor advisory.
3. Patch or apply the vendor's bounded mitigation.
4. Review gateway and origin logs for evidence of parser disagreement without copying secrets into the case record.
5. Invalidate sessions or credentials only when evidence shows they may have been exposed or misused.
6. Reproduce the original condition in an isolated environment and verify that the fixed chain rejects it consistently.
7. Add the framing case to regression tests for future gateway, server, and protocol changes.

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Sanitize gateway logs before sharing</h3>
  <p class="mb-8 text-slate-400 text-lg">Env Sanitizer heuristically masks common credentials in your browser. Review the result before sharing because custom tokens and sensitive request data may not be detected.</p>
  <a href="/tools/env-sanitizer" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400">
    Open Env Sanitizer →
  </a>
</div>

## Primary sources

- [RFC 9112: HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112)
- [Jetty advisory GHSA-355h-qmc2-wpwf / CVE-2026-2332](https://github.com/jetty/jetty.project/security/advisories/GHSA-355h-qmc2-wpwf)
- [NVD: CVE-2026-2332](https://nvd.nist.gov/vuln/detail/CVE-2026-2332)
- [Jetty security reports](https://jetty.org/security.html)
- [GitHub Advisory Database: GHSA-fvcv-3m26-pcqx / CVE-2026-40175](https://github.com/advisories/GHSA-fvcv-3m26-pcqx)
- [NVD: CVE-2026-40175](https://nvd.nist.gov/vuln/detail/CVE-2026-40175)
