import { UUID_GUIDE_EXAMPLE as ex } from '@/lib/tool-guide-examples';
import { Code, CodeBlock, Faq, Guide, GuideHeading, GuideTable, P, Sources } from './GuideKit';

export default function UuidGeneratorGuide() {
  return (
    <Guide id="uuid-guide">
      <GuideHeading>Reading a version 4 UUID</GuideHeading>
      <P>
        A UUID is 128 bits written as five hyphen-separated hex groups. In a version 4 UUID the first digit of the third
        group is always <Code>4</Code>, and the first digit of the fourth group is one of <Code>8</Code>, <Code>9</Code>,{' '}
        <Code>a</Code> or <Code>b</Code> (the variant bits <Code>10</Code>). The other 122 bits are random, as RFC 9562
        section 5.4 defines.
      </P>
      <P>
        You can verify the bit handling by hand. Take the 16 bytes <Code>00 01 02 … 0f</Code>. Byte 6 (<Code>06</Code>)
        keeps its low nibble and gets version 4 in the high nibble, giving <Code>46</Code>. Byte 8 (<Code>08</Code>) keeps its
        low six bits and gets <Code>10</Code> in the top two, giving <Code>88</Code>. The result is{' '}
        <Code>{ex.uuid}</Code>, which is what this tool&apos;s formatter returns for those bytes. Python agrees:
      </P>
      <CodeBlock
        label="Python cross-check"
        code={`import uuid
uuid.UUID(bytes=bytes(range(16)), version=4)
# UUID('${ex.uuid}')`}
      />

      <GuideHeading>Versions defined in RFC 9562</GuideHeading>
      <P>
        RFC 9562 (May 2024) obsoletes RFC 4122. This page&apos;s tool generates version 4 only, using{' '}
        <Code>crypto.randomUUID()</Code> when the browser has it and <Code>crypto.getRandomValues()</Code> otherwise.
      </P>
      <GuideTable
        caption="UUID versions"
        head={['Version', 'What it is', 'Typical use']}
        rows={[
          ['1', 'Gregorian time-based', 'Legacy time-ordered IDs'],
          ['3', 'Name-based, MD5', 'Stable ID derived from a name'],
          ['4', 'Random or pseudorandom', 'General-purpose unique IDs (this tool)'],
          ['5', 'Name-based, SHA-1', 'Stable ID derived from a name'],
          ['6', 'Reordered Gregorian time-based', 'Sortable replacement for v1'],
          ['7', 'Unix Epoch time-based', 'Database keys that sort by creation time'],
          ['8', 'Custom format', 'Application-defined layouts'],
        ]}
      />

      <GuideHeading>Collisions, and what a UUID is not</GuideHeading>
      <P>
        With 122 random bits, the chance of any collision among n identifiers is roughly n² / 2<sup>123</sup>. For one
        billion UUIDs that is about {ex.collisionAfterOneBillion}; reaching even odds takes around {ex.fiftyPercentAfter}{' '}
        UUIDs. This holds only if the random source is sound. RFC 9562 section 8 is explicit that implementations should
        not assume UUIDs are hard to guess and must not use them as security capabilities, meaning an ID whose mere
        possession grants access. Use a dedicated token generator for session or reset links.
      </P>

      <GuideHeading>Using UUIDs as database keys</GuideHeading>
      <P>
        RFC 9562 notes that random UUIDs such as v4 have poor index locality, because new rows land at random positions in a
        B-tree, and that time-ordered v6 and v7 keep new values near each other. If insert performance on a large table
        matters, consider v7. This tool does not generate it, but common runtimes do:
      </P>
      <CodeBlock
        label="Version 4 and version 7"
        code={`// JavaScript (browser and Node.js)
crypto.randomUUID()                // v4

# Python
import uuid
uuid.uuid4()                       # v4
uuid.uuid7()                       # v7, Python 3.14+

-- PostgreSQL 18+
SELECT gen_random_uuid(), uuidv7();`}
      />

      <GuideHeading>Questions</GuideHeading>
      <Faq
        items={[
          {
            q: 'Is a GUID different from a UUID?',
            a: 'No. RFC 9562 treats GUID as another name for the same 128-bit identifier.',
          },
          {
            q: 'Do the uppercase and no-hyphen options change the value?',
            a: 'Not the underlying 128 bits. RFC 9562 allows uppercase, lowercase or mixed-case hex, but the hyphenated form is the standard text representation, so check what the receiving system expects before stripping hyphens.',
          },
        ]}
      />

      <Sources
        links={[
          { href: 'https://www.rfc-editor.org/rfc/rfc9562', label: 'RFC 9562: Universally Unique IDentifiers (UUIDs)' },
          { href: 'https://www.postgresql.org/docs/current/functions-uuid.html', label: 'PostgreSQL documentation: UUID functions' },
          { href: 'https://docs.python.org/3/library/uuid.html', label: 'Python documentation: uuid' },
          { href: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID', label: 'MDN: Crypto.randomUUID()' },
        ]}
      />
    </Guide>
  );
}
