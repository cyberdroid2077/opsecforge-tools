---
title: "How to Generate a UUID v4 in Your Browser"
date: "2026-03-27"
reviewed: "2026-08-03"
description: "Generate RFC 9562 UUID v4 identifiers with browser Web Crypto, understand their collision probability, and learn when UUIDs are—and are not—the right choice."
category: "Developer Tools"
tags: ["uuid", "guid", "uuid-v4", "web-crypto", "database", "browser"]
faqs:
  - question: "How do I generate a UUID v4 in the browser?"
    answer: "Use crypto.randomUUID() in a secure browser context. For older browsers with Web Crypto support, fill 16 bytes with crypto.getRandomValues(), then set the UUID v4 version and variant bits. Do not fall back to Math.random()."
  - question: "Can two UUID v4 values be the same?"
    answer: "Yes, because the space is finite, but a correctly generated UUID v4 has 122 random bits. Collision risk grows with the number of identifiers generated, so systems must still handle uniqueness conflicts rather than assuming they are impossible."
  - question: "Should I use a UUID as a session token or API secret?"
    answer: "Use the session or token mechanism provided by your security framework. A UUID is an identifier format, not a complete session-management design, and an unpredictable identifier does not provide expiration, rotation, storage, cookie, or authorization controls."
---

# How to Generate a UUID v4 in Your Browser

A UUID is a 128-bit identifier represented as 32 hexadecimal digits, usually grouped as `8-4-4-4-12`. In current standards, [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html) defines UUID versions 1 through 8 and supersedes RFC 4122.

For a browser tool that needs independent, opaque identifiers, UUID v4 is the straightforward choice. Its payload is random except for the version and variant bits. The important implementation rule is that those random bits must come from browser Web Crypto—not `Math.random()`.

## Generate a UUID v4 with Web Crypto

Modern browsers expose [`crypto.randomUUID()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID), which generates a UUID v4 using a cryptographically secure random-number generator. It is available only in a secure context such as HTTPS or localhost.

```js
const id = crypto.randomUUID();
console.log(id); // for example: 2c5ea4c0-4067-4a9f-ae55-3f10c8d8f996
```

If `randomUUID()` is unavailable but Web Crypto exists, [`crypto.getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) can securely fill the 16 bytes before the version and variant bits are set. `Math.random()` is not a cryptographic random source and should not be used as a silent fallback.

The OpsecForge generator follows that rule: it uses `crypto.randomUUID()` when available, falls back only to `crypto.getRandomValues()`, and refuses to generate when secure browser randomness is unavailable.

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Generate UUID v4 Values Locally</h3>
  <p class="mb-8 text-slate-400 text-lg">Create one or up to 100 UUIDs with browser Web Crypto. Inputs and results are not sent to an OpsecForge API.</p>
  <a href="/tools/uuid-generator" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
    Open UUID Generator →
  </a>
</div>

## UUID v4 Collision Probability

A standards-compliant UUID v4 has 122 random bits because the remaining bits identify its version and variant. That gives `2^122` possible random values—not `2^128` equally available UUID v4 values.

Collision risk depends on how many identifiers you generate. For `n` uniformly random UUID v4 values, the approximate probability of at least one collision while the probability is small is:

```text
n² / (2 × 2^122)
```

At one billion generated UUIDs, that approximation is about `9.4 × 10^-20`. This is extremely small, but it is not zero. Keep a unique constraint on database columns and handle a conflict by generating another value. RFC 9562 discusses both collision resistance and the difference between global and local uniqueness.

## UUID v4, UUID v7, or an Integer?

Choose based on what the identifier must do:

- **UUID v4:** useful when independent systems need random identifiers without coordination and creation time should not be encoded.
- **UUID v7:** time ordered and often a better fit for database index locality, but its timestamp is visible.
- **Sequential integer:** compact and efficient inside one database, but predictable when exposed directly.

None of these choices replaces authorization. OWASP's [IDOR guidance](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html) notes that complex identifiers are defense in depth; every request still needs a server-side permission check for the requested object.

## Do Not Treat Every UUID as a Secret

UUIDs are identifiers. Even when a UUID v4 is generated with strong randomness, using it as a session credential requires more than unpredictability: secure transport and cookies, expiration, renewal, revocation, fixation defenses, safe storage, and server-side validation all matter.

For authenticated sessions, prefer your framework's established session mechanism and follow the [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). For cryptographic keys, use a purpose-built key-generation API. Do not paste a generated UUID into a system merely because a field asks for a “secret.”

## Practical Checklist

- Generate browser UUID v4 values with `crypto.randomUUID()` or `crypto.getRandomValues()`.
- Never downgrade to `Math.random()` while claiming cryptographic randomness.
- Keep database uniqueness constraints and retry the rare conflict.
- Use UUID v7 only when timestamp disclosure and time ordering fit the design.
- Enforce authorization independently of whether IDs are sequential or random.
- Use framework-managed session identifiers and dedicated cryptographic key generators for security credentials.

## Sources

- [RFC 9562: Universally Unique IDentifiers](https://www.rfc-editor.org/rfc/rfc9562.html)
- [MDN: Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [MDN: Crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP: Insecure Direct Object Reference Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
