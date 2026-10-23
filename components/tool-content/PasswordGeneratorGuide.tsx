import { PASSWORD_GUIDE_ROWS, PASSWORD_POLICY_EXAMPLE as policy } from '@/lib/tool-guide-examples';
import { Code, CodeBlock, Faq, Guide, GuideHeading, GuideTable, P, Sources } from './GuideKit';

export default function PasswordGeneratorGuide() {
  return (
    <Guide id="password-guide">
      <GuideHeading>How the strength estimate is calculated</GuideHeading>
      <P>
        For a password drawn uniformly at random, entropy in bits is the length times log<sub>2</sub> of the number of
        possible characters. With all four sets ticked the pool is 26 + 26 + 10 + 8 = 70 symbols (the symbols are{' '}
        <Code>!@#$%^&amp;*</Code>), so 16 characters give 16 × log<sub>2</sub>(70) = 16 × 6.129 = 98.07 bits. The figure under
        the strength label uses the same formula, so you can check it with a calculator.
      </P>
      <GuideTable
        caption="Entropy by length and character set"
        head={['Setting', 'Pool size', 'Entropy (bits)']}
        rows={PASSWORD_GUIDE_ROWS.map((row) => [row.label, row.poolSize, <Code key={row.label}>{row.bits}</Code>])}
      />
      <P>
        Treat the number as an upper bound. It applies only to characters picked at random, not to a password you typed or
        edited, and it says nothing about where the password is stored or reused. The Weak, Fair, Strong and Very strong
        bands (under 50, 50–79, 80–111, 112 and above) are this tool&apos;s own thresholds, not a published standard.
      </P>

      <GuideHeading>What the generator does</GuideHeading>
      <P>
        Randomness comes from <Code>crypto.getRandomValues</Code>, the browser&apos;s cryptographic random number generator,
        not <Code>Math.random</Code>. Turning a 32-bit draw into an index with a plain <Code>value % 70</Code> would make the
        first 46 characters very slightly more likely, because 2<sup>32</sup> is not a multiple of 70 (the skew is about one
        part in 61 million). The tool avoids it by redrawing any value at or above the largest multiple of the pool size
        below 2<sup>32</sup>:
      </P>
      <CodeBlock
        label="Unbiased index (rejection sampling)"
        code={`const limit = Math.floor(2 ** 32 / max) * max;
do { crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
return buffer[0] % max;`}
      />
      <P>
        Each ticked set contributes at least one character, then the rest are drawn from the merged pool and the result is
        shuffled. That rule excludes strings that miss a set, so the true ceiling is a little lower than the formula: for 16
        characters it is {policy.policyBits} bits instead of {policy.formulaBits}. The point is only that the number on the page
        is an estimate, not an exact figure.
      </P>

      <GuideHeading>What NIST SP 800-63B-4 asks for</GuideHeading>
      <P>
        The current NIST password rules tell verifiers to require at least 15 characters when a password is the only
        authentication factor (8 if it is used only alongside another factor), to allow at least 64, and not to impose
        composition rules such as mixing character types. In practice: choose length over complexity, make each password
        unique, and keep them in a password manager. The character-set boxes are here because some sites still demand them.
      </P>

      <GuideHeading>The same thing in other languages</GuideHeading>
      <CodeBlock
        label="Python (secrets)"
        code={`import secrets, string
alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
"".join(secrets.choice(alphabet) for _ in range(16))`}
      />
      <CodeBlock
        label="Node.js (crypto.randomInt avoids modulo bias)"
        code={`import { randomInt } from 'node:crypto';
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]).join('');`}
      />

      <GuideHeading>Questions</GuideHeading>
      <Faq
        items={[
          {
            q: 'Is the password sent anywhere?',
            a: 'It is generated in this page and the tool does not transmit it. The page itself still loads normal site resources and aggregate analytics, which never include the generated value.',
          },
        ]}
      />

      <Sources
        links={[
          { href: 'https://pages.nist.gov/800-63-4/sp800-63b.html', label: 'NIST SP 800-63B-4: Digital Identity Guidelines, Authentication and Authenticator Management' },
          { href: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues', label: 'MDN: Crypto.getRandomValues()' },
          { href: 'https://docs.python.org/3/library/secrets.html', label: 'Python documentation: secrets' },
          { href: 'https://nodejs.org/api/crypto.html#cryptorandomintmin-max-callback', label: 'Node.js documentation: crypto.randomInt()' },
        ]}
      />
    </Guide>
  );
}
