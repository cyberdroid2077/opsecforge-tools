# Growth execution plan — 2026-09-04

Owner: OpsecForge autonomous operations. This plan implements PRODUCT_CHARTER.md. Daily operators must read this plan alongside OPERATIONS.md; historical wait instructions are not current decisions. Day-7 check: September 11. Day-14 decision: September 18. Day-28 business review: October 2. AdSense has a separate provisional September 20 deadline that still requires verification against the original notice.

## What the review established

Search Console API queried with dataState=final on September 4. Current 28 days: August 6–September 2, 455 impressions, 5 clicks, CTR 1.10%, position 58.65. Previous 28 days: July 9–August 5, 358 impressions, 0 clicks, position 52.25. These are complete equal-length periods, not two overlapping rolling snapshots. The 27% impression increase is not evidence of durable acquisition.

- SQL formatter: 79 impressions, no clicks, position 74.09; `postgresql beautifier` 27 impressions at 80.30. It is a genuine but competitive task. Retitling the page again is not a demonstrated fix.
- Hash-collision article: 52 impressions, no clicks, position 66.46 (previous 10 at 39.2). This is the highest-exposure non-home article, not proof of demand for a particular checksum keyword. Its practical next step was unsupported by the text-only hash tool.
- UUID browser article: 29 impressions, no clicks, position 70.93. Unix timestamp: 28, no clicks, position 70.21.
- The exposed query rows contain unrelated `opsec mod` and `opsec minecraft` queries. Filter these out of qualified-demand reporting. Do not target them or attribute hidden/anonymized queries to clicks.
- Current clicks: historical apex homepage 2, www homepage 1, reviewed API JSON response article 2. Host migration and the August 21 inventory reduction confound period comparisons.
- The August 21 internal-link experiment did not establish lift. Environment prevention: 18 impressions at 42.33 → 5 at 53.60; environment response: 8 at 55.50 → 11 at 60.00; JWT: 10 at 44.30 → 12 at 67.67. All zero clicks. Existing useful links can stay; repeating this intervention is not the next growth strategy.
- Vercel aggregate dashboard access is unreliable. Existing generic `tool_used` instrumentation counts a first input/button, not a completed task. We have no verified activation or retention baseline. A failed analytics read is missing data, not zero visitors.

## Execute in parallel workstreams, with concrete weekly decisions

| Due | Action | Deliverable / decision |
| --- | --- | --- |
| Sep 4 | Enhance the existing hash tool with local SHA-256/SHA-512 file comparison, bounded memory and exact-byte tests; connect the hash articles and canonical homepage/catalog entry | Tested production workflow, no new competing URL; GitHub README contains a reproducible synthetic example and channel-tagged link |
| Sep 7 | Re-establish read-only Vercel landing-page/referrer access through the existing authenticated dashboard; if unavailable, report one specific login/export action to the owner | Current and prior 28-day visitors, hash landing-page visits, GitHub referrals if exposed. No new tracker or paid tier by default |
| Sep 7 | Check AdSense setup/quality readiness against current rendered content and account checklist; verify the original notice date; use Ads.txt “Check for updates” if available and authorized | Give a submission recommendation with actual remaining quality/setup tasks. A stale Ads.txt label, GSC totals, or small traffic alone is not a veto. Review submission still awaits the user's existing requested final confirmation |
| Sep 11 | Review checksum discovery and distribution. Publish one factual demonstration on an existing verified OpsecForge channel if accessible and its rules allow; otherwise deliver one ready-to-use post and the exact login needed | At least one completed distribution surface (the public repository README ships in wave 1); record actual link/post, date, channel and available page-view evidence. Do not call drafts published |
| Sep 11 | Audit SQL formatter correctness on quoted strings, comments, PostgreSQL dollar quotes and dialect-specific expressions before promoting it | Reproducible pass/fail examples. If semantics change, fix the parser or narrow the documented support before any SQL campaign. No title churn merely because rank is low |
| Sep 18 | Decide on the older env/JWT experiment and checksum wave separately | Keep, iterate once, or stop further investment, with sample size and crawl dates. No automatic deletion/noindex for missing clicks |
| Oct 2 | Business review and next 30-day allocation | Compare equal 28-day windows, qualified queries, clicks, tool landing pages and actual referral sources. Set next investment based on evidence |

## Targets and decision rules

These are operating targets, not forecasts or Google requirements: seek 20 Google clicks in the next complete 28-day period (baseline 5), and 20 measured tool-page visits from deliberate distribution if aggregate access is available. If access is missing, the second goal remains unmeasured rather than satisfied.

1. A crawl/availability/canonical regression is fixed immediately. After a material update, verify the rendered result and, if authorized owner access is available, request inspection/indexing once for the selected canonical URLs. Log the request date; do not submit daily duplicates.
2. For a relevant query/page with at least 100 impressions and typical position 1–20 over 28 days, inspect the real SERP and intent before trying one title/description change for low CTR. Smaller samples are exploratory and cannot prove a headline problem.
3. For ranks below 30, identify a specific product/content gap or a credible distribution opportunity. Do not repeat generic internal-link edits. New feature work must make the task materially more useful.
4. For article-to-tool flow, use aggregate page/referrer data when it supports that inference. Do not equate page views or generic button events with execution, and do not instrument file names, content, sizes, digests, results, or secrets.
5. At 14 days, report absolute counts and whether Google has recrawled the changed page. An unrecrawled page is an unexposed intervention: address discovery while other distribution work continues. Do not reset the entire site's schedule.
6. At 28 days, if there are no relevant new query signals, clicks, referrals or feedback, stop expanding that experiment and allocate effort to another evidenced task. If the sample is insufficient, label the result inconclusive and cap additional investment; never keep extending the same wait indefinitely.
7. A page is merged, noindexed or retired only for a verified duplicate intent, factual/functional deficiency, or lack of distinct useful content. Two small zero-click windows are not by themselves a deletion criterion. Missing review metadata is an audit queue, not proof of Google policy noncompliance. Noindex does not make publicly accessible low-value content invisible to AdSense reviewers.

## Distribution ready material

Campaign URL: https://www.opsecforge.com/tools/hash-generator?utm_source=brand_post&utm_medium=social&utm_campaign=file_checksum_20260904#file-checksum

Draft for one verified brand channel after production verification:

> Checking a download against its checksum? OpsecForge now compares SHA-256 or SHA-512 locally in your browser. Select a file up to 32 MiB and paste the digest from a trusted publisher. No file upload. A match verifies the checksum you supplied—not publisher identity or malware safety. For larger files, the page includes local terminal commands.

Use a screenshot of synthetic `abc` input only. Do not post via the owner's personal X identity or promise security/usage statistics. License-dependent directories remain deferred until the owner selects a license. Product Hunt/other launches need an authenticated suitable account and genuine launch participation; avoid directory quotas and mass submissions.

## Corrected AdSense decision basis

Earlier logs treated Ads.txt recognition and refreshed GSC aggregate indexing as mandatory preconditions to reapply. That was an unsupported operational restriction. Google's [Ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en) explicitly calls ads.txt recommended, not mandatory; [troubleshooting](https://support.google.com/adsense/answer/12171244?hl=en) allows for delayed recognition and offers a status refresh. [Site connection guidance](https://support.google.com/adsense/answer/7584263?hl=en) supports publisher meta as an ownership method. Reapplication depends on actually resolving the stated site-quality issue and required account setup, not waiting for an unrelated Search Console total or a traffic threshold we invented. Approval remains Google's decision. No account submission or payment-data change is made by this document.

## Daily operating contract

Until October 2, every run reports: completed action or a named observation window, fresh data date, result, next dated action, and one precise blocker if present. Read this plan before replaying old automation-memory next steps. Missing access must be escalated once with a concise human-friendly action and tracked, not rediscovered silently each day. Weekly output must include a keep/iterate/stop decision even if the honest result is inconclusive. Keep measurement dates fixed for each experiment; other independent work may proceed.
