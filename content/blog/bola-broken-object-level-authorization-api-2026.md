---
title: "Broken Object Level Authorization (BOLA): Prevention and Testing"
date: "2026-04-02"
updated: "2026-08-07"
description: "Learn how BOLA occurs in REST and GraphQL APIs, why authentication and unpredictable IDs are insufficient, and how to enforce and test object-level authorization."
category: "API Security"
tags: ["BOLA", "API security", "authorization", "IDOR", "OWASP", "secure coding"]
source_reviewed: "2026-08-07"
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
