# JWT Security Cheat Sheet

## Always Verify Signatures
Never trust a JWT without verifying its cryptographic signature. Use the appropriate algorithm (RS256 for asymmetric, HS256 for symmetric) and validate against your secret/public key.

## Use Short Token Expiry
Set `exp` claims to 15 minutes to 1 hour for access tokens. Refresh tokens can have longer expiry (days/weeks). Short-lived tokens limit the damage of a leaked token.

## Prefer RS256/ES256 Over HS256
RS256 (RSA Signature with SHA-256) is asymmetric — the server uses a private key to sign, and clients use a public key to verify. HS256 is symmetric — the same secret is used for both signing and verification. If an HS256 secret leaks, all tokens are compromised. RS256 isolates the signing key.

## Never Log Full Tokens
A JWT often contains PII (user IDs, emails, roles). Logging the full token in server logs exposes it to anyone with log access. Log only the token ID (jti) or a truncated hash.

## Check the Audience (aud) Claim
Verify the `aud` claim matches your application. A token intended for your staging environment should not work in production. This prevents token substitution attacks across environments.

## Validate All Time Claims
Check `exp` (expiration), `iat` (issued at), and `nbf` (not before). An attacker may reuse an old token with a valid signature but expired/invalid time window.

## Implement a Token Blocklist
Even with short expiry, a compromised token can be used until it expires. Implement a blocklist (Redis, etc.) to revoke tokens immediately upon logout or security event.

## Keep Secrets Server-Side
Never embed your signing secret in client-side code. The secret must live only on the server that verifies signatures. If you're using a symmetric algorithm (HS256), the secret is particularly dangerous — treat it like a password.

## Use the OpsecForge JWT Decoder
Inspect JWTs safely at opsecforge.com/tools/jwt-decoder — 100% client-side, zero data transmission.
