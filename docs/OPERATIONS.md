# OpsecForge Operations

Last updated: 2026-07-24

This file is the durable source of truth for website operations. Update it after any meaningful change to measurement, publishing, deployment, SEO, experiments, or operating risk.

## Mission

Grow OpsecForge into the trusted destination for privacy-first developer-security utilities: useful tools that process sensitive input locally in the browser, supported by accurate technical guidance.

## Target users

- Developers handling JWTs, JSON, SQL, environment files, hashes, URLs, and other sensitive text.
- Security and platform engineers who need quick local inspection or transformation tools.
- Technical teams searching for practical API security, credential hygiene, and browser-local workflow guidance.

## Operating principles

1. Optimize measured acquisition, activation, and repeat use rather than publishing volume.
2. Protect the core promise: sensitive tool input stays in the browser unless a page explicitly says otherwise.
3. Publish only source-backed English content with clear user value and relevant internal links.
4. Preserve existing work; inspect repository state before editing and isolate each commit.
5. Run content checks, typecheck, tests, and production build before publishing.
6. Never expose credentials or place secrets in code, logs, reports, or analytics.
7. Do not rely on or re-enable OpenClaw Producer jobs. Codex owns website operations.
8. Paid spend, access-control changes, and broad redesigns require a user decision.

## Current operating baseline

Recorded on 2026-07-24:

- Production: `https://www.opsecforge.com`, HTTP 200 on Vercel.
- Repository: `/home/dingw/opsecforge-tools`, `main` synchronized with `origin/main`.
- Inventory: 21 tool pages, 71 Markdown blog posts, 101 sitemap URLs.
- Link health: every sitemap URL returned HTTP 200; the four featured homepage article links also returned HTTP 200.
- Validation: explicit TypeScript checking is required because the Next.js build configuration can skip type errors.
- Email/support: tickets route to the OpsecForge Zoho inbox; 0 unread and 3 total messages at the latest check.
- Search Console snapshot since 2026-03-12: 510 impressions and 4 clicks; July impressions are rising.
- Vercel Web Analytics snapshot for the latest 30 days: 269 visitors, 417 page views, and 88% bounce rate.
- Leading article pages by visitors: Base64 vs Base64URL (14), offline cryptographic hashes (12), developer OpSec checklist (11), AI-enhanced XSS (10), API-key leaks (10), and webhook signature validation (10).
- Leading tool pages: SHA-256 Hash and SQL Formatter, each with 4 visitors and 6 page views.

## Analytics access and status

| Source | Configured | Reachable by operations | Current status |
| --- | --- | --- | --- |
| Vercel Web Analytics | Yes; `@vercel/analytics` is loaded globally | Snapshot only | A verified 30-day snapshot is available, but no recurring CLI/API access is available to this operator. |
| Google Search Console | Ownership appears configured | Snapshot only | A verified performance snapshot is available, but no recurring Search Console API/client access is available. |
| Google Analytics | No evidence found | No | No GA4 measurement ID, gtag, Tag Manager, environment key, or production marker was found. |
| Other product analytics | No evidence found | No | No PostHog, Plausible, Umami, Matomo, Fathom, Mixpanel, Segment, or Amplitude integration was found. |
| First-party tool events | No | No | Tool use and blog-to-tool conversion are not currently measurable. |

Minimum access needed for a measurable growth loop:

1. Read-only access to the existing Vercel project Web Analytics, either through team/project membership or a scoped token that can query aggregated visits.
2. Search Console read access to the verified OpsecForge property.
3. A user decision before enabling paid-plan Vercel custom events or another product-analytics integration. Vercel custom events are not available on the Hobby plan.

No secrets should be pasted into this document or chat. Grant access through the relevant provider's membership or scoped-token controls.

## Active experiments and hypotheses

Active experiment: high-traffic article to contextual tool navigation.

- If high-intent security articles link prominently to the single most relevant local tool, organic landing visits should convert into tool use more often than generic site navigation.
- First wave pages: Base64 vs Base64URL, offline cryptographic hashes, developer OpSec checklist, AI-enhanced XSS, API-key leaks, and webhook signature validation.
- Intervention: add a visible above-the-fold tool CTA, relevant ending links, and a categorized `/tools` hub without adding tracking.
- Measurement window: compare 14- and 28-day article entrances, tool page views, navigation paths where available, and bounce rate against the 2026-07-24 baseline.
- Limitation: Vercel Hobby has no custom events, so tool page views are the current activation proxy.

## Content inventory and pipeline

- 71 Markdown articles under `content/blog`.
- 21 live tools under `app/tools`.
- `/tools` is the canonical indexable tools center, organized into Encoding & Formatting, Credentials & Security, and Debugging & Validation.
- OpenClaw Producer morning brief, daily blog, and daily QA jobs are disabled and must remain disabled.
- New content is authored and reviewed by Codex only when it serves a verified search/user need.
- CVE content is guarded by `scripts/validate-content-sources.mjs`, which runs before production build and requires primary sources and explicit review metadata.
- Known historical risk: automated articles have included fabricated incidents, severity claims, statistics, and incorrect product capabilities. Existing content should be audited by traffic/value priority before promotion.

## Deployment and SEO observations

- Vercel deploys from `main`; production verification is required after push.
- The sitemap is generated dynamically and currently exposes 102 canonical `www` URLs.
- The apex domain redirects to `www`; public machine-readable URLs should use `https://www.opsecforge.com`.
- Vercel Analytics is live, so public claims of “no analytics” are inaccurate even though tool input remains browser-local.
- On 2026-07-24, `robots.txt` and `llms.txt` were corrected to use the `www` host; `llms.txt` also stopped linking to the nonexistent `/tools` index and now describes analytics truthfully.
- No current sitemap or featured-link HTTP failures were found.
- First growth wave changes on 2026-07-24:
  - Added above-the-fold contextual tool CTAs and ending links to the six leading article pages.
  - Replaced the unsupported API-key cost anecdote with evidence-safe incident-response guidance.
  - Removed duplicate Markdown H1 output from dynamic blog pages and added a visible organizational byline.
  - Added accurate Article and BreadcrumbList JSON-LD to dynamic articles and the two updated static articles.
  - Added Organization JSON-LD globally and BreadcrumbList/ItemList JSON-LD to the tools hub.
  - Added a visible Tools navigation entry and included `/tools` in the sitemap.
  - An independent read-only Claude review confirmed the chosen priorities: early contextual CTA, editorial internal links, duplicate-H1 removal, and visible provenance/structured data.
- Before/after checks for this wave:
  - `/tools`: HTTP 404 before; HTTP 200 and indexable after deployment.
  - Base64 article: two visible H1 headings before; one H1 after the renderer change.
  - Contextual CTA: late or absent before; visible immediately after each article header/introduction after.
  - Sitemap: 101 URLs before; 102 after adding `/tools`.
- P0 sanitizer reliability wave deployed on 2026-07-24 in commit `73fb70e`:
  - Replaced the overbroad 40-character AWS-secret regex and destructive split-based replacement with a pure, browser-local sanitizer that preserves surrounding structure where feasible.
  - Added heuristic handling for sensitive named fields in `.env`, JSON, and YAML; authorization/API-key/cookie headers; credentials in URLs and cURL commands; sensitive query parameters; common provider-token shapes; JWT-like strings; and private-key blocks.
  - Kept safe near misses such as checksums, public keys, key IDs, token endpoints, and already-redacted values unchanged in regression tests.
  - Renamed the interface to “Safe-to-Share Sanitizer” and states prominently that detection is heuristic, can miss custom formats, can flag benign values, and requires human review.
  - Confirmed by static inspection that the sanitizer input path contains no fetch, beacon, storage, console logging, or input analytics call.
  - Updated the leading API-key article CTA to describe the same limitations.
  - Narrowed webhook success wording to the supported fact: supplied payload, secret, and signature match; this alone does not establish source or prevent replay.
- P0 verification evidence:
  - `npm run typecheck`: passed.
  - Vitest: 14/14 passed, including eight sanitizer tests covering `.env`, JSON, YAML, logs, headers, URLs, cURL, private-key blocks, provider tokens, and near misses.
  - Content verification: passed.
  - Production build: passed, 121 generated pages.
  - Production synthetic check: redacted API-key, JSON password, bearer, and cURL header values while preserving a public-key field and JSON structure.
  - Production bundle check: new scoped webhook success wording present; old universal-authenticity wording absent.
- P0 measurement plan:
  - Compare 14- and 28-day visits to `/tools/env-sanitizer` and entrances from the API-key and OpSec articles against the 2026-07-24 baseline.
  - Use only aggregate Vercel page views and navigation paths where available; do not record pasted input, detected values, redaction counts, or copy actions.
- Webhook verifier reliability wave deployed on 2026-07-24 in commit `11ab28f`:
  - Fixed the Web Crypto identifier defect by mapping `sha1`, `sha256`, and `sha512` to `SHA-1`, `SHA-256`, and `SHA-512`.
  - Split the paste-only interface into bounded Generic HMAC, GitHub, and Stripe modes instead of implying one generic digest covers every provider.
  - GitHub mode requires the complete `sha256=` `X-Hub-Signature-256` value and verifies it over the exact UTF-8 request body.
  - Stripe mode parses `t=` and every `v1=` value, verifies HMAC-SHA256 over `timestamp.rawBody`, and reports whether the signed timestamp falls within a non-zero, user-visible tolerance based on the device clock.
  - Result copy distinguishes matching supplied values from observed request provenance, secret custody, event processing, and replay prevention.
  - Added direct links to current GitHub and Stripe webhook verification documentation and recommends official provider libraries for production receivers.
  - Confirmed by static inspection that the verifier input path contains no fetch, beacon, storage, console logging, or input analytics call.
- Webhook verifier evidence:
  - `npm run typecheck`: passed.
  - Vitest: 22/22 passed, including eight webhook tests for Web Crypto algorithm mapping, GitHub’s official HMAC test vector, modified payloads, malformed headers, Generic HMAC, Stripe multiple-signature rotation, timestamp tolerance, and disabled-tolerance rejection.
  - Content verification: passed.
  - Production build: passed, 121 generated pages.
  - Production browser checks: GitHub’s official public test vector matched; a current-time synthetic Stripe fixture matched inside the 300-second tolerance; the same synthetic construction at 301 seconds old produced the explicit outside-tolerance warning.
- Webhook measurement plan:
  - Compare 14- and 28-day visits to `/tools/webhook-debugger` and navigation from the webhook-signature article against the 2026-07-24 baseline.
  - Continue using aggregate page views only. Never record payloads, secrets, signatures, provider selection, verification results, or copy actions.

## Decisions

- Quality over volume; no daily content quota.
- OpenClaw Producer remains disabled.
- Existing Vercel page-view analytics stays in place; no new analytics integration is added without an access/plan decision.
- Tool input, secrets, tokens, and source text must never be included in analytics events.
- Vercel Hobby custom events remain disabled; no paid analytics features are enabled.
- `www` is the canonical public host.

## Risks

1. Growth cannot be measured end to end until Search Console and Vercel Analytics are readable.
2. Tool activation is invisible because only page views are configured.
3. Older AI-generated posts may still contain unsupported claims or weak internal linking.
4. Vercel custom events may require a paid plan; do not enable paid usage without approval.
5. Machine-facing trust files can drift from the actual runtime and must be checked during SEO audits.
6. The Base64 tool page is comparatively thin; a concise direct-answer/help section is queued for phase two rather than expanding the current wave.
7. Secret detection remains heuristic, paste-only, and non-exhaustive. It is not a repository scanner, secrets manager, compliance control, or substitute for rotating an exposed credential.
8. The webhook page is a local debugging aid, not production receiver middleware. Stripe freshness depends on the user’s device clock; GitHub replay handling still requires server-side delivery-ID deduplication; neither mode observes the real request source or secret custody.

## One next priority

Pause after the webhook verifier wave. When explicitly authorized, the next proposed implementation is to consolidate the overlapping hash pages and add browser-local file checksum verification. Do not begin that work automatically.
