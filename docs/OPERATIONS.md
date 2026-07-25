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

## Analytics access and status

| Source | Configured | Reachable by operations | Current status |
| --- | --- | --- | --- |
| Vercel Web Analytics | Yes; `@vercel/analytics` is loaded globally | No | Page-view collection is present, but no usable CLI token, project metadata, or dashboard/API access is available to this operator. |
| Google Search Console | Ownership appears configured | No | DNS contains a Google site-verification record, but no Search Console API/client access is available. |
| Google Analytics | No evidence found | No | No GA4 measurement ID, gtag, Tag Manager, environment key, or production marker was found. |
| Other product analytics | No evidence found | No | No PostHog, Plausible, Umami, Matomo, Fathom, Mixpanel, Segment, or Amplitude integration was found. |
| First-party tool events | No | No | Tool use and blog-to-tool conversion are not currently measurable. |

Minimum access needed for a measurable growth loop:

1. Read-only access to the existing Vercel project Web Analytics, either through team/project membership or a scoped token that can query aggregated visits.
2. Search Console read access to the verified OpsecForge property.
3. A user decision before enabling paid-plan Vercel custom events or another product-analytics integration. Vercel custom events are not available on the Hobby plan.

No secrets should be pasted into this document or chat. Grant access through the relevant provider's membership or scoped-token controls.

## Active experiments and hypotheses

No traffic experiment is active because acquisition and conversion data are not yet readable.

Queued hypothesis:

- If high-intent security articles link prominently to the single most relevant local tool, organic landing visits should convert into tool use more often than generic site navigation.
- Required measurement: landing page, relevant tool page view, and a privacy-safe tool-use event that contains no user input.

## Content inventory and pipeline

- 71 Markdown articles under `content/blog`.
- 21 live tools under `app/tools`.
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

## Decisions

- Quality over volume; no daily content quota.
- OpenClaw Producer remains disabled.
- Existing Vercel page-view analytics stays in place; no new analytics integration is added without an access/plan decision.
- Tool input, secrets, tokens, and source text must never be included in analytics events.
- `www` is the canonical public host.

## Risks

1. Growth cannot be measured end to end until Search Console and Vercel Analytics are readable.
2. Tool activation is invisible because only page views are configured.
3. Older AI-generated posts may still contain unsupported claims or weak internal linking.
4. Vercel custom events may require a paid plan; do not enable paid usage without approval.
5. Machine-facing trust files can drift from the actual runtime and must be checked during SEO audits.

## One next priority

Obtain read-only access to the existing Vercel Web Analytics project and the verified Search Console property, then record a 28-day baseline for impressions, clicks, visitors, top landing pages, referrers, and blog-to-tool navigation.
