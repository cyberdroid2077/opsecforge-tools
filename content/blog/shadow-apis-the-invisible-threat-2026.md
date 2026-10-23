---
title: "API Inventory and Gateway Boundaries: Finding Endpoints Your Gateway Does Not Cover"
date: "2026-03-28"
updated: "2026-10-23"
description: "How to build an evidence-based API inventory, reconcile it against traffic, and close the routes that bypass your gateway, with a runnable reconciliation script and sourced examples."
author: "OpsecForge Security Team"
category: "API Security"
tags: ["Shadow APIs", "API Gateway", "API Inventory", "DevSecOps", "Attack Surface"]
source_reviewed: "2026-10-23"
primary_source: "https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/"
---

# API Inventory and Gateway Boundaries: Finding Endpoints Your Gateway Does Not Cover

An API gateway enforces policy only on the traffic that passes through it. A shadow API is an API host, version, or route that is live but missing from the organization's reliable inventory: an old version, a service reachable directly instead of through the gateway, a test deployment holding production data, or an integration that outlived its owner. The two problems are connected, because the endpoints a gateway cannot protect are mostly the ones nobody listed.

This guide covers how to build an inventory from evidence, how to compare it with real traffic, and where gateway coverage stops. For the controls that belong on the gateway itself, see [API rate-limiting bypass attacks](/blog/api-rate-limiting-bypass-attacks-2026) and [JWT validation rules](/blog/jwt-token-vulnerabilities-authentication-security).

## What an inventory has to answer

[OWASP API9:2023, Improper Inventory Management](https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/) describes two gaps. An API has a "documentation blindspot" when the purpose of a host is unclear: nobody can say which environment it runs in (production, staging, test, development), who should have network access to it (public, internal, partners), or which version it is, and there is no current documentation or retirement plan. It has a "data flow blindspot" when it shares sensitive data with a third party without a business justification, an inventory of the flow, or visibility into what data is shared.

Turn those into fields you can check for every host and version:

| Field | Question it answers |
| --- | --- |
| Owner | Who can change, patch, or switch it off? |
| Environment | Production, staging, test, or development? Does a non-production host hold production data? |
| Intended audience | Public, partner, or internal, and what enforces that? |
| Version and retirement date | Which version is this, and when does it go away? |
| Authentication and authorization model | Who may call it, and where is the decision made? |
| Sensitive data and third-party flows | What leaves the boundary, and who approved it? |
| Route to it | Through the gateway only, or also directly? |

A spreadsheet is a starting point, not the inventory. The [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) defines a language-agnostic description of an HTTP API that people and tools can read without source code, which makes it a good declared source. OWASP recommends generating documentation automatically from open standards and including that build in the CI/CD pipeline, so the declaration changes when the code does.

## Compare the declaration with what the network shows

Differences between sources are investigation targets. Gather several: gateway and ingress configuration, load balancers and DNS records, deployment manifests, API specifications, and access logs. Confirm ownership before changing or shutting anything down.

The script below does the simplest useful comparison. It reads an OpenAPI document, a list of declared hosts, and an access log reduced to `host method path status`, then prints what was observed but not declared and what was declared but never observed. It uses only the Python standard library and runs on a copy of the log, so it never touches production systems.

```python
#!/usr/bin/env python3
"""List observed requests that the OpenAPI document or host list does not declare.

Usage: reconcile.py openapi.json access.log host1,host2
Log line format: <host> <method> <path> <status>
"""
import json
import re
import sys
from collections import defaultdict

def path_regex(template):
    parts = []
    for segment in template.strip("/").split("/"):
        is_param = segment.startswith("{") and segment.endswith("}")
        parts.append("[^/]+" if is_param else re.escape(segment))
    return re.compile("^/" + "/".join(parts) + "/?$")

def declared_operations(spec_path):
    with open(spec_path) as handle:
        spec = json.load(handle)
    methods = {"get", "put", "post", "delete", "patch", "head", "options"}
    return [
        (method.upper(), path_regex(template), template)
        for template, item in spec["paths"].items()
        for method in item
        if method in methods
    ]

def main(spec_path, log_path, declared_hosts):
    operations = declared_operations(spec_path)
    seen = set()
    undeclared = defaultdict(lambda: defaultdict(int))
    with open(log_path) as handle:
        for line in handle:
            host, method, path, status = line.split()
            path = path.split("?")[0]
            match = next((op for op in operations if op[0] == method and op[1].match(path)), None)
            if match and host in declared_hosts:
                seen.add((match[0], match[2]))
            else:
                undeclared[(host, method, path)][status] += 1

    print("Observed but not declared:")
    for (host, method, path), statuses in sorted(undeclared.items()):
        summary = ", ".join(f"{code} x{count}" for code, count in sorted(statuses.items()))
        print(f"  {host} {method} {path}  [{summary}]")

    print("Declared but never observed:")
    for method, _, template in operations:
        if (method, template) not in seen:
            print(f"  {method} {template}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], set(sys.argv[3].split(",")))
```

Synthetic OpenAPI document (`openapi.json`):

```json
{
  "openapi": "3.1.0",
  "info": {"title": "Orders API (synthetic)", "version": "2"},
  "paths": {
    "/v2/orders": {"get": {}, "post": {}},
    "/v2/orders/{orderId}": {"get": {}, "delete": {}},
    "/v2/health": {"get": {}}
  }
}
```

Synthetic access log (`access.log`):

```text
api.example.test GET /v2/orders?limit=10 200
api.example.test GET /v2/orders/8841 200
api.example.test POST /v2/orders 201
api.example.test GET /v1/orders/8841 200
api.example.test GET /v1/orders/8842 200
beta.api.example.test GET /v2/orders 200
api.example.test GET /v2/admin/export 403
api.example.test GET /v2/admin/export 403
api.example.test GET /.env 404
```

Running `python3 -I reconcile.py openapi.json access.log api.example.test` prints:

```text
Observed but not declared:
  api.example.test GET /.env  [404 x1]
  api.example.test GET /v1/orders/8841  [200 x1]
  api.example.test GET /v1/orders/8842  [200 x1]
  api.example.test GET /v2/admin/export  [403 x2]
  beta.api.example.test GET /v2/orders  [200 x1]
Declared but never observed:
  DELETE /v2/orders/{orderId}
  GET /v2/health
```

How to read the result:

- `/v1/orders/...` returning 200 is a version nobody declared that still serves data. This is the "no retirement plan" case from API9.
- `beta.api.example.test` answering the same route is an undeclared host. Find out what data it holds and which controls it lacks.
- `/v2/admin/export` returning 403 shows something answers there. Someone is probing it or a client is calling it, and a 403 does not tell you whether the function-level checks behind it are correct.
- `/.env` returning 404 is background scanning noise. Sort by status so 2xx rows come first.
- A declared route that is never observed is a retirement candidate, or a sign that the log window is too short or that traffic bypasses the log source. Check which before concluding.

An access log only shows traffic that reached a logging point. It cannot find a host that nothing has called yet, so combine it with DNS, certificate, and cloud-configuration review.

## Where gateway coverage ends

### A second route to the same service

OWASP's first example for API9 is a social network that rate-limited password-reset attempts in a separate component in front of `api.socialnetwork.owasp.org`. A researcher found a beta host, `beta.api.socialnetwork.owasp.org`, that ran the same API without that component, and could brute-force the six-digit reset token there. This is OWASP's illustrative scenario, not a reported incident, but the structure is common: the control lived in the layer in front of the API, not in the API, so any second path skipped it.

Cloud gateways create the same shape by default. Amazon API Gateway REST APIs get a generated `execute-api` endpoint; AWS documents that to make sure clients reach the API only through a custom domain name you can [disable the default endpoint](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-disable-default-endpoint.html), after which requests to it receive a 403 Forbidden. Disabling it affects all stages of the API and takes effect after you update a stage or redeploy. AWS's [mutual TLS documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-mutual-tls.html) makes the consequence explicit: to ensure clients can reach the API only through a custom domain with mutual TLS, disable the default `execute-api` endpoint. Whatever control you attach to the custom domain, check whether the default endpoint is a route around it.

### The service must not be reachable around the gateway

If services run in Kubernetes, the cluster network is the next boundary. Kubernetes [NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) control traffic at the IP-address and port level, and a pod is non-isolated for ingress by default. A policy that selects all pods in a namespace and allows no ingress gives you default-deny, onto which you add the specific sources that may call each service, such as the gateway. The same documentation warns that creating a NetworkPolicy without a network plugin that implements it has no effect, so test that a direct call from an unauthorized pod is actually refused.

Outside Kubernetes the principle is the same: security groups, firewall rules, or private networking should make the gateway the only path to the service, and a test should prove a direct request fails.

### Authorization decisions the gateway cannot make

A gateway can validate a token and reject malformed or unauthenticated traffic. Whether a caller may act on a particular record is a different question. OWASP describes object-level authorization as usually implemented at the code level, and says every endpoint that receives an object ID and acts on the object should check that the logged-in user may perform the action on that object. Comparing the session's user ID with the ID parameter, it warns, covers only a small subset of cases. Keep those checks in the service, and test them; see [BOLA in practice](/blog/bola-broken-object-level-authorization-api-2026). Function-level checks have the same property: [OWASP API5:2023](https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/) notes that authorization checks for a function or resource are usually managed through configuration or code, which is why an exposed admin route such as `/v2/admin/export` needs its own check even if the gateway blocks most callers.

## What belongs on the gateway

A gateway is the right place for controls that need no business context and that you want applied uniformly:

- **Identity checks.** Validate the token against the expected issuer, audience, algorithm, and key, and reject expired or malformed tokens. Mutual TLS can authenticate a service connection, but it does not replace application authorization.
- **Resource bounds.** Set request-size limits, timeouts, concurrency limits, and per-endpoint rate limits, and protect expensive operations more tightly than health checks. Test failure behavior so a limit does not leak details or cause a secondary outage.
- **Logging that supports the inventory.** Record route, identity reference, policy decision, status, latency, and a correlation ID. Do not log full authorization headers, tokens, credentials, or sensitive bodies, restrict access to the logs, and set retention deliberately.

Behavioral or machine-learning traffic analysis can help prioritize unusual requests, but it produces false positives and false negatives. Keep deterministic controls for authentication, authorization, schema validation, and resource limits, and test any automatic blocking against known legitimate traffic first.

Protocol-level mismatches between a gateway and its back end are a separate failure mode, covered in [HTTP request smuggling at API gateways](/blog/http-request-smuggling-api-gateway-protocol-desync-2026).

## A related case: knowing which services contain a component (Log4Shell)

An endpoint inventory answers "what is exposed". When an advisory lands for a library, you also need "which of our services contain it". CISA, the FBI, NSA and partner agencies in Australia, Canada, New Zealand and the United Kingdom published joint advisory [AA21-356A](https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-356a) in December 2021 on vulnerabilities in Apache's Log4j library, including Log4Shell. It reported that sophisticated threat actors were scanning networks for vulnerable systems, and its first recommended step was identifying the assets affected by Log4Shell and the other Log4j-related vulnerabilities, then upgrading them and starting hunt and incident-response procedures. It describes Log4j as a Java logging library used in a variety of consumer and enterprise services, websites, applications, and operational-technology products.

A library like that is rarely listed on an asset sheet that names only products and hosts. The engineering takeaway, which is our reading and not a statement from the advisory, is to record the runtime and key libraries of each service next to its owner and exposure, for example from a software bill of materials generated in CI, so the question can be answered from data in hours rather than reconstructed from memory.

## Keep the inventory from drifting

1. Generate API descriptions from version-controlled specifications and build them in CI.
2. Add an inventory update to the deployment workflow and a removal step to the decommission workflow.
3. Do not expose a new host publicly until it has an owner and a review.
4. Avoid production data in non-production deployments; where it is unavoidable, apply production-level controls to those endpoints (OWASP's recommendation).
5. When a newer version fixes a security problem, decide what to do about older versions: backport the fix if compatibility allows, or retire the old version and move clients.
6. Re-run the reconciliation on a schedule and treat each new difference as a ticket with an owner.

## Test safely

Start with passive records and an authorized internal assessment. Do not scan systems you do not own or have permission to test. Discovery is only the first step: a documented endpoint can still have authorization, configuration, or data-exposure flaws.

## Primary sources

- [OWASP API9:2023 Improper Inventory Management](https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/)
- [OWASP API5:2023 Broken Function Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/)
- [OWASP API1:2023 Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [Amazon API Gateway: Disable the default endpoint for REST APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-disable-default-endpoint.html)
- [Amazon API Gateway: Mutual TLS authentication for REST APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-mutual-tls.html)
- [Kubernetes: Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [CISA, FBI, NSA and partners: Mitigating Log4Shell and other Log4j-related vulnerabilities (AA21-356A)](https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-356a)
