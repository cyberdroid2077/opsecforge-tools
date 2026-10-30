---
title: "Base64 vs Base64URL: Differences, Padding and Use Cases"
date: "2026-03-22"
updated: "2026-10-30"
description: "Base64URL swaps + and / for - and _ so data fits in URLs, and often drops = padding. RFC 4648 differences, JWT use and when to pick each."
category: "Web Development"
tags: ["base64", "base64url", "jwt", "encoding", "url-encoding", "security", "web-development"]
source_reviewed: "2026-10-30"
primary_source: "https://www.rfc-editor.org/rfc/rfc4648"
---

# Base64 vs Base64URL: Differences, Padding and Use Cases

**Base64URL is Base64 with a URL-safe alphabet.** Both encode bytes in 6-bit groups, but Base64URL uses `-` and `_` in place of `+` and `/` (RFC 4648 section 5), so the output can sit in URLs and file names without escaping. Standard Base64 pads output with `=`; Base64URL specifications such as JWS often omit that padding, though RFC 4648 says padding stays unless the referring specification says otherwise.

| | Standard Base64 (RFC 4648 §4) | Base64URL (RFC 4648 §5) |
| :-- | :-- | :-- |
| Characters 0-61 | `A-Z`, `a-z`, `0-9` | `A-Z`, `a-z`, `0-9` |
| Character 62 | `+` | `-` |
| Character 63 | `/` | `_` |
| Padding | `=` | `=` by default; omitted where the protocol says so |
| Typical use | MIME email, data URIs, config files | JWT/JWS segments ([RFC 7515](https://www.rfc-editor.org/rfc/rfc7515)), URL parameters |

<div class="my-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
  <p class="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-400">Try it locally</p>
  <h2 class="mt-0 text-2xl font-bold text-slate-100">Try standard Base64 and Base64URL on a sample</h2>
  <p class="text-slate-300">The converter handles UTF-8 text only, in the loaded browser page. It encodes to unpadded Base64URL and does not decode arbitrary binary data or verify JWTs.</p>
  <a href="/tools/base64-converter" class="mt-4 inline-flex rounded-full bg-emerald-500 px-6 py-3 font-bold !text-slate-950 !no-underline hover:bg-emerald-400">Open the Base64 Converter →</a>
</div>

<div class="my-6 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
  <svg class="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
  </svg>
  <span class="font-semibold text-amber-200">Compatibility boundary</span>
  <span class="text-slate-400">— Use the alphabet and padding rules required by the receiving protocol</span>
</div>

The two encodings differ only in two characters and the padding. The differences matter at the boundaries: a query string parser that turns `+` into a space, a decoder that silently ignores characters it does not recognize, or a library that insists on padding. The outputs below come from Node.js v22.23.1 and Python 3.12.3 with synthetic bytes.

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">The Core Problem: URL-Safety</h2>
</div>

Standard Base64 can produce `+`, `/`, and `=`. In a URL these can be misread depending on where they appear. Base64URL substitutes a URL- and filename-safe alphabet while keeping the same 6-bit encoding scheme. [RFC 4648 section 5](https://www.rfc-editor.org/rfc/rfc4648.html#section-5) notes that the pad character "is typically percent-encoded when used in an URI, but if the data length is known implicitly, this can be avoided by skipping the padding". Neither encoding encrypts or authenticates the underlying bytes.

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">Character Comparison</h2>
</div>

Standard Base64 uses the alphabet `A-Z`, `a-z`, `0-9`, `+`, and `/`, with `=` as a pad character. RFC 4648 section 5 defines the URL- and filename-safe alphabet by replacing `+` with `-` and `/` with `_`. Padding may be omitted only when the specification that uses Base64URL permits it ([section 3.2](https://www.rfc-editor.org/rfc/rfc4648.html#section-3.2): implementations "MUST include appropriate pad characters at the end of encoded data unless the specification referring to this document explicitly states otherwise").

| Standard Base64 | Base64URL | Decimal Value |
|-----------------|-----------|---------------|
| `+` | `-` (hyphen) | 62 |
| `/` | `_` (underscore) | 63 |
| `=` | (omitted when the protocol allows) | Padding |

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">Encoding Process</h2>
</div>

Both encodings follow identical 6-bit chunking but diverge at character selection and padding.

<div class="my-6 flex items-center gap-3 border-l-4 border-slate-600 pl-4">
  <h3 class="m-0 text-xl font-semibold text-slate-200">Example: Encoding "Hello"</h3>
</div>

Given input bytes `[0x48, 0x65, 0x6c, 0x6c, 0x6f]` ("Hello"), standard Base64 produces `SGVsbG8=`. An unpadded Base64URL representation is `SGVsbG8`. The alphabets do not diverge for this input, but the padding convention can.

<div class="my-6 flex items-center gap-3 border-l-4 border-slate-600 pl-4">
  <h3 class="m-0 text-xl font-semibold text-slate-200">When They Diverge</h3>
</div>

Only bytes whose 6-bit groups equal 62 or 63 differ. The ASCII input `00?` (bytes `[0x30, 0x30, 0x3f]`) hits one of them: standard Base64 gives `MDA/`, Base64URL gives `MDA_`. The four bytes `fb ff bf 3e` hit both characters, and show all three output forms:

```javascript
const b = Buffer.from([0xfb, 0xff, 0xbf, 0x3e]);
const std = b.toString('base64');
console.log(std);                                        // standard, padded
console.log(std.replace(/\+/g, '-').replace(/\//g, '_')); // URL alphabet, padded
console.log(b.toString('base64url'));                    // URL alphabet, unpadded
```

```text
+/+/Pg==
-_-_Pg==
-_-_Pg
```

| Form | Output |
| :-- | :-- |
| Standard Base64 | `+/+/Pg==` |
| Base64URL with padding | `-_-_Pg==` |
| Base64URL without padding | `-_-_Pg` |

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">Padding and Length</h2>
</div>

Base64 turns every 3 input bytes into 4 characters. For `n` input bytes the padded length is `4 * ceil(n / 3)`, and the unpadded length is `ceil(4n / 3)`. If `n` is `3k + 1`, two `=` are added; if `n` is `3k + 2`, one `=` is added. Checked for `n = 1..6` with bytes of value `0x41`:

| n | Padded | Padded length | Unpadded | Unpadded length | Unpadded length mod 4 |
| --: | :-- | --: | :-- | --: | --: |
| 1 | `QQ==` | 4 | `QQ` | 2 | 2 |
| 2 | `QUE=` | 4 | `QUE` | 3 | 3 |
| 3 | `QUFB` | 4 | `QUFB` | 4 | 0 |
| 4 | `QUFBQQ==` | 8 | `QUFBQQ` | 6 | 2 |
| 5 | `QUFBQUE=` | 8 | `QUFBQUE` | 7 | 3 |
| 6 | `QUFBQUFB` | 8 | `QUFBQUFB` | 8 | 0 |

### Why unpadded input still decodes unambiguously

The padding carries no information that the length does not already carry. After removing `=`, a valid string has length mod 4 of 0, 2 or 3. Length 2 means one trailing byte, length 3 means two, and length 1 would encode only 6 bits, which is not a whole byte, so it is malformed. [RFC 7515 Appendix C](https://www.rfc-editor.org/rfc/rfc7515.html#appendix-C) says the same: "if the length mod 4 is 0, no padding is added; if the length mod 4 is 2, two '=' padding characters are added; if the length mod 4 is 3, one '=' padding character is added; if the length mod 4 is 1, the input is malformed."

That appendix also gives the portable recipe: swap `-` and `_` back to `+` and `/`, append padding according to the length, and call an ordinary padded decoder. In JavaScript:

```javascript
function base64UrlDecodeToBytes(s) {
  const std = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = std + '='.repeat((4 - (std.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}
```

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">When to Use Each Encoding</h2>
</div>

<div class="my-6 flex items-center gap-3 border-l-4 border-slate-600 pl-4">
  <h3 class="m-0 text-xl font-semibold text-slate-200">Use Standard Base64 When:</h3>
</div>

-   The protocol or format names it: MIME email bodies and attachments, `data:` URIs, PEM-style blocks
-   A consumer expects RFC 4648 section 4 or RFC 2045 output
-   The text never enters a URL, path or file name

<div class="my-6 flex items-center gap-3 border-l-4 border-slate-600 pl-4">
  <h3 class="m-0 text-xl font-semibold text-slate-200">Use Base64URL When:</h3>
</div>

-   JWT/JWS header, payload and signature segments (RFC 7515 defines them as base64url without padding)
-   Values placed in URL query strings, path segments or file names
-   State, nonce or cursor parameters you control on both ends
-   Any protocol field that explicitly requires the RFC 4648 URL-safe alphabet

For a value you control end to end, Base64URL is the safer default, because it avoids the query-string problem below without extra escaping steps.

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">JWT: The Primary Use Case</h2>
</div>

JWT compact serialization uses Base64URL-encoded segments without padding, as specified by [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) and its underlying JOSE rules. RFC 7515 defines base64url as "Base64 encoding using the URL- and filename-safe character set defined in Section 5 of RFC 4648, with all trailing '=' characters omitted (as permitted by Section 3.2) and without the inclusion of any line breaks, whitespace, or other additional characters." Use a maintained JWT library for parsing and signature verification; Base64URL decoding alone does not validate a token.

JWT structure:
```
base64url(header).base64url(payload).base64url(signature)
```

A synthetic JWT-shaped example:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.Signature
```
Notice the absence of `+`, `/`, and `=` in the encoded segments.

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">Common Bug Patterns</h2>
</div>

<div class="my-6 flex items-center gap-3 border-l-4 border-red-500/50 pl-4">
  <h3 class="m-0 text-xl font-semibold text-red-300">Bug 1: A "+" in a query string becomes a space</h3>
</div>

The `/` character is not what breaks query parameters; the WHATWG URL parser leaves it alone:

```javascript
new URLSearchParams('data=MDA/').get('data')   // 'MDA/'
```

The usual failure is `+`. The URL Standard's [application/x-www-form-urlencoded parser](https://url.spec.whatwg.org/#urlencoded-parsing) does "Replace any 0x2B (+) in name and value with 0x20 (SP)", and `URLSearchParams` implements it. Server-side form parsers commonly behave the same way. Standard Base64 for the bytes `3e 3e 3e ff` contains a `+`:

```javascript
const bytes = Buffer.from([0x3e, 0x3e, 0x3e, 0xff]);
const std = bytes.toString('base64');       // 'Pj4+/w=='
const got = new URLSearchParams('data=' + std).get('data');
console.log(JSON.stringify(got));                          // the + is now a space
console.log(Buffer.from(got, 'base64').toString('hex'));   // lenient decoder
console.log(bytes.toString('hex'));                        // what was sent
try { atob(got); } catch (e) { console.log(e.name); }      // strict decoder
```

```text
"Pj4 /w=="
3e3e3f
3e3e3eff
InvalidCharacterError
```

Node's lenient decoder skips the space and returns `3e3e3f`: three bytes instead of four, with the last one wrong, and no error. `atob` rejects the string, which is the better failure. The Base64URL form survives the same trip:

```javascript
const url = bytes.toString('base64url');    // 'Pj4-_w'
const got2 = new URLSearchParams('data=' + url).get('data');
console.log(got2, Buffer.from(got2, 'base64url').toString('hex'));
```

```text
Pj4-_w 3e3e3eff
```

If standard Base64 must go into a query string, percent-encode it. `new URLSearchParams({ data: std }).toString()` gives `data=Pj4%2B%2Fw%3D%3D`, and parsing that string back returns the original bytes (`3e3e3eff` in the same test). The WHATWG parser splits a pair at the first `=`, so the padding `=` in `data=QQ==` survived in Node (`'QQ=='`). Other server-side parsers may differ; that was not tested here.

<div class="my-6 flex items-center gap-3 border-l-4 border-red-500/50 pl-4">
  <h3 class="m-0 text-xl font-semibold text-red-300">Bug 2: Expecting Padding in Base64URL Decoding</h3>
</div>

JWT libraries and custom decoders must accept the absence of padding in Base64URL.

**BROKEN (Python 3.12):**
```python
import base64

# JWT segment (no padding)
jwt_payload = "eyJ1c2VyIjoiYWRtaW4ifQ"
base64.b64decode(jwt_payload)
base64.urlsafe_b64decode(jwt_payload)
```
Both calls raise `binascii.Error: Incorrect padding`.

**CORRECT (Python):**
```python
import base64

def base64url_decode(s):
    return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))

print(base64url_decode("eyJ1c2VyIjoiYWRtaW4ifQ"))
```
```text
b'{"user":"admin"}'
```

For an input whose length mod 4 is 1 the function above still fails, with `binascii.Error: Invalid base64-encoded string: number of data characters (5) cannot be 1 more than a multiple of 4` for the 5-character input `QUFBQ`. That is the intended outcome, since such a string is not valid Base64URL.

<div class="my-6 flex items-center gap-3 border-l-4 border-red-500/50 pl-4">
  <h3 class="m-0 text-xl font-semibold text-red-300">Bug 3: Re-encoding a JWT segment changes the signed bytes</h3>
</div>

A JWS signature is computed over text, not over the decoded JSON. RFC 7515 section 5.1, step 5, signs "the JWS Signing Input ASCII(BASE64URL(UTF8(JWS Protected Header)) || '.' || BASE64URL(JWS Payload))". If middleware decodes a segment and re-encodes it as standard Base64 (or with padding), the string that was signed no longer exists, and verification fails. A synthetic HS256 comparison with the key `test-secret-not-for-production` and the payload `{"sub":"user-123","note":">>>???"}`:

```javascript
import { createHmac } from 'node:crypto';
const secret = 'test-secret-not-for-production';
const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const payloadJson = JSON.stringify({ sub: 'user-123', note: '>>>???' });
const payloadUrl = Buffer.from(payloadJson).toString('base64url');
const payloadStd = Buffer.from(payloadJson).toString('base64');
const sign = (input) => createHmac('sha256', secret).update(input).digest('base64url');
console.log(payloadUrl);
console.log(payloadStd);
console.log(sign(header + '.' + payloadUrl));
console.log(sign(header + '.' + payloadStd));
```

```text
eyJzdWIiOiJ1c2VyLTEyMyIsIm5vdGUiOiI-Pj4_Pz8ifQ
eyJzdWIiOiJ1c2VyLTEyMyIsIm5vdGUiOiI+Pj4/Pz8ifQ==
FEZqJUqAx3tml5zwJ7C8E7Q0eqTYcwZnvzc0YQfta9g
2Hbva_FU2fRyhqDTQkQai8KROg8fCJB18S1ihwU-vQc
```

The decoded payload is identical in both cases; only the text differs, and the two HMACs differ completely. Verify the signature over the segments exactly as received, and decode them only afterwards.

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">How Decoders Treat the Other Alphabet</h2>
</div>

Decoders differ in what they accept. RFC 4648 section 3.3 says implementations "MUST reject the encoded data if it contains characters outside the base alphabet" unless the referring specification says otherwise, but widely used libraries are more lenient, and in one case the leniency corrupts data. Results below use the test string `+/+/Pg==` (standard) and `-_-_Pg==` or `-_-_Pg` (URL), all decoding to `fbffbf3e`.

| Decoder | `-` `_` accepted? | `+` `/` accepted? | Missing padding | Notes |
| :-- | :-- | :-- | :-- | :-- |
| Node `Buffer.from(s, 'base64')` | Yes | Yes | Accepted | Whitespace ignored |
| Node `Buffer.from(s, 'base64url')` | Yes | Yes | Accepted | Accepts either alphabet |
| Node/browser `atob` | No (throws) | Yes | Accepted when length mod 4 is 2 or 3 | Forgiving-base64 rules |
| Python `b64decode` (default) | Silently dropped | Yes | Error | Wrong bytes, no error |
| Python `b64decode(validate=True)` | Error | Yes | Error | Strict |
| Python `urlsafe_b64decode` | Yes | Yes | Error | Needs padding in 3.12 |
| Go `StdEncoding` / `RawStdEncoding` | Not in this alphabet | Yes | `Raw` variant is the unpadded form | Documentation only, not run |
| Go `URLEncoding` / `RawURLEncoding` | Yes | Not in this alphabet | `Raw` variant is the unpadded form | Documentation only, not run |

### Node.js Buffer

The Node [Buffer documentation](https://nodejs.org/api/buffer.html) says of `'base64'`: "When creating a `Buffer` from a string, this encoding will also correctly accept 'URL and Filename Safe Alphabet' as specified in RFC 4648, Section 5. Whitespace characters such as spaces, tabs, and new lines contained within the base64-encoded string are ignored." And of `'base64url'`: "When creating a `Buffer` from a string, this encoding will also correctly accept regular base64-encoded strings. When encoding a `Buffer` to a string, this encoding will omit padding."

```javascript
for (const [s, enc] of [
  ['+/+/Pg==', 'base64'], ['-_-_Pg==', 'base64'], ['-_-_Pg', 'base64'], ['+/+/Pg', 'base64'],
  ['+/+/Pg==', 'base64url'], ['+/+/Pg', 'base64url'], ['-_-_Pg', 'base64url'], ['-_-_Pg==', 'base64url'],
]) console.log(enc, s, Buffer.from(s, enc).toString('hex'));
```

Every one of these eight combinations returns `fbffbf3e`: Node needs no padding and does not distinguish the two alphabets. It also does not report malformed strings: `Buffer.from('A', 'base64')` returns an empty buffer and `Buffer.from('QUFBQ', 'base64')` returns `414141`, dropping the dangling character without an error.

### Browser and Node atob

`atob` follows the HTML Standard, which delegates to the Infra Standard's [forgiving-base64 decode](https://infra.spec.whatwg.org/#forgiving-base64-decode) (the algorithm is defined there; HTML's [`atob(data)` steps](https://html.spec.whatwg.org/multipage/webappapis.html) call it and throw `InvalidCharacterError` on failure). The algorithm removes ASCII whitespace; if the length divides by 4, it strips one or two trailing `=`; it fails if the length mod 4 is 1; and it fails on any code point that is not `+`, `/` or ASCII alphanumeric.

```javascript
const hex = (s) => Buffer.from(atob(s), 'latin1').toString('hex');
for (const s of ['+/+/Pg==', '+/+/Pg', '-_-_Pg==', '-_-_Pg', 'QUFBQ', 'QQ=', 'QQ', 'Q Q==']) {
  try { console.log(s, hex(s)); } catch (e) { console.log(s, e.name); }
}
```

```text
+/+/Pg== fbffbf3e
+/+/Pg fbffbf3e
-_-_Pg== InvalidCharacterError
-_-_Pg InvalidCharacterError
QUFBQ InvalidCharacterError
QQ= InvalidCharacterError
QQ 41
Q Q== 41
```

So `atob` handles unpadded standard Base64 but rejects `-` and `_`, which is why the swap-back step in the RFC 7515 recipe is required. A string with a single trailing `=` (`QQ=`) is rejected, because after the length check only the two-`=` and zero-`=` forms are stripped.

### Python base64

The [Python 3.12 documentation](https://docs.python.org/3.12/library/base64.html) for `b64decode` says: "If validate is False (the default), characters that are neither in the normal base-64 alphabet nor the alternative alphabet are discarded prior to the padding check. If validate is True, these non-alphabet characters in the input result in a binascii.Error."

```python
import base64

def run(f):
    try:
        print(f())
    except Exception as e:
        print(f"{type(e).__module__}.{type(e).__name__}: {e}")

run(lambda: base64.b64decode('-_-_Pg==').hex())
run(lambda: base64.b64decode('-_-_Pg==', validate=True))
run(lambda: base64.urlsafe_b64decode('-_-_Pg==').hex())
run(lambda: base64.urlsafe_b64decode('-_-_Pg'))
```

```text
3e
binascii.Error: Only base64 data is allowed
fbffbf3e
binascii.Error: Incorrect padding
```

The first line is the dangerous one: a Base64URL string passed to the standard decoder loses its `-_-_` prefix and returns the single byte `3e` instead of `fbffbf3e`, with no exception. Use `urlsafe_b64decode` for Base64URL input, or pass `validate=True` to the standard decoder so unexpected characters fail loudly. The development documentation lists changes for Python 3.15 (a `padded` parameter, and padding no longer required by default in `urlsafe_b64decode`); those were not run here, which is why the table is labeled for 3.12.

### Go

Go was not available on the machine used for this article, so nothing below was run. According to the [encoding/base64 documentation](https://pkg.go.dev/encoding/base64): `StdEncoding` is the standard encoding of RFC 4648, `URLEncoding` is the alternate alphabet ("typically used in URLs and file names"), and `RawStdEncoding` and `RawURLEncoding` are the same encodings with padding omitted (`WithPadding(NoPadding)`). The documentation for `Strict()` also notes that decoding still ignores CR and LF. Choose the Raw variant for JWT-style unpadded values and check decoder behavior on your own inputs.

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">Language-Specific Implementations</h2>
</div>

<div class="my-6 flex items-center gap-3 border-l-4 border-slate-600 pl-4">
  <h3 class="m-0 text-xl font-semibold text-slate-200">JavaScript / TypeScript</h3>
</div>

`Buffer` supports `'base64url'` directly in Node. For code that must also run in a browser, encode the UTF-8 bytes with `TextEncoder` rather than the legacy `unescape()`, which MDN marks as deprecated ("Avoid using this feature in new projects"):

```javascript
function base64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s) {
  const std = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = std + '='.repeat((4 - (std.length % 4)) % 4);
  const bin = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
```

Checked in Node 22 against `Buffer.from(input, 'utf8').toString('base64url')` for synthetic inputs, including non-ASCII text and an emoji:

| Input | Output (both methods) | Same as Buffer | Round trip |
| :-- | :-- | :-- | :-- |
| `café → ¿?>` | `Y2Fmw6kg4oaSIMK_Pz4` | yes | yes |
| `🔒 key` | `8J-UkiBrZXk` | yes | yes |
| `00?` | `MDA_` | yes | yes |
| `Hello` | `SGVsbG8` | yes | yes |

[MDN documents `Uint8Array.prototype.toBase64()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64) with `alphabet: 'base64url'` and `omitPadding` options, and lists it as Baseline 2025 ("Since September 2025, this feature works across the latest devices and browser versions"). In Node v22.23.1, `typeof Uint8Array.prototype.toBase64` is `"undefined"`, so it was not run here; feature-detect it before relying on it.


<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">Telling Which Variant a String Is</h2>
</div>

The alphabet is the only signal. A string containing `-` or `_` is Base64URL; a string containing `+` or `/` is standard Base64; a string with neither is valid in both alphabets and decodes to the same bytes. A string with characters from both sets is not valid in either:

```javascript
function detectBase64Variant(s) {
  const std = /[+/]/.test(s);
  const url = /[-_]/.test(s);
  if (std && url) return 'invalid-mixed';
  if (std) return 'standard';
  if (url) return 'url';
  return 'ambiguous';
}

for (const s of ['+/+/Pg==', '-_-_Pg', 'SGVsbG8=', 'SGVsbG8', 'a+b-c']) {
  console.log(s.padEnd(9), '->', detectBase64Variant(s));
}
```

```text
+/+/Pg==  -> standard
-_-_Pg    -> url
SGVsbG8=  -> ambiguous
SGVsbG8   -> ambiguous
a+b-c     -> invalid-mixed
```

Padding is a weaker hint: a trailing `=` suggests the standard form but does not prove it, since Base64URL with padding is allowed. Detection suits diagnostics; a protocol should still declare which form it uses rather than have receivers guess.

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">Security Implications</h2>
</div>

<div class="my-6 flex items-center gap-3 border-l-4 border-slate-600 pl-4">
  <h3 class="m-0 text-xl font-semibold text-slate-200">Encoding is not a security control</h3>
</div>

Choosing the wrong alphabet can cause parsing or interoperability failures. Choosing the right alphabet does not make untrusted data safe, prevent injection, or verify a JWT signature. Validate the decoded data for its destination and use the protocol's normal authentication and authorization controls.

Lenient decoding is its own risk. RFC 4648 section 3.3 warns that non-alphabet characters "may be exploited as a 'covert channel'" and might be used to "exploit implementation errors". Two components that disagree about what to ignore (as the Python `b64decode` example does) can see different bytes from the same string. Where input is untrusted, decode with a strict mode and reject what does not match the expected alphabet and length.

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">Quick Reference Table</h2>
</div>

| Aspect          | Standard Base64 | Base64URL      |
| :-------------- | :-------------- | :------------- |
| Character 62    | `+`             | `-` (hyphen)   |
| Character 63    | `/`             | `_` (underscore) |
| Padding (`=`)   | Required unless specified otherwise | Protocol-dependent |
| In a query string | `+` is read as a space by form parsers; percent-encode | No special characters |
| JWT/JWS         | Not used for segments | Required, without padding |
| RFC Reference   | RFC 4648 §4     | RFC 4648 §5    |

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Local Base64 text conversion</h3>
  <p class="mb-8 text-slate-400 text-lg">Encode and decode sample UTF-8 text with standard or URL-safe Base64 in the loaded browser page. Do not treat encoded output as encrypted or safe to disclose.</p>
  <a href="/tools/base64-converter" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
    Open Base64 Converter →
  </a>
</div>

<div class="my-8 flex items-center gap-3 border-b border-slate-700 pb-3">
  <svg class="h-6 w-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
  </svg>
  <h2 class="m-0 text-2xl font-bold text-slate-100">Conclusion</h2>
</div>

The two alphabets differ in two characters, and the real-world failures come from how software around them reacts: form parsers turn `+` into a space, decoders drop characters they do not know, and some libraries need padding that the protocol omits.

**Remember:**
- Use **Base64** where the format names it (MIME, `data:` URIs, PEM-style blocks) and the text stays out of URLs.
- Use **Base64URL** for JWT/JWS segments and for values placed in URLs or file names.
- Unpadded input decodes unambiguously: restore padding from the length (mod 4 of 2 or 3), and treat a remainder of 1 as an error.
- Do not let a lenient decoder guess the alphabet; reject unexpected characters at trust boundaries.
- Verify JWT signatures over the segments as received, not over re-encoded copies.

> **📬 Stay Ahead of Threats**
> Continue with the [JWT Decoder](/tools/jwt-decoder) for JWT segments, or browse the [complete tools center](/tools).

## Primary references

- [RFC 4648: The Base16, Base32, and Base64 Data Encodings](https://www.rfc-editor.org/rfc/rfc4648) (section 3.2 padding, section 3.3 non-alphabet characters, section 5 URL-safe alphabet)
- [RFC 7515: JSON Web Signature](https://www.rfc-editor.org/rfc/rfc7515) (section 2 base64url definition, section 5.1 signing input, Appendix C unpadded implementation notes)
- [RFC 7519: JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519)
- [Node.js Buffer documentation: Buffers and character encodings](https://nodejs.org/api/buffer.html)
- [Infra Standard: forgiving-base64 decode](https://infra.spec.whatwg.org/#forgiving-base64-decode)
- [HTML Standard: atob()](https://html.spec.whatwg.org/multipage/webappapis.html)
- [URL Standard: application/x-www-form-urlencoded parsing](https://url.spec.whatwg.org/#urlencoded-parsing)
- [Python 3.12 base64 module](https://docs.python.org/3.12/library/base64.html)
- [Go encoding/base64 package](https://pkg.go.dev/encoding/base64)
- [MDN: Uint8Array.prototype.toBase64()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64)
- [MDN: unescape()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/unescape)
