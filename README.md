# OpsecForge

[OpsecForge](https://www.opsecforge.com) is a Next.js site for privacy-first developer and security utilities. Its core product boundary is simple: values pasted into a tool are processed in the loaded browser page, not sent to an OpsecForge tool-processing backend.

## Privacy and analytics boundary

- Tool inputs and generated outputs are not sent to OpsecForge analytics.
- The public site uses aggregate Vercel Web Analytics for page-view measurement.
- The site may load advertising resources.
- Browser-local processing reduces an upload path; it does not make tool output correct, safe, or compliant by itself.
- Each security-sensitive tool should state its limitations and require appropriate human review.

Never add logging, storage, analytics, error reporting, or network calls that can contain tool input, secrets, tokens, signatures, or generated credentials.

## Tools

### Try a real workflow

- [Compare a file checksum](https://www.opsecforge.com/tools/hash-generator?utm_source=github&utm_medium=readme&utm_campaign=file_checksum_20260904#file-checksum): select a file up to 32 MiB, calculate SHA-256 or SHA-512, and compare a trusted publisher's digest. No file upload. A match does not prove the file is safe or authenticate its publisher.
- [Sanitize a configuration before sharing](https://www.opsecforge.com/tools/env-sanitizer): mask likely secrets in synthetic test data first. Detection is heuristic; review all output.
- [Check a webhook signature](https://www.opsecforge.com/tools/webhook-debugger): compare supplied GitHub, Stripe, or generic HMAC fixtures. Matching supplied values does not replace a production receiver's replay controls.

For a reproducible checksum demo, create a text file containing exactly `abc` with no newline. Its SHA-256 is `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`. Change one byte and the digest changes. File names, bytes, and digests are not included in analytics. Campaign labels on the public README link describe the distribution channel only.

The `/tools` hub groups the current utilities into:

- Encoding and formatting
- Credentials and security
- Debugging and validation

The catalog is defined in `lib/tool-catalog.ts`. Preserve existing public tool URLs unless a reviewed redirect or canonical migration is part of the change.

## Development

Requirements: a current Node.js release compatible with the lockfile and npm.

```bash
npm install
npm run dev
```

Before publishing:

```bash
npm run typecheck
npm test
npm run content:verify
npm run build
```

The production build runs content-source verification through `prebuild`.

## Content and security boundaries

- Use primary or authoritative sources for incident details, vulnerability status, statistics, standards, and vendor behavior.
- Do not invent incidents, identities, credentials, measurements, reviews, certifications, or compliance claims.
- Use synthetic fixtures in tests and documentation. Never commit real secrets, production payloads, or customer data.
- Keep defensive tools browser-local. Do not add remote scanners, proxy behavior, or requests to user-supplied URLs.
- Do not weaken the visible limitations of heuristic tools such as secret redaction.

## Governance

- [Product Charter](docs/PRODUCT_CHARTER.md): the authoritative, stable product and operating constitution.
- [Operations Log](docs/OPERATIONS.md): the chronological record of verified facts, deployments, experiments, measurements, risks, and decisions.
- [Current growth plan](docs/GROWTH_PLAN.md): dated experiments, distribution work, measurable decisions, and outstanding access needs.

When documentation conflicts, follow the hierarchy in the Product Charter and verify behavior against current code and production.

## Contributing

Keep changes focused and preserve unrelated work. For a proposed feature or material behavior change, start with an issue describing the user need, privacy boundary, evidence, and test plan. Security reports should use the contact method published on the live site and must not include active credentials or unnecessary sensitive data.

Deployment, analytics access, active experiments, and operating decisions are recorded in the Operations Log.
