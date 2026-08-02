export type UnixTimestampUnit = 'seconds' | 'milliseconds';

export type UnixTimestampResult = {
  date: Date | null;
  error: string;
};

const DECIMAL_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

export function unixTimestampToDate(
  input: string,
  unit: UnixTimestampUnit,
): UnixTimestampResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { date: null, error: '' };
  }

  if (!DECIMAL_NUMBER.test(trimmed)) {
    return {
      date: null,
      error: `Enter a valid Unix timestamp in ${unit}.`,
    };
  }

  const numeric = Number(trimmed);
  const milliseconds = unit === 'seconds' ? numeric * 1000 : numeric;

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
