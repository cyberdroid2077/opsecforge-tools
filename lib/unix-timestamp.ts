export type UnixTimestampUnit = 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds';

export type UnixTimestampResult = {
  date: Date | null;
  error: string;
};

const DECIMAL_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const WHOLE_NUMBER = /^[+-]?\d+$/;

// JavaScript Date has millisecond resolution, so microsecond and nanosecond
// inputs are divided down to milliseconds with BigInt (exact for any length).
const SUB_MILLISECOND_DIVISORS: Partial<Record<UnixTimestampUnit, bigint>> = {
  microseconds: BigInt(1000),
  nanoseconds: BigInt(1000000),
};

// Floor division: the result is the whole millisecond that contains the instant,
// so -1 ns is 1969-12-31T23:59:59.999Z, not 1970-01-01T00:00:00.000Z.
function floorDivide(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor;
  return value % divisor !== BigInt(0) && value < BigInt(0) ? quotient - BigInt(1) : quotient;
}

/**
 * Converts a Unix timestamp string to a Date. The unit is always chosen by the
 * caller; the length of the string is never used to guess it (see suggestUnit).
 *
 * Seconds and milliseconds accept decimals. Microseconds and nanoseconds must
 * be whole numbers and are floored to a whole millisecond.
 */
export function unixTimestampToDate(
  input: string,
  unit: UnixTimestampUnit,
): UnixTimestampResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { date: null, error: '' };
  }

  const subMillisecondDivisor = SUB_MILLISECOND_DIVISORS[unit];
  let milliseconds: number;

  if (subMillisecondDivisor !== undefined) {
    if (!WHOLE_NUMBER.test(trimmed)) {
      return {
        date: null,
        error: `Enter a whole number of ${unit}. Fractions of a ${unit === 'microseconds' ? 'microsecond' : 'nanosecond'} are not supported.`,
      };
    }

    milliseconds = Number(floorDivide(BigInt(trimmed), subMillisecondDivisor));
  } else {
    if (!DECIMAL_NUMBER.test(trimmed)) {
      return {
        date: null,
        error: `Enter a valid Unix timestamp in ${unit}.`,
      };
    }

    const numeric = Number(trimmed);
    milliseconds = unit === 'seconds' ? numeric * 1000 : numeric;
  }

  if (!Number.isFinite(milliseconds)) {
    return {
      date: null,
      error: `Enter a valid Unix timestamp in ${unit}.`,
    };
  }

  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    return {
      date: null,
      error: 'The timestamp is outside the supported JavaScript date range.',
    };
  }

  return { date, error: '' };
}

/** Number of digits in the integer part, ignoring sign and leading zeros. 0 if the input is not a decimal number. */
export function countIntegerDigits(input: string): number {
  const trimmed = input.trim();

  if (!DECIMAL_NUMBER.test(trimmed)) {
    return 0;
  }

  const integerPart = trimmed.replace(/^[+-]/, '').split('.')[0].replace(/^0+/, '');
  return integerPart.length;
}

/**
 * Suggests a unit from the digit count of the integer part, for values near the
 * present day (roughly 2001 to 2286 in seconds). This is only a hint for the UI;
 * unixTimestampToDate never calls it. Returns null when the length is ambiguous.
 */
export function suggestUnit(input: string): UnixTimestampUnit | null {
  const digits = countIntegerDigits(input);

  if (digits >= 9 && digits <= 11) return 'seconds';
  if (digits >= 12 && digits <= 14) return 'milliseconds';
  if (digits >= 15 && digits <= 17) return 'microseconds';
  if (digits >= 18 && digits <= 20) return 'nanoseconds';
  return null;
}

export type DateInputZone = 'local' | 'utc';

export type DateInputResult = {
  milliseconds: number | null;
  error: string;
};

const DATETIME_LOCAL = /^(\d{4,6})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * Converts the value of a datetime-local input ('YYYY-MM-DDTHH:mm') plus a
 * seconds field into epoch milliseconds.
 *
 * zone 'utc': the fields are read as UTC; the result does not depend on the
 * environment's time zone.
 * zone 'local': the fields are read in the environment's time zone. At a DST
 * change, a repeated time resolves to the earlier instant and a skipped time
 * moves forward (the ECMAScript Date behavior).
 */
export function dateInputToEpoch(
  value: string,
  seconds: number,
  zone: DateInputZone,
): DateInputResult {
  const zoneLabel = zone === 'utc' ? 'UTC' : 'local';
  const invalid = (message: string): DateInputResult => ({ milliseconds: null, error: message });

  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
    return invalid('Seconds must be an integer between 0 and 59.');
  }

  const match = DATETIME_LOCAL.exec(value);

  if (!match) {
    return invalid(`Pick a valid ${zoneLabel} date and time.`);
  }

  const [year, month, day, hours, minutes] = match.slice(1).map(Number);

  if (
    month < 1 || month > 12 ||
    day < 1 || day > daysInMonth(year, month) ||
    hours > 23 || minutes > 59
  ) {
    return invalid(`Pick a valid ${zoneLabel} date and time.`);
  }

  let milliseconds: number;

  if (zone === 'utc') {
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    // Date.UTC maps years 0-99 to 1900-1999; set the year explicitly.
    if (year < 100) date.setUTCFullYear(year);
    milliseconds = date.getTime();
  } else {
    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    // The Date constructor maps years 0-99 to 1900-1999; set the year explicitly.
    if (year < 100) date.setFullYear(year);
    milliseconds = date.getTime();
  }

  if (Number.isNaN(milliseconds)) {
    return invalid(`Pick a valid ${zoneLabel} date and time.`);
  }

  return { milliseconds, error: '' };
}

export const BATCH_MAX_LINES = 1000;

export type BatchRow = {
  /** 1-based line number in the pasted text (blank lines are skipped but still counted). */
  line: number;
  /** The line as pasted, trimmed. */
  input: string;
  /** The number that was converted. Equals input unless extracted is true. */
  token: string;
  /** True when the number was found inside a longer line instead of being the whole line. */
  extracted: boolean;
  date: Date | null;
  /** ISO 8601 UTC with milliseconds, or '' when there is no date. */
  utc: string;
  error: string;
};

export type BatchResult = {
  rows: BatchRow[];
  /** Number of lines in the input after dropping trailing blank lines. */
  totalLines: number;
  truncated: boolean;
  /** Non-empty when lines were not processed. */
  notice: string;
};

// A standalone number inside a longer line: not glued to letters, digits or a
// decimal point on either side, integer part of at least 9 digits, optional fraction.
const EMBEDDED_TIMESTAMP = /(?<![0-9A-Za-z.])-?\d{9,}(?:\.\d+)?(?![0-9A-Za-z.])/;

/**
 * Converts pasted text line by line. The unit is always the caller's choice.
 *
 * A line whose trimmed text is a number is converted as is, whatever its length.
 * Any other line is searched for its first standalone number with at least 9
 * integer digits, which is converted and flagged extracted. Blank lines are
 * skipped (line numbers still count them). Only the first BATCH_MAX_LINES lines
 * are processed; the result says so in notice.
 */
export function convertTimestampBatch(text: string, unit: UnixTimestampUnit): BatchResult {
  const lines = text.split(/\r\n|\r|\n/);

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  const totalLines = lines.length;
  const truncated = totalLines > BATCH_MAX_LINES;
  const rows: BatchRow[] = [];

  lines.slice(0, BATCH_MAX_LINES).forEach((raw, index) => {
    const input = raw.trim();

    if (!input) {
      return;
    }

    let token = input;
    let extracted = false;

    if (!DECIMAL_NUMBER.test(input)) {
      const match = EMBEDDED_TIMESTAMP.exec(input);

      if (!match) {
        rows.push({
          line: index + 1, input, token: '', extracted: false, date: null, utc: '', error: 'No timestamp found',
        });
        return;
      }

      token = match[0];
      extracted = true;
    }

    const result = unixTimestampToDate(token, unit);
    rows.push({
      line: index + 1,
      input,
      token,
      extracted,
      date: result.date,
      utc: result.date ? result.date.toISOString() : '',
      error: result.error,
    });
  });

  return {
    rows,
    totalLines,
    truncated,
    notice: truncated
      ? `The input has ${totalLines} lines. Only the first ${BATCH_MAX_LINES} were converted; paste the rest as a second batch.`
      : '',
  };
}
