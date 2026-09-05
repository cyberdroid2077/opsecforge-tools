import { webcrypto, createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { compareDigest, digestFile, MAX_CHECKSUM_BYTES } from './file-checksum';

afterEach(() => vi.unstubAllGlobals());

describe('file checksum', () => {
  it('hashes exact binary bytes including empty input with SHA-256 and SHA-512', async () => {
    vi.stubGlobal('crypto', webcrypto);
    for (const bytes of [new Uint8Array(), new Uint8Array([0, 255, 13, 10, 128, 65])]) {
      for (const algorithm of ['SHA-256', 'SHA-512'] as const) {
        const file = { size: bytes.length, arrayBuffer: async () => bytes.buffer };
        expect(await digestFile(file, algorithm)).toBe(createHash(algorithm.replace('-', '').toLowerCase()).update(bytes).digest('hex'));
      }
    }
  });
  it('rejects oversized files before reading bytes', async () => {
    const arrayBuffer = vi.fn();
    await expect(digestFile({size: MAX_CHECKSUM_BYTES + 1, arrayBuffer}, 'SHA-256')).rejects.toThrow('32 MiB');
    expect(arrayBuffer).not.toHaveBeenCalled();
  });
  it('accepts case-insensitive digests but rejects prefixes, wrong lengths, and non-hex values', () => {
    const actual = 'ab'.repeat(32);
    expect(compareDigest(actual, ` ${actual.toUpperCase()}\n`, 'SHA-256')).toBe('match');
    expect(compareDigest(actual, 'cd'.repeat(32), 'SHA-256')).toBe('mismatch');
    for (const bad of ['sha256:' + actual, actual + ' file.zip', 'z'.repeat(64), actual.slice(1)]) {
      expect(compareDigest(actual, bad, 'SHA-256')).toBe('invalid');
    }
    expect(compareDigest('', actual, 'SHA-256')).toBe('pending');
    expect(compareDigest(actual, '', 'SHA-256')).toBe('empty');
    expect(compareDigest(actual, actual, 'SHA-512')).toBe('invalid');
  });
});
