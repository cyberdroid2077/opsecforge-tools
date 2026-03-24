---
title: "GraphQL Batching Attacks: The DoS Vector Hiding in Plain Sight"
description: "How attackers exploit GraphQL's batching feature to bypass rate limits, brute-force credentials, and exhaust API resources—and why standard WAFs can't stop them."
date: "2026-03-24"
category: "API Security"
tags: ["GraphQL", "DoS", "Batching", "API Security", "Rate Limiting", "Resource Exhaustion"]
---

# GraphQL Batching Attacks: The DoS Vector Hiding in Plain Sight

<!-- Threat Badge -->
<div class="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 border border-red-500/20 mb-6">
  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>
  <span>High Severity: Active Exploitation Detected</span>
</div>

In March 2026, a fintech startup running a GraphQL API discovered their authentication endpoint was processing 50,000 login attempts per second—all from a single IP address. Their WAF showed nothing unusual. Rate limiting was "working." But attackers weren't sending 50,000 HTTP requests. They were sending **one**.

Welcome to the world of GraphQL batching attacks, where the flexibility that makes GraphQL powerful becomes its greatest vulnerability.

<!-- Section Header: The Batching Trap -->
<div class="flex items-center gap-3 mb-4">
  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  </div>
  <h2 class="text-2xl font-bold text-slate-100">The Batching Trap: When Convenience Becomes Exploitation</h2>
</div>

GraphQL's batching feature was designed to solve the N+1 query problem. Instead of making multiple HTTP round trips, clients bundle operations into a single request:

```json
[
  {"query": "query { user(id: 1) { name } }"},
  {"query": "query { user(id: 2) { name } }"},
  {"query": "query { user(id: 3) { name } }"}
]
```

The server processes them sequentially, returning an array of results. Elegant, efficient—and absolutely devastating when weaponized.

Attackers quickly realized that most rate limiters count **HTTP requests**, not **GraphQL operations**. A single POST request containing 100 login attempts looks like one request to your infrastructure but executes as 100 authentication attempts against your database. Standard WAF rules don't inspect JSON payloads for nested query arrays. IP-based blocking becomes meaningless when the "attack volume" shows up as 10 requests per minute.

<!-- Warning Box -->
<div class="my-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
  <div class="flex items-start gap-3">
    <svg class="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
    <div>
      <h4 class="text-lg font-bold text-amber-400 mb-2">The OTP Bypass Reality</h4>
      <p class="text-slate-300 m-0">Batching attacks don't just brute-force passwords. Security researchers have demonstrated bypassing two-factor authentication by sending all 1,000,000 possible 6-digit OTP codes in a single batched request. The server validates each sequentially until one succeeds—all within the "allowed" request rate.</p>
    </div>
  </div>
</div>

<!-- Section Header: Attack Variants -->
<div class="flex items-center gap-3 mb-4">
  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-cyan-400">
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  </div>
  <h2 class="text-2xl font-bold text-slate-100">Beyond Batching: The Resource Exhaustion Arsenal</h2>
</div>

Disabling batching doesn't solve the problem. Attackers have multiple vectors to achieve the same outcome:

**Alias Overloading**
When batching is disabled, aliases provide an alternative path:

```graphql
query {
  user1: user(id: 1) { name email }
  user2: user(id: 2) { name email }
  user3: user(id: 3) { name email }
  # ... repeat 100 times
}
```

The server processes each alias as a separate resolver invocation. One request, N operations.

**Field Duplication**
Even simpler—duplicate fields force redundant computation:

```graphql
query {
  user(id: 1) {
    name
    name
    name
    # repeated 50 times
  }
}
```

Some GraphQL implementations deduplicate response fields but still execute the resolvers, wasting CPU and database connections.

**Circular Fragments**
GraphQL fragments are client-controlled and can create circular references that expand exponentially:

```graphql
fragment UserFields on User {
  friends {
    ...UserFields
  }
}

query {
  user(id: 1) {
    ...UserFields
  }
}
```

Without depth limiting, this query recursively traverses relationships until resource exhaustion crashes the server.

<!-- Case Study Box -->
<div class="my-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-6">
  <div class="flex items-start gap-3">
    <svg class="h-6 w-6 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
    <div>
      <h4 class="text-lg font-bold text-rose-400 mb-2">Case Study: The Hidden Cost of Nested Queries</h4>
      <p class="text-slate-300 m-0 mb-3">An e-commerce platform experienced intermittent API outages during peak traffic. Investigation revealed attackers sending complex queries with 15+ levels of nesting: <code>product -&gt; category -&gt; products -&gt; reviews -&gt; user -&gt; orders -&gt; products...</code> Each request triggered thousands of database queries. The "small" API load (200 req/s) translated to 200,000+ SQL queries per second, overwhelming the PostgreSQL connection pool and causing cascading failures across the platform.</p>
      <p class="text-slate-400 text-sm m-0">The fix cost $47,000 in emergency infrastructure scaling before proper query complexity analysis was implemented.</p>
    </div>
  </div>
</div>

<!-- Section Header: Defense Strategy -->
<div class="flex items-center gap-3 mb-4">
  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-purple-400">
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  </div>
  <h2 class="text-2xl font-bold text-slate-100">Defense in Depth: Securing GraphQL APIs</h2>
</div>

Protecting GraphQL requires moving beyond traditional HTTP-centric security models. Here's a practical defense strategy:

**1. Query Complexity Analysis**

Assign cost scores to fields and reject queries exceeding thresholds:

```python
# Python example using graphql-cost-analysis concepts
COMPLEXITY_LIMIT = 1000

field_costs = {
    'User': {'friends': 10, 'orders': 5},
    'Order': {'products': 5, 'shipping': 1},
}

def calculate_complexity(query_ast):
    total = 0
    for field in query_ast.selections:
        cost = field_costs.get(field.type, {}).get(field.name, 1)
        total += cost * calculate_complexity(field)
    return total
```

**2. Depth Limiting**

Prevent circular and deeply nested queries:

```javascript
// Node.js using graphql-depth-limit
const depthLimit = require('graphql-depth-limit');
const { createYoga } = require('graphql-yoga');

const yoga = createYoga({
  schema,
  validationRules: [depthLimit(10)]  // Max 10 levels deep
});
```

**3. Operation-Level Rate Limiting**

Count GraphQL operations, not HTTP requests:

```yaml
# Example Envoy proxy configuration
rate_limits:
  - actions:
      - request_headers:
          header_name: "x-graphql-operation-count"
          descriptor_key: "graphql_ops"
    limit:
      unit: minute
      requests_per_unit: 50  # Max 50 operations per minute
```

**4. Persistent Query Whitelisting**

Only allow pre-registered queries in production:

```javascript
// Using @apollo/persisted-query-lists
const { PersistedQueryList } = require('@apollo/persisted-query-lists');

const allowList = new PersistedQueryList({
  queries: require('./query-manifest.json')
});
```

<!-- Feature Grid -->
<div class="my-8 grid gap-4 sm:grid-cols-2">
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
    <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
      <svg class="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    <h3 class="mb-2 font-bold text-slate-100">Query Cost Analysis</h3>
    <p class="text-sm text-slate-400">Assign complexity scores to fields based on database impact. Reject queries exceeding cost thresholds before execution.</p>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
    <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
      <svg class="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
    </div>
    <h3 class="mb-2 font-bold text-slate-100">Depth & Breadth Limits</h3>
    <p class="text-sm text-slate-400">Enforce maximum query depth and limit the number of fields per selection to prevent resource exhaustion attacks.</p>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
    <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
      <svg class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
    <h3 class="mb-2 font-bold text-slate-100">Timeout Controls</h3>
    <p class="text-sm text-slate-400">Set aggressive query execution timeouts. Kill queries running longer than 5 seconds to prevent slowloris-style attacks.</p>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
    <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
      <svg class="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    </div>
    <h3 class="mb-2 font-bold text-slate-100">Trusted Documents</h3>
    <p class="text-sm text-slate-400">Disable arbitrary queries in production. Only execute pre-registered, hashed queries known at build time.</p>
  </div>
</div>

<!-- Section Header: The Bottom Line -->
<div class="flex items-center gap-3 mb-4">
  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-rose-400">
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
    </svg>
  </div>
  <h2 class="text-2xl font-bold text-slate-100">The Bottom Line</h2>
</div>

GraphQL's flexibility is a double-edged sword. The same features that make it developer-friendly—batching, nested queries, client-specified fields—create attack surfaces invisible to traditional security tooling. Standard WAFs, IP-based rate limiting, and HTTP-centric monitoring won't save you.

The vulnerabilities disclosed in early 2026—including Check Point Research's findings on Claude Code's API key exfiltration and the ongoing GraphQL DoS campaigns targeting fintech—demonstrate that attackers are actively exploiting these gaps.

**Audit your GraphQL APIs today:**
- Review rate limiting logic—are you counting operations or requests?
- Test query complexity limits with real attack patterns
- Disable introspection and GraphiQL in production
- Implement persistent query whitelisting
- Monitor for alias-heavy queries and field duplication

Your next breach might come in a single POST request containing a thousand malicious operations. Make sure you're counting what matters.

<!-- Tool Spotlight -->
<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Decode JWTs Without Exposing Secrets</h3>
  <p class="mb-8 text-slate-400 text-lg">Stop pasting your tokens into online decoders that log your payload. Use our fully client-side JWT decoder to inspect headers and payloads without sending data to any server.</p>
  <a href="/tools/jwt-decoder" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
    Open JWT Decoder →
  </a>
</div>
