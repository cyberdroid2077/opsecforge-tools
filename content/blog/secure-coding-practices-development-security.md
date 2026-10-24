---
title: "Secure Coding Practices: What They Are and a Checklist by Development Stage"
date: "2026-04-06"
updated: "2026-10-24"
description: "Secure coding practices are the habits that keep code enforcing its security rules when input is hostile or a component fails. Nine practices with code patterns, sources, and a design-to-deploy checklist."
author: "OpsecForge Security Team"
category: "Application Security"
tags: ["secure-coding", "devsecops", "input-validation", "secrets-management", "vulnerability-prevention"]
source_reviewed: "2026-10-24"
primary_source: "https://csrc.nist.gov/pubs/sp/800/218/final"
---

# Secure Coding Practices: What They Are and a Checklist by Development Stage

**Secure coding practices are the design and coding habits that keep software enforcing its security rules when input is hostile, a caller is untrusted, or a dependency fails.** They are not a final scan. Each one targets a specific class of flaw, which is why this page does not try to teach all of them: it names the flaw, shows what it looks like in code, and sends you to the page on this site (and the primary source) that goes deep.

[NIST's Secure Software Development Framework (SP 800-218)](https://csrc.nist.gov/pubs/sp/800/218/final) organizes this work into preparing the organization, protecting the software, producing well-secured software, and responding to vulnerabilities. The practices below cover the "producing well-secured software" part for web and API code. Use the [stage checklist](#checklist-by-development-stage) at the end if you want to jump straight to what to do when.

## 1. Check authorization on the object, not just the login

The most common API flaw is a handler that confirms the caller is logged in and then loads whatever ID they sent. The fix is to put the owner in the query or to check it before returning the object:

```python
# Any logged-in user can read any invoice by guessing or enumerating IDs
invoice = db.get("SELECT * FROM invoices WHERE id = ?", (invoice_id,))

# The caller must own the row; a miss is indistinguishable from "not found"
invoice = db.get(
    "SELECT * FROM invoices WHERE id = ? AND owner_id = ?",
    (invoice_id, current_user.id),
)
```

Unpredictable IDs do not replace this check. Test it with two accounts: request A's object with B's token. Deep dive: [BOLA prevention and testing](/blog/bola-broken-object-level-authorization-api-2026). Sources: [OWASP API1:2023](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/), [CWE-639](https://cwe.mitre.org/data/definitions/639.html), [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## 2. Bind only the fields a client may set

Passing a request body straight into an ORM model lets a client set fields you never put on the form, such as `role` or `is_admin`. Name the writable fields explicitly, per operation:

```ts
const { displayName, timezone } = parseProfileUpdate(req.body); // schema rejects extras
await db.user.update({ where: { id: currentUser.id }, data: { displayName, timezone } });
```

Deep dive: [mass assignment and unsafe object binding](/blog/mass-assignment-api-vulnerability-orm-auto-binding-2026). Sources: [OWASP API3:2023](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/), [CWE-915](https://cwe.mitre.org/data/definitions/915.html), [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html).

## 3. Keep data out of the query text

Parameters cover values. They do not cover table names, column names, or sort direction, and ORM "raw" escape hatches reintroduce string building. Anything that selects an identifier must come from a fixed list in your code. Deep dive, with tested examples for SQLite, Django, SQLAlchemy and Sequelize: [SQL injection in API code](/blog/sql-injection-modern-apis-parameterized-queries-2026). To read a messy query before reviewing it, use the [SQL Formatter](/tools/sql-formatter). Sources: [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), [CWE-89](https://cwe.mitre.org/data/definitions/89.html).

## 4. Validate input on the server and encode output for its destination

Validation answers "is this value acceptable?" with an allowlist of type, length, range, and format. Encoding answers "can this value become code where I am putting it?" and depends on the destination (HTML text, attribute, URL, script). Prefer APIs that do not parse markup at all:

```js
el.textContent = comment.body;  // rendered as text
el.innerHTML = comment.body;    // parsed as HTML: stored XSS if body is attacker-controlled
```

If users must supply HTML, run it through a maintained sanitizer with an explicit policy rather than a regular expression. This site has no dedicated article on cross-site scripting, so rely on the sources: [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [CWE-79](https://cwe.mitre.org/data/definitions/79.html).

## 5. Do not let user-supplied URLs reach internal networks

Any feature that fetches a URL for the user (link previews, image import, webhook targets) can be pointed at `localhost` or a cloud metadata address. A check on the hostname string is not enough, because the name can resolve differently when your HTTP client connects, and a redirect can lead somewhere the check never saw. The reliable shape is a host allowlist, a check of the IP address actually connected to, and redirects either disabled or validated hop by hop. Deep dive with code: [SSRF prevention for APIs](/blog/ssrf-api-security-guide-2026). Sources: [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html), [CWE-918](https://cwe.mitre.org/data/definitions/918.html).

## 6. Use current password rules and validate tokens fully

For passwords, NIST SP 800-63B-4 centers on length, screening against a blocklist of commonly used or compromised values, and not forcing arbitrary composition rules; see [what it requires and how to calculate entropy](/blog/password-security-vulnerabilities-best-practices) and try the [Password Generator](/tools/password-generator). Store passwords with a dedicated password hashing function, not a plain hash ([OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)).

For JWTs, the verifier must fix the accepted algorithm itself instead of trusting the token's header, and must check the claims it relies on (issuer, audience, expiry). Decoding a token is not verifying it. Deep dives: [JWT vulnerabilities and safe validation](/blog/jwt-token-vulnerabilities-authentication-security) and [signing and issuing tokens](/blog/jwt-encoder-security-token-generation-best-practices); inspect a token locally with the [JWT Decoder](/tools/jwt-decoder), which parses but does not verify signatures. Sources: [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), [RFC 8725 (JWT best current practices)](https://www.rfc-editor.org/rfc/rfc8725.html), [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

## 7. Verify webhook signatures over the raw body

A webhook endpoint is a public URL that anyone can POST to. Compute the HMAC over the exact bytes received (not re-serialized JSON) and compare in constant time:

```js
const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
const ok = a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
```

Where `a` is the received signature header and `b` the value you computed. Add a timestamp window and event-ID deduplication if the provider supports them. Deep dive with GitHub, Stripe and Slack examples: [verifying webhook signatures](/blog/webhook-signature-validation-hmac-sha256-best-practices-2026); try it in the [Webhook Signature Verifier](/tools/webhook-debugger). Sources: [GitHub: validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries), [CWE-347](https://cwe.mitre.org/data/definitions/347.html).

## 8. Keep secrets out of code, logs, and shared files

A credential in source, a build log, a client bundle, or a pasted `.env` is exposed to everyone who can read those. Load secrets at runtime, scope each one narrowly, and when one leaks, revoke it before you start cleaning up. Deep dives: [are environment variables secure?](/blog/environment-variable-security-secrets-management), [what to do after an environment-variable leak](/blog/environment-variable-leaks-security-risks), [API key leaks](/blog/api-key-leaks-credential-security), and [token exposure in CI/CD](/blog/oauth-token-leakage-ci-cd-2026). Before sharing a config file for debugging, run it through the [Safe-to-Share Sanitizer](/tools/env-sanitizer); its detection is heuristic, so read the output before you send it. Sources: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html), [CWE-798](https://cwe.mitre.org/data/definitions/798.html).

## 9. Limit resource use and know every endpoint you expose

Endpoints without limits on request rate, payload size, query depth, or batch size invite denial of service and cost abuse, and a limit keyed only on IP address is easy to shift around. Separately, an endpoint you forgot (old versions, debug routes, paths that skip the gateway) has no controls at all. Deep dives: [rate limit design](/blog/api-rate-limiting-bypass-attacks-2026), [GraphQL batching and resource limits](/blog/graphql-batching-attacks-dos-resource-exhaustion-2026), [API inventory and gateway boundaries](/blog/shadow-apis-the-invisible-threat-2026), and [HTTP request smuggling at the gateway](/blog/http-request-smuggling-api-gateway-protocol-desync-2026). Sources: [OWASP API4:2023](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/), [OWASP API9:2023](https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/).

## Checklist by development stage

**Design**
- [ ] Write down each trust boundary and who may do what to which object (practices 1, 9). Make each rule testable: "only the owner can download this invoice."
- [ ] Decide where secrets live and how they rotate (practice 8: [environment variables](/blog/environment-variable-security-secrets-management)).
- [ ] List every endpoint and its limits before launch (practice 9: [API inventory](/blog/shadow-apis-the-invisible-threat-2026)).

**Coding**
- [ ] Owner check in every object lookup ([BOLA](/blog/bola-broken-object-level-authorization-api-2026)); explicit writable fields ([mass assignment](/blog/mass-assignment-api-vulnerability-orm-auto-binding-2026)).
- [ ] No string-built queries; identifiers from a fixed list ([SQL injection](/blog/sql-injection-modern-apis-parameterized-queries-2026)).
- [ ] URL-fetching features use an allowlist and check the connected IP ([SSRF](/blog/ssrf-api-security-guide-2026)).
- [ ] Webhooks verified over the raw body ([signature guide](/blog/webhook-signature-validation-hmac-sha256-best-practices-2026)); JWT algorithm and claims pinned ([JWT validation](/blog/jwt-token-vulnerabilities-authentication-security)).

**Review**
- [ ] For every new route, ask who else's data it returns if the ID changes, and which request fields reach the database.
- [ ] Add tests for the denied path: another user's ID, a lower role, an extra JSON field, an unsigned webhook.
- [ ] Search the diff for secrets and for pasted config; sanitize shared files with the [Safe-to-Share Sanitizer](/tools/env-sanitizer).

**Deploy and operate**
- [ ] CI credentials are short-lived and scoped ([CI/CD token exposure](/blog/oauth-token-leakage-ci-cd-2026)); leak response is rehearsed ([leak response](/blog/environment-variable-leaks-security-risks)).
- [ ] Rate and size limits are active at the gateway and the application ([rate limits](/blog/api-rate-limiting-bypass-attacks-2026)).
- [ ] Logs record authentication and authorization failures without tokens or passwords ([OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)).
- [ ] You can receive a vulnerability report, ship a fix, and add a test or rule so the same flaw does not return (NIST SSDF group RV).

## Sources

- [NIST SP 800-218, Secure Software Development Framework 1.1](https://csrc.nist.gov/pubs/sp/800/218/final)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/), a detailed requirements list to take this page's practices further
- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
