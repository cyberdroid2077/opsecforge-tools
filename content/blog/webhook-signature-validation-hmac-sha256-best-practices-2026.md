---
title: "How to Verify Webhook Signatures (HMAC-SHA256): GitHub, Stripe and Slack"
date: "2026-03-21"
updated: "2026-10-23"
description: "Verify GitHub, Stripe and Slack webhook signatures with HMAC-SHA256: raw body handling, constant-time comparison, replay windows, event-ID deduplication, working Node and Python code, and a table of why verification fails."
author: "OpsecForge Security Team"
category: "API Security"
source_reviewed: "2026-10-23"
primary_source: "https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries"
sources:
  - "https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries"
  - "https://docs.stripe.com/webhooks"
  - "https://docs.stripe.com/webhooks/signature"
  - "https://docs.slack.dev/authentication/verifying-requests-from-slack/"
  - "https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b"
  - "https://docs.python.org/3/library/hmac.html"
  - "https://docs.github.com/en/webhooks/webhook-events-and-payloads"
  - "https://docs.slack.dev/apis/events-api/"
---

# How to Verify Webhook Signatures (HMAC-SHA256): GitHub, Stripe and Slack

Compute HMAC-SHA256 over the exact bytes of the request body, using the secret the provider gave you, and compare the result to the signature header with a constant-time function. Stripe and Slack also sign a timestamp, so reject requests whose timestamp is more than a few minutes old. Everything else, such as which header to read and what string to sign, differs per provider and is covered below.

<div class="my-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
  <p class="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-400">Check a signature in your browser</p>
  <p class="text-slate-300">The <a href="/tools/webhook-debugger">Webhook Signature Verifier</a> compares a payload, secret and signature for GitHub, Stripe or generic HMAC formats, locally in the browser tab. It shows whether the bytes you pasted match; it cannot show who sent a real request or whether it was replayed.</p>
  <a href="/tools/webhook-debugger" class="mt-4 inline-flex rounded-full bg-emerald-500 px-6 py-3 font-bold !text-slate-950 !no-underline hover:bg-emerald-400">Open the Webhook Signature Verifier →</a>
</div>

The functions behind that page are in `lib/webhook-verifier.ts`. Run against GitHub's published test vector (secret `It's a Secret to Everybody`, payload `Hello, World!`) and a synthetic Stripe header, they return:

```text
GitHub vector                 : true
GitHub, payload "Hello, World?": false
Stripe synthetic, 60 s old    : {"signatureMatched":true,"timestamp":1700000000,"ageSeconds":60,"withinTolerance":true}
Stripe synthetic, 400 s old   : {"signatureMatched":true,"timestamp":1700000000,"ageSeconds":400,"withinTolerance":false}
```

The Stripe values are synthetic, generated for this article and not produced by Stripe: secret `whsec_synthetic_example_only`, body `{"id":"evt_synthetic_1","object":"event"}`, header `t=1700000000,v1=cb0ce34c4a56d6e4716e4b9a886c3beb19829e4d1d0c04be1192875efcc999ca`. Paste them into the tool and the signature matches; the tool measures age against your device clock, so it will report the timestamp as outside tolerance.

## Use the raw body

The signature covers bytes. If a framework parses the JSON and you serialize it again, key order, whitespace or escaping can change and the HMAC no longer matches. Stripe's [troubleshooting guide](https://docs.stripe.com/webhooks/signature) lists it, and Slack's [documentation](https://docs.slack.dev/authentication/verifying-requests-from-slack/) says to use the body before it is deserialized. Read the body first, verify, then parse.

```js
// Express: put the raw parser on the webhook route, and express.json() only after it
app.post("/webhooks/github", express.raw({ type: "application/json" }), (req, res) => {
  const ok = verifyGitHub(req.body, req.get("X-Hub-Signature-256"), SECRET); // req.body is a Buffer
  res.sendStatus(ok ? 204 : 401);
});

// Next.js route handler (app/api/webhooks/github/route.ts): use text(), never json()
const raw = await request.text();
```

```python
# Flask: call get_data() before touching request.json or request.form
raw = request.get_data()

# FastAPI: read the body from the Request object, not from a Pydantic model
raw = await request.body()
```

## What each provider signs

<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:0.9rem;line-height:1.5">
<tr><th style="border:1px solid #334155;padding:0.5rem 0.75rem;background:#1e293b;color:#f1f5f9;text-align:left;vertical-align:top"></th><th style="border:1px solid #334155;padding:0.5rem 0.75rem;background:#1e293b;color:#f1f5f9;text-align:left;vertical-align:top">GitHub</th><th style="border:1px solid #334155;padding:0.5rem 0.75rem;background:#1e293b;color:#f1f5f9;text-align:left;vertical-align:top">Stripe</th><th style="border:1px solid #334155;padding:0.5rem 0.75rem;background:#1e293b;color:#f1f5f9;text-align:left;vertical-align:top">Slack</th></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Header</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>X-Hub-Signature-256</code></td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>Stripe-Signature</code></td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>X-Slack-Signature</code></td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Header value</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>sha256=&lt;hex&gt;</code></td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>t=&lt;unix seconds&gt;,v1=&lt;hex&gt;[,v1=...]</code></td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>v0=&lt;hex&gt;</code></td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Signed string</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">body</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>&lt;t&gt;.&lt;body&gt;</code></td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>v0:&lt;timestamp&gt;:&lt;body&gt;</code></td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Timestamp</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">none</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>t=</code> in the header</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top"><code>X-Slack-Request-Timestamp</code></td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Key</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">webhook secret</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">endpoint secret (<code>whsec_...</code>)</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">app signing secret</td></tr>
</table></div>

Details from the docs: GitHub says the payload should be handled as UTF-8 ([GitHub](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)). Stripe tells you to ignore every scheme other than `v1`, and a header can carry several `v1` values while a secret is being rolled ([Stripe](https://docs.stripe.com/webhooks)). Slack uses the signing secret as a plain UTF-8 string and notes that header names are case-insensitive.

## Node.js

`crypto.timingSafeEqual` [throws when the two inputs differ in length](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b), so check lengths first. Tested on Node 22.

```js
import { createHmac, timingSafeEqual } from "node:crypto";

const hmacHex = (secret, ...chunks) => {
  const h = createHmac("sha256", secret);
  chunks.forEach((c) => h.update(c)); // Buffer or string; bytes are hashed as given
  return h.digest("hex");
};

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const fresh = (ts, now, tolerance) =>
  /^\d+$/.test(ts ?? "") && Math.abs(now - Number(ts)) <= tolerance;

export function verifyGitHub(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  return safeEqual("sha256=" + hmacHex(secret, rawBody), signatureHeader);
}

export function verifyStripe(rawBody, header, secret, { tolerance = 300, now = Date.now() / 1000 } = {}) {
  const pairs = (header ?? "").split(",").map((p) => p.trim().split("="));
  const t = pairs.find(([k]) => k === "t")?.[1];
  const v1 = pairs.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!fresh(t, now, tolerance) || v1.length === 0) return false;
  const expected = hmacHex(secret, `${t}.`, rawBody);
  return v1.some((sig) => safeEqual(expected, sig));
}

export function verifySlack(rawBody, timestamp, signature, secret, { tolerance = 300, now = Date.now() / 1000 } = {}) {
  if (!signature || !fresh(timestamp, now, tolerance)) return false;
  return safeEqual("v0=" + hmacHex(secret, `v0:${timestamp}:`, rawBody), signature);
}
```

## Python

`hmac.compare_digest` is what the [Python documentation](https://docs.python.org/3/library/hmac.html) recommends instead of `==` when comparing digests. Encoding both sides to bytes means odd input returns `False` instead of raising `TypeError`. Tested on Python 3.12 (needs 3.10+ for the type syntax).

```python
import hashlib
import hmac
import time


def _hex(secret: str, *chunks: bytes) -> str:
    mac = hmac.new(secret.encode("utf-8"), digestmod=hashlib.sha256)
    for chunk in chunks:
        mac.update(chunk)
    return mac.hexdigest()


def _same(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


def _fresh(ts: str | None, now: float, tolerance: int) -> bool:
    return bool(ts) and ts.isdigit() and abs(now - int(ts)) <= tolerance


def verify_github(raw_body: bytes, signature_header: str | None, secret: str) -> bool:
    if not signature_header:
        return False
    return _same("sha256=" + _hex(secret, raw_body), signature_header)


def verify_stripe(raw_body: bytes, header: str | None, secret: str,
                  tolerance: int = 300, now: float | None = None) -> bool:
    now = time.time() if now is None else now
    pairs = [p.strip().split("=", 1) for p in (header or "").split(",") if "=" in p]
    t = next((v for k, v in pairs if k == "t"), None)
    v1 = [v for k, v in pairs if k == "v1"]
    if not _fresh(t, now, tolerance) or not v1:
        return False
    expected = _hex(secret, f"{t}.".encode(), raw_body)
    return any(_same(expected, sig) for sig in v1)


def verify_slack(raw_body: bytes, timestamp: str | None, signature: str | None, secret: str,
                 tolerance: int = 300, now: float | None = None) -> bool:
    now = time.time() if now is None else now
    if not signature or not _fresh(timestamp, now, tolerance):
        return False
    return _same("v0=" + _hex(secret, f"v0:{timestamp}:".encode(), raw_body), signature)
```

Both versions pass GitHub's published vector, reproduce the Slack documentation's worked example (`v0=a2114d57...`), and agree on the synthetic Stripe digest above. They reject a changed payload, a stale timestamp, a millisecond timestamp, a secret with a stray space or newline, and a body that was parsed and pretty-printed again.

## Replay protection is not exactly-once

A valid signature stays valid when someone captures the request and sends it again. Stripe and Slack sign the timestamp, so a tolerance window limits how old a replay can be. Stripe's libraries default to five minutes and Slack's example uses five minutes. Stripe warns that a tolerance of `0` disables the recency check entirely, and that your server clock should be synced with NTP.

The window does not stop a replay inside it, and providers also redeliver on purpose: Stripe retries failed deliveries with a new signature and timestamp each time. So store the event ID (`id` in Stripe's body, `X-GitHub-Delivery` for GitHub, `event_id` in Slack Events API payloads) and skip IDs you have processed. Write the ID in the same database transaction as the side effect. Delivery can repeat, so this gives you idempotent handling under at-least-once delivery, not exactly-once processing. Stripe's own advice is to track event IDs rather than rely on `created` or event order.

## Verifying at a gateway

Verification can run in a gateway or proxy only if that component receives the original body and headers untouched. GitHub's documentation tells you to make sure a proxy or load balancer does not modify the payload or headers, and Stripe's troubleshooting page shows that AWS API Gateway needs a body mapping template before the Lambda function can see the raw body. If the gateway verifies and then forwards a re-encoded body, downstream services can no longer verify it themselves and must trust the gateway instead. Decide that trade-off on purpose.

## Why verification fails

<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:0.9rem;line-height:1.5">
<tr><th style="border:1px solid #334155;padding:0.5rem 0.75rem;background:#1e293b;color:#f1f5f9;text-align:left;vertical-align:top">Symptom</th><th style="border:1px solid #334155;padding:0.5rem 0.75rem;background:#1e293b;color:#f1f5f9;text-align:left;vertical-align:top">Likely cause</th><th style="border:1px solid #334155;padding:0.5rem 0.75rem;background:#1e293b;color:#f1f5f9;text-align:left;vertical-align:top">What to check</th></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Fails on every request</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Body was parsed and re-serialized</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Hash the bytes you verify; use <code>express.raw</code>, <code>get_data()</code>, <code>text()</code></td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Fails only with non-ASCII text</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Body decoded with a non-UTF-8 charset</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Decode as UTF-8 or hash the bytes</td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Fails only behind a proxy</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Proxy rewrites body or headers</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Compare body length at the proxy and at the app</td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Works in test, fails in live</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Test and live secrets are mixed</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">The same Stripe endpoint has a different secret in test and live use, and <code>stripe listen</code> prints its own</td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Secret looks right</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Space or newline around the secret</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Print its length; trim once when loading</td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Digest has the right letters but fails</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Hex versus Base64, or missing <code>sha256=</code> / <code>v0=</code> prefix</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">GitHub and Slack prefix the value; Stripe's <code>v1=</code> value is bare hex</td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Header is <code>undefined</code></td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Name case, or no secret configured</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Header names are case-insensitive; GitHub omits the header when no secret is set</td></tr>
<tr><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Valid signature, request rejected</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Timestamp in milliseconds, or clock drift</td><td style="border:1px solid #334155;padding:0.5rem 0.75rem;vertical-align:top">Stripe and Slack timestamps are Unix seconds</td></tr>
</table></div>

## Sources

- [GitHub: Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries), including the `Hello, World!` test vector
- [GitHub: Webhook events and payloads](https://docs.github.com/en/webhooks/webhook-events-and-payloads) (`X-GitHub-Delivery`)
- [Stripe: Webhooks](https://docs.stripe.com/webhooks) and [Stripe: Resolve webhook signature verification errors](https://docs.stripe.com/webhooks/signature)
- [Slack: Verifying requests from Slack](https://docs.slack.dev/authentication/verifying-requests-from-slack/) and [Slack: Events API](https://docs.slack.dev/apis/events-api/)
- [Node.js: crypto.timingSafeEqual](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)
- [Python: hmac.compare_digest](https://docs.python.org/3/library/hmac.html)

Sources reviewed 2026-10-23. For a documented case where a handler skipped this step, see our write-up of the [OneUptime webhook signature advisory](/blog/cve-2026-33143-webhook-signature-verification-bypass-2026).
