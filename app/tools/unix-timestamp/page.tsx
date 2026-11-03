import UnixTimestampTool from '@/components/UnixTimestampTool';
import UnixTimestampGuide from '@/components/tool-content/UnixTimestampGuide';
import { Code, CodeBlock, Guide, GuideHeading, P } from '@/components/tool-content/GuideKit';

export default function UnixTimestampPage() {
  return (
    <UnixTimestampTool>
      <UnixTimestampGuide />
      <Guide id="batch-epoch-guide">
        <GuideHeading>Converting a pile of timestamps from a log</GuideHeading>
        <P>
          Paste the lines into Batch Epoch To Date, pick the unit once, and read the table. The unit applies to every
          line and is never guessed, so a log that mixes seconds and milliseconds needs two batches. Each line is handled
          by one of two rules:
        </P>
        <P>
          If the whole line, trimmed, is a number, it is converted as it is, however many digits it has. Otherwise the
          tool takes the first standalone number in the line that has at least 9 integer digits, with an optional
          fraction and a leading minus, and marks the row &quot;from line&quot;. Standalone means the number is not
          attached to letters, other digits or a decimal point, so <Code>id=abc1710352200</Code> and{' '}
          <Code>1710352200abc</Code> are skipped. A line with no such number shows &quot;No timestamp found&quot;. Blank
          lines are skipped but still counted, so the Line column matches the line numbers in your editor. Only the first
          1000 lines are converted; if you paste more, a notice says how many lines were left out.
        </P>
        <P>
          Example with a synthetic log. The first line is <Code>2024-03-13 INFO req=a1 ts=1710352200 ok</Code>, the third
          has no timestamp, and the unit is Seconds:
        </P>
        <CodeBlock
          label="Input"
          code={`2024-03-13 INFO req=a1 ts=1710352200 ok
2024-03-13 INFO req=a2 ts=1710352260 ok
2024-03-13 WARN req=a3 slow=250ms
2024-03-13 INFO req=a4 ts=1710352321 ok`}
        />
        <CodeBlock
          label="Line, UTC, status"
          code={`1  2024-03-13T17:50:00.000Z  from line: 1710352200
2  2024-03-13T17:51:00.000Z  from line: 1710352260
3  (none)                    No timestamp found
4  2024-03-13T17:52:01.000Z  from line: 1710352321`}
        />
        <P>
          The date parts such as <Code>2024-03-13</Code> are not picked up because no run of digits in them reaches 9. The
          text is processed in the page and is not uploaded, and Copy as TSV puts the line number, input, UTC and local
          time on the clipboard separated by tabs, ready to paste into a spreadsheet.
        </P>
        <P>
          On a Linux machine with GNU coreutils you can do the extraction yourself. <Code>grep -oE &apos;[0-9]&#123;10&#125;&apos;</Code>{' '}
          prints every 10-digit run in the file, one per line; for the log above it printed{' '}
          <Code>1710352200</Code>, <Code>1710352260</Code> and <Code>1710352321</Code>. Each value can then be passed to{' '}
          <Code>date</Code> in a shell loop. Unlike the tool, a fixed 10-digit pattern also matches the first 10 digits
          of a longer number and assumes seconds.
        </P>
        <CodeBlock
          label="GNU date, one value"
          code={`$ date -u -d @1710352321 +%Y-%m-%dT%H:%M:%SZ
2024-03-13T17:52:01Z`}
        />
      </Guide>
    </UnixTimestampTool>
  );
}
