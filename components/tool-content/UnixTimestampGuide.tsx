import { UNIX_GUIDE_EXAMPLE as ex } from '@/lib/tool-guide-examples';
import { Code, CodeBlock, Faq, Guide, GuideHeading, GuideTable, P, Sources } from './GuideKit';

export default function UnixTimestampGuide() {
  return (
    <Guide id="timestamp-guide">
      <GuideHeading>Seconds or milliseconds: which one do you have?</GuideHeading>
      <P>
        A Unix timestamp counts time from 1970-01-01 00:00:00 UTC. POSIX defines &quot;seconds since the Epoch&quot; as a
        value that approximates elapsed seconds and treats every day as exactly 86,400 seconds, so leap seconds are not
        counted. JavaScript&apos;s <Code>Date</Code> counts milliseconds; most Unix tools and many APIs count seconds. For
        dates near the present you can tell them apart by length:
      </P>
      <GuideTable
        caption="Timestamp length and unit"
        head={['Digits', 'Unit', 'Example', 'What to do in this tool']}
        rows={[
          ['10', 'seconds', <Code key="s">{ex.seconds}</Code>, 'Unit: Seconds'],
          ['13', 'milliseconds', <Code key="m">{ex.milliseconds}</Code>, 'Unit: Milliseconds'],
          ['16', 'microseconds', <Code key="u">{ex.microseconds}</Code>, 'Divide by 1,000, then use Milliseconds'],
        ]}
      />
      <P>
        Check it yourself. Enter <Code>{ex.seconds}</Code> with the unit set to Seconds: UTC shows <Code>{ex.utc}</Code>.
        Leave the digits and switch the unit to Milliseconds and you get <Code>{ex.secondsReadAsMilliseconds}</Code>, a
        date in January 1970. Enter the 13-digit <Code>{ex.milliseconds}</Code> as Seconds and the result is{' '}
        <Code>{ex.millisecondsReadAsSeconds}</Code>, a year in the 56,000s. Either symptom means the unit is wrong.
      </P>

      <GuideHeading>One instant, three wall-clock times</GuideHeading>
      <P>
        An epoch value has no time zone; only its display does. The UTC line in the tool is ISO 8601 with a trailing{' '}
        <Code>Z</Code>{' '}(the RFC 3339 profile), and the Local line follows your browser&apos;s zone. The Date-to-Epoch side
        reads your input as local time, so the same wall-clock entry gives different epochs in different zones.
      </P>
      <GuideTable
        caption={`Rendering ${ex.seconds}`}
        head={['Zone', `Wall-clock time for ${ex.seconds}`, 'Note']}
        rows={ex.zones.map((z) => [z.zone, <Code key={z.zone}>{z.local}</Code>, z.note])}
      />

      <GuideHeading>The year 2038 limit</GuideHeading>
      <P>
        A signed 32-bit seconds counter tops out at 2<sup>31</sup> − 1. One second later it does not fit, and a naive
        implementation wraps to a negative number. Systems that store the count in 64 bits, and JavaScript, are not
        affected; the ECMAScript <Code>Date</Code> range is ±100,000,000 days around 1970.
      </P>
      <GuideTable
        caption="Values around the signed 32-bit limit"
        head={['Seconds', 'UTC', 'Meaning']}
        rows={ex.y2038.map((row) => [<Code key={row.seconds}>{row.seconds}</Code>, <Code key={`${row.seconds}-utc`}>{row.utc}</Code>, row.note])}
      />

      <GuideHeading>Current time and conversion in code</GuideHeading>
      <CodeBlock
        label="JavaScript"
        code={`Math.floor(Date.now() / 1000)                // seconds, 10 digits
new Date(1710352200 * 1000).toISOString()    // '2024-03-13T17:50:00.000Z'`}
      />
      <CodeBlock
        label="Python"
        code={`from datetime import datetime, timezone
datetime.fromtimestamp(1710352200, tz=timezone.utc).isoformat()
# '2024-03-13T17:50:00+00:00'`}
      />
      <CodeBlock
        label="Shell"
        code={`date -u -d @1710352200 +%Y-%m-%dT%H:%M:%SZ   # GNU/Linux
date -u -r 1710352200 +%Y-%m-%dT%H:%M:%SZ    # macOS/BSD
# both print 2024-03-13T17:50:00Z`}
      />

      <GuideHeading>Questions</GuideHeading>
      <Faq
        items={[
          {
            q: 'Can I enter a negative timestamp?',
            a: (
              <>
                Yes. <Code>-1</Code> in seconds gives <Code>1969-12-31T23:59:59.000Z</Code> because JavaScript handles dates
                before 1970. POSIX leaves the mapping undefined for negative values, so other systems may differ.
              </>
            ),
          },
          {
            q: 'Why is there no microsecond option?',
            a: 'JavaScript dates have millisecond resolution. Divide a microsecond value by 1,000 and use the Milliseconds unit; the extra digits are lost.',
          },
        ]}
      />

      <Sources
        links={[
          { href: 'https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap04.html#tag_04_19', label: 'POSIX.1-2024, Base Definitions 4.19: Seconds Since the Epoch' },
          { href: 'https://tc39.es/ecma262/#sec-time-values-and-time-range', label: 'ECMAScript: Time Values and Time Range' },
          { href: 'https://www.rfc-editor.org/rfc/rfc3339', label: 'RFC 3339: Date and Time on the Internet: Timestamps' },
        ]}
      />
    </Guide>
  );
}
