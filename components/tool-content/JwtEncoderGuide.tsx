import { JWT_ENCODER_GUIDE as ex } from '@/lib/tool-guide-examples';
import { Code, CodeBlock, Guide, GuideHeading, GuideTable, P, Sources } from './GuideKit';

const linkClass = 'text-emerald-400 underline hover:text-emerald-300';

export default function JwtEncoderGuide() {
  return (
    <Guide id="jwt-encoder-guide">
      <GuideHeading>When a hand-built token is the right tool</GuideHeading>
      <P>
        A verifier is only trustworthy if you have seen it say no. Real tokens are hard to produce in a bad state, so you
        build them: one whose <Code>exp</Code> is in the past, one whose <Code>nbf</Code> is in the future, one with the
        wrong <Code>aud</Code> or <Code>iss</Code>, one signed with the wrong key, and one signed with HS256 sent to an
        endpoint that expects an asymmetric algorithm. That last case is the algorithm-confusion test described in RFC 8725:
        a verifier must accept only the algorithms it expects, not whatever the token header names. This tool signs only
        HS256 and HS512 and always writes the algorithm you selected into the header, so it cannot make an{' '}
        <Code>alg: none</Code> token. Each of the other cases takes one edit of the payload shown below.
      </P>

      <GuideHeading>A token you can reproduce</GuideHeading>
      <P>
        Use the default header, paste this payload, set the algorithm to HS256 and use the synthetic secret below. The
        output must be byte for byte the token shown. If it is not, a field differs; JSON key order and whitespace matter
        because they change the signed bytes.
      </P>
      <GuideTable
        caption="Inputs and output for the reproducible token"
        head={['Field', 'Value']}
        rows={[
          ['Secret (32 bytes, synthetic)', <Code key="s">{ex.secret}</Code>],
          ['Header', <Code key="h">{ex.header}</Code>],
          ['Payload', <Code key="p"><span className="break-all">{ex.payload}</span></Code>],
          ['Token', <Code key="t"><span className="break-all">{ex.token}</span></Code>],
        ]}
      />
      <P>Check the signature outside the browser. Both commands print <Code>{ex.signature}</Code>:</P>
      <CodeBlock
        label="Bash with OpenSSL and GNU coreutils 8.31+ (basenc), and Node.js"
        code={`TOKEN='${ex.token}'

printf '%s' "\${TOKEN%.*}" \\
  | openssl dgst -sha256 -hmac '${ex.secret}' -binary \\
  | basenc --base64url | tr -d '='

node -e "const c=require('node:crypto');
const t=process.argv[1], i=t.slice(0,t.lastIndexOf('.'));
console.log(c.createHmac('sha256','${ex.secret}').update(i).digest('base64url'))" "$TOKEN"`}
      />

      <GuideHeading>Claims: seconds, not milliseconds</GuideHeading>
      <P>
        RFC 7519 defines <Code>exp</Code>, <Code>nbf</Code> and <Code>iat</Code> as NumericDate values: seconds since
        1970-01-01T00:00:00Z UTC, not milliseconds. The sample uses <Code>iat</Code> and <Code>nbf</Code> {ex.iat} ({ex.iatUtc})
        and <Code>exp</Code> {ex.exp} ({ex.expUtc}), a one-hour lifetime. In JavaScript, write{' '}
        <Code>Math.floor(Date.now() / 1000)</Code>; a raw <Code>Date.now()</Code> is a thousand times too large.
      </P>
      <GuideTable
        caption="Registered time claims and what a verifier should do"
        head={['Claim', 'To test rejection', 'Rule (RFC 7519)']}
        rows={[
          [<Code key="e">exp</Code>, 'Set it to a past second, such as 1699999999', 'The current time must be before exp (section 4.1.4)'],
          [<Code key="n">nbf</Code>, 'Set it to a future second', 'The current time must be at or after nbf (section 4.1.5)'],
          [<Code key="i">iat</Code>, 'Set it far in the future', 'Informational; apply your own age limit (section 4.1.6)'],
        ]}
      />
      <P>
        RFC 7519 allows a small leeway for clock skew; if your verifier has one, test just outside it, not far outside.
      </P>

      <GuideHeading>Key length for HS256</GuideHeading>
      <P>
        RFC 7518 section 3.2 says a key at least as large as the hash output must be used with HS256, which means 256 bits
        (32 bytes) or more. This encoder only requires a non-empty secret, so it will sign with a short one; do not read
        that as approval. Use at least 32 random bytes whenever you are testing a verifier&apos;s key handling, and
        &quot;Generate Test Secret&quot; fills a throwaway value.
      </P>

      <GuideHeading>Encoded is not encrypted</GuideHeading>
      <P>
        The first two segments are Base64URL-encoded JSON. Anyone holding the token can read them, with no key; the secret
        only lets a verifier detect changes. Do not put passwords, personal data or anything confidential in a payload. To
        see this, paste the token into the{' '}
        <a className={linkClass} href="/tools/jwt-decoder">JWT decoder</a>, which reads claims without verifying the
        signature. Our{' '}
        <a className={linkClass} href="/blog/jwt-token-vulnerabilities-authentication-security">JWT vulnerabilities article</a>{' '}
        covers the common implementation mistakes.
      </P>

      <GuideHeading>Use synthetic values only</GuideHeading>
      <P>
        Signing happens in this page, but a production signing key pasted into any web form can be exposed to browser
        extensions, screen shares or clipboard history. If a key has been pasted anywhere it should not be, rotate it. Create
        invented claims and a throwaway secret, and point them at a test environment.
      </P>

      <Sources
        links={[
          { href: 'https://www.rfc-editor.org/rfc/rfc7519', label: 'RFC 7519: JSON Web Token (NumericDate, exp, nbf, iat)' },
          { href: 'https://www.rfc-editor.org/rfc/rfc7518', label: 'RFC 7518: JSON Web Algorithms (HS256 key length, section 3.2)' },
          { href: 'https://www.rfc-editor.org/rfc/rfc7515', label: 'RFC 7515: JSON Web Signature (compact serialization)' },
          { href: 'https://www.rfc-editor.org/rfc/rfc8725', label: 'RFC 8725: JWT Best Current Practices (algorithm verification)' },
        ]}
      />
    </Guide>
  );
}
