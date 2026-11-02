import { describe, expect, it, vi } from 'vitest';
import {
  createUuidV4,
  createUuidV7Batch,
  formatUuidV4,
  formatUuidV7,
  normalizeUuidCount,
  readUuidV7Timestamp,
} from './uuid';

describe('UUID v4 generation', () => {
  it('sets the RFC version and variant bits for a Web Crypto fallback', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(0xff);
      return bytes;
    });

    expect(createUuidV4({ getRandomValues })).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(getRandomValues).toHaveBeenCalledOnce();
  });

  it('uses randomUUID when the browser provides it', () => {
    const randomUUID = vi.fn(() => '12345678-1234-4234-9234-123456789abc');
    const getRandomValues = vi.fn();

    expect(createUuidV4({ randomUUID, getRandomValues })).toBe('12345678-1234-4234-9234-123456789abc');
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it('refuses to generate an identifier without secure randomness', () => {
    expect(() => createUuidV4(null)).toThrow('Secure browser randomness is unavailable.');
  });

  it('requires exactly 16 bytes', () => {
    expect(() => formatUuidV4(new Uint8Array(15))).toThrow('exactly 16 random bytes');
  });
});

describe('UUID v7 generation', () => {
  it('matches the RFC 9562 appendix A.6 example', () => {
    // unix_ts_ms 0x017F22E279B0, rand_a 0xCC3, rand_b 0x18C4DC0C0C07398F
    const random74 = (BigInt('0xcc3') << BigInt(62)) | BigInt('0x18c4dc0c0c07398f');
    expect(formatUuidV7(0x017f22e279b0, random74)).toBe('017f22e2-79b0-7cc3-98c4-dc0c0c07398f');
  });

  it('reads the timestamp back out', () => {
    expect(readUuidV7Timestamp('017f22e2-79b0-7cc3-98c4-dc0c0c07398f')).toBe(1645557742000);
    expect(readUuidV7Timestamp('00010203-0405-4607-8809-0a0b0c0d0e0f')).toBeNull();
    expect(readUuidV7Timestamp('not a uuid')).toBeNull();
  });

  it('rejects out-of-range inputs', () => {
    expect(() => formatUuidV7(-1, BigInt(0))).toThrow('timestamp');
    expect(() => formatUuidV7(2 ** 48, BigInt(0))).toThrow('timestamp');
    expect(() => formatUuidV7(1.5, BigInt(0))).toThrow('timestamp');
    expect(() => formatUuidV7(0, BigInt(1) << BigInt(74))).toThrow('74 bits');
  });

  it('produces sorted, unique ids inside one millisecond', () => {
    const random = {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(0xff);
        return bytes;
      },
    };
    const ids = createUuidV7Batch(50, random, () => 1700000000000);
    expect(new Set(ids).size).toBe(50);
    expect([...ids].sort()).toEqual(ids);
    expect(ids.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))).toBe(true);
    expect(readUuidV7Timestamp(ids[0])).toBe(1700000000000);
  });

  it('never lets the timestamp go backwards', () => {
    const random = { getRandomValues: (bytes: Uint8Array) => bytes };
    const times = [1000, 999, 1001];
    let i = 0;
    const ids = createUuidV7Batch(3, random, () => times[i++]);
    expect(ids.map(readUuidV7Timestamp)).toEqual([1000, 1000, 1001]);
    expect([...ids].sort()).toEqual(ids);
  });

  it('refuses to generate without secure randomness', () => {
    expect(() => createUuidV7Batch(1, null)).toThrow('Secure browser randomness is unavailable.');
  });
});

describe('UUID batch count normalization', () => {
  it.each([
    [Number.NaN, 1],
    [-2, 1],
    [3.9, 3],
    [101, 100],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeUuidCount(input)).toBe(expected);
  });
});
