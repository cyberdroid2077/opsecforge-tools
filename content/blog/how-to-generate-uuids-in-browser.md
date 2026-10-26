---
title: "How to Generate a UUID v4 in Your Browser"
date: "2026-03-27"
reviewed: "2026-10-26"
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

Modern browsers expose [`crypto.randomUUID()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID), which generates a UUID v4 using a cryptographically secure random-number generator. MDN marks it as available only in [secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts) such as HTTPS pages (localhost is also treated as potentially trustworthy by browsers). On a plain `http://` page on a real hostname, `crypto.randomUUID` is not defined, so check for it instead of assuming it exists.

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

## What the Fallback Does, Bit by Bit

A v4 UUID is 16 random bytes with six bits overwritten: four for the version and two for the variant. To see exactly which, take a fixed, synthetic 16-byte value instead of random data. Here the bytes are `00 11 22 33 … ee ff`, which print as:

```text
00112233-4455-6677-8899-aabbccddeeff
```

Two bytes need to change:

- **Byte 6** holds the version in its high nibble. `bytes[6] & 0x0f` clears that nibble and `| 0x40` writes `4`. Here `0x66` becomes `0x46`.
- **Byte 8** holds the variant in its top two bits. `bytes[8] & 0x3f` clears them and `| 0x80` writes `10`. Here `0x88` is already `10001000`, so it stays `0x88`.

The result, computed with Node.js:

```text
00112233-4455-4677-8899-aabbccddeeff
```

Two positions in the string are therefore constrained. The 13th hexadecimal digit (the first character of the third group) is always `4`. The 17th digit (the first character of the fourth group) can only be `8`, `9`, `a`, or `b`, because the top two bits are `10` and the other two bits are random. Every other digit, 122 bits in total, is random.

A complete fallback that you can run in a browser console or in Node.js:

```js
function uuidV4(c = globalThis.crypto) {
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("Secure randomness unavailable");
  }
  if (typeof c.randomUUID === "function") return c.randomUUID();

  const bytes = c.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
```

The function throws rather than falling back to `Math.random()`. To test the bit logic without randomness, pass a stub whose `getRandomValues` fills the array with `i * 17`: it returns `00112233-4455-4677-8899-aabbccddeeff`, matching the walk-through above. Running the real generator 10,000 times and checking each output against the pattern in the next section produced no mismatches.

## Validate and Identify a UUID

Format checks are cheap and worth doing before a value reaches a database or an API. This regular expression accepts only UUIDs whose version is 4 or 7 and whose variant is the RFC 9562 one:

```js
const UUID_V4_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-([47])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuidVersion(s) {
  const m = UUID_V4_V7.exec(s);
  return m ? Number(m[1]) : null; // 4, 7, or null
}
```

The `[47]` that opens the third group checks the version digit, and the `[89ab]` that opens the fourth group checks the variant. A value like `00112233-4455-4677-c899-aabbccddeeff` is rejected because its variant digit is `c`.

**Letter case.** RFC 9562 describes the text form as hexadecimal characters that "may be all uppercase, all lowercase, or mixed case", so a parser should accept any case, which is why the expression above uses the `i` flag. If you store or compare UUIDs as strings, normalize with `toLowerCase()` first so `017F22E2-…` and `017f22e2-…` are treated as the same identifier. The lowercase output of `randomUUID()` and most libraries is a convention that is convenient for comparison, not something this validator can assume about input.

**Nil and Max UUIDs.** RFC 9562 defines two special values (sections 5.9 and 5.10). The Nil UUID, `00000000-0000-0000-0000-000000000000`, has all 128 bits set to zero and can express "no such value here". The Max UUID, `ffffffff-ffff-ffff-ffff-ffffffffffff`, has all bits set to one and can be a sentinel such as "end of UUID list". Neither has a version 4 or 7 nibble, so the expression above rejects both, which is usually what you want for generated identifiers. If your schema uses one of them as a placeholder, test for it explicitly.

A matching format only says the string is shaped like a v4 or v7 UUID. It does not tell you the value was generated securely, belongs to the caller, or exists in your system.

## UUID v4 Collision Probability

A standards-compliant UUID v4 has 122 random bits because the remaining bits identify its version and variant. That gives `2^122` possible random values—not `2^128` equally available UUID v4 values.

Collision risk depends on how many identifiers you generate. This is the birthday problem. For `n` uniformly random UUID v4 values, the approximate probability of at least one collision while the probability is small is:

```text
n² / (2 × 2^122)   =   n² / 2^123
```

The more precise form is `1 − exp(−n² / 2^123)`. Computing both in Node.js (double precision) gives:

| n generated | n² / 2^123 | 1 − exp(−n² / 2^123) |
| --- | --- | --- |
| 10^6 (one million) | 9.404 × 10^-26 | 9.404 × 10^-26 |
| 10^9 (one billion) | 9.404 × 10^-20 | 9.404 × 10^-20 |
| 10^12 (one trillion) | 9.404 × 10^-14 | 9.404 × 10^-14 |
| 2^61 ≈ 2.31 × 10^18 | 0.5 (approximation no longer valid) | 0.393 |

The one-billion row confirms the earlier figure of about `9.4 × 10^-20`. The two columns agree until the probability stops being small. At `n = 2^61` the simple formula gives exactly 0.5 but overshoots; the exponential form gives about 39%.

Setting `1 − exp(−n² / 2^123) = 0.5` and solving gives `n ≈ sqrt(ln 2 × 2^123) ≈ 2.71 × 10^18`. So a 50% chance of at least one collision takes roughly 2.7 quintillion UUIDs, assuming a correct, uniform, independent random source.

These numbers describe an ideal generator. They do not cover a weak or reused random source, a buggy fallback, or two systems accidentally sharing state, which are more realistic causes of duplicates than chance. Keep a unique constraint on database columns and handle a conflict by generating another value. RFC 9562 discusses both collision resistance and the difference between global and local uniqueness.

## UUID v7: Structure and the Timestamp It Exposes

UUID v7 replaces most of the random payload with a timestamp so values sort by creation time. RFC 9562 lays out the 128 bits as:

| Field | Bits | Content |
| --- | --- | --- |
| `unix_ts_ms` | 48 | Unix time in milliseconds, big-endian |
| `ver` | 4 | `0111` (7) |
| `rand_a` | 12 | random (or other sub-millisecond data) |
| `var` | 2 | `10` |
| `rand_b` | 62 | random |

RFC 9562 Appendix A.6 gives a test vector: `017F22E2-79B0-7CC3-98C4-DC0C0C07398F`. Its first 48 bits, `0x017F22E279B0`, are `1645557742000` in decimal, and the RFC states the time as Tuesday, February 22, 2022, 2:22:22.00 PM GMT-05:00. Its version digit is `7`, `rand_a` is `0xCC3`, and its variant digit is `9` (binary `10..`).

Reading the creation time back out takes one line of parsing:

```js
function uuidV7Time(s) {
  if (uuidVersion(s) !== 7) throw new Error("not a UUID v7");
  const ms = parseInt(s.replace(/-/g, "").slice(0, 12), 16); // first 48 bits
  return new Date(ms);
}

uuidV7Time("017F22E2-79B0-7CC3-98C4-DC0C0C07398F").toISOString();
// "2022-02-22T19:22:22.000Z"
```

The ISO result, `19:22:22Z`, is the RFC's 2:22:22 PM at UTC−5 expressed in UTC, so the decode matches the specification. The 48-bit value fits exactly in a JavaScript number, so no `BigInt` is needed.

This is the concrete cost of choosing v7: anyone who sees the identifier can recover its creation time to the millisecond, with no key or special access. That is useful for debugging and sorting. It is a disclosure if the ID appears in URLs, exports or logs shared with people who should not learn when a record was created. Note that `crypto.randomUUID()` only produces version 4; generating v7 requires a library or your own code that gets its random bits from `getRandomValues()`.

## UUID v4, UUID v7, or an Integer?

Choose based on what the identifier must do:

- **UUID v4:** useful when independent systems need random identifiers without coordination and creation time should not be encoded.
- **UUID v7:** time ordered and often a better fit for database index locality, but its timestamp is visible, as decoded above.
- **Sequential integer:** compact and efficient inside one database, but predictable when exposed directly.

None of these choices replaces authorization. OWASP's [IDOR guidance](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html) notes that complex identifiers are defense in depth; every request still needs a server-side permission check for the requested object.

## Do Not Treat Every UUID as a Secret

UUIDs are identifiers. Even when a UUID v4 is generated with strong randomness, using it as a session credential requires more than unpredictability: secure transport and cookies, expiration, renewal, revocation, fixation defenses, safe storage, and server-side validation all matter.

For authenticated sessions, prefer your framework's established session mechanism and follow the [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). For cryptographic keys, use a purpose-built key-generation API. Do not paste a generated UUID into a system merely because a field asks for a “secret.”

## Practical Checklist

- Generate browser UUID v4 values with `crypto.randomUUID()` or `crypto.getRandomValues()`, and feature-detect rather than assuming a secure context.
- Never downgrade to `Math.random()` while claiming cryptographic randomness.
- Validate version and variant digits on input, accept any letter case, and normalize before comparing.
- Treat Nil and Max UUIDs as placeholders, not as generated identifiers.
- Keep database uniqueness constraints and retry the rare conflict.
- Use UUID v7 only when timestamp disclosure and time ordering fit the design.
- Enforce authorization independently of whether IDs are sequential or random.
- Use framework-managed session identifiers and dedicated cryptographic key generators for security credentials.

## Sources

- [RFC 9562: Universally Unique IDentifiers](https://www.rfc-editor.org/rfc/rfc9562.html) (text representation, Nil and Max UUIDs, Appendix A.6 UUIDv7 test vector)
- [MDN: Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID)
- [MDN: Crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
- [MDN: Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP: Insecure Direct Object Reference Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
