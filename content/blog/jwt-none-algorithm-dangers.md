---
title: "JWT 'none' Algorithm Attack: The Complete Security Guide"
description: "A comprehensive technical guide to JWT 'none' algorithm vulnerabilities, including exploitation techniques, real-world attack scenarios, and defensive coding patterns for secure authentication."
date: "2026-03-22"
author: "OpSecForge Team"
tags: ["JWT", "Security", "Authentication", "Vulnerability", "Web Security"]
---

# JWT 'none' Algorithm Attack: The Complete Security Guide

<div class="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold tracking-widest text-red-400 uppercase">
  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
  THREAT BRIEFING
</div>

JSON Web Tokens (JWTs) have become the de facto standard for stateless authentication in modern web applications. They are compact, URL-safe, and self-contained. However, their flexibility also introduces potential security pitfalls if not implemented and validated correctly. One of the most infamous and persistent vulnerabilities associated with JWTs is the **"none" algorithm attack**.

In this comprehensive guide, we will explore:
*   The anatomy of JWTs and how the "none" algorithm works
*   Why this vulnerability exists in the specification
*   Step-by-step exploitation techniques
*   The broader context of JWT algorithm confusion attacks
*   Defensive coding patterns and mitigation strategies
*   Testing methodologies to identify vulnerable implementations

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Anatomy of a JWT</h2>
</div>

Before diving into the vulnerability, let's review the structure of a JWT. A JWT consists of three parts separated by dots (`.`):

### Header
Contains metadata about the token, typically:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
### Payload
Contains the claims (actual data), such as:
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "role": "user",
  "iat": 1516239022,
  "exp": 1516242622
}
### Signature
A cryptographic hash ensuring integrity, created by:
HMACSHA256(
  base64url(header) + "." + base64url(payload),
  secret
)
<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">The 'None' Algorithm Explained</h2>
</div>

The JWT specification ([RFC 7519](https://tools.ietf.org/html/rfc7519)) and the JSON Web Signature (JWS) specification ([RFC 7515](https://tools.ietf.org/html/rfc7515)) define various algorithms for securing tokens, such as HMAC (HS256) and RSA (RS256).

Curiously, the specification also mandates support for an algorithm called **`none`**.

When the `alg` header is set to `none`, it explicitly tells the receiving server that **the token is not signed**. In this scenario, the signature part of the JWT is simply empty.

### Example of an Unsigned JWT

eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikpob24gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
Base64-decoded:
*   **Header:** `{"alg":"none","typ":"JWT"}`
*   **Payload:** `{"sub":"1234567890","name":"John Doe","iat":1516239022}`
*   **Signature:** (empty — notice the trailing dot)

### Why Does 'None' Exist?

The `none` algorithm was intended for situations where the integrity of the token is already guaranteed by another mechanism, such as:
*   A secure, mutually authenticated TLS connection
*   An internal network where tampering is impossible

In these highly specific, controlled environments, generating and verifying signatures adds unnecessary overhead.

**However**, in the vast majority of web applications, the JWT is passed through the untrusted internet (e.g., in an Authorization header or a cookie), making signature verification critical.

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">The Exploitation</h2>
</div>

The vulnerability arises when a server-side JWT library or the application's implementation **fails to enforce the expected signing algorithm** and blindly trusts the `alg` header provided in the token itself.

### Attack Sequence

1.  **Interception:** Attacker obtains a valid JWT (even a low-privileged one).
2.  **Header Modification:** Changes the `alg` value to `none`.
3.  **Payload Modification:** Elevates privileges (e.g., `"role": "user"` → `"role": "admin"`).
4.  **Signature Stripping:** Removes the original signature, leaving only a trailing dot.
5.  **Submission:** Sends the forged token to the server.

If the server relies solely on the `alg` header to determine how to verify the token, it will see `alg: none` and accept the modified payload as valid, bypassing authentication entirely.

### Real Attack Example

<div class="my-6 border-l-4 border-rose-500 bg-slate-900/50 p-6 rounded-r-xl">
  <h4 class="mb-2 text-lg font-bold text-rose-400">The Forged Admin Token</h4>
  <p class="m-0 text-slate-300 text-sm">An attacker intercepts a standard user JWT. They then modify the header to <code>"alg": "none"</code> and alter the payload to grant themselves administrator privileges (e.g., changing <code>"role": "user"</code> to <code>"role": "admin"</code>). By stripping the original signature, the server, if vulnerable, will accept this forged token as valid due to the explicit <code>"none"</code> algorithm declaration, granting the attacker full administrative access.</p>
</div>

**Original Token:**
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NSIsInJvbGUiOiJ1c2VyIn0.
SflKxwRJSMeKKF2QT4fwpMe...
**Modified Malicious Token:**
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.
eyJzdWIiOiIxMjM0NSIsInJvbGUiOiJhZG1pbiJ9.
Decoded malicious payload:
```json
{
  "sub": "12345",
  "role": "admin"
}
### Vulnerable Code Pattern

```javascript
// VULNERABLE: Trusts the alg header from the client
const jwt = require('jsonwebtoken');

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}
<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">The Broader Context: JWT Algorithm Confusion</h2>
</div>

The `none` algorithm is just one vector in a larger class of vulnerabilities called **JWT Algorithm Confusion**. Understanding these related attacks helps build comprehensive defenses.

### RS256 to HS256 Algorithm Substitution

Asymmetric algorithms like RS256 (RSA with SHA-256) use public/private key pairs. Symmetric algorithms like HS256 (HMAC with SHA-256) use a single shared secret.

**The Attack:**
1.  Application uses RS256 with a public key published at `/.well-known/jwks.json`.
2.  Attacker extracts the public key.
3.  Attacker modifies the JWT header to use `alg: HS256`.
4.  Attacker signs the token using the public key as the HMAC secret.
5.  Server verifies using the same public key, and verification succeeds.

**Why it works:** Many JWT libraries dynamically select verification methods based on the `alg` header.

### Key ID (kid) Header Injection

The `kid` (Key ID) header specifies which key was used to sign the token. When combined with algorithm confusion, attackers can manipulate key resolution:

**Directory Traversal via kid:**
```json
{
  "kid": "../../../etc/passwd",
  "alg": "HS256"
}
If the application resolves keys using filesystem paths, this can lead to reading arbitrary files as HMAC secrets.

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Mitigation Strategies</h2>
</div>

### 1. Explicitly Define Allowed Algorithms

**The golden rule:** Never trust the `alg` header blindly.

```javascript
// SECURE: Node.js with jsonwebtoken
const jwt = require('jsonwebtoken');

function verifyToken(token) {
  try {
    // Explicitly only allow HS256
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    return decoded;
  } catch (err) {
    return null;
  }
}
```python
# SECURE: Python with PyJWT
import jwt

try:
    decoded = jwt.decode(
        token,
        secret,
        algorithms=['HS256']  # Whitelist only expected algorithms
    )
except jwt.InvalidTokenError:
    # Handle invalid token
    pass
```go
// SECURE: Go with golang-jwt
token, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
    if t.Method.Alg() != "HS256" {
        return nil, fmt.Errorf("unexpected signing method: %v", t.Method.Alg())
    }
    return secret, nil
})
### 2. Keep Libraries Updated

Many popular JWT libraries historically had default configurations vulnerable to this attack. Modern libraries:
*   Require explicit algorithm configuration
*   Disable `none` by default
*   Enforce algorithm whitelisting

**Always use the latest stable version** of your chosen JWT library.

### 3. Reject 'None' at the Gateway

If using an API gateway (Kong, AWS API Gateway, Nginx), configure it to inspect JWT headers and reject any request where `alg` is `none`, `None`, or `NONE`:

```nginx
# Nginx configuration example
if ($jwt_header_alg ~* "none") {
    return 401;
}
### 4. Separate Key Stores for Asymmetric/Symmetric

Never use the same key material for different algorithm types:

```javascript
// SECURE: Different secrets for different algorithms
const verifyToken = (token) => {
  const header = JSON.parse(base64UrlDecode(token.split('.')[0]));

  if (header.alg === 'RS256') {
    return jwt.verify(token, rsaPublicKey, { algorithms: ['RS256'] });
  } else if (header.alg === 'HS256') {
    return jwt.verify(token, hmacSecret, { algorithms: ['HS256'] });
  }
  throw new Error('Unsupported algorithm');
};
### 5. Reject Suspicious Headers

```javascript
const FORBIDDEN_HEADERS = ['jwk', 'jku', 'x5c', 'x5u'];

const sanitizeHeader = (header) => {
  FORBIDDEN_HEADERS.forEach(h => {
    if (h in header) {
      throw new Error(`Forbidden header parameter: ${h}`);
    }
  });
};
<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Decode JWTs Securely (100% Local)</h3>
  <p class="mb-8 text-slate-400 text-lg">Stop pasting your tokens into online formatters that log your payload. Use our fully client-side JWT decoder to inspect headers and payloads without exposing your secrets.</p>
  <a href="https://opsecforge.tools/tools/jwt-decoder" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
    Open JWT Debugger →
  </a>
</div>

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Testing for Vulnerabilities</h2>
</div>

### Manual Testing

Use [jwt_tool](https://github.com/ticarpi/jwt_tool) for automated testing:

```bash
# Test for alg:none
jwt_tool.py target_token.txt -at -pc "role" -pv "admin"

# Test RS256->HS256 confusion
jwt_tool.py target_token.txt -X k -pk public_key.pem
### Burp Suite JWT Editor

1.  Intercept JWT in Burp Proxy.
2.  Send to JWT Editor.
3.  Modify `alg` header parameter.
4.  Re-sign with appropriate key (or none).
5.  Forward request and observe response.

### Automated Scanning with Nuclei

```yaml
id: jwt-alg-none

info:
  name: JWT Algorithm None Bypass
  severity: critical

requests:
  - raw:
      - |
        GET /api/protected HTTP/1.1
        Host: {{Hostname}}
        Authorization: Bearer {{base64("{\"alg\":\"none\"}")}}
<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Secure Implementation Checklist</h2>
</div>

Before deploying JWT authentication:

*   **Explicitly whitelist** allowed algorithms in your JWT library.
*   **Reject** tokens with `alg: none` at the application or gateway level.
*   **Separate key material** for asymmetric and symmetric algorithms.
*   **Validate the `kid` header** against an allowlist.
*   **Keep JWT libraries** updated to latest versions.
*   **Implement proper signature verification** with no algorithm fallback.
*   **Test your implementation** using jwt_tool or similar utilities.
*   **Use strongly-typed libraries** like `jose` that enforce algorithm/key type matching.

<div class="mt-12 flex items-center gap-3">
  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-emerald-400">
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
  </div>
  <h2 class="!mt-0 mb-0 text-2xl font-bold text-slate-100">Conclusion</h2>
</div>

The JWT `none` algorithm attack is a classic example of how flexibility in a specification can lead to catastrophic security vulnerabilities when implementations are not secure by default. By understanding the mechanics of this attack and enforcing strict, explicitly defined algorithm validation, you can neutralize this threat and ensure the integrity of your authentication system.

**Remember:** Never trust the client to tell you how to verify its own credentials.

---

## Related Tools

*   **JWT Debugger** — Inspect, decode, and debug JWT tokens locally
*   **Base64URL Encoder** — Encode/decode Base64URL for JWT segments

## References

*   [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
*   [RFC 7515 - JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515)
*   [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)