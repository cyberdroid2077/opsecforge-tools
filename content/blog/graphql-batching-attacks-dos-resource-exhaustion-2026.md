---
title: "GraphQL Batching and Resource Limits: A Defensive Guide"
date: "2026-03-28"
updated: "2026-08-17"
description: "Bound GraphQL batching, aliases, depth, pagination, and query cost without confusing one HTTP request with one unit of work."
category: "API Security"
tags: ["GraphQL", "batching", "resource limits", "API security", "denial of service"]
source_reviewed: "2026-08-17"
primary_source: "https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html"
---

# GraphQL Batching and Resource Limits: A Defensive Guide

A GraphQL endpoint should not treat one HTTP request as one fixed unit of work. A single request can ask for many aliased fields, wide or deeply nested selections, large connection pages, or—when the server supports a batching extension—multiple request entries. Bound the work the server will accept, charge it to the authenticated caller when possible, and keep authorization checks on every requested object and field.

“Disable batching” is not a complete defense. Transport batching, aliases, fragments, pagination, and backend data-loader batching are different mechanisms. Controls should match the behavior the implementation actually supports.

## What “batching” can mean

The word is used for several different patterns:

| Pattern | What happens | Security decision |
| --- | --- | --- |
| Aliases in one operation | One operation asks for the same field several times under different response names | Count the resulting field, object, and resolver work; enforce authorization for every result. |
| Multiple operations in one document | A document contains several named operations | Under the GraphQL specification, the client must select one operation when a document contains multiple operations. Do not assume every definition executes. |
| HTTP request batching | A server or framework extension accepts an array of GraphQL request entries in one HTTP request | Disable it when it is not needed, or cap entries and enforce both per-entry and aggregate budgets. |
| Server-side data-loader batching | The server combines duplicate or related backend reads during execution | This can reduce resource use. Do not confuse it with accepting more client work. |

The [GraphQL specification](https://spec.graphql.org/September2025/#sec-Executing-Requests) requires an operation name when a document contains multiple operations, and execution selects one operation. Array-style HTTP batching is therefore an implementation feature rather than evidence that a standard GraphQL document executes every operation it contains.

OWASP's [GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html) separately discusses aliases, request batching, depth and amount limits, query cost, pagination, timeouts, rate limiting, authorization, and server-side batching. That separation is useful: no single counter covers every resource path.

## Start with the work graph

Before choosing limits, identify what consumes resources:

- accepted request envelopes, including any array-batch extension;
- operations, aliases, fragments, directives, and introspection;
- list fields and their `first`, `last`, limit, or page-size arguments;
- resolver fan-out into databases, caches, queues, search services, or other APIs;
- mutation side effects and idempotency behavior;
- authorization checks on nodes, edges, fields, and mutations; and
- response size, serialization work, memory, CPU, and execution time.

A depth limit alone can still allow a shallow but very wide operation. A request-count limit alone can miss an expensive operation. A cost model alone can be wrong when resolver behavior or data distribution changes. Use overlapping, observable controls.

## Apply layered limits

### 1. Bound the request before execution

Reject malformed or unsupported envelopes early. If HTTP batching is enabled, define a maximum number of entries and a maximum total request size. Validate each entry independently, then apply an aggregate limit to the whole envelope.

Also bound:

- document size and parse time;
- operation and fragment counts;
- selection depth and breadth;
- repeated aliases and cyclic fragment references;
- list arguments and total requested nodes; and
- variables and input-object sizes.

Set limits from measurements of legitimate operations and backend capacity. A copied universal value such as “depth 10” or “timeout 5 seconds” is not a production policy.

### 2. Estimate cost before dispatch

Assign cost according to expected work, including multiplicative list fan-out and expensive fields. Reject an entry that exceeds its per-operation budget, and reject a transport batch whose combined cost exceeds the batch budget.

Cost should reflect the actual schema and resolver paths. Recalibrate it when a resolver changes, a field begins calling another service, or real execution cost diverges from the estimate. GitHub's production GraphQL API illustrates the layered approach: its [rate and query limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api) include point-based budgets, connection pagination requirements, a total node limit, timeouts, and other resource limits.

### 3. Rate-limit by a meaningful principal

Charge accepted and rejected work to the authenticated user, service account, API key, tenant, or installation when available. Use network identity as an additional signal for unauthenticated traffic, not as a substitute for application identity.

Track both request rate and cost consumption. For a supported HTTP batch, one network request can consume several operation budgets. Mutations and other sensitive actions may need separate, lower limits and business-level abuse controls.

Do not trust a client-supplied forwarding header as the caller identity. Resolve the client address only through a reviewed trusted-proxy configuration.

### 4. Enforce authorization inside the graph

Resource limits do not fix broken authorization. Every resolver or service boundary that returns or changes protected data must enforce caller-specific access for the requested node, edge, field, or mutation.

Aliases and batching can make authorization gaps easier to exercise at scale, but removing aliases or batching does not close the gap. Add negative tests for:

- another tenant's object identifier;
- a permitted parent with a forbidden child or field;
- mixed authorized and unauthorized items in one operation;
- repeated sensitive mutations;
- array batches containing different identities or contexts; and
- partial-error behavior that might disclose protected data.

### 5. Bound runtime and downstream work

Use application-aware deadlines and cancellation where the runtime and data source support them. Propagate deadlines to databases and downstream services, cap concurrency, bound queues, and apply container or process resource limits.

A timeout is a backstop, not proof that earlier work was harmless. The service may already have consumed CPU, memory, database connections, or downstream capacity before the deadline fires. Record cancellations and verify that abandoned work does not continue invisibly.

Server-side data loaders and request-scoped caches can reduce duplicate backend work. Scope caches so one caller cannot receive another caller's protected result, and include authorization-relevant context in cache decisions.

## Choose a transport-batching policy

Use one of these explicit policies:

1. **Not supported:** reject array request envelopes when clients do not require them.
2. **Supported with strict bounds:** cap entry count, body size, per-entry cost, aggregate cost, concurrency, and mutation behavior.
3. **Trusted-client only:** allow batching only for authenticated clients with an owned use case and a separately enforced budget.

Document the chosen wire format because GraphQL frameworks and gateways do not all implement batching the same way. Test the deployed gateway and application together; an upstream proxy that counts HTTP requests cannot see every unit of GraphQL work unless the application exports a safe derived signal.

## Test safely

Use a staging or isolated environment with synthetic data and explicit authorization. Build a small matrix rather than firing an unbounded stress script at production:

| Case | Expected result |
| --- | --- |
| Normal named operation within budget | Accepted and charged the expected cost |
| Wide shallow selection | Rejected by breadth, node, or cost policy |
| Deep nested selection | Rejected by depth or cost policy |
| Oversized page argument | Rejected or clamped according to the documented contract |
| Too many aliases | Rejected before resolver fan-out |
| Array batch over entry limit | Entire envelope rejected with a bounded error |
| Entries valid alone but over aggregate cost | Aggregate batch rejected |
| Unauthorized object mixed with authorized objects | Protected object and fields remain unavailable; no data leaks through partial results |
| Resolver exceeds deadline | Work is cancelled where supported and the event is observable |

Test limits during normal load and degraded downstream conditions. A budget that works against a warm cache can still overload a database or dependency during a cache miss or outage.

## Observe limits without logging sensitive payloads

Useful aggregate fields include:

- authenticated principal or tenant identifier in an access-controlled log, when policy permits;
- registered operation name or a one-way operation signature;
- request-entry count, predicted cost, depth, node count, and resolver count;
- accepted or rejected outcome and a bounded reason code;
- execution time, timeout, cancellation, and downstream error class; and
- response byte count without response bodies.

Do not record authorization headers, variables, full query payloads, returned objects, tokens, passwords, or personal data merely to tune a limiter. Keep security logs access-controlled and retention-bounded.

If a GraphQL request or diagnostic trace must be shared in a ticket, replace real values with synthetic data first. OpsecForge's [Safe-to-Share Sanitizer](/tools/env-sanitizer) can help flag common secrets locally in the browser, but its detection is heuristic: it can miss custom formats, and the result still requires human review.

## Incident checklist

If GraphQL traffic is exhausting resources or exercising sensitive operations:

1. Preserve bounded request metadata, limit decisions, affected principals, and downstream symptoms without copying secrets into the incident record.
2. Apply a reviewed temporary control at the narrowest effective layer: operation signature, authenticated principal, tenant, mutation, field, or batch feature.
3. Confirm whether authorization or data exposure occurred; do not classify an availability event as a breach without evidence.
4. Reduce accepted cost, concurrency, page sizes, or batch counts based on observed work, and verify the effect under load.
5. Fix resolver fan-out, cancellation, cache scope, and missing authorization rather than relying permanently on an emergency block.
6. Add the observed pattern to regression and capacity tests before relaxing temporary controls.

The durable rule is simple: measure and bound GraphQL work at the application layer, while retaining network, identity, authorization, and infrastructure controls around it. One HTTP request is only a transport fact—not a trustworthy measure of cost or permission.

## Reviewed sources

- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [GraphQL Specification, September 2025: Executing Requests](https://spec.graphql.org/September2025/#sec-Executing-Requests)
- [GitHub Docs: Rate limits and query limits for the GraphQL API](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)
