import Link from 'next/link';
import { HASH_GUIDE_VECTOR as v } from '@/lib/tool-guide-examples';
import { Code, CodeBlock, Guide, GuideHeading, GuideTable, P, Sources } from './GuideKit';

const linkClass = 'text-emerald-400 underline hover:text-emerald-300';

export default function HashGeneratorGuide() {
  return (
    <Guide id="hash-guide">
      <GuideHeading>Check a download against the published checksum</GuideHeading>
      <P>
        Pick the file in the checksum box above, choose the algorithm the publisher used, and paste the published value.
        The tool reports a match or a mismatch. Upper and lower case are treated as equal, and the file is read in this
        browser tab. You can paste just the digest, a whole line from the publisher&apos;s SHA256SUMS file, or the entire
        file; with several lines, the one matching the selected file name is used. Files up to 32 MiB are hashed in one
        step; larger files up to 8 GiB are hashed in pieces on this page, which is slower than a command line. Each of
        these prints the same digest, so you can cross-check the page against your own machine:
      </P>
      <CodeBlock
        label="Linux, macOS, Windows"
        code={`# Linux (GNU coreutils)
sha256sum ubuntu.iso

# macOS (also works on most Linux systems)
shasum -a 256 ubuntu.iso

# Windows PowerShell (prints the hash in upper case; -eq ignores case)
(Get-FileHash .\\ubuntu.iso -Algorithm SHA256).Hash

# When the publisher ships a SHA256SUMS file, let sha256sum check every listed file
sha256sum -c SHA256SUMS --ignore-missing`}
      />

      <GuideHeading>A test vector you can reproduce</GuideHeading>
      <P>
        The message <Code>{v.message}</Code> (three bytes) is the one-block message in NIST&apos;s published SHA example values. Type it into
        &quot;Hash text&quot; above, or run <Code>printf abc | sha256sum</Code>. If your digest differs, the input is not
        what you think it is. The classic cause is <Code>echo abc</Code>, which appends a newline and changes the digest
        completely.
      </P>
      <GuideTable
        caption="Digests of the message abc"
        head={['Input', 'Algorithm', 'Digest']}
        rows={[
          [<Code key="a">abc</Code>, 'SHA-256', <Code key="a1"><span className="break-all">{v.sha256}</span></Code>],
          [<Code key="b">abc</Code>, 'SHA-1', <Code key="b1"><span className="break-all">{v.sha1}</span></Code>],
          [<Code key="c">abc</Code>, 'MD5', <Code key="c1"><span className="break-all">{v.md5}</span></Code>],
          [<span key="d">abc plus a newline (<Code>echo abc</Code>)</span>, 'SHA-256', <Code key="d1"><span className="break-all">{v.sha256WithNewline}</span></Code>],
          ['Empty input', 'SHA-256', <Code key="e1"><span className="break-all">{v.sha256Empty}</span></Code>],
        ]}
      />

      <GuideHeading>Which algorithm for which job</GuideHeading>
      <P>
        For detecting a corrupted or changed file, use SHA-256 or SHA-512, both defined in FIPS 180-4. MD5 and SHA-1 still
        detect accidental corruption, but a motivated attacker can build two different files with the same digest:
        RFC 6151 documents the MD5 collision attacks, and researchers published a practical SHA-1 collision in 2017.
        NIST has said it will phase SHA-1 out by 31 December 2030. If a project publishes only MD5 or SHA-1, the
        tool still shows them, but treat a match as a corruption check only.
      </P>

      <GuideHeading>What a matching checksum does not prove</GuideHeading>
      <P>
        A match proves that your file equals whatever the publisher listed. It does not prove the publisher is who you
        think, or that the listed value was not changed. If the checksum sits on the same web page as the download, someone
        who can replace the file can usually replace the checksum too. Get the value over a separate channel, or verify a
        digital signature (for example a GPG or minisign signature over the checksum file), which is the part that ties the
        value to a key you chose to trust.
      </P>

      <GuideHeading>Two things a plain hash is not</GuideHeading>
      <P>
        <strong className="text-slate-200">Not password storage.</strong> SHA-256 is fast on purpose, so an attacker who
        steals a table of fast hashes can test guesses at enormous speed. The OWASP Password Storage Cheat Sheet recommends
        slow, salted algorithms such as Argon2id or bcrypt; our{' '}
        <Link href="/blog/password-security-vulnerabilities-best-practices" className={linkClass}>
          password security article
        </Link>{' '}
        covers the details. The Bcrypt box on this page is for learning and testing.
      </P>
      <P>
        <strong className="text-slate-200">Not a keyed signature.</strong> Anyone can compute a plain hash of a message, so
        it cannot show who sent it. HMAC (RFC 2104) mixes in a secret key: HMAC-SHA256 of{' '}
        <Code>{v.message}</Code> with the key <Code>{v.hmacKey}</Code> is{' '}
        <Code><span className="break-all">{v.hmacSha256}</span></Code>, unrelated to the plain digest above. To compute and
        compare HMACs, for example for webhook signatures, use the{' '}
        <Link href="/tools/webhook-debugger" className={linkClass}>
          webhook signature verifier
        </Link>
        .
      </P>

      <Sources
        links={[
          { href: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final', label: 'NIST FIPS 180-4: Secure Hash Standard (SHA-1, SHA-2)' },
          { href: 'https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines/example-values', label: 'NIST: Example values for cryptographic algorithms' },
          { href: 'https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm', label: 'NIST: SHA-1 retirement announcement (December 2022)' },
          { href: 'https://shattered.io/', label: 'SHAttered: the 2017 practical SHA-1 collision' },
          { href: 'https://www.rfc-editor.org/rfc/rfc6151', label: 'RFC 6151: Updated security considerations for MD5' },
          { href: 'https://www.rfc-editor.org/rfc/rfc2104', label: 'RFC 2104: HMAC' },
          { href: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', label: 'OWASP: Password Storage Cheat Sheet' },
          { href: 'https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash', label: 'Microsoft Learn: Get-FileHash' },
          { href: 'https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html', label: 'GNU coreutils: sha2 utilities (sha256sum)' },
        ]}
      />
    </Guide>
  );
}
