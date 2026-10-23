import { BASE64_BASIC_AUTH, BASE64_GUIDE_ROWS, BASE64_JWT_HEADER } from '@/lib/tool-guide-examples';
import { Code, CodeBlock, Faq, Guide, GuideHeading, GuideTable, P, Sources } from './GuideKit';

export default function Base64ConverterGuide() {
  return (
    <Guide id="base64-guide">
      <GuideHeading>Encoding examples you can check</GuideHeading>
      <P>
        Base64 turns every 3 bytes into 4 characters. A final group of 2 bytes is padded with one <Code>=</Code>, and a
        group of 1 byte with two, which is why <Code>a</Code> becomes <Code>YQ==</Code>. Base64URL replaces{' '}
        <Code>+</Code> and <Code>/</Code> with <Code>-</Code> and <Code>_</Code>; this tool also drops the padding in that mode.
        Paste any input below into Encode mode to reproduce the row.
      </P>
      <GuideTable
        caption="Base64 and Base64URL outputs"
        head={['Input text', 'Standard Base64', 'Base64URL']}
        rows={BASE64_GUIDE_ROWS.map((row) => [
          <Code key={`i-${row.input}`}>{row.input}</Code>,
          <Code key={`s-${row.input}`}>{row.standard}</Code>,
          <Code key={`u-${row.input}`}>{row.url}</Code>,
        ])}
      />

      <GuideHeading>Text is encoded as UTF-8</GuideHeading>
      <P>
        The tool converts text to UTF-8 bytes first, so <Code>é</Code> is the two bytes <Code>C3 A9</Code> and{' '}
        <Code>héllo</Code> encodes to <Code>aMOpbGxv</Code>. The browser&apos;s bare <Code>btoa()</Code> works on Latin-1
        characters instead: <Code>btoa(&quot;é&quot;)</Code> returns <Code>6Q==</Code> (one byte, <Code>E9</Code>), and{' '}
        <Code>btoa(&quot;€&quot;)</Code> throws <Code>InvalidCharacterError</Code>. If two systems disagree on the same string,
        compare the bytes they encoded.
      </P>

      <GuideHeading>Two places you meet Base64 every day</GuideHeading>
      <P>
        A JWT header is Base64URL without padding. Decode <Code>{BASE64_JWT_HEADER.encoded}</Code> in Base64URL mode and you
        get <Code>{BASE64_JWT_HEADER.decoded}</Code>. HTTP Basic authentication Base64-encodes <Code>user:password</Code>:
        RFC 7617&apos;s example <Code>{BASE64_BASIC_AUTH.credentials}</Code> becomes{' '}
        <Code>Authorization: Basic {BASE64_BASIC_AUTH.encoded}</Code>. Base64 is a transport encoding, not encryption; anyone
        who sees the header can decode it.
      </P>

      <GuideHeading>When decoding fails</GuideHeading>
      <GuideTable
        caption="Decode errors"
        head={['Input', 'Mode', 'Result', 'Fix']}
        rows={[
          [<Code key="1">SGVsbG8==</Code>, 'Standard', 'Invalid Base64 input.', 'Seven characters need exactly one =; remove the extra one.'],
          [<Code key="2">SGVsb</Code>, 'Standard', 'Invalid Base64 input.', 'A length of 1 mod 4 cannot occur in valid Base64; the string was cut off.'],
          [<Code key="3">PDw_Pz8-Pg</Code>, 'Standard', 'Invalid Base64 input.', 'It contains - and _, so it is Base64URL; switch the variant.'],
          [<Code key="4">PDw/Pz8+Pg==</Code>, 'Base64URL', 'Invalid Base64URL input.', 'It contains + and /; use the Standard variant.'],
          [<Code key="5">/w==</Code>, 'Standard', 'Decoded bytes are not valid UTF-8 text.', 'The byte FF is not text. Binary data (images, keys) should be decoded to a file instead.'],
          [<Code key="6">SGVsbG8</Code>, 'Standard', 'Hello', 'Missing padding is accepted; whitespace and line breaks are ignored.'],
        ]}
      />

      <GuideHeading>The same conversion in code</GuideHeading>
      <CodeBlock
        label="JavaScript (UTF-8 safe)"
        code={`btoa(String.fromCharCode(...new TextEncoder().encode('héllo')))   // 'aMOpbGxv'
Buffer.from('<<???>>').toString('base64url')                       // 'PDw_Pz8-Pg' (Node.js)`}
      />
      <CodeBlock
        label="Python"
        code={`import base64
base64.b64encode('héllo'.encode()).decode()                  # 'aMOpbGxv'
base64.urlsafe_b64encode(b'<<???>>').rstrip(b'=').decode()   # 'PDw_Pz8-Pg'`}
      />
      <CodeBlock
        label="Shell"
        code={`printf 'Hello, World!' | base64        # SGVsbG8sIFdvcmxkIQ==
# GNU base64 wraps output at 76 characters; add -w0 to keep one line`}
      />

      <Faq
        items={[
          {
            q: 'Why are my encoded strings longer than the input?',
            a: 'Four output characters carry three input bytes, so Base64 text is about a third larger than the data, plus any padding.',
          },
        ]}
      />

      <Sources
        links={[
          { href: 'https://www.rfc-editor.org/rfc/rfc4648', label: 'RFC 4648: The Base16, Base32, and Base64 Data Encodings' },
          { href: 'https://www.rfc-editor.org/rfc/rfc7515#section-2', label: 'RFC 7515 (JWS): base64url encoding without padding' },
          { href: 'https://www.rfc-editor.org/rfc/rfc7617', label: 'RFC 7617: The Basic HTTP Authentication Scheme' },
          { href: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa', label: 'MDN: Window.btoa()' },
        ]}
      />
    </Guide>
  );
}
