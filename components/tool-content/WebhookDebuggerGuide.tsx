import {
  WEBHOOK_GITHUB_VECTOR as github,
  WEBHOOK_REFORMAT_EXAMPLE as reformat,
  WEBHOOK_STRIPE_EXAMPLE as stripe,
} from '@/lib/tool-guide-examples';
import { Code, CodeBlock, Guide, GuideHeading, GuideTable, P, Sources } from './GuideKit';

export default function WebhookDebuggerGuide() {
  return (
    <Guide id="webhook-guide">
      <GuideHeading>Reproduce GitHub&apos;s official test vector</GuideHeading>
      <P>
        GitHub publishes a secret, a payload and the signature that HMAC-SHA256 must produce for them. Click{' '}
        <strong className="text-slate-200">Load GitHub test vector</strong>{' '}
        above, or enter the values yourself with the
        GitHub provider selected, then press Verify. The result should read &quot;Supplied GitHub values match&quot;.
      </P>
      <GuideTable
        caption="GitHub test vector"
        head={['Field', 'Value']}
        rows={[
          ['Signing secret', <Code key="s">{github.secret}</Code>],
          ['Raw body (13 bytes, no newline)', <Code key="p">{github.payload}</Code>],
          ['X-Hub-Signature-256', <Code key="h"><span className="break-all">{github.header}</span></Code>],
        ]}
      />
      <P>
        Now change one thing. Make the body <Code>Hello, World?</Code>, add a newline after the exclamation mark, or change a
        letter of the secret, and the check reports a mismatch. HMAC offers no partial match: one different byte gives an
        unrelated digest.
      </P>

      <GuideHeading>Why the right secret still fails</GuideHeading>
      <P>
        The most common cause is that the bytes you verify are not the bytes the sender signed. Take the body{' '}
        <Code>{reformat.original}</Code> signed with the synthetic secret <Code>{reformat.secret}</Code>. Choose Generic
        HMAC, HMAC-SHA256, and paste the first digest below as the expected value. Only the original body matches:
      </P>
      <GuideTable
        caption="HMAC-SHA256 of three versions of the same body"
        head={['Body', 'Digest']}
        rows={[
          [<Code key="a">{reformat.original}</Code>, <Code key="ad"><span className="break-all">{reformat.originalDigest}</span></Code>],
          [<span key="b">After <Code>JSON.stringify(JSON.parse(body))</Code>: <Code>{reformat.reserialized}</Code></span>, <Code key="bd"><span className="break-all">{reformat.reserializedDigest}</span></Code>],
          ['Original plus a trailing newline', <Code key="cd"><span className="break-all">{reformat.trailingNewlineDigest}</span></Code>],
        ]}
      />
      <GuideTable
        caption="Troubleshooting checklist"
        head={['Symptom', 'Likely cause', 'What to check']}
        rows={[
          ['Mismatch on every request', 'Body was parsed and re-serialized, or decoded by middleware', 'Capture the raw bytes before any JSON parser runs. Stripe states that any manipulation of the raw body makes verification fail.'],
          ['Mismatch on some requests', 'Non-ASCII characters or line endings changed', 'Treat the payload as UTF-8 bytes end to end; GitHub notes payloads can contain Unicode.'],
          ['GitHub header rejected', 'Missing prefix or legacy header', 'Use the full sha256=… value from X-Hub-Signature-256, not the older SHA-1 X-Hub-Signature.'],
          ['Stripe signature matches but is flagged', 'Timestamp outside tolerance', 'Stripe libraries default to 5 minutes; check the server clock with NTP and never set the tolerance to 0.'],
          ['Stripe never matches', 'Wrong secret', 'Use the signing secret (starts with whsec_) of the endpoint that received the event; Stripe generates a different one for each endpoint. It is not an API key.'],
        ]}
      />

      <GuideHeading>A Stripe-style header to try</GuideHeading>
      <P>
        Stripe signs <Code>timestamp.rawBody</Code> with HMAC-SHA256 and sends it in{' '}
        <Code>Stripe-Signature</Code> as <Code>t=…,v1=…</Code>. This synthetic example uses the secret{' '}
        <Code>{stripe.secret}</Code> and the body <Code>{stripe.payload}</Code>. Select Stripe and paste:
      </P>
      <CodeBlock label="Stripe-Signature (synthetic)" code={stripe.header} />
      <P>
        Because the timestamp is from November 2023 and the check uses your device clock, the tool answers
        &quot;Signature matches, timestamp outside tolerance&quot;. That confirms the HMAC while still rejecting a stale
        request. The tool also checks every <Code>v1</Code> value, which matters while a secret is being rotated.
      </P>

      <GuideHeading>Verify in your own code</GuideHeading>
      <CodeBlock
        label="Node.js"
        code={`const crypto = require('node:crypto');

function verifyGitHub(rawBody, signatureHeader, secret) {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// verifyGitHub(Buffer.from('Hello, World!'), header, "It's a Secret to Everybody") -> true`}
      />
      <CodeBlock
        label="Python"
        code={`import hmac, hashlib

def verify_github(raw_body: bytes, signature_header: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header)
# verify_github(b"Hello, World!", header, "It's a Secret to Everybody") -> True`}
      />
      <P>
        Both functions return false for the body with a trailing newline. They use constant-time comparison, as GitHub
        recommends, rather than <Code>==</Code>. For Stripe in production, prefer its official libraries, which also handle
        the timestamp tolerance.
      </P>

      <Sources
        links={[
          { href: 'https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries', label: 'GitHub Docs: Validating webhook deliveries (includes the test vector)' },
          { href: 'https://docs.stripe.com/webhooks#verify-manually', label: 'Stripe Docs: Verify webhook signatures' },
        ]}
      />
    </Guide>
  );
}
