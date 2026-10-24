export interface GlossaryLink {
  label: string;
  href: string;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  full?: string;
  def: string;
  /** Pages on this site that cover the term in depth. */
  internal: GlossaryLink[];
  /** One primary source (RFC, OWASP, MDN, NIST, vendor docs). */
  source: GlossaryLink;
}

// Every internal link must point at a live page (checked by lib/glossary.test.ts);
// every external link was fetched and returned HTTP 200 when this list was written.
export const glossary: GlossaryEntry[] = [
  {
    id: 'jwt',
    term: 'JWT',
    full: 'JSON Web Token',
    def: 'A compact, URL-safe format (RFC 7519) for a set of claims, usually a signed JWS. A signature lets the receiver check that the claims were not altered and who signed them. It does not make the contents secret: the payload of a signed JWT is only Base64URL-encoded, and anyone holding the token can read it.',
    internal: [
      { label: 'JWT Decoder', href: '/tools/jwt-decoder' },
      { label: 'JWT vulnerabilities and safe validation', href: '/blog/jwt-token-vulnerabilities-authentication-security' },
    ],
    source: { label: 'RFC 7519: JSON Web Token', href: 'https://datatracker.ietf.org/doc/html/rfc7519' },
  },
  {
    id: 'algorithm-confusion',
    term: 'Algorithm confusion',
    def: 'A class of JWT flaws where the verifier trusts the alg header supplied by the token instead of an algorithm fixed by the application, so a token can ask to be checked with a weaker method (including none) or with a public key used as an HMAC secret. The fix is to pin the accepted algorithms per key on the verifying side.',
    internal: [
      { label: 'JWT vulnerabilities and safe validation', href: '/blog/jwt-token-vulnerabilities-authentication-security' },
      { label: 'CVE-2026-29000: pac4j-jwt bypass', href: '/blog/cve-2026-29000-pac4j-jwt-authentication-bypass-2026' },
    ],
    source: { label: 'RFC 8725: JSON Web Token Best Current Practices', href: 'https://datatracker.ietf.org/doc/html/rfc8725' },
  },
  {
    id: 'hmac',
    term: 'HMAC',
    full: 'Hash-based Message Authentication Code',
    def: 'A construction that combines a secret key with a hash function (for example SHA-256) to produce a tag. Whoever holds the same key can recompute the tag and confirm that the message came from a key holder and was not changed. Compare tags with a constant-time function, not ordinary string equality.',
    internal: [
      { label: 'Verifying webhook signatures', href: '/blog/webhook-signature-validation-hmac-sha256-best-practices-2026' },
    ],
    source: { label: 'RFC 2104: HMAC', href: 'https://datatracker.ietf.org/doc/html/rfc2104' },
  },
  {
    id: 'webhook-signature',
    term: 'Webhook signature',
    def: 'A header on an incoming webhook request, typically an HMAC of the raw request body, that lets the receiver check the request came from the sender. The HMAC must be computed over the exact bytes received; parsing and re-serializing the JSON first usually breaks the match.',
    internal: [
      { label: 'Webhook Signature Verifier', href: '/tools/webhook-debugger' },
      { label: 'How to verify webhook signatures', href: '/blog/webhook-signature-validation-hmac-sha256-best-practices-2026' },
    ],
    source: { label: 'GitHub Docs: Validating webhook deliveries', href: 'https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries' },
  },
  {
    id: 'base64url',
    term: 'Base64URL',
    def: 'A variant of Base64 that uses - and _ instead of + and /, and usually omits the = padding, so the output can sit in URLs and filenames. JWT segments use it. It is an encoding, not encryption: anyone can reverse it.',
    internal: [
      { label: 'Base64 Converter', href: '/tools/base64-converter' },
      { label: 'Base64 vs Base64URL', href: '/blog/base64-vs-base64url' },
    ],
    source: { label: 'RFC 4648, section 5: Base 64 Encoding with URL and Filename Safe Alphabet', href: 'https://datatracker.ietf.org/doc/html/rfc4648#section-5' },
  },
  {
    id: 'sha-256',
    term: 'SHA-256',
    full: 'Secure Hash Algorithm 256-bit',
    def: 'A cryptographic hash function from the SHA-2 family (FIPS 180-4) that maps any input to a 256-bit digest. It is suited to integrity checks such as file checksums. It is fast by design, so on its own it is the wrong tool for storing passwords.',
    internal: [
      { label: 'Hash Generator', href: '/tools/hash-generator' },
      { label: 'Hash generator guide', href: '/blog/hash-generator-tools-data-integrity-security' },
    ],
    source: { label: 'NIST FIPS 180-4: Secure Hash Standard', href: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final' },
  },
  {
    id: 'hash-collision',
    term: 'Hash collision',
    def: 'Two different inputs that produce the same digest. Practical collision attacks exist for MD5 and SHA-1, so neither should be used where an attacker can choose the inputs, such as signatures or certificate checks. Checking a download against a published SHA-256 value is a different, still valid use.',
    internal: [
      { label: 'Hash collision attacks', href: '/blog/hash-collision-attacks-data-integrity' },
    ],
    source: { label: 'RFC 6151: Updated Security Considerations for MD5 and HMAC-MD5', href: 'https://datatracker.ietf.org/doc/html/rfc6151' },
  },
  {
    id: 'salt',
    term: 'Salt',
    def: 'A unique random value stored next to a password hash and mixed into the hash input, so identical passwords produce different hashes and precomputed tables stop working. A salt does not slow down guessing; that is the job of a slow password hashing function such as Argon2id, scrypt or bcrypt.',
    internal: [
      { label: 'Password security and NIST SP 800-63B-4', href: '/blog/password-security-vulnerabilities-best-practices' },
    ],
    source: { label: 'OWASP Password Storage Cheat Sheet', href: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' },
  },
  {
    id: 'passphrase-entropy',
    term: 'Entropy (passwords)',
    def: 'A measure, in bits, of how many guesses an attacker needs on average against a secret chosen by a given random process. It describes the generation method, not a single string: a password you picked yourself cannot be given a reliable entropy figure just by counting characters. A random passphrase of n words from a list of N words has n x log2(N) bits.',
    internal: [
      { label: 'Password Generator', href: '/tools/password-generator' },
      { label: 'NIST password rules and passphrase entropy', href: '/blog/password-security-vulnerabilities-best-practices' },
    ],
    source: { label: 'NIST SP 800-63B-4: Authentication and Authenticator Management', href: 'https://pages.nist.gov/800-63-4/sp800-63b.html' },
  },
  {
    id: 'uuid',
    term: 'UUID',
    full: 'Universally Unique Identifier',
    def: 'A 128-bit identifier written as 32 hex digits in five groups. Version 4 is random; version 7 puts a timestamp first so values sort by creation time. Uniqueness is probabilistic, and a UUID is an identifier, not a secret: do not use one as an access token unless it came from a cryptographically secure generator and is treated as a credential.',
    internal: [
      { label: 'UUID Generator', href: '/tools/uuid-generator' },
      { label: 'Generate a UUID v4 in the browser', href: '/blog/how-to-generate-uuids-in-browser' },
    ],
    source: { label: 'RFC 9562: Universally Unique IDentifiers (UUIDs)', href: 'https://datatracker.ietf.org/doc/html/rfc9562' },
  },
  {
    id: 'unix-epoch',
    term: 'Unix time',
    full: 'Seconds since the Unix Epoch',
    def: 'The number of seconds since 1970-01-01 00:00:00 UTC, not counting leap seconds. Many APIs use seconds (10 digits today) while JavaScript Date uses milliseconds (13 digits), a frequent source of off-by-1000 bugs.',
    internal: [
      { label: 'Unix Timestamp Converter', href: '/tools/unix-timestamp' },
    ],
    source: { label: 'POSIX.1-2024: Seconds Since the Epoch', href: 'https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap04.html' },
  },
  {
    id: 'sql-injection',
    term: 'SQL injection',
    def: 'A flaw where untrusted input is concatenated into a SQL statement, so the input can change the statement\'s structure. Parameterized queries send the SQL text and the values separately and prevent this for values, but not for identifiers such as table names or ORDER BY columns, which need an allowlist.',
    internal: [
      { label: 'SQL injection in API code', href: '/blog/sql-injection-modern-apis-parameterized-queries-2026' },
      { label: 'SQL Formatter', href: '/tools/sql-formatter' },
    ],
    source: { label: 'OWASP: SQL Injection', href: 'https://owasp.org/www-community/attacks/SQL_Injection' },
  },
  {
    id: 'ssrf',
    term: 'SSRF',
    full: 'Server-Side Request Forgery',
    def: 'A flaw where the server fetches a URL that an attacker influences, letting the attacker reach internal services or cloud metadata endpoints the server can see but the attacker cannot. Defences include allowlisting destinations and checking the resolved IP address that is actually connected to.',
    internal: [
      { label: 'SSRF prevention for APIs', href: '/blog/ssrf-api-security-guide-2026' },
    ],
    source: { label: 'OWASP Top 10 2021: A10 Server-Side Request Forgery', href: 'https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/' },
  },
  {
    id: 'bola',
    term: 'BOLA',
    full: 'Broken Object Level Authorization',
    def: 'An API flaw where the server accepts an object identifier from the client (for example /orders/1043) without checking that the caller may access that specific object. Also known as IDOR. Hard-to-guess identifiers do not fix it; an authorization check on every object access does.',
    internal: [
      { label: 'BOLA: prevention and testing', href: '/blog/bola-broken-object-level-authorization-api-2026' },
    ],
    source: { label: 'OWASP API Security Top 10 2023: API1 Broken Object Level Authorization', href: 'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/' },
  },
  {
    id: 'mass-assignment',
    term: 'Mass assignment',
    def: 'A flaw where request fields are bound directly to an internal object, so a client can set properties it should not control, such as role or isAdmin. Prevent it by binding only an explicit allowlist of fields.',
    internal: [
      { label: 'Mass assignment in APIs', href: '/blog/mass-assignment-api-vulnerability-orm-auto-binding-2026' },
    ],
    source: { label: 'OWASP API Security Top 10 2023: API3 Broken Object Property Level Authorization', href: 'https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/' },
  },
  {
    id: 'request-smuggling',
    term: 'HTTP request smuggling',
    def: 'An attack that exploits two HTTP components, such as a gateway and a back-end server, disagreeing about where one request ends and the next begins, usually through conflicting Content-Length and Transfer-Encoding headers. The attacker\'s bytes can then be read as the start of another user\'s request.',
    internal: [
      { label: 'Request smuggling in API gateways', href: '/blog/http-request-smuggling-api-gateway-protocol-desync-2026' },
    ],
    source: { label: 'RFC 9112, section 11.2: Request Smuggling', href: 'https://www.rfc-editor.org/rfc/rfc9112.html#section-11.2' },
  },
  {
    id: 'rate-limiting',
    term: 'Rate limiting',
    def: 'Capping how many requests a client may make in a time window. It limits brute force, scraping and resource exhaustion, but it only works if the limit key cannot be rotated cheaply: limiting by IP alone, or by a spoofable header, is easy to bypass.',
    internal: [
      { label: 'API rate limit bypass and layered controls', href: '/blog/api-rate-limiting-bypass-attacks-2026' },
    ],
    source: { label: 'OWASP API Security Top 10 2023: API4 Unrestricted Resource Consumption', href: 'https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/' },
  },
  {
    id: 'open-redirect',
    term: 'Open redirect',
    def: 'A redirect whose destination is taken from a request parameter without validation. In OAuth, an unvalidated redirect_uri can send authorization codes or tokens to an attacker-controlled address, so redirect URIs must be matched exactly against a registered list.',
    internal: [
      { label: 'OAuth redirect abuse', href: '/blog/oauth-redirect-abuse-microsoft-warning-2026' },
    ],
    source: { label: 'OWASP Unvalidated Redirects and Forwards Cheat Sheet', href: 'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html' },
  },
  {
    id: 'shadow-api',
    term: 'Shadow API',
    def: 'An API endpoint that is running and reachable but missing from the organization\'s inventory, documentation or gateway policies, so it is not monitored or patched like the known ones. Old versions and debug endpoints are common examples.',
    internal: [
      { label: 'API inventory and gateway boundaries', href: '/blog/shadow-apis-the-invisible-threat-2026' },
    ],
    source: { label: 'OWASP API Security Top 10 2023: API9 Improper Inventory Management', href: 'https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/' },
  },
  {
    id: 'secret-leak',
    term: 'Secret leakage',
    def: 'Exposure of credentials such as API keys, tokens or private keys through source control, logs, shared .env files or build artifacts. A leaked secret should be treated as compromised: revoke and rotate it, because deleting the commit or message does not remove copies.',
    internal: [
      { label: 'API key leaks: detection and response', href: '/blog/api-key-leaks-credential-security' },
      { label: 'Env Sanitizer', href: '/tools/env-sanitizer' },
    ],
    source: { label: 'OWASP Secrets Management Cheat Sheet', href: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' },
  },
  {
    id: 'cve',
    term: 'CVE',
    full: 'Common Vulnerabilities and Exposures',
    def: 'A public identifier (CVE-YYYY-NNNN) assigned to a specific vulnerability so that advisories, patches and scanners can refer to the same issue. A CVE record identifies the flaw; it is not a severity rating, which comes from separate scoring such as CVSS.',
    internal: [
      { label: 'CVE-2026-33143: webhook signature bypass', href: '/blog/cve-2026-33143-webhook-signature-verification-bypass-2026' },
    ],
    source: { label: 'CVE Program glossary', href: 'https://www.cve.org/ResourcesSupport/Glossary' },
  },
];
