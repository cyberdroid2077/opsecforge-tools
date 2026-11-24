---
title: "Broken Object Level Authorization (BOLA): Prevention and Testing"
date: "2026-04-02"
updated: "2026-11-24"
description: "How BOLA occurs in REST and GraphQL APIs, why authentication and unpredictable IDs are insufficient, and how to test for it, with a runnable GraphQL script that replays every route to an object as the wrong account."
category: "API Security"
tags: ["BOLA", "API security", "authorization", "IDOR", "OWASP", "secure coding"]
source_reviewed: "2026-11-24"
primary_source: "https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/"
---

# Broken Object Level Authorization (BOLA): Prevention and Testing

Broken Object Level Authorization occurs when an API accepts an object identifier but does not verify that the caller may perform the requested action on that specific object. A caller who is legitimately authenticated may then read, change, or delete another user's data by changing an identifier in a path, query parameter, header, or request body.

OWASP lists BOLA as API1:2023 in the API Security Top 10. It is also closely related to insecure direct object reference (IDOR). The important distinction is that authentication answers who the caller is; object-level authorization decides whether that caller may perform this action on this object.

## What a vulnerable endpoint looks like

Consider an endpoint that loads a document directly from a client-supplied ID:

```python
def get_document(document_id, current_user):
    return db.documents.find_one({"id": document_id})
```

The caller may be signed in and the token may be valid, but the query does not use the caller's authorization context. Changing `document_id` may expose a document owned by another account.

A safer design makes the authorization decision part of the lookup or performs an equivalent policy check before returning data:

```python
def get_document(document_id, current_user):
    document = db.documents.find_one({
        "id": document_id,
        "tenant_id": current_user.tenant_id,
    })

    if document is None or not policy.can_read(current_user, document):
        raise NotFoundError()

    return document
```

This example is intentionally incomplete: real policy may depend on ownership, tenant, role, relationship, resource state, requested action, and other attributes. Comparing one user ID with one object field solves only simple ownership models.

## Where BOLA appears

Object identifiers are not limited to sequential integers. OWASP notes that they can be UUIDs or other strings, and they can appear in more than URL paths. Review identifiers in:

- REST paths such as `/accounts/{account_id}/invoices/{invoice_id}`;
- query parameters, headers, cookies, and JSON bodies;
- batch operations that accept arrays of object IDs;
- GraphQL query arguments, mutations, and nested resolvers;
- file downloads, export jobs, and background-task status endpoints;
- multi-tenant administration and support workflows.

Check every operation separately. Permission to read an object does not automatically imply permission to update, delete, export, share, or approve it.

## Why common shortcuts are insufficient

### Authentication alone

A valid session or JWT establishes an authenticated identity. It does not establish entitlement to every object reachable through an endpoint. The authorization decision still belongs on the trusted server side.

### UUIDs and unpredictable IDs

Random identifiers make enumeration harder, but they are not an authorization control. IDs can leak through logs, links, browser history, analytics, referrers, support tickets, or another endpoint. The server must reject unauthorized access even when the caller knows the exact identifier.

### API gateways and route middleware

A gateway can authenticate callers and enforce coarse route or scope rules, but it may not know the application's object relationships. Enforce object-level policy where the service has enough trusted context to make the decision. Shared policy components can improve consistency, but their defaults and integration points still require review and tests.

### Client-side filtering

Hiding another tenant's records in the user interface does not protect the underlying API. Treat every identifier and authorization attribute supplied by a client as untrusted.

## Prevention checklist

1. **Map subjects, actions, and objects.** Document which users and workloads may perform each action on each resource type, including tenant and relationship rules.
2. **Deny by default.** When no explicit rule grants access, reject the request.
3. **Validate permission on every request.** Apply the decision to the requested action and object, including batch items and nested GraphQL resources.
4. **Use trusted authorization context.** Derive identity and tenant context from a verified session or token. Do not trust client-supplied owner, role, or tenant fields.
5. **Constrain data access.** Where practical, scope database queries to the authorized tenant or subject so unrelated objects are not loaded first.
6. **Centralize policy without hiding it.** Reusable authorization functions or policy engines can reduce drift, but each endpoint must actually invoke them with the correct action and resource.
7. **Fail safely.** Avoid returning protected object details through error messages, existence checks, or timing differences where that distinction is sensitive.
8. **Log decisions without leaking data.** Record enough context to investigate denied and unusual access while excluding tokens and sensitive object contents.
9. **Test the negative cases.** A successful owner request is not enough; prove that other users, tenants, roles, and workloads are denied.

## Authorization tests that catch regressions

Build a small authorization matrix for each protected resource. At minimum, include:

| Caller | Object | Action | Expected result |
| --- | --- | --- | --- |
| owner | own object | read | allow |
| different user | owner's object | read | deny |
| same role, different tenant | tenant object | read | deny |
| owner | own object | delete | policy-dependent |
| privileged support role | customer object | export | policy-dependent |
| unauthenticated caller | protected object | any | deny |

Run the matrix against REST and GraphQL entry points, bulk endpoints, alternate HTTP methods, and indirect paths such as exports. Include regression tests when a new relationship, role, or resource state changes the policy.

For an authorized security assessment, use two controlled test accounts and objects created for the test. Capture a legitimate request for account A, then repeat the request as account B with only the object reference changed. Do not test systems without permission, and avoid production data when a staging environment can reproduce the policy.

## Detecting BOLA in GraphQL

In a REST API each route is a visible place to put a check and to test it. A GraphQL API has one endpoint and a schema that is a graph: the same object can be returned by several fields, and each field has its own resolver. A check written in one resolver protects only the route that passes through it. OWASP's GraphQL Cheat Sheet makes both points: authorization checks belong "on both edges and nodes", and a schema may expose `node` or `nodes` fields that "can be used to access objects directly by ID" even when nobody intended that as a public route.

Typical routes to one object type:

| Route | Example | Why it gets missed |
| --- | --- | --- |
| The named root field | `invoice(id: "inv-1")` | Usually the one that has the check. |
| A generic lookup by ID | `node(id: "inv-1")` | Added for client caching and refetching (the Global Object Identification convention); it resolves any type from an ID. |
| A relationship on another type | `user(id: "u1") { invoices { … } }` | The parent resolver checks nothing about the children it returns. |
| A mutation that takes an ID | `deleteInvoice(id: "inv-1")` | Read checks are not reused for writes. OWASP's API1:2023 page uses a GraphQL delete mutation as its third example scenario. |

### A test you can run

The script below builds a small schema with three read routes to an `Invoice`, protects only the first one, and then replays the same three queries as the wrong account. Everything in it is synthetic. It needs Node.js and the `graphql` package (the reference JavaScript implementation); the output shown was produced with `graphql` 17.1.0 on Node.js 22.

```js
// bola-graphql.mjs — run with: npm install graphql && node bola-graphql.mjs
import { buildSchema, graphql, getNamedType, isAbstractType, isObjectType } from "graphql";

const schema = buildSchema(`
  interface Node { id: ID! }
  type Invoice implements Node { id: ID! ownerId: ID! memo: String! }
  type User implements Node { id: ID! name: String! invoices: [Invoice!]! }
  type Query {
    invoice(id: ID!): Invoice
    node(id: ID!): Node
    user(id: ID!): User
  }
`);

// Synthetic data: two accounts, one invoice each. Each memo is a canary string
// that should never appear in a response to the other account.
const users = {
  u1: { __typename: "User", id: "u1", name: "Account A" },
  u2: { __typename: "User", id: "u2", name: "Account B" },
};
const invoices = {
  "inv-1": { __typename: "Invoice", id: "inv-1", ownerId: "u1", memo: "canary-A-7f3c" },
  "inv-2": { __typename: "Invoice", id: "inv-2", ownerId: "u2", memo: "canary-B-91d0" },
};
const invoicesOf = (userId) => Object.values(invoices).filter((i) => i.ownerId === userId);

// VULNERABLE: only the `invoice` field checks ownership.
const vulnerable = {
  invoice({ id }, ctx) {
    const inv = invoices[id];
    if (!inv || inv.ownerId !== ctx.userId) throw new Error("Not found");
    return inv;
  },
  node: ({ id }) => invoices[id] ?? users[id] ?? null,
  user({ id }) {
    const u = users[id];
    return u ? { ...u, invoices: () => invoicesOf(u.id) } : null;
  },
};

// FIXED: every route loads invoices through one function that takes the caller.
function loadInvoice(ctx, id) {
  const inv = invoices[id];
  if (!inv || inv.ownerId !== ctx.userId) throw new Error("Not found");
  return inv;
}
const fixed = {
  invoice: ({ id }, ctx) => loadInvoice(ctx, id),
  node: ({ id }, ctx) => (id in invoices ? loadInvoice(ctx, id) : users[id] ?? null),
  user({ id }, ctx) {
    const u = users[id];
    if (!u) return null;
    const visible = () => invoicesOf(u.id).filter((i) => i.ownerId === ctx.userId);
    return { ...u, invoices: visible };
  },
};

// 1. List every field that can return an Invoice, directly or through an
//    interface or union it belongs to.
function fieldsReturning(schema, typeName) {
  const target = schema.getType(typeName);
  const found = [];
  for (const type of Object.values(schema.getTypeMap())) {
    if (!isObjectType(type) || type.name.startsWith("__")) continue;
    for (const field of Object.values(type.getFields())) {
      const returned = getNamedType(field.type);
      const viaAbstract = isAbstractType(returned) && schema.isSubType(returned, target);
      if (returned === target || viaAbstract) found.push(`${type.name}.${field.name}`);
    }
  }
  return found;
}
console.log("Fields that can return Invoice:", fieldsReturning(schema, "Invoice").join(", "));

// 2. One query per route to Account A's invoice, replayed as Account B.
const routes = {
  "Query.invoice": `{ invoice(id: "inv-1") { id memo } }`,
  "Query.node": `{ node(id: "inv-1") { id ... on Invoice { memo } } }`,
  "User.invoices": `{ user(id: "u1") { invoices { id memo } } }`,
};
const CANARY = invoices["inv-1"].memo;

for (const [label, rootValue] of Object.entries({ vulnerable, fixed })) {
  console.log(`\n${label} resolvers, caller = Account B (u2)`);
  for (const [route, source] of Object.entries(routes)) {
    const result = await graphql({ schema, source, rootValue, contextValue: { userId: "u2" } });
    const leaked = JSON.stringify(result.data ?? null).includes(CANARY);
    console.log(`${leaked ? "LEAK" : "ok  "} ${route.padEnd(14)} ${JSON.stringify(result)}`);
  }
}
```

Output:

```text
Fields that can return Invoice: User.invoices, Query.invoice, Query.node

vulnerable resolvers, caller = Account B (u2)
ok   Query.invoice  {"errors":[{"message":"Not found","locations":[{"line":1,"column":3}],"path":["invoice"]}],"data":{"invoice":null}}
LEAK Query.node     {"data":{"node":{"id":"inv-1","memo":"canary-A-7f3c"}}}
LEAK User.invoices  {"data":{"user":{"invoices":[{"id":"inv-1","memo":"canary-A-7f3c"}]}}}

fixed resolvers, caller = Account B (u2)
ok   Query.invoice  {"errors":[{"message":"Not found","locations":[{"line":1,"column":3}],"path":["invoice"]}],"data":{"invoice":null}}
ok   Query.node     {"errors":[{"message":"Not found","locations":[{"line":1,"column":3}],"path":["node"]}],"data":{"node":null}}
ok   User.invoices  {"data":{"user":{"invoices":[]}}}
```

The named field refuses Account B, and the same invoice comes back through the other two routes. A test that only exercised `invoice(id:)` would have passed.

### What to take from it

1. **Start from the type, not from the endpoint.** `fieldsReturning` walks the schema and lists every field whose return type is the object type or an interface or union that includes it. That list, plus the mutations that accept the type's ID, is the set of routes to test. It works from the schema definition in your repository, so it does not depend on introspection being enabled in production.
2. **Judge by the response body, not the status code.** The denied query above still produces a `data` key, and graphql.org's guidance for serving over HTTP is that a response with a non-null `data` value gets a 2xx status even when it also carries `errors`. A scanner that treats every 200 as "access granted", or every non-403 as a finding, will be wrong in both directions. Plant a unique canary value in each test account's objects and search the other account's responses for it.
3. **A parent you may read can still return children you may not.** In the fixed version Account B can still load Account A's `User` object (this toy schema treats names as public) and gets an empty `invoices` list. Decide separately for each type whether another account should get an empty list, a `null`, or an error.
4. **Put the check where every route has to pass.** The fix is not three copies of the ownership comparison; it is `loadInvoice(ctx, id)`, called by every resolver that returns an invoice. graphql.org's authorization guide recommends the same thing: keep a single source of truth for authorization in the business logic layer instead of in individual resolvers.
5. **One request can carry many IDs.** Aliases let a caller ask for `a: node(id: "inv-1") { … } b: node(id: "inv-2") { … }` and so on in a single HTTP request, so per-request rate limits do little to slow enumeration of a field that lacks a check. See [GraphQL batching and aliases](/blog/graphql-batching-attacks-dos-resource-exhaustion-2026) for limits that count the work inside a request.

Limits of this approach: the script proves the method on a toy schema with an ownership rule. In a real API the routes list will be longer, policies will depend on tenant, role, and object state, and list fields need test data in both accounts so that an empty result means "filtered" and not "no data". Subscriptions and file or export URLs returned by resolvers need the same replay and are not covered here. Run the test against your own API with accounts and objects created for the purpose.

## JWT inspection is not authorization testing

Inspecting a JWT can help identify claims the server may use, but decoding does not verify its signature, issuer, audience, expiry, or current authorization state. It also cannot show whether an API applied object-level policy correctly.

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Inspect JWT structure locally</h3>
  <p class="mb-8 text-slate-400 text-lg">OpsecForge's browser-based JWT Decoder displays header and payload fields locally. Use synthetic or already-redacted tokens when possible; decoding is not signature validation or authorization testing.</p>
  <a href="/tools/jwt-decoder" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400">
    Open JWT Decoder →
  </a>
</div>

## Primary sources

- [OWASP API1:2023 — Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)
- [GraphQL: Authorization](https://graphql.org/learn/authorization/)
- [GraphQL: Global Object Identification](https://graphql.org/learn/global-object-identification/)
- [GraphQL: Serving over HTTP](https://graphql.org/learn/serving-over-http/)
