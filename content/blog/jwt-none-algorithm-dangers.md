---
title: "JWT 'none' Algorithm Attack: The Complete Security Guide"
date: "2026-03-22"
description: "A comprehensive technical guide to JWT 'none' algorithm vulnerabilities, including exploitation techniques, real-world attack scenarios, and defensive coding patterns for secure authentication."
category: "Web Security"
---

# JWT 'none' Algorithm Attack: The Complete Security Guide

JSON Web Tokens (JWTs) have become the de facto standard for stateless authentication in modern web applications. They are compact, URL-safe, and self-contained. However, their flexibility also introduces potential security pitfalls if not implemented and validated correctly. One of the most infamous and persistent vulnerabilities associated with JWTs is the **"none" algorithm attack**.

This guide will explore:
- The anatomy of JWTs and how the "none" algorithm works
- Why this vulnerability exists and how it's exploited
- Broader JWT algorithm confusion attacks
- Defensive coding patterns and mitigation strategies
- Testing methodologies to identify vulnerable implementations

## Anatomy of a JWT

A JWT consists of three parts separated by dots (`.`): Header, Payload, and Signature.

### Header
Contains metadata about the token, typically specifying the algorithm.
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload
Contains the claims (actual data), such as user information and expiration times.
```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "role": "user",
  "iat": 1516239022,
  "exp": 1516242622
}
```

### Signature
Ensures integrity by hashing the header and payload with a secret.
```
HMACSHA256(base64url(header) + "." + base64url(payload), secret)
```

## The 'None' Algorithm Explained

The JWT specification mandates support for an algorithm called **`none`**. When the `alg` header is set to `none`, it explicitly tells the receiving server that the **token is not signed**. In this scenario, the signature part of the JWT is simply empty.

### Example of an Unsigned JWT

```
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
```

This decodes to:
- **Header:** `{"alg":"none","typ":"JWT"}`
- **Payload:** `{"sub":"1234567890","name":"John Doe","iat":1516239022}`
- **Signature:** (empty)

The `none` algorithm was intended for highly specific, controlled environments where integrity is guaranteed by other means (like mutually authenticated TLS), not for general web use where tampering is a risk.

## The Exploitation

The vulnerability arises when a server-side JWT library or implementation **fails to enforce the expected signing algorithm** and blindly trusts the `alg` header provided by the client.

### Attack Sequence

1.  **Interception:** Attacker obtains a valid JWT.
2.  **Header Modification:** Changes the `alg` value to `none`.
3.  **Payload Modification:** Elevates privileges (e.g., changes `"role": "user"` to `"role": "admin"`).
4.  **Signature Stripping:** Removes the original signature, leaving only a trailing dot.
5.  **Submission:** Sends the forged token to the server.

If the server relies solely on the `alg` header and has a fallback for `none`, it will accept the modified payload as valid, bypassing authentication.

### Vulnerable Code Pattern

```javascript
// VULNERABLE: Trusts the alg header from the client
const jwt = require('jsonwebtoken');

function verifyToken(token) {
  try {
    // Fails to explicitly define allowed algorithms
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}
```

## The Broader Context: JWT Algorithm Confusion

The `none` algorithm is one facet of JWT Algorithm Confusion vulnerabilities. Other common attacks include:

### RS256 to HS256 Algorithm Substitution

Asymmetric algorithms (RS256) use public/private keys, while symmetric (HS256) use a shared secret.

**The Attack:** An attacker might switch the `alg` from RS256 to HS256 and sign the token using the public key (which they can obtain) as the HMAC secret. If the server allows this switch and uses the public key as a shared secret, verification succeeds.

### Key ID (kid) Header Injection

The `kid` header specifies which key was used. Attackers can manipulate this header for directory traversal if the server resolves keys insecurely:

**Directory Traversal via kid:**
```json
{
  "kid": "../../../etc/passwd",
  "alg": "HS256"
}
```
If the server uses the `kid` value as a file path, this can lead to arbitrary file reads.

## Mitigation Strategies

### 1. Explicitly Define Allowed Algorithms

**The golden rule:** Never trust the `alg` header blindly. Always whitelist expected algorithms.

```javascript
// SECURE: Node.js with jsonwebtoken
const jwt = require('jsonwebtoken');

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'] // Whitelist only the expected algorithm
    });
    return decoded;
  } catch (err) {
    return null;
  }
}
```

```python
# SECURE: Python with PyJWT
import jwt

try:
    decoded = jwt.decode(
        token,
        secret,
        algorithms=['HS256'] # Explicitly allow only HS256
    )
except jwt.InvalidTokenError:
    # Handle invalid token gracefully
    pass
```

### 2. Keep Libraries Updated

Many JWT libraries historically had default configurations vulnerable to this attack. Modern libraries:
- Require explicit algorithm configuration.
- Disable `none` by default.
- Enforce algorithm whitelisting.

**Always use the latest stable version** of your JWT library.

### 3. Reject 'None' at the Gateway

Configure your API Gateway (e.g., Kong, AWS API Gateway) to inspect JWT headers and reject any request where `alg` is `none` or similarly manipulated values.

```nginx
# Nginx example: Reject if alg header contains 'none' (case-insensitive)
if ($jwt_header_alg ~* "none") {
    return 401;
}
```

### 4. Separate Key Stores

Never use the same key material for different algorithm types (e.g., symmetric HS256 vs. asymmetric RS256).

```javascript
// SECURE: Distinct secrets for different algorithms
const verifyToken = (token) => {
  const header = JSON.parse(base64UrlDecode(token.split('.')[0]));

  if (header.alg === 'RS256') {
    // Use RSA public key
    return jwt.verify(token, rsaPublicKey, { algorithms: ['RS256'] });
  } else if (header.alg === 'HS256') {
    // Use HMAC secret
    return jwt.verify(token, hmacSecret, { algorithms: ['HS256'] });
  }
  // Reject any other or unsupported algorithms
  throw new Error('Unsupported algorithm');
};
```

### 5. Reject Suspicious Headers

Guard against header injection attacks by sanitizing header parameters like `jwk`, `jku`, `x5c`, `x5u`.

```javascript
const FORBIDDEN_HEADERS = ['jwk', 'jku', 'x5c', 'x5u'];

const sanitizeHeader = (header) => {
  FORBIDDEN_HEADERS.forEach(h => {
    if (header.hasOwnProperty(h)) { // Check if header property exists
      throw new Error(`Forbidden header parameter detected: ${h}`);
    }
  });
};
```

## Testing Methodologies

### Manual Testing with Tools

Use specialized tools like `jwt_tool` for automated testing:

```bash
# Example: Test for alg:none bypass and privilege escalation
jwt_tool.py target_token.txt -at -pc "role" -pv "admin"

# Example: Test RS256 to HS256 confusion
jwt_tool.py target_token.txt -X k -pk public_key.pem
```

### Burp Suite JWT Editor

Intercept JWTs in Burp Suite, send them to the JWT Editor, modify the `alg` header, re-sign if necessary, and forward the request to test server responses.

### Automated Scanning with Nuclei

Integrate checks into your CI/CD pipeline using tools like Nuclei:

```yaml
id: jwt-alg-none-bypass

info:
  name: JWT Algorithm None Bypass Vulnerability
  severity: critical
  description: Checks if an API endpoint incorrectly accepts JWTs with alg:none.

requests:
  - method: GET
    path:
      - "/api/protected"
    headers:
      Authorization: "Bearer {{base64(\"{\\\"alg\\\":\\\"none\\\"}\")}}" # Forged header
    # ... additional request details and expected response checks
```

## Secure Implementation Checklist

Before deploying JWT authentication, ensure these practices are followed:

-   [ ] **Explicitly whitelist** allowed algorithms in your JWT library.
-   [ ] **Reject** tokens with `alg: none` at the application or gateway level.
-   [ ] **Separate key material** for asymmetric and symmetric algorithms.
-   [ ] **Validate the `kid` header** against an allowlist.
-   [ ] **Keep JWT libraries updated** to the latest stable versions.
-   [ ] **Implement proper signature verification** with no algorithm fallback.
-   [ ] **Test your implementation** using security tools like `jwt_tool`.
-   [ ] **Use strongly-typed libraries** that enforce algorithm/key type matching.

> **\ud83d\udcec Stay Ahead of Threats**
> Want more actionable security guides like this? Join 10,000+ developers in the [OpSecForge Newsletter](https://opsecforge.com/newsletter) for weekly deep-dives into API security and DevSecOps.

## Conclusion

The JWT `none` algorithm attack is a classic example of how specification flexibility can lead to catastrophic vulnerabilities in implementation. By understanding the mechanics of this attack and enforcing strict, explicitly defined algorithm validation, you can neutralize this threat and ensure the integrity of your authentication system.

**Remember:** Never trust the client to dictate the security protocol; always enforce expected algorithms server-side.

---

## Related Tools

-   **[JWT Debugger](/tools/jwt-debugger)** — Inspect, decode, and debug JWT tokens locally
-   **[Base64 Converter](/tools/base64)** — Encode/decode Base64URL for JWT segments securely

## References

-   [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
-   [RFC 7515 - JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515)
-   [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)