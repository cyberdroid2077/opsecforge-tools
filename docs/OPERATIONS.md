# OpsecForge Operations

Last updated: 2026-07-27

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
| Google Search Console | Yes; domain property verified | Yes; restricted-user read-only API | Performance and URL Inspection data are available. Page-indexing issue examples and first-seen dates are not exposed by the API; the web UI currently requires Google account re-verification. |
| Google Analytics | No evidence found | No | No GA4 measurement ID, gtag, Tag Manager, environment key, or production marker was found. |
| Other product analytics | No evidence found | No | No PostHog, Plausible, Umami, Matomo, Fathom, Mixpanel, Segment, or Amplitude integration was found. |
| First-party tool events | Yes; privacy-safe `tool_used` and `tool_result_copied` events use Vercel Analytics | Code and deployment verified; aggregate reports unavailable | Events contain only the tool slug and interaction type, never tool input. The first seven-day reporting baseline is still pending. |

Minimum access needed for a measurable growth loop:

1. Read-only access to the existing Vercel project Web Analytics, either through team/project membership or a scoped token that can query aggregated visits.
2. No additional Search Console access is needed for performance or URL Inspection. A signed-in UI session is needed only for coverage-example lists, first-seen dates, or manual validation controls.
3. A user decision before enabling paid-plan Vercel custom events or another product-analytics integration. Vercel custom events are not available on the Hobby plan.

No secrets should be pasted into this document or chat. Grant access through the relevant provider's membership or scoped-token controls.

## Active experiments and hypotheses

Active experiment: high-traffic article to contextual tool navigation.

- If high-intent security articles link prominently to the single most relevant local tool, organic landing visits should convert into tool use more often than generic site navigation.
- First wave pages: Base64 vs Base64URL, offline cryptographic hashes, developer OpSec checklist, AI-enhanced XSS, API-key leaks, and webhook signature validation.
- Intervention: add a visible above-the-fold tool CTA, relevant ending links, and a categorized `/tools` hub without adding tracking.
- Measurement window: compare 14- and 28-day article entrances, tool page views, navigation paths where available, and bounce rate against the 2026-07-24 baseline.
- Limitation: Vercel Hobby has no custom events, so tool page views are the current activation proxy.

Active experiment: simplified task discovery and duplicate-chrome removal.

- Hypothesis: a compact global navigation, four explicit homepage task pathways, and grouped secondary tools will reduce choice overload and increase visits to relevant tool pages without hiding the long tail.
- Intervention: replace the 18-link horizontal tool strip with Tools and Blog entries; make sanitizer, webhook verification, SHA hashes, and Base64 the four primary homepage pathways; group all other tools by purpose; keep every tool linked from `/tools` and the sitemap.
- Baseline: latest available 30-day Vercel snapshot is 269 visitors, 417 page views, and 88% bounce. SHA-256 Hash and SQL Formatter each had 4 visitors and 6 page views; tool activation beyond page views is not observable.
- 14-day check: compare homepage and `/tools` page views, exits to the four primary tool routes where aggregate navigation paths are available, bounce rate, mobile share, and 404s against the 2026-07-24 baseline.
- 28-day check: repeat the same comparison, check whether discovery spreads beyond the four primary routes, and review Search Console page/query changes. Do not infer tool use from a page view.
- Guardrail: no custom events, input telemetry, paid analytics, popularity labels, or claims based on unmeasured usage.

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
- The sitemap is generated dynamically and currently exposes 101 canonical `www` URLs.
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
- UI simplification and conversion wave prepared on 2026-07-24:
  - Replaced the dense 18-tool, horizontally scrolling global strip and its two scroll controls with a compact, keyboard-focusable Tools/Blog navigation. The tools center remains the grouped discovery surface.
  - Reorganized the homepage around four explicitly selected task pathways: Safe-to-Share Sanitizer, Webhook Signature Verifier, SHA Hash Generator, and Base64 Converter. These are operating priorities, not a claim that they are the most used.
  - Grouped the remaining 17 tools by Encoding & Formatting, Credentials & Security, and Debugging & Validation. A shared 21-tool catalog now drives the homepage and `/tools`, with tests for route uniqueness and primary-path integrity.
  - Removed the homepage's second footer, repetitive Live badges, repetitive “100% local” card rows, and stale decorative version/zero-log lines. Useful About, Case Studies, Glossary, FAQ, Privacy, Terms, and Contact links now appear once in the global footer.
  - Replaced the 21 tool-level re-exports of the root layout with a transparent metadata-preserving child layout. This removes the confirmed duplicate navbar, footer, analytics, ad banner, language selector, and ticket button from tool pages.
  - Corrected confirmed heading defects: Hash Generator, Text Case, and URL Encoder now have page H1 headings; Markdown to HTML's default sample no longer injects a second H1 into the preview. Input/output labels were added to the three legacy tool UIs where touched.
  - Deliberately left all tool and article URLs, algorithms, tool input behavior, pricing, JSON aliases, overlapping hash tools, article inventory, social-share controls, ads, language selector, and ticket flow unchanged. JSON/hash consolidation remains out of scope.
- UI wave pre-deployment evidence:
  - New catalog tests: 3/3 passed; full Vitest suite: 25/25 passed.
  - `npm run typecheck`, content verification, and production build passed; 121 pages generated.
  - Targeted ESLint passed for the new navigation, homepage, tools hub, transparent tool layout, and catalog files. Repository-wide ESLint still fails on 41 pre-existing errors in older JWT, SQL, hash, language, social-share, test, and related components; this wave did not expand into those modules.
  - Staged DOM checks on the homepage, tools hub, sanitizer, webhook verifier, hash generator, text case, URL encoder, and Markdown tool found one primary navigation, one footer, and one H1 per page.
  - `/tools` exposed all 21 tool links; the homepage exposed the four primary pathways plus 17 grouped remaining tools.
  - Responsive DOM was checked at 375 × 812; the compact navigation remained available without the old horizontal tool scroller. Tools is a native link with visible keyboard focus styling.
  - Staged HTTP checks returned 200 for the homepage, tools hub, six representative tool pages, and the two sampled guide routes.
- UI wave production verification:
  - Commit `9b303bf` was pushed to `main` and served by `https://www.opsecforge.com` on 2026-07-24.
  - Production DOM checks repeated the homepage, tools hub, sanitizer, webhook verifier, hash generator, text case, URL encoder, and Markdown checks: one primary navigation, one footer, and one H1 per page.
  - The production tools hub exposed 21 direct tool links; the sitemap listed all 21 tool URLs; all 21 returned HTTP 200.
  - At a 375 × 812 viewport, Tools, Blog, and the theme control remained exposed in the primary navigation and the removed scroll controls were absent. Native links and visible focus styles preserve keyboard discovery.
  - A safe synthetic sanitizer check redacted `API_KEY=synthetic-example-secret-12345` while preserving the near-miss `PUBLIC_KEY_ID=pk_synthetic`, confirming the layout change did not break the representative local tool flow.

## Credibility and index-hygiene P0 — 2026-07-24

Scope completed:

- Reviewed and corrected fifteen indexed, high-risk Markdown articles that contained unsupported incident narratives, precise statistics, vendor claims, or unavailable-product links:
  - AI sycophancy and security advice
  - SQL injection and parameterized queries
  - AI agent credential governance
  - API gateway security
  - secrets sprawl
  - committed `.env` file response
  - secure coding practices
  - password security
  - JWT vulnerabilities
  - a fabricated JWT token-leak incident
  - API JSON property exposure
  - shadow APIs
  - SSRF prevention
  - CI/CD security-tool supply chain
  - webhook HMAC verification guidance and its unavailable vault link
- Preserved every existing article URL. Unsupported anecdotes and numbers were removed rather than replaced with invented values. Revised claims link to NIST, OWASP, CISA, GitHub, Toyota, or the clearly labeled GitGuardian measurement where applicable.
- Added optional `updated`, `source_reviewed`, and `primary_source` frontmatter support. Reviewed articles expose a visible source-review date and primary-source link; Article JSON-LD now emits `dateModified` only when supplied.
- Fixed dynamic Markdown pages that embedded raw HTML H1 elements by demoting body H1s to H2s. The page header remains the sole H1.
- Replaced the unsourced five-item Case Studies page with two directly sourced incident summaries from Toyota and CISA. Removed the unsupported “added daily” claim.
- Corrected unsupported About and FAQ claims including “100% open source,” “no telemetry,” WebAssembly usage, universal offline operation, inherent GDPR compliance, ISO/SOC alignment, and absolute tool-safety claims. The pages now state the aggregate page-analytics/advertising boundary and tool limitations.
- Removed a SQL Formatter claim that browser-local formatting itself establishes GDPR, SOC 2, or HIPAA compliance.
- Added self-referencing canonicals to the homepage, static content pages, blog index, and every tool page.
- Confirmed `/tools/json-formatter` is the same implementation as `/tools/json-beautifier`; kept both URLs live, assigned the alias a canonical to `/tools/json-beautifier`, and removed only the non-canonical alias from the sitemap.
- Removed duplicate page-local footers from About, Blog, FAQ, Case Studies, Glossary, and Privacy while preserving the single global footer.
- Removed synthetic sitemap `lastModified` values. File mtimes are not stable across Vercel builds and most pages lack a truthful update field, so the sitemap omits `lastmod` instead of fabricating a date.
- Replaced the create-next-app README with an accurate project README covering mission, browser-local input boundaries, aggregate analytics, advertising, categories, validation commands, content standards, and contribution constraints. No license was added.
- Strengthened `content:verify` so changed high-risk articles with percentages, large counts, currency, studies, reports, or incident-impact claims require review metadata and a primary-source URL. Working-tree changes are now validated as well as the latest commit.

Pre-deployment evidence:

- `npm run content:verify`: passed for all 15 changed blog files.
- Targeted provenance/sitemap tests: 9/9 passed; full Vitest suite: 28/28 passed.
- `npm run typecheck`: passed.
- Targeted ESLint passed for the changed, non-ignored application and library files; the repository retains its previously documented legacy lint debt outside this scope.
- Production build: passed, 121 pages generated.
- Staged sitemap: 101 canonical URLs, zero fabricated `lastmod` values, and no non-canonical `/tools/json-formatter` entry.
- Staged full-sitemap DOM audit: 101/101 pages had a title, canonical, exactly one H1, and exactly one global footer.
- Staged provenance checks confirmed visible review dates and primary-source links on reviewed dynamic articles, `dateModified` in Article JSON-LD, and the JSON alias canonical.

Measurement and guardrails:

- 14-day: compare Search Console impressions, clicks, average position, and indexed-page coverage for the changed articles and static pages; check Vercel entrances, tool-page views, bounce rate, 404s, and the canonical JSON alias. Search snippets may lag the deployment.
- 28-day: repeat the page/query comparison, inspect whether unsupported snippets have been replaced after recrawl, and assess whether source-backed pages gain or lose qualified entrances. Do not infer tool execution from page views.
- Guardrails: no new telemetry, no input events, no paid plan, no external submission, no URL deletion, and no change to the Privacy Policy or Terms of Service body.
- Production verification and final commit identifiers are recorded after deployment.

Production verification:

- Commit `cee264d` was pushed to `main` and served by `https://www.opsecforge.com` on 2026-07-24.
- Production full-sitemap audit repeated the staged result: 101/101 URLs returned a title, canonical, exactly one H1, and exactly one footer; sitemap `lastmod` count was zero.
- Production article checks confirmed the corrected titles/copy, visible source-review dates, visible primary-source links, and truthful Article `dateModified`.
- `/tools/json-formatter` remains HTTP 200 and now canonicals to `/tools/json-beautifier`; only the canonical URL appears in the sitemap.
- Public search results still showed cached pre-change titles and fabricated snippets immediately after deployment. This is expected recrawl lag, not a production rollback; recheck at the 14-day measurement point rather than claiming immediate search-snippet correction.

## Search Console duplicate-canonical audit — 2026-07-27

- Search Console URL Inspection reported `Duplicate without user-selected canonical` for `https://www.opsecforge.com/` and `https://www.opsecforge.com/tools/lorem-ipsum`. Google had selected the equivalent non-`www` URLs as canonical.
- Those results were based on crawls from 2026-07-17 and 2026-07-16 respectively, before self-referencing `www` canonicals were deployed on 2026-07-24. The API does not expose the issue's first-seen date or complete example list; the Search Console web UI requires account re-verification.
- Current production sends apex HTTPS requests to the matching `www` URL, HTTP variants redirect to HTTPS, and trailing-slash variants redirect to the slashless URL.
- A production sitemap audit found 101 unique URLs: all use HTTPS and `www`, none has a trailing slash, and `/tools/json-formatter` is absent. Every sitemap URL returned HTTP 200, allowed indexing, exposed exactly one H1, and had a canonical exactly matching its sitemap URL.
- `/tools/json-formatter` remains an intentional duplicate alias with a user-declared canonical to `/tools/json-beautifier`; this is expected consolidation, not the reported no-canonical condition.
- The audit found one live conflicting host signal: `SocialShare` generated encoded apex-domain URLs on every tool and dynamic article page. It was corrected to generate the canonical `https://www.opsecforge.com` host. No page URL, visible content, sitemap entry, or redirect target changed.
- Expected outcome: Google should replace the stale non-`www` canonical selection after recrawling the updated pages. No traffic loss is established; Search Console performance data still contains historical impressions for both hosts, while all current site-owned canonical signals point to `www`.
- Measurement: re-inspect the two examples after Google recrawls them and check whether `userCanonical` and `googleCanonical` converge on `www`. A manual validation request is optional, not required for the redirects and canonical tags to be processed.

## Decisions

- Quality over volume; no daily content quota.
- OpenClaw Producer remains disabled.
- Existing Vercel page-view analytics stays in place; no new analytics integration is added without an access/plan decision.
- Tool input, secrets, tokens, and source text must never be included in analytics events.
- Vercel Hobby custom events remain disabled; no paid analytics features are enabled.
- `www` is the canonical public host.

## Risks

1. Search Console is readable, but end-to-end growth measurement remains incomplete until aggregate Vercel page and tool-event reports are available to operations.
2. Tool activation is invisible because only page views are configured.
3. The first P0 wave corrected the highest-risk pages identified in the audit, but the remaining historical article inventory still needs traffic-prioritized source review before promotion.
4. Vercel custom events may require a paid plan; do not enable paid usage without approval.
5. Machine-facing trust files can drift from the actual runtime and must be checked during SEO audits.
6. The Base64 tool page is comparatively thin; a concise direct-answer/help section is queued for phase two rather than expanding the current wave.
7. Secret detection remains heuristic, paste-only, and non-exhaustive. It is not a repository scanner, secrets manager, compliance control, or substitute for rotating an exposed credential.
8. The webhook page is a local debugging aid, not production receiver middleware. Stripe freshness depends on the user’s device clock; GitHub replay handling still requires server-side delivery-ID deduplication; neither mode observes the real request source or secret custody.

## One next priority

Pause after the production-verified credibility and index-hygiene P0 wave. Collect 14- and 28-day Search Console and Vercel signals before beginning P1 content refresh, hash consolidation, JWT, CSP/SRI, pricing, or external distribution work.
