import { describe, expect, it, vi } from 'vitest';
import { createUuidV4, formatUuidV4, normalizeUuidCount } from './uuid';

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
