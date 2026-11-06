import { UNIX_GUIDE_EXAMPLE as ex } from '@/lib/tool-guide-examples';
import { Code, CodeBlock, Faq, Guide, GuideHeading, GuideTable, P, Sources } from './GuideKit';

export default function UnixTimestampGuide() {
  return (
    <Guide id="timestamp-guide">
      <P>
        To convert an epoch value to a date, choose the unit that matches its length (10 digits is usually seconds, 13 is
        usually milliseconds) and enter it in Epoch To Date. <Code>{ex.seconds}</Code> in seconds is{' '}
        <Code>{ex.utc}</Code>, which is 2024-03-13 17:50:00 UTC. The same digits in the wrong unit give a date in 1970 or
        in the year 56168, which is the sign to switch units.
      </P>

      <GuideHeading>Seconds or milliseconds: which one do you have?</GuideHeading>
      <P>
        A Unix timestamp counts time from 1970-01-01 00:00:00 UTC. POSIX defines &quot;seconds since the Epoch&quot; as a
        value that approximates elapsed seconds and treats every day as exactly 86,400 seconds, so leap seconds are not
        counted. JavaScript&apos;s <Code>Date</Code> counts milliseconds; most Unix tools and many APIs count seconds. For
        dates near the present you can tell them apart by length. The tool shows a hint based on this rule when the
        digits do not match the selected unit, but it never changes the unit for you:
      </P>
      <GuideTable
        caption="Timestamp length and unit"
        head={['Digits', 'Unit', 'Example', 'What to do in this tool']}
        rows={[
          ['10', 'seconds', <Code key="s">{ex.seconds}</Code>, 'Unit: Seconds'],
          ['13', 'milliseconds', <Code key="m">{ex.milliseconds}</Code>, 'Unit: Milliseconds'],
          ['16', 'microseconds', <Code key="u">{ex.microseconds}</Code>, 'Unit: Microseconds (floored to a whole millisecond)'],
          ['19', 'nanoseconds', <Code key="n">{ex.nanoseconds}</Code>, 'Unit: Nanoseconds (floored to a whole millisecond)'],
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
        reads your input as local time by default, so the same wall-clock entry gives different epochs in different
        zones. Switch it to UTC to read the entry as UTC regardless of the browser&apos;s zone.
      </P>
      <GuideTable
        caption={`Rendering ${ex.seconds}`}
        head={['Zone', `Wall-clock time for ${ex.seconds}`, 'Note']}
        rows={ex.zones.map((z) => [z.zone, <Code key={z.zone}>{z.local}</Code>, z.note])}
      />

      <GuideHeading>The Details box</GuideHeading>
      <P>
        Below the UTC line, Epoch To Date lists a few values derived from the same instant. All of them are calculated in
        UTC, so they do not change with your browser&apos;s zone. For <Code>1710352200</Code> (2024-03-13T17:50:00Z) the
        tool shows <Code>Wednesday</Code>, day of year <Code>73</Code> (31 days of January, 29 of February in the leap year
        2024, plus 13), ISO week <Code>2024-W11-3</Code>, and the HTTP date{' '}
        <Code>Wed, 13 Mar 2024 17:50:00 GMT</Code>.
      </P>
      <P>
        An ISO 8601 week starts on Monday, and week 1 is the week that contains the year&apos;s first Thursday. The week
        number therefore belongs to the year of that Thursday, which can differ from the calendar year near 1 January:{' '}
        <Code>1609459200</Code> (2021-01-01, a Friday) is <Code>2020-W53-5</Code>, and <Code>1735603200</Code>{' '}
        (2024-12-31, a Tuesday) is <Code>2025-W01-2</Code>. The last number is the weekday, 1 for Monday to 7 for Sunday.
        The HTTP date is the fixed-format timestamp from RFC 9110 (IMF-fixdate): English day and month abbreviations, always
        GMT, independent of locale. The relative text, such as <Code>3 days ago</Code> or <Code>in 2 hours</Code>, is
        computed in the browser from the current time and is floored to one unit (a month is 30.4375 days, a year 365.25
        days).
      </P>
      <P>
        If the seconds value does not fit a signed 32-bit integer, that is above <Code>2147483647</Code> or below{' '}
        <Code>-2147483648</Code>, the box adds a note. Code that stores the value in a 32-bit <Code>time_t</Code> would
        overflow there; the conversion in this tool is not affected. Sub-second values are floored to whole seconds for
        that check.
      </P>

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

      <GuideHeading>Unix time with the Linux date command</GuideHeading>
      <P>
        GNU <Code>date</Code> (from coreutils, the default on most Linux distributions) prints the current epoch with the{' '}
        <Code>%s</Code> format and reads an epoch value when the argument to <Code>-d</Code> starts with <Code>@</Code>.
        The outputs below were produced by running each command on a Linux machine with GNU coreutils; the current-time
        values change on every run.
      </P>
      <CodeBlock
        label="Current epoch"
        code={`$ date +%s
1793280712
$ date +%s%3N      # milliseconds: %N is nanoseconds, %3N keeps the first 3 digits
1793280712521`}
      />
      <CodeBlock
        label="Epoch to date (UTC)"
        code={`$ date -u -d @1710352200
Wed 13 Mar 2024 05:50:00 PM UTC
$ date -u -d @1710352200 +%Y-%m-%dT%H:%M:%SZ
2024-03-13T17:50:00Z
$ date -u -d @1710352200.123 +%s%3N
1710352200123`}
      />
      <CodeBlock
        label="Date to epoch (UTC)"
        code={`$ date -u -d '2024-03-13 17:50:00' +%s
1710352200`}
      />
      <P>
        The default output layout depends on your locale, so use an explicit format such as the one above when a script
        parses the result. The GNU manual says an <Code>@</Code> value may contain a decimal point and that excess
        precision is truncated toward minus infinity, which is the same flooring this tool applies to microseconds and
        nanoseconds.
      </P>

      <GuideHeading>Local time versus -u</GuideHeading>
      <P>
        Without <Code>-u</Code>, <Code>date</Code> uses the zone from the <Code>TZ</Code> environment variable or the
        system default, and reads a date string in that zone. <Code>-u</Code> makes it operate in UTC instead. The same
        wall-clock text therefore gives different epochs. The next output comes from a machine whose zone is
        America/Toronto (EDT, UTC-4 on this date):
      </P>
      <CodeBlock
        label="Local zone: America/Toronto"
        code={`$ date -d @1710352200 +%Y-%m-%dT%H:%M:%S%z
2024-03-13T13:50:00-0400
$ date -d '2024-03-13 17:50:00' +%s
1710366600
$ date -u -d '2024-03-13 17:50:00' +%s
1710352200`}
      />
      <P>
        The epoch <Code>{ex.shell.utcEpoch}</Code> is one instant: 17:50:00 in UTC and 13:50:00 in Toronto. Reading{' '}
        <Code>17:50:00</Code> as Toronto time instead gives <Code>{ex.shell.torontoEpochForSameWallClock}</Code>, four hours
        later. That is the same difference the Local and UTC toggle makes in the Date To Epoch box above.
      </P>

      <GuideHeading>macOS and BSD equivalents</GuideHeading>
      <P>
        BSD <Code>date</Code> has different options. The FreeBSD <Code>date(1)</Code> manual documents{' '}
        <Code>-r seconds</Code> to print the date for a number of seconds since the Epoch, <Code>-u</Code> for UTC, and{' '}
        <Code>-f</Code> to parse the date argument with a <Code>strptime(3)</Code> format. Its <Code>-j</Code> flag
        means do not try to set the date, which lets <Code>-f</Code> be used to convert one format to another. These two
        commands were not run for this guide, and macOS ships its own BSD-derived <Code>date</Code>, so check{' '}
        <Code>man date</Code> on your system before relying on them.
      </P>
      <CodeBlock
        label="BSD date, as documented for FreeBSD (not run here)"
        code={`date -u -r 1710352200 +%Y-%m-%dT%H:%M:%SZ
date -j -u -f '%Y-%m-%d %H:%M:%S' '2024-03-13 17:50:00' +%s`}
      />
      <P>
        In GNU <Code>date</Code>, <Code>-r</Code> takes a file and prints its modification time; the GNU form for an
        epoch value is <Code>-d @…</Code>, which the FreeBSD page does not document. Treat the two sets of commands as
        separate rather than interchangeable.
      </P>

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
            q: 'What happens to microsecond and nanosecond digits?',
            a: 'JavaScript dates have millisecond resolution, so the tool floors microsecond and nanosecond values to a whole millisecond and the finer digits are dropped. For example, 1710352200123456789 nanoseconds shows as 2024-03-13T17:50:00.123Z. Floor means toward earlier time: -1 nanosecond is 1969-12-31T23:59:59.999Z. Microsecond and nanosecond inputs must be whole numbers; decimals are rejected.',
          },
        ]}
      />

      <Sources
        links={[
          { href: 'https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap04.html#tag_04_19', label: 'POSIX.1-2024, Base Definitions 4.19: Seconds Since the Epoch' },
          { href: 'https://tc39.es/ecma262/#sec-time-values-and-time-range', label: 'ECMAScript: Time Values and Time Range' },
          { href: 'https://www.rfc-editor.org/rfc/rfc3339', label: 'RFC 3339: Date and Time on the Internet: Timestamps' },
          { href: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-date-time-formats', label: 'RFC 9110: HTTP Semantics, 5.6.7 Date/Time Formats' },
          { href: 'https://www.gnu.org/software/coreutils/manual/html_node/date-invocation.html', label: 'GNU Coreutils manual: date invocation' },
          { href: 'https://www.gnu.org/software/coreutils/manual/html_node/Seconds-since-the-Epoch.html', label: 'GNU Coreutils manual: Seconds since the Epoch (the @ syntax)' },
          { href: 'https://man.freebsd.org/cgi/man.cgi?query=date', label: 'FreeBSD date(1) manual page' },
        ]}
      />
    </Guide>
  );
}
