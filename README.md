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

## Contributing

Keep changes focused and preserve unrelated work. For a proposed feature or material behavior change, start with an issue describing the user need, privacy boundary, evidence, and test plan. Security reports should use the contact method published on the live site and must not include active credentials or unnecessary sensitive data.

Deployment, analytics access, active experiments, and operating decisions are documented in `docs/OPERATIONS.md`.
