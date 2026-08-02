import { describe, expect, it } from 'vitest';

import { unixTimestampToDate } from './unix-timestamp';

describe('unixTimestampToDate', () => {
  it('converts seconds and milliseconds without guessing by string length', () => {
    expect(unixTimestampToDate('1710352200', 'seconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.000Z',
    );
    expect(unixTimestampToDate('1710352200000', 'milliseconds').date?.toISOString()).toBe(
      '2024-03-13T17:50:00.000Z',
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
});
