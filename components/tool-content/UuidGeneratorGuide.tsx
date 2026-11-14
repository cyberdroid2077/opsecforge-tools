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
        RFC 9562 (May 2024) obsoletes RFC 4122. This page&apos;s tool generates version 4 and version 7, and its Inspect
        panel can read any version. Version 4 uses{' '}
        <Code>crypto.randomUUID()</Code> when the browser has it and <Code>crypto.getRandomValues()</Code> otherwise;
        version 7 reads the clock with <Code>Date.now()</Code> and takes its random bits from{' '}
        <Code>crypto.getRandomValues()</Code>.
      </P>
      <GuideTable
        caption="UUID versions"
        head={['Version', 'What it is', 'Typical use']}
        rows={[
          ['1', 'Gregorian time-based', 'Legacy time-ordered IDs (inspect only)'],
          ['2', 'DCE Security', 'Layout not defined by RFC 9562 (inspect labels the version only)'],
          ['3', 'Name-based, MD5', 'Stable ID derived from a name (inspect only)'],
          ['4', 'Random or pseudorandom', 'General-purpose unique IDs (generate and inspect)'],
          ['5', 'Name-based, SHA-1', 'Stable ID derived from a name (inspect only)'],
          ['6', 'Reordered Gregorian time-based', 'Sortable replacement for v1 (inspect only)'],
          ['7', 'Unix Epoch time-based', 'Database keys that sort by creation time (generate and inspect)'],
          ['8', 'Custom format', 'Application-defined layouts (inspect labels the version only)'],
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

      <GuideHeading>Reading a version 7 UUID</GuideHeading>
      <P>
        A v7 UUID starts with a 48-bit Unix timestamp in milliseconds, so the first 12 hex digits are the creation time.
        The 13th digit is always <Code>7</Code>, the variant bits are again <Code>10</Code>, and the remaining 74 bits are
        random (RFC 9562 section 5.7). The RFC&apos;s own example, <Code>017f22e2-79b0-7cc3-98c4-dc0c0c07398f</Code>, begins
        with <Code>017f22e279b0</Code>, which is 1645557742000 ms, or 2022-02-22T19:22:22Z. You can paste that number into
        the{' '}
        <a className="text-emerald-400 underline hover:text-emerald-300" href="/tools/unix-timestamp">
          Unix timestamp converter
        </a>{' '}
        to check it, or paste the whole UUID into the{' '}
        <a className="text-emerald-400 underline hover:text-emerald-300" href="#inspect">
          Inspect a UUID
        </a>{' '}
        panel above, which reads the timestamp for you. Selecting v7 in the generator shows the same readout for the first
        ID in each batch.
      </P>
      <P>
        Two consequences follow from the embedded time. IDs created later sort after earlier ones as plain strings, which is
        what makes them friendly to database indexes. And anyone who sees the ID can read when it was created, so do not use
        v7 where the creation time itself is sensitive. When several IDs are generated within the same millisecond, this tool
        increments the 74 random bits by one so the batch stays in order; across separate clicks or machines, order inside
        one millisecond is not guaranteed.
      </P>

      <GuideHeading>Reading a version 1 or version 6 UUID</GuideHeading>
      <P>
        Versions 1 and 6 store a 60-bit count of 100-nanosecond intervals since 1582-10-15 00:00:00 UTC, a 14-bit clock
        sequence and a 48-bit node (RFC 9562 sections 5.1 and 5.6). Version 6 holds the same fields as version 1 but puts
        the timestamp bytes in order from most to least significant, so the IDs sort by time. The node was traditionally a
        network card&apos;s MAC address. Section 8 says MAC addresses pose privacy risks and should not be used in a UUID,
        and section 6.10 describes a random node instead, with the lowest bit of its first octet set to 1. That is the
        multicast bit, which network card addresses never have.
      </P>
      <P>
        The RFC&apos;s appendix A.1 example is <Code>C232AB00-9414-11EC-B3C8-9F6BDECED846</Code>. The Inspect panel reads it
        as version 1, time 2022-02-22T19:22:22.000Z (1645557742000 ms), clock sequence 13256 (<Code>0x33C8</Code>) and node{' '}
        <Code>9f:6b:de:ce:d8:46</Code>. The first octet, <Code>9f</Code>, has the multicast bit set, so this node is
        random rather than a card address. The A.5 v6 vector, <Code>1EC9414C-232A-6B00-B3C8-9F6BDECED846</Code>, gives the
        same time, clock sequence and node. If the bit is 0, the node could be a real MAC address, which the UUID alone
        cannot confirm.
      </P>

      <GuideHeading>Using UUIDs as database keys</GuideHeading>
      <P>
        RFC 9562 notes that random UUIDs such as v4 have poor index locality, because new rows land at random positions in a
        B-tree, and that time-ordered v6 and v7 keep new values near each other. If insert performance on a large table
        matters, consider v7. Common runtimes generate it too:
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
          {
            q: 'Can I tell when a UUID was created?',
            a: 'Only for some versions. Versions 1, 6 and 7 embed a timestamp that anyone holding the ID can decode. Version 4 is random, and versions 3 and 5 are hashes of a namespace and a name, so none of those carry a creation time. Paste an ID into the Inspect panel to see which case it is.',
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
