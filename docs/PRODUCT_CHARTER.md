# OpsecForge Product Charter

## Document control

| Field | Value |
| --- | --- |
| Status | Authoritative product and operating charter |
| Version | 1.0.0 |
| Effective date | 2026-08-14 |
| Owner | OpsecForge product operations, acting under the user's AI CEO authorization |
| Review cadence | Formal review every 28 days; emergency review for material safety, legal, privacy, or factual errors |
| Change record | Every revision must update the version and document evidence, reason, and summary in [OPERATIONS.md](OPERATIONS.md) |

This charter defines the durable rules for OpsecForge. [OPERATIONS.md](OPERATIONS.md) is the chronological record of what happened, what was measured, and what was decided under these rules.

## Mission, users, and purpose

OpsecForge helps developers and security practitioners format, inspect, sanitize, and verify sensitive technical data with trustworthy browser-local tools and accurate guidance.

Primary users are:

- Developers working with credentials, tokens, environment files, hashes, encodings, structured data, and API workflows.
- Security, platform, and operations engineers who need fast, bounded diagnostic utilities.
- Technical readers looking for direct, source-backed answers that lead to a relevant practical workflow.

The site exists to connect trustworthy technical discovery with useful tools. It is not a remote scanner, credential vault, compliance authority, exploit service, or substitute for production security controls.

Monetization is phased:

1. Earn trust through accurate content, reliable tools, and repeat use.
2. Establish measurable search-to-tool pathways using aggregate, privacy-safe signals.
3. Improve contextual discovery and retention before expanding distribution.
4. Use restrained advertising or other approved revenue paths only when they do not weaken trust, usability, accessibility, or the privacy boundary. Payments, subscriptions, or material commercial changes require human approval.

## North-star funnel

The product funnel is:

`search or content discovery → trustworthy answer → contextual tool entry → actual tool-page use → return visit or useful referral`

Page views are not proof of tool execution. Until privacy-safe aggregate activation data is available, article-to-tool navigation and tool-page visits are proxies only. Optimization must improve the full path rather than maximize publishing volume, impressions, or clicks in isolation.

## Product principles and tool decisions

Every tool must solve one clear task, have a defensible privacy boundary, work reliably on mobile and desktop, explain important limitations, and fit an owned user intent.

| Decision | Use when |
| --- | --- |
| Create | A verified user/search need is not served by an existing tool; the workflow can be safely bounded and tested; and the tool adds a distinct intent rather than a keyword variant. |
| Enhance | An existing tool already owns the intent but lacks a high-value capability, clearer limitations, better accessibility, or a safer workflow. |
| Merge | Two tools or pages serve substantially the same task, split authority, confuse users, or create avoidable maintenance and SEO overlap. Preserve the strongest URL and use reviewed redirects/canonicals when needed. |
| Reject | The idea requires sensitive server-side processing without an approved design, unsafe remote fetching or scanning, unverifiable security claims, input-level tracking, deceptive behavior, weak user value, or maintenance disproportionate to evidence of demand. |

Prefer enhancing or consolidating a proven workflow over adding another shallow utility. Do not claim popularity, accuracy, safety, or compliance without evidence.

## Content-to-tool protocol

An article must include a contextual tool CTA or small tool module when the reader's next reasonable step is directly supported by an existing OpsecForge tool. This is especially important for high-intent how-to, troubleshooting, comparison, credential-hygiene, encoding, hashing, formatting, and webhook-validation content.

- Place the first contextual entry after the direct answer or first useful explanation, not before the reader receives value.
- A second entry may appear near the conclusion when it supports the next step. Avoid repeated or unrelated CTAs.
- Name the exact task and boundary. Do not use generic promotional language or imply that a tool proves security, authenticity, authorization, or compliance.
- Small embedded modules may use synthetic examples and expose a narrow safe action. Do not embed a full dangerous workflow merely to increase interaction.
- Never add tracking for pasted input, source text, secrets, output, detection results, redaction counts, clipboard content, or payload characteristics.
- If no tool is contextually relevant, link to another authoritative answer or omit the CTA.

## Content quality and sources

- Use primary or authoritative sources for standards, vulnerabilities, vendor behavior, framework behavior, legal facts, statistics, and incident claims.
- Prefer specifications, official documentation, security advisories, research papers, and direct regulator or standards-body material. Secondary sources may add context but must not replace available primary evidence.
- Never invent data, cases, users, companies, quotes, reviews, severity, losses, adoption, or product capabilities.
- Never make absolute safety, prevention, privacy, anonymity, compliance, or “no risk” promises. State assumptions, scope, limitations, and required human or server-side controls.
- Use synthetic examples. Do not publish active secrets, exploit-ready sensitive payloads, or unnecessary operational details that materially increase harm.
- Security-sensitive and CVE content must carry the repository's required source-review metadata, including review date and reviewed sources, and pass the content-source gate.
- Correct material factual or safety errors promptly. Preserve URL intent when reasonable and record the correction in operations.

## Privacy and security boundary

Tool input is processed in the loaded browser page when the tool explicitly states that boundary. This does not mean that the entire site is offline or network-free: pages may load site resources, aggregate analytics, or approved advertising.

- Do not send tool input or output to an OpsecForge processing backend unless a future workflow is explicitly designed, disclosed, reviewed, and approved.
- Analytics and ads may observe aggregate page-level activity within their configured scope. They must not receive tool input, secrets, tokens, signatures, generated credentials, source text, output, or derived payload characteristics.
- Do not print, log, persist, report, commit, or expose credentials. Use secure credential loading only for the authorized operation.
- Browser-local processing reduces an upload path; it does not establish correctness, authenticity, authorization, safety, or compliance.
- Heuristic tools must disclose that they can miss custom or unexpected sensitive data and require review.
- Security facts that cannot be verified must not be asserted.

## UI and brand system

- Use a dark black/green security-oriented system. Green is the primary brand and action color.
- Warm amber, approximately `#F6B84A`, is a limited semantic accent for caution, review-required states, indices, and small highlights. It is not a second primary CTA color.
- Create clear hierarchy: one primary task, visibly subordinate alternatives, restrained decoration, and purposeful spacing. Avoid dashboard-like density and repeated cards with identical weight.
- Remove components that lack verified user value, duplicate native browser capability, add unsupported claims, or reduce trust. Do not add ornamental widgets by default.
- Design mobile-first behavior deliberately. Validate representative desktop, wide-screen, tablet, and 375 px layouts with no horizontal overflow or obscured controls.
- Maintain semantic structure, one clear H1, keyboard access, visible focus, useful accessible names, readable contrast, reduced-motion support, and meaningful labels.
- Prefer maintainable layout rules and reserved component space over viewport-specific coordinate patches.

## SEO and AI search/AEO

- Assign one primary intent owner to each indexable page. Enhance or consolidate when pages compete for the same task.
- Preserve stable public URLs. Changes to canonical ownership require evidence, reviewed redirects where appropriate, sitemap updates, and production verification.
- Keep canonicals, sitemap entries, robots behavior, titles, descriptions, headings, and structured data aligned with the rendered page.
- Use JSON-LD only when it accurately describes visible content and supported entities. Do not add review, rating, usage, or popularity schema without evidence.
- Lead with a concise direct answer, then explain assumptions, safe implementation, limitations, and next steps. This supports both human readers and answer engines.
- Build relevant internal links among the authoritative article, its contextual tool, and genuinely adjacent concepts. Do not create link farms.
- Do not mass-produce low-quality, overlapping, lightly rewritten, or source-free pages for search engines or AI crawlers.

## Distribution and monetization

- Prioritize credibility, product reliability, and evidence of real use before increasing ads or external promotion.
- Publish externally only through verified OpsecForge accounts and approved channels. Represent the product accurately and disclose material limitations.
- Reasonable, relevant replies and low-frequency compliant email are allowed. Spam, bulk unsolicited outreach, engagement manipulation, impersonation, deceptive urgency, purchased interactions, and unconsented list expansion are prohibited.
- Do not use unsupported usage statistics, fabricated testimonials, or fear-based security claims to acquire traffic.
- Paid spend, subscriptions, purchases, new billing flows, or material advertising changes require human approval.

## Measurement and experiments

Use Google Search Console for search discovery and Vercel aggregate analytics for page-level behavior when available. Evaluate article-to-tool navigation and tool-page visits as funnel proxies; do not label them tool executions.

Every material experiment must record its hypothesis, intervention, baseline, affected pages, privacy guardrails, start date, 14-day check, 28-day decision, and measurement limitations in [OPERATIONS.md](OPERATIONS.md).

- Start when a user or search problem is evidenced, the change is bounded, the metric is observable, and the privacy/SEO risks are acceptable.
- Keep when the 28-day evidence shows useful directional improvement without material trust, accessibility, performance, privacy, or SEO regression.
- Iterate when the signal is mixed but the underlying problem and measurement remain credible.
- Stop or revert when the intervention causes harm, violates a guardrail, creates no useful signal after a fair window, or depends on misleading interpretation.
- Treat small samples as directional. Report counts, windows, missing access, and confounders; do not overstate causality or trends.
- Safety, legal, privacy, and factual corrections do not wait for an experiment window.

## AI autonomy and human escalation

Within this charter, authorized AI operations may inspect data, update site content and SEO, improve tools and conversion paths, make routine code fixes, publish source-verified articles, operate verified brand channels, perform low-frequency compliant email operations, collect aggregate data, commit, push, deploy, and verify production. Credentials may be loaded securely from existing approved storage only for the target operation and must never be printed, copied, reported, committed, or transferred.

Human approval or intervention is required for:

- 2FA, CAPTCHA, account recovery, platform security confirmation, or domain-ownership confirmation.
- Payments, purchases, subscriptions, paid advertising, or new billing commitments.
- Material legal, terms, privacy-policy, consent, data-retention, or compliance changes.
- Irreversible deletion, destructive infrastructure changes, high-risk access-control changes, or actions that could materially disrupt production.
- Unverifiable security assertions, ambiguous authority, or a meaningful expansion beyond OpsecForge.

Never operate on unrelated projects or assets. In particular, OpenClaw, model, and ComfyUI business assets are outside scope except for read-only migration of OpsecForge knowledge.

## Documentation hierarchy

The authority order is:

1. This `PRODUCT_CHARTER.md`.
2. Current boundary and implementation documents, including [README.md](../README.md) and current code-level documentation.
3. [OPERATIONS.md](OPERATIONS.md), the append-only factual operating log and experiment record.
4. Historical reports, plans, audits, [OPS_MANUAL.md](../OPS_MANUAL.md), and [ROADMAP.md](../ROADMAP.md).

Code and production behavior are evidence, not permission to silently override the charter. When documentation, code, analytics, and the live site conflict, verify the current reality, record the discrepancy in operations, correct unsafe or false statements, and escalate any material policy conflict.

`OPS_MANUAL.md` and `ROADMAP.md` are retained for historical context only. Their Producer/OpenClaw roles, daily bulk-publishing rules, automatic content quotas, and related scheduling instructions are superseded and have no operating authority.

## Governance and revision

A formal charter review occurs every 28 days. The review uses production behavior, the operations log, verified analytics, Search Console data, user feedback, support signals, experiment results, and newly identified risks.

Each revision must:

1. Change the semantic version.
2. Cite the evidence or trigger in [OPERATIONS.md](OPERATIONS.md).
3. State the reason and a concise change summary.
4. Identify affected rules, experiments, or product behavior.
5. Be committed as an explicit governance change, never as silent drift inside an unrelated change.

Emergency revisions are allowed for material security, legal, privacy, or factual errors. They must still be versioned and documented as soon as the immediate risk is contained. Historical text may remain available, but superseded instructions must be clearly marked and must not regain authority without a reviewed charter revision.
