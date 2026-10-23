import { JSON_GUIDE_ERRORS, JSON_GUIDE_PRECISION as precision } from '@/lib/tool-guide-examples';
import { Code, CodeBlock, Faq, Guide, GuideHeading, GuideTable, P, Sources } from './GuideKit';

export default function JsonBeautifierGuide() {
  return (
    <Guide id="json-guide">
      <GuideHeading>Errors the parser reports, and the fix</GuideHeading>
      <P>
        The tool validates with the browser&apos;s own <Code>JSON.parse</Code>, so it accepts exactly what that parser
        accepts. JSON is stricter than JavaScript object syntax. Each row below is an input you can paste to see the
        error; the message shown is what Chrome and Node.js (V8) print, and Firefox and Safari word theirs differently. The{' '}
        <Code>position</Code> counts characters from the start of the input.
      </P>
      <GuideTable
        caption="Common JSON mistakes"
        head={['Mistake', 'Input', 'Message (V8)', 'Fix']}
        rows={[
          [JSON_GUIDE_ERRORS[0].mistake, <Code key="a">{JSON_GUIDE_ERRORS[0].input}</Code>, JSON_GUIDE_ERRORS[0].v8, 'Remove the comma after the last member.'],
          [JSON_GUIDE_ERRORS[1].mistake, <Code key="b">{JSON_GUIDE_ERRORS[1].input}</Code>, JSON_GUIDE_ERRORS[1].v8, 'Use double quotes around keys and strings.'],
          [JSON_GUIDE_ERRORS[2].mistake, <Code key="c">{JSON_GUIDE_ERRORS[2].input}</Code>, JSON_GUIDE_ERRORS[2].v8, 'Quote the key: "a".'],
          [JSON_GUIDE_ERRORS[3].mistake, <Code key="d">{JSON_GUIDE_ERRORS[3].input}</Code>, JSON_GUIDE_ERRORS[3].v8, 'JSON has no comments; delete them.'],
          [JSON_GUIDE_ERRORS[4].mistake, <Code key="e">{JSON_GUIDE_ERRORS[4].input}</Code>, JSON_GUIDE_ERRORS[4].v8, 'NaN, Infinity and undefined do not exist in JSON; use null or a string.'],
          [JSON_GUIDE_ERRORS[5].mistake, <Code key="f">{JSON_GUIDE_ERRORS[5].input}</Code>, JSON_GUIDE_ERRORS[5].v8, 'Numbers cannot start with 0 unless the value is 0 or 0.x.'],
        ]}
      />

      <GuideHeading>What formatting can change</GuideHeading>
      <P>
        Beautify and Minify parse the text and write it back, so the output reflects how JavaScript reads the document, not
        a character-for-character copy. Numbers are the main surprise: they become IEEE 754 doubles, which hold integers
        exactly only up to 2<sup>53</sup> − 1 (9007199254740991). RFC 8259 warns that numbers beyond that range may not
        interoperate. Try this input in Minify:
      </P>
      <CodeBlock
        label="Input"
        code={precision.input}
      />
      <CodeBlock
        label="Output"
        code={precision.minified}
      />
      <P>
        The 20-digit id is rounded, <Code>10.50</Code> loses its trailing zero and <Code>1e2</Code> is written as{' '}
        <Code>100</Code>. When an integer in your input is outside the safe range, the tool shows a precision warning under
        the toolbar. If exact digits matter (database ids, snowflake ids), have the producer send them as strings. Duplicate
        keys are not an error: Minify turns <Code>{'{"a":1,"a":2}'}</Code> into <Code>{'{"a":2}'}</Code> because the last
        value wins, although RFC 8259 says names SHOULD be unique.
      </P>

      <GuideHeading>The same job on the command line</GuideHeading>
      <CodeBlock
        label="jq and Python"
        code={`echo '{"a":1,"b":[2,3]}' | jq .                 # 2-space indent
echo '{"a":1,"b":[2,3]}' | python3 -m json.tool  # 4-space indent by default
python3 -m json.tool --indent 2 data.json`}
      />
      <CodeBlock
        label="JavaScript"
        code={`JSON.stringify(JSON.parse(text), null, 2)   // beautify
JSON.stringify(JSON.parse(text))            // minify`}
      />
      <P>
        Unlike this page, <Code>jq</Code> 1.7.1 and Python&apos;s <Code>json.tool</Code> print <Code>12345678901234567890</Code> back
        unchanged, so use one of them when you need to reformat a document without touching its numbers.
      </P>

      <Faq
        items={[
          {
            q: 'Does key order change?',
            a: 'Mostly no. Keys keep their input order, with one exception: JavaScript objects list integer-like keys such as "1" first in ascending order, so {"b":1,"2":2,"1":4} is written back as {"1":4,"2":2,"b":1}.',
          },
          {
            q: 'Is my JSON uploaded?',
            a: 'Parsing runs in this tab with JSON.parse and the tool does not send the text to a processing backend.',
          },
        ]}
      />

      <Sources
        links={[
          { href: 'https://www.rfc-editor.org/rfc/rfc8259', label: 'RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format' },
          { href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse', label: 'MDN: JSON.parse()' },
          { href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER', label: 'MDN: Number.MAX_SAFE_INTEGER' },
        ]}
      />
    </Guide>
  );
}
