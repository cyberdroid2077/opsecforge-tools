---
title: "Why Your API JSON Responses Are a Security Blind Spot"
date: "2026-03-24"
updated: "2026-10-23"
description: "Learn how excessive JSON response fields expose sensitive data, how this differs from request-side mass assignment, and how to test explicit response contracts."
author: "OpsecForge Security Team"
category: "API Security"
tags: ["JSON", "API Security", "Data Leakage", "Response Filtering", "DevSecOps"]
source_reviewed: "2026-10-23"
primary_source: "https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/"
---

# Why Your API JSON Responses Are a Security Blind Spot

If an endpoint serializes a database object as it is, the response contains every attribute on that object, whether or not the client needs it. Authorization has to cover the properties in the response as well as the object.

OWASP names this risk [API3:2023 Broken Object Property Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/). The 2023 edition merged two 2019 entries into it: [API3:2019 Excessive Data Exposure](https://owasp.org/API-Security/editions/2019/en/0xa3-excessive-data-exposure/) (reading properties the caller should not see) and [API6:2019 Mass Assignment](https://owasp.org/API-Security/editions/2019/en/0xa6-mass-assignment/) (writing them). This article covers the read side and shows how to test for it.

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">What Over-Exposure Looks Like</h2>
</div>

OWASP's first example is a dating app whose "report user" call returns the reported user's `fullName` and `recentLocation`, although the reporter should never see them. The fields were part of the object, so they were part of the response.

The script below reproduces the pattern with a synthetic `User`. Serializing the whole object (`asdict(user)`) returns the password hash, e-mail address, admin flag and internal notes alongside the name. Mass assignment is the write-side counterpart: the API maps request JSON onto a model and lets the client set a protected field such as `is_admin`.

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Response Filtering</h2>
</div>

OWASP's prevention advice is to avoid generic methods such as `to_json()` and `to_string()` and to cherry-pick the properties you intend to return. Define the response for each endpoint explicitly, and add `?fields=` support only through an allow-list.

```python
from dataclasses import dataclass, asdict

import jsonschema


@dataclass
class User:
    id: int
    public_id: str
    name: str
    avatar_url: str
    email: str
    password_hash: str
    is_admin: bool
    internal_notes: str


user = User(7, "u_4f2a", "Ada", "https://cdn.example.test/ada.png",
            "ada@example.test", "$2b$12$synthetic", False, "synthetic note")

# 1. Unconstrained serialization: every attribute becomes part of the response
leaky = asdict(user)

# 2. Explicit response model: only what this endpoint is meant to return
def public_user(u: User) -> dict:
    return {"id": u.public_id, "name": u.name, "avatar": u.avatar_url}

# 3. Allow-list for ?fields=name,avatar
ALLOWED = {"name", "avatar", "id"}

def select_fields(payload: dict, fields_param: str) -> dict:
    requested = {f for f in fields_param.split(",") if f}
    return {k: v for k, v in payload.items() if k in (requested & ALLOWED)}

# 4. Closed schema for tests
user_schema = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "name": {"type": "string"},
        "avatar": {"type": "string"},
    },
    "required": ["id", "name"],
    "additionalProperties": False,
}

def check(response: dict) -> str:
    try:
        jsonschema.validate(response, user_schema)
        return "ok"
    except jsonschema.ValidationError as e:
        return "FAIL: " + e.message
```

`select_fields` intersects what the client asks for with what the endpoint allows, so a request for `email` or `password_hash` is silently dropped. Whether a field is allowed should also depend on who is asking; a static set like `ALLOWED` fits only fields that are public for every caller.

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Testing the Response Contract</h2>
</div>

OWASP also recommends schema-based response validation as an extra layer. With `additionalProperties` set to `False`, a response that grows a new field fails the test instead of shipping. The checks below run against the definitions above:

```python
print("leaky keys      :", sorted(leaky))
print("public keys     :", sorted(public_user(user)))
print("?fields=name,email,password_hash ->", select_fields(public_user(user), "name,email,password_hash"))
print("schema(leaky)   :", check(leaky))
print("schema(public)  :", check(public_user(user)))
```

```text
leaky keys      : ['avatar_url', 'email', 'id', 'internal_notes', 'is_admin', 'name', 'password_hash', 'public_id']
public keys     : ['avatar', 'id', 'name']
?fields=name,email,password_hash -> {'name': 'Ada'}
schema(leaky)   : FAIL: Additional properties are not allowed ('avatar_url', 'email', 'internal_notes', 'is_admin', 'password_hash', 'public_id' were unexpected)
schema(public)  : ok
```

That output comes from running the full script with `jsonschema` 4.26 on Python 3.12. In a real suite, call the endpoint with a test client and pass `response.json()` to `jsonschema.validate`, for each role and for list, nested and error responses. A schema in a test does not stop a leak in production; it only catches the regression before release.

### Inspecting Responses Locally

Sensitive JSON should not be pasted into online formatters. Use a tool that runs in the browser tab.

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Format JSON Without Data Leaks</h3>
  <p class="mb-8 text-slate-400 text-lg">Stop pasting sensitive API responses into online formatters. Our client-side JSON tool handles your data locally, with validation and error highlighting.</p>
  <a href="/tools/json-beautifier" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
    Open JSON Formatter →
  </a>
</div>

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Checklist</h2>
</div>

1. **Return an explicit model per endpoint** (`public_user` above) instead of the persistence object.
2. **Check the caller's right to each property**, not only to the object. A role check on the route does not tell you which fields a given role may read.
3. **Close the schema** with `additionalProperties: false` in tests, so a new database column cannot reach a response unnoticed.
4. **Test every response shape**: list endpoints, nested relations, error bodies, and each role that can call the endpoint.
5. **Keep full response bodies out of logs and analytics.** Log the route, status code and size.

## Sources

- [OWASP API3:2023 Broken Object Property Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [OWASP API3:2019 Excessive Data Exposure](https://owasp.org/API-Security/editions/2019/en/0xa3-excessive-data-exposure/) and [API6:2019 Mass Assignment](https://owasp.org/API-Security/editions/2019/en/0xa6-mass-assignment/)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [JSON Schema: additionalProperties](https://json-schema.org/understanding-json-schema/reference/object)
