import { describe, expect, it } from 'vitest';

import {
  BATCH_MAX_LINES,
  convertTimestampBatch,
  countIntegerDigits,
  dateInputToEpoch,
  suggestUnit,
  unixTimestampToDate,
} from './unix-timestamp';

describe('unixTimestampToDate', () => {
  it('converts seconds and milliseconds using the unit the caller chose', () => {
    expect(unixTimestampToDate('1710352200', 'seconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.000Z',
    );
    expect(unixTimestampToDate('1710352200000', 'milliseconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.000Z',
    );
  });

  it('does not change the unit based on string length', () => {
    // 13 digits read as seconds stays seconds and falls outside the Date range.
    expect(unixTimestampToDate('1710352200000', 'seconds').date?.toISOString()).toBe(
      '+056168-11-26T01:20:00.000Z',
    );
    expect(unixTimestampToDate('1710352200', 'milliseconds').date?.toISOString()).toBe(
      '1970-01-20T19:05:52.200Z',
    );
  });

  it('keeps 11-digit future timestamps in seconds when selected', () => {
    expect(unixTimestampToDate('10000000000', 'seconds').date?.toISOString()).toBe(
      '2286-11-20T17:46:40.000Z',
    );
  });

  it('supports negative seconds before 1970', () => {
    expect(unixTimestampToDate('-2208988800', 'seconds').date?.toISOString()).toBe(
      '1900-01-01T00:00:00.000Z',
    );
  });

  it('rejects non-decimal input and dates outside the supported range', () => {
    expect(unixTimestampToDate('0x10', 'seconds').error).toContain('valid Unix timestamp');
    expect(unixTimestampToDate('9000000000000000', 'milliseconds').error).toContain(
      'outside the supported',
    );
  });

  it('converts microseconds exactly', () => {
    expect(unixTimestampToDate('1710352200000000', 'microseconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.000Z',
    );
    expect(unixTimestampToDate('1710352200123456', 'microseconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.123Z',
    );
  });

  it('converts nanoseconds exactly, beyond the 2^53 safe-integer limit', () => {
    expect(Number.isSafeInteger(1710352200123456789)).toBe(false);
    expect(unixTimestampToDate('1710352200000000000', 'nanoseconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.000Z',
    );
    expect(unixTimestampToDate('1710352200123456789', 'nanoseconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.123Z',
    );
  });

  it('floors sub-millisecond digits instead of rounding', () => {
    expect(unixTimestampToDate('1710352200999999999', 'nanoseconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.999Z',
    );
    expect(unixTimestampToDate('1710352200000999', 'microseconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.000Z',
    );
  });

  it('floors negative nanoseconds and microseconds toward earlier time', () => {
    expect(unixTimestampToDate('-1', 'nanoseconds').date?.toISOString()).toBe(
      '1969-12-31T23:59:59.999Z',
    );
    expect(unixTimestampToDate('-1000000', 'nanoseconds').date?.toISOString()).toBe(
      '1969-12-31T23:59:59.999Z',
    );
    expect(unixTimestampToDate('-1000001', 'nanoseconds').date?.toISOString()).toBe(
      '1969-12-31T23:59:59.998Z',
    );
    expect(unixTimestampToDate('-1', 'microseconds').date?.toISOString()).toBe(
      '1969-12-31T23:59:59.999Z',
    );
    expect(unixTimestampToDate('0', 'nanoseconds').date?.toISOString()).toBe(
      '1970-01-01T00:00:00.000Z',
    );
  });

  it('rejects decimals and bad input for microseconds and nanoseconds', () => {
    expect(unixTimestampToDate('1710352200000000.5', 'microseconds').error).toContain('whole number');
    expect(unixTimestampToDate('1.5', 'nanoseconds').error).toContain('whole number');
    expect(unixTimestampToDate('abc', 'nanoseconds').error).toContain('whole number');
  });

  it('reports out-of-range and absurdly long sub-millisecond values', () => {
    expect(unixTimestampToDate('9'.repeat(25), 'nanoseconds').error).toContain('outside the supported');
    expect(unixTimestampToDate('9'.repeat(400), 'nanoseconds').error).toContain('valid Unix timestamp');
  });
});

describe('suggestUnit', () => {
  it.each([
    ['1710352200', 'seconds'],
    ['100000000', 'seconds'],
    ['10000000000', 'seconds'],
    ['-1710352200', 'seconds'],
    ['+1710352200', 'seconds'],
    ['1710352200.5', 'seconds'],
    ['  1710352200  ', 'seconds'],
    ['100000000000', 'milliseconds'],
    ['1710352200000', 'milliseconds'],
    ['99999999999999', 'milliseconds'],
    ['1710352200000000', 'microseconds'],
    ['100000000000000', 'microseconds'],
    ['1710352200000000000', 'nanoseconds'],
    ['99999999999999999999', 'nanoseconds'],
    ['-1710352200000000000', 'nanoseconds'],
  ] as const)('suggests the unit for %s', (input, unit) => {
    expect(suggestUnit(input)).toBe(unit);
  });

  it.each(['', '   ', 'abc', '0x10', '0', '12345678', '123456789012345678901', '1e12', '-', '.5'])(
    'returns null for %j',
    (input) => {
      expect(suggestUnit(input)).toBeNull();
    },
  );

  it('ignores leading zeros when counting digits', () => {
    expect(suggestUnit('0001710352200')).toBe('seconds');
    expect(countIntegerDigits('0001710352200')).toBe(10);
    expect(countIntegerDigits('-1710352200.99')).toBe(10);
    expect(countIntegerDigits('abc')).toBe(0);
  });
});

describe('dateInputToEpoch', () => {
  it('reads the fields as UTC without depending on the environment time zone', () => {
    expect(dateInputToEpoch('2024-03-13T17:50', 0, 'utc')).toEqual({
      milliseconds: 1710352200000,
      error: '',
    });
    expect(dateInputToEpoch('1970-01-01T00:00', 0, 'utc').milliseconds).toBe(0);
    expect(dateInputToEpoch('1970-01-01T00:00', 59, 'utc').milliseconds).toBe(59000);
    expect(dateInputToEpoch('1969-12-31T23:59', 59, 'utc').milliseconds).toBe(-1000);
    expect(dateInputToEpoch('2038-01-19T03:14', 7, 'utc').milliseconds).toBe(2147483647000);
  });

  it('handles leap days and years below 100 in UTC mode', () => {
    expect(dateInputToEpoch('2024-02-29T00:00', 0, 'utc').milliseconds).toBe(Date.UTC(2024, 1, 29));
    expect(dateInputToEpoch('2023-02-29T00:00', 0, 'utc').error).toContain('valid UTC date');
    expect(dateInputToEpoch('1900-02-29T00:00', 0, 'utc').error).toContain('valid UTC date');
    expect(dateInputToEpoch('2000-02-29T00:00', 0, 'utc').milliseconds).toBe(Date.UTC(2000, 1, 29));
    expect(new Date(dateInputToEpoch('0050-06-15T12:30', 0, 'utc').milliseconds as number).toISOString()).toBe(
      '0050-06-15T12:30:00.000Z',
    );
  });

  it('rejects malformed values and out-of-range seconds', () => {
    expect(dateInputToEpoch('', 0, 'utc').error).toContain('valid UTC date');
    expect(dateInputToEpoch('2024-13-01T00:00', 0, 'utc').error).toContain('valid UTC date');
    expect(dateInputToEpoch('2024-04-31T00:00', 0, 'utc').error).toContain('valid UTC date');
    expect(dateInputToEpoch('2024-03-13T24:00', 0, 'utc').error).toContain('valid UTC date');
    expect(dateInputToEpoch('2024-03-13T17:60', 0, 'utc').error).toContain('valid UTC date');
    expect(dateInputToEpoch('2024-03-13T17:50:30', 0, 'utc').error).toContain('valid UTC date');
    expect(dateInputToEpoch('2024-03-13T17:50', 60, 'utc').error).toContain('Seconds must be');
    expect(dateInputToEpoch('2024-03-13T17:50', -1, 'utc').error).toContain('Seconds must be');
    expect(dateInputToEpoch('2024-03-13T17:50', 1.5, 'utc').error).toContain('Seconds must be');
    expect(dateInputToEpoch('275760-09-13T00:01', 0, 'utc').error).toContain('valid UTC date');
  });

  it('local mode matches the Date constructor in the environment time zone', () => {
    const expected = new Date(2024, 2, 13, 17, 50, 7).getTime();
    expect(dateInputToEpoch('2024-03-13T17:50', 7, 'local')).toEqual({ milliseconds: expected, error: '' });
    expect(dateInputToEpoch('2024-02-30T00:00', 0, 'local').error).toContain('valid local date');
    expect(dateInputToEpoch('nonsense', 0, 'local').error).toContain('valid local date');
  });

  it('local and UTC differ by the environment UTC offset', () => {
    const local = dateInputToEpoch('2024-03-13T17:50', 0, 'local').milliseconds as number;
    const utc = dateInputToEpoch('2024-03-13T17:50', 0, 'utc').milliseconds as number;
    expect(local - utc).toBe(new Date(local).getTimezoneOffset() * 60000);
  });
});

describe('convertTimestampBatch', () => {
  // Expected values computed independently with node -e (new Date(n * 1000).toISOString()).
  it('converts whole-line numbers in the selected unit without extraction', () => {
    const { rows, truncated, notice } = convertTimestampBatch('1710352200\n1710352201\n1710352260', 'seconds');
    expect(truncated).toBe(false);
    expect(notice).toBe('');
    expect(rows.map((r) => r.utc)).toEqual([
      '2024-03-13T17:50:00.000Z',
      '2024-03-13T17:50:01.000Z',
      '2024-03-13T17:51:00.000Z',
    ]);
    expect(rows.map((r) => r.extracted)).toEqual([false, false, false]);
    expect(rows.map((r) => r.line)).toEqual([1, 2, 3]);
    expect(rows[0].input).toBe('1710352200');
    expect(rows[0].error).toBe('');
  });

  it('uses the selected unit and never guesses it from length', () => {
    expect(convertTimestampBatch('1710352200123', 'milliseconds').rows[0].utc).toBe('2024-03-13T17:50:00.123Z');
    // 10 digits read as milliseconds stays milliseconds.
    expect(convertTimestampBatch('1710352200', 'milliseconds').rows[0].utc).toBe('1970-01-20T19:05:52.200Z');
  });

  it('extracts the first standalone number from a log line and flags it', () => {
    const { rows } = convertTimestampBatch('2026-01-01 INFO req=abc ts=1710352200 ok', 'seconds');
    expect(rows).toHaveLength(1);
    expect(rows[0].extracted).toBe(true);
    expect(rows[0].token).toBe('1710352200');
    expect(rows[0].utc).toBe('2024-03-13T17:50:00.000Z');
    expect(rows[0].error).toBe('');
    expect(rows[0].input).toBe('2026-01-01 INFO req=abc ts=1710352200 ok');
  });

  it('takes only the first qualifying number on a line', () => {
    const { rows } = convertTimestampBatch('a=1710352200 b=1710352260', 'seconds');
    expect(rows[0].token).toBe('1710352200');
  });

  it('reports a line without a timestamp', () => {
    const { rows } = convertTimestampBatch('server started, no time here', 'seconds');
    expect(rows[0].error).toBe('No timestamp found');
    expect(rows[0].date).toBeNull();
    expect(rows[0].utc).toBe('');
    expect(rows[0].extracted).toBe(false);
  });

  it('reports invalid lines instead of throwing', () => {
    const { rows } = convertTimestampBatch('12.3.4\n1e9\nabc', 'seconds');
    expect(rows.map((r) => r.error)).toEqual(['No timestamp found', 'No timestamp found', 'No timestamp found']);
  });

  it('skips blank lines but keeps original line numbers', () => {
    const { rows } = convertTimestampBatch('1710352200\n\n   \n1710352260\n\n', 'seconds');
    expect(rows.map((r) => r.line)).toEqual([1, 4]);
    expect(rows.map((r) => r.utc)).toEqual(['2024-03-13T17:50:00.000Z', '2024-03-13T17:51:00.000Z']);
  });

  it('handles CRLF line endings and empty input', () => {
    expect(convertTimestampBatch('1710352200\r\n1710352260', 'seconds').rows).toHaveLength(2);
    const empty = convertTimestampBatch('', 'seconds');
    expect(empty.rows).toEqual([]);
    expect(empty.totalLines).toBe(0);
  });

  it('does not extract numbers shorter than 9 digits', () => {
    const { rows } = convertTimestampBatch('port=12345678 took 250ms', 'seconds');
    expect(rows[0].error).toBe('No timestamp found');
    // A whole line that is a short number is still converted as typed.
    expect(convertTimestampBatch('12345678', 'seconds').rows[0].utc).toBe('1970-05-23T21:21:18.000Z');
  });

  it('does not extract numbers glued to letters or a decimal point', () => {
    const { rows } = convertTimestampBatch('id=abc1710352200\nid=1710352200abc\nv=1.710352200', 'seconds');
    expect(rows.map((r) => r.error)).toEqual(['No timestamp found', 'No timestamp found', 'No timestamp found']);
  });

  it('supports negative numbers and fractions', () => {
    const { rows } = convertTimestampBatch('-2208988800\n1710352200.5\nts=-1710352200\nts=1710352200.5 ok', 'seconds');
    expect(rows.map((r) => r.utc)).toEqual([
      '1900-01-01T00:00:00.000Z',
      '2024-03-13T17:50:00.500Z',
      '1915-10-21T06:10:00.000Z',
      '2024-03-13T17:50:00.500Z',
    ]);
    expect(rows.map((r) => r.extracted)).toEqual([false, false, true, true]);
    expect(rows[3].token).toBe('1710352200.5');
  });

  it('passes unit errors through for whole-line numbers', () => {
    const { rows } = convertTimestampBatch('1710352200.5', 'microseconds');
    expect(rows[0].date).toBeNull();
    expect(rows[0].error).toContain('whole number of microseconds');
  });

  it('processes at most 1000 lines and says so', () => {
    const text = Array.from({ length: 1001 }, () => '1710352200').join('\n');
    const result = convertTimestampBatch(text, 'seconds');
    expect(BATCH_MAX_LINES).toBe(1000);
    expect(result.rows).toHaveLength(1000);
    expect(result.rows[999].line).toBe(1000);
    expect(result.truncated).toBe(true);
    expect(result.totalLines).toBe(1001);
    expect(result.notice).toBe(
      'The input has 1001 lines. Only the first 1000 were converted; paste the rest as a second batch.',
    );
  });

  it('accepts exactly 1000 lines without a notice', () => {
    const text = Array.from({ length: 1000 }, () => '1710352200').join('\n') + '\n';
    const result = convertTimestampBatch(text, 'seconds');
    expect(result.rows).toHaveLength(1000);
    expect(result.truncated).toBe(false);
    expect(result.notice).toBe('');
  });
});
