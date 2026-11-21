import {
  BASE64_BASIC_AUTH,
  BASE64_GUIDE_ROWS,
  BASE64_JWT_HEADER,
  BASE64_K8S_SECRET_EXAMPLE,
  BASE64_PNG_EXAMPLE,
  BASE64_SIGNATURE_ROWS,
} from '@/lib/tool-guide-examples';
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
          [<Code key="5">/w==</Code>, 'Standard', 'Not UTF-8 text; hex view: ff', 'The byte FF is not text, so the tool shows the bytes as hex. Use Save in the Decoded bytes panel to write them to a file.'],
          [<Code key="6">SGVsbG8</Code>, 'Standard', 'Hello', 'Missing padding is accepted; whitespace and line breaks are ignored.'],
        ]}
      />

      <GuideHeading>Input check, hex view, and variant conversion</GuideHeading>
      <P>
        In Decode mode the Input check panel reports which alphabet the string uses (standard, URL-safe, ambiguous when it
        only has characters both share, or invalid when it mixes <Code>+ /</Code> with <Code>- _</Code>), whether padding is
        present, correct, or missing, the length modulo 4, the first invalid character and its position, how much whitespace
        was ignored, and the decoded size in bytes. If the detected variant differs from the selected one, a button offers to
        switch; the tool never switches on its own. When the decoded bytes are not valid UTF-8, the tool says so and shows
        them as lowercase hex, capped at 4096 bytes with a note when the output is cut short. The Convert Standard ⇄ URL-safe
        section swaps the alphabet and adds or removes <Code>=</Code> without decoding anything.
      </P>
      <P>
        Worked example: the four bytes <Code>fb ff bf 3e</Code> are <Code>+/+/Pg==</Code> in standard Base64 and{' '}
        <Code>-_-_Pg</Code> as unpadded Base64URL. Paste <Code>-_-_Pg</Code> in Decode mode with Standard selected and the
        check reports URL-safe, padding missing, 4 bytes; after you switch to Base64URL the hex view shows{' '}
        <Code>fb ff bf 3e</Code>. In the conversion section, <Code>-_-_Pg</Code> to Standard with padding on gives{' '}
        <Code>+/+/Pg==</Code>. The check and hex view describe the characters and bytes only; they do not show that a value
        is authentic, and a JWT segment decoded here is not a verified token.
      </P>

      <GuideHeading>Decode Base64 to a file, or encode a file</GuideHeading>
      <P>
        Whenever a decode succeeds, the Decoded bytes panel shows the size and a Save button that writes the exact bytes
        to a file from this page: <Code>decoded.txt</Code> for UTF-8 text, <Code>decoded.bin</Code> for other data, or
        the matching extension when the data starts with a file signature from the table below. PNG, JPEG, GIF, and WebP
        data of up to 2 MiB is also shown as an image. You can paste a whole <Code>data:</Code> URL; RFC 2397 defines the
        form as <Code>data:[&lt;mediatype&gt;][;base64],&lt;data&gt;</Code>, and the tool skips everything up to the
        comma and decodes the rest. In the other direction, Encode a file reads a local file of up to 5 MiB and returns
        its Base64, Base64URL, or a ready-to-paste <Code>data:</Code> URL.
      </P>
      <P>
        To try it, switch to Decode and paste this {BASE64_PNG_EXAMPLE.bytes}-byte, one-pixel PNG. The panel reports the
        PNG signature, previews the pixel, and offers <Code>decoded.png</Code>:
      </P>
      <CodeBlock label="A complete 1×1 PNG" code={BASE64_PNG_EXAMPLE.encoded} />
      <P>
        Because Base64 maps bytes to characters in fixed groups, a file format that starts with fixed bytes always starts
        with the same Base64 characters. That is enough to tell what an unlabeled blob in a config file or API response
        probably is before you decode it:
      </P>
      <GuideTable
        caption="File signatures and the Base64 text they produce"
        head={['Data', 'First bytes (hex)', 'Base64 starts with']}
        rows={BASE64_SIGNATURE_ROWS.map((row) => [
          row.type,
          <Code key={`h-${row.type}`}>{row.hex}</Code>,
          <Code key={`p-${row.type}`}>{row.prefix}</Code>,
        ])}
      />
      <P>
        A signature match describes only the first bytes. The tool does not parse or validate the rest of the file, and a
        saved file deserves the same caution as any download from the source that gave you the string. In Base64URL the
        JPEG prefix is <Code>_9j_</Code>; the other prefixes in the table contain no <Code>+</Code> or <Code>/</Code>{' '}
        and are the same in both variants.
      </P>

      <GuideHeading>Decoding a Kubernetes Secret value</GuideHeading>
      <P>
        Values under <Code>data:</Code> in a Kubernetes Secret manifest are standard Base64. The Kubernetes documentation
        says the encoding &quot;obscures them but does NOT provide any useful level of confidentiality&quot;. Its own
        example value <Code>{BASE64_K8S_SECRET_EXAMPLE.encoded}</Code> decodes here, or with any of the commands below,
        to <Code>{BASE64_K8S_SECRET_EXAMPLE.decoded}</Code>.
      </P>
      <CodeBlock
        label="kubectl, yq, and base64"
        code={`kubectl get secret db-user-pass -o jsonpath='{.data.password}' | base64 --decode
yq '.data.password | @base64d' secret.yaml          # yq v4; treats the result as a string
base64 --decode cert.b64 > cert.der                 # binary values: write to a file instead`}
      />
      <P>
        When you create a value by hand, <Code>echo admin | base64</Code> encodes the trailing newline as well and gives{' '}
        <Code>{BASE64_K8S_SECRET_EXAMPLE.withNewline}</Code>; <Code>printf admin | base64</Code> gives{' '}
        <Code>{BASE64_K8S_SECRET_EXAMPLE.withoutNewline}</Code>. If a decoded credential is one byte longer than you
        expect, compare the Decoded size in the Input check with the length of the value you meant to store. Pasting a
        production secret into any web page is a decision for your own policy; this page decodes in the browser tab and
        does not send the input to a tool backend, but the commands above keep it in your terminal.
      </P>

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
# GNU base64 wraps output at 76 characters; add -w0 to keep one line
base64 -w0 logo.png > logo.b64          # encode a file (GNU coreutils)
base64 --decode logo.b64 > logo.png     # decode back to a file`}
      />

      <Faq
        items={[
          {
            q: 'Why are my encoded strings longer than the input?',
            a: 'Four output characters carry three input bytes, so Base64 text is about a third larger than the data, plus any padding.',
          },
          {
            q: 'How do I convert Base64 back to a file or image?',
            a: 'Switch to Decode, paste the Base64 string or the whole data: URL, and use the Save button in the Decoded bytes panel. The page names the file by its signature (for example decoded.png or decoded.pdf) and previews PNG, JPEG, GIF, and WebP images. On the command line, base64 --decode input.b64 > output.bin does the same.',
          },
        ]}
      />

      <Sources
        links={[
          { href: 'https://www.rfc-editor.org/rfc/rfc4648', label: 'RFC 4648: The Base16, Base32, and Base64 Data Encodings' },
          { href: 'https://www.rfc-editor.org/rfc/rfc7515#section-2', label: 'RFC 7515 (JWS): base64url encoding without padding' },
          { href: 'https://www.rfc-editor.org/rfc/rfc7617', label: 'RFC 7617: The Basic HTTP Authentication Scheme' },
          { href: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa', label: 'MDN: Window.btoa()' },
          { href: 'https://www.rfc-editor.org/rfc/rfc2397', label: 'RFC 2397: The "data" URL scheme' },
          { href: 'https://www.w3.org/TR/png-3/#5PNG-file-signature', label: 'W3C PNG Specification: PNG signature' },
          { href: 'https://www.w3.org/Graphics/JPEG/itu-t81.pdf', label: 'ITU-T T.81 (JPEG): marker codes, SOI' },
          { href: 'https://www.w3.org/Graphics/GIF/spec-gif89a.txt', label: 'GIF89a Specification: header signature and version' },
          { href: 'https://www.rfc-editor.org/rfc/rfc8118', label: 'RFC 8118: The application/pdf Media Type (magic number)' },
          { href: 'https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT', label: 'PKWARE APPNOTE: ZIP local file header signature' },
          { href: 'https://www.rfc-editor.org/rfc/rfc1952', label: 'RFC 1952: GZIP file format (ID1, ID2, CM)' },
          { href: 'https://kubernetes.io/docs/concepts/configuration/secret/', label: 'Kubernetes: Secrets' },
          {
            href: 'https://kubernetes.io/docs/tasks/configmap-secret/managing-secret-using-kubectl/',
            label: 'Kubernetes: Managing Secrets using kubectl (decode example)',
          },
          { href: 'https://mikefarah.gitbook.io/yq/operators/encode-decode', label: 'yq: Encode / Decode operators (@base64d)' },
        ]}
      />
    </Guide>
  );
}
