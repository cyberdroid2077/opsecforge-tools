import { webcrypto, createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  compareDigest,
  digestFile,
  DIRECT_HASH_MAX_BYTES,
  isAbortError,
  MAX_CHECKSUM_BYTES,
  parseExpectedChecksum,
  type ChecksumSource,
} from './file-checksum';

afterEach(() => vi.unstubAllGlobals());

// Synthetic digests only: hashes of fixed byte patterns, never of real downloads.
const hex256 = createHash('sha256').update('synthetic-a').digest('hex');
const hex256b = createHash('sha256').update('synthetic-b').digest('hex');
const hex512 = createHash('sha512').update('synthetic-a').digest('hex');

/** File-like object whose bytes are (index & 0xff) and are only produced by slice(). */
function syntheticFile(size: number, onSlice?: (start: number, end: number) => void) {
  const slice = vi.fn((start: number, end: number) => {
    onSlice?.(start, end);
    const bytes = new Uint8Array(end - start);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (start + i) & 0xff;
    return { arrayBuffer: async () => bytes.buffer as ArrayBuffer };
  });
  const arrayBuffer = vi.fn(async () => { throw new Error('streaming path must not read the whole file'); });
  const file: ChecksumSource = { size, arrayBuffer, slice };
  return { file, slice, arrayBuffer };
}

function expectedFor(size: number, algorithm: 'sha256' | 'sha512') {
  const hash = createHash(algorithm);
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) bytes[i] = i & 0xff;
  return hash.update(bytes).digest('hex');
}

describe('digestFile', () => {
  it('hashes exact binary bytes including empty input with SHA-256 and SHA-512', async () => {
    vi.stubGlobal('crypto', webcrypto);
    for (const bytes of [new Uint8Array(), new Uint8Array([0, 255, 13, 10, 128, 65])]) {
      for (const algorithm of ['SHA-256', 'SHA-512'] as const) {
        const file = { size: bytes.length, arrayBuffer: async () => bytes.buffer };
        expect(await digestFile(file, algorithm)).toBe(createHash(algorithm.replace('-', '').toLowerCase()).update(bytes).digest('hex'));
      }
    }
  });

  it('rejects files over the upper limit before reading any bytes, and points to the command line', async () => {
    const arrayBuffer = vi.fn();
    const slice = vi.fn();
    await expect(digestFile({ size: MAX_CHECKSUM_BYTES + 1, arrayBuffer, slice }, 'SHA-256')).rejects.toThrow(/8 GiB.*command-line/);
    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(slice).not.toHaveBeenCalled();
  });

  it('uses SubtleCrypto up to the direct limit and the streaming path above it', async () => {
    const digest = vi.fn(async () => new ArrayBuffer(32));
    vi.stubGlobal('crypto', { subtle: { digest } });
    const small = { size: DIRECT_HASH_MAX_BYTES, arrayBuffer: vi.fn(async () => new ArrayBuffer(0)) };
    await digestFile(small, 'SHA-256');
    expect(digest).toHaveBeenCalledTimes(1);
    const big = syntheticFile(300);
    await digestFile(big.file, 'SHA-256', { directLimit: 299, chunkSize: 100 });
    expect(digest).toHaveBeenCalledTimes(1);
    expect(big.slice).toHaveBeenCalledTimes(3);
  });

  it('streams in slices with the same result as node:crypto, for both algorithms', async () => {
    for (const algorithm of ['SHA-256', 'SHA-512'] as const) {
      const size = 10_007;
      const { file, slice, arrayBuffer } = syntheticFile(size);
      const progress: Array<[number, number]> = [];
      const result = await digestFile(file, algorithm, {
        directLimit: 1000,
        chunkSize: 1024,
        onProgress: (done, total) => progress.push([done, total]),
      });
      expect(result).toBe(expectedFor(size, algorithm === 'SHA-256' ? 'sha256' : 'sha512'));
      expect(arrayBuffer).not.toHaveBeenCalled();
      expect(slice).toHaveBeenCalledTimes(Math.ceil(size / 1024));
      // monotonic, bounded, and ends at the total
      for (let i = 1; i < progress.length; i++) expect(progress[i][0]).toBeGreaterThan(progress[i - 1][0]);
      expect(progress.every(([done, total]) => total === size && done >= 0 && done <= size)).toBe(true);
      expect(progress[progress.length - 1]).toEqual([size, size]);
    }
  });

  it('streams a file just over the default 32 MiB limit with default settings', async () => {
    const size = DIRECT_HASH_MAX_BYTES + 12_345;
    const { file, slice } = syntheticFile(size);
    let last = 0;
    const result = await digestFile(file, 'SHA-256', { onProgress: (done) => { last = done; } });
    expect(result).toBe(expectedFor(size, 'sha256'));
    expect(last).toBe(size);
    expect(slice).toHaveBeenCalledTimes(9); // 4 MiB pieces
  }, 60_000);

  it('can be cancelled between slices', async () => {
    const controller = new AbortController();
    const { file, slice } = syntheticFile(100_000);
    const promise = digestFile(file, 'SHA-256', {
      directLimit: 10,
      chunkSize: 1000,
      signal: controller.signal,
      onProgress: (done) => { if (done >= 3000) controller.abort(); },
    });
    const error = await promise.catch((e) => e);
    expect(isAbortError(error)).toBe(true);
    expect(slice.mock.calls.length).toBeLessThan(10);
  });

  it('does not read anything when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const { file, slice } = syntheticFile(100_000);
    const error = await digestFile(file, 'SHA-256', { directLimit: 10, signal: controller.signal }).catch((e) => e);
    expect(isAbortError(error)).toBe(true);
    expect(slice).not.toHaveBeenCalled();
  });

  it('fails clearly when a slice comes back short or the file cannot be sliced', async () => {
    const short: ChecksumSource = { size: 100, arrayBuffer: async () => new ArrayBuffer(0), slice: () => ({ arrayBuffer: async () => new ArrayBuffer(10) }) };
    await expect(digestFile(short, 'SHA-256', { directLimit: 10, chunkSize: 50 })).rejects.toThrow(/changed or could not be read/);
    const noSlice: ChecksumSource = { size: 100, arrayBuffer: async () => new ArrayBuffer(100) };
    await expect(digestFile(noSlice, 'SHA-256', { directLimit: 10 })).rejects.toThrow(/in pieces/);
  });
});

describe('compareDigest', () => {
  it('accepts case-insensitive digests and whitespace, and reports wrong lengths and non-hex as invalid', () => {
    const actual = 'ab'.repeat(32);
    expect(compareDigest(actual, ` ${actual.toUpperCase()}\n`, 'SHA-256')).toBe('match');
    expect(compareDigest(actual, 'cd'.repeat(32), 'SHA-256')).toBe('mismatch');
    for (const bad of ['z'.repeat(64), actual.slice(1), 'sha1:' + actual, 'md5 (x) = ' + actual]) {
      expect(compareDigest(actual, bad, 'SHA-256')).toBe('invalid');
    }
    expect(compareDigest('', actual, 'SHA-256')).toBe('pending');
    expect(compareDigest(actual, '', 'SHA-256')).toBe('empty');
    expect(compareDigest(actual, actual, 'SHA-512')).toBe('algorithm-mismatch');
  });

  it('compares pasted prefixed, GNU and BSD lines', () => {
    const actual = hex256;
    expect(compareDigest(actual, `sha256:${actual.toUpperCase()}`, 'SHA-256')).toBe('match');
    expect(compareDigest(actual, `${actual}  data.bin`, 'SHA-256')).toBe('match');
    expect(compareDigest(actual, `SHA256 (data.bin) = ${actual}`, 'SHA-256')).toBe('match');
    expect(compareDigest(actual, `${hex256b} *data.bin`, 'SHA-256')).toBe('mismatch');
  });

  it('picks the line for the selected file name in a multi-line file', () => {
    const text = `${hex256b}  other.bin\n${hex256}  data.bin\n`;
    expect(compareDigest(hex256, text, 'SHA-256', 'data.bin')).toBe('match');
    expect(compareDigest(hex256, text, 'SHA-256', 'other.bin')).toBe('mismatch');
    expect(compareDigest(hex256, text, 'SHA-256', 'missing.bin')).toBe('no-match-for-file');
    expect(compareDigest(hex256, text, 'SHA-256')).toBe('multiple-entries');
  });
});

describe('parseExpectedChecksum', () => {
  it('parses a bare digest with any case and surrounding whitespace', () => {
    for (const text of [hex256, hex256.toUpperCase(), `  ${hex256}\n`, `\n\n${hex256}\r\n`]) {
      expect(parseExpectedChecksum(text)).toEqual({
        status: 'ok', entries: 1, matchedByName: false,
        entry: { hex: hex256, algorithm: 'SHA-256', algorithmNamed: false, fileName: undefined },
      });
    }
  });

  it('infers SHA-512 from 128 hex characters', () => {
    const parsed = parseExpectedChecksum(hex512);
    expect(parsed.status === 'ok' && parsed.entry.algorithm).toBe('SHA-512');
  });

  it('parses sha256:/sha512: prefixes in any case', () => {
    for (const text of [`sha256:${hex256}`, `SHA256:${hex256.toUpperCase()}`, `sha-256: ${hex256}`, `sha256=${hex256}`]) {
      const parsed = parseExpectedChecksum(text);
      expect(parsed.status === 'ok' && parsed.entry).toMatchObject({ hex: hex256, algorithm: 'SHA-256', algorithmNamed: true });
    }
    const p512 = parseExpectedChecksum(`sha512:${hex512}`);
    expect(p512.status === 'ok' && p512.entry.algorithm).toBe('SHA-512');
  });

  it('rejects a prefix that disagrees with the digest length', () => {
    expect(parseExpectedChecksum(`sha512:${hex256}`).status).toBe('invalid');
    expect(parseExpectedChecksum(`sha256:${hex512}`).status).toBe('invalid');
  });

  it('parses GNU lines in text and binary mode, with ./ and directories', () => {
    for (const [line, name] of [
      [`${hex256}  data.bin`, 'data.bin'],
      [`${hex256} *data.bin`, 'data.bin'],
      [`${hex256}  ./data.bin`, 'data.bin'],
      [`${hex256} *./sub/data.bin`, 'data.bin'],
      [`${hex256}\tdata.bin`, 'data.bin'],
      [`${hex256.toUpperCase()}  my file (1).bin`, 'my file (1).bin'],
    ] as const) {
      const parsed = parseExpectedChecksum(line);
      expect(parsed.status === 'ok' && parsed.entry, line).toMatchObject({ hex: hex256, algorithm: 'SHA-256', fileName: name });
    }
  });

  it('parses BSD / shasum --tag lines', () => {
    const a = parseExpectedChecksum(`SHA256 (data.bin) = ${hex256}`);
    expect(a.status === 'ok' && a.entry).toMatchObject({ hex: hex256, algorithm: 'SHA-256', algorithmNamed: true, fileName: 'data.bin' });
    const b = parseExpectedChecksum(`SHA512 (my file (1).bin) = ${hex512.toUpperCase()}`);
    expect(b.status === 'ok' && b.entry).toMatchObject({ hex: hex512, algorithm: 'SHA-512', fileName: 'my file (1).bin' });
    expect(parseExpectedChecksum(`SHA512 (data.bin) = ${hex256}`).status).toBe('invalid');
  });

  it('handles CRLF and CR line endings and ignores blank and # comment lines', () => {
    const text = `# synthetic checksums\r\n\r\n${hex256b}  other.bin\r\n# another comment\r\n${hex256} *data.bin\r\n`;
    const parsed = parseExpectedChecksum(text, 'data.bin');
    expect(parsed).toMatchObject({ status: 'ok', entries: 2, matchedByName: true });
    expect(parsed.status === 'ok' && parsed.entry.hex).toBe(hex256);
    expect(parseExpectedChecksum(`${hex256b}  other.bin\r${hex256}  data.bin`, 'data.bin')).toMatchObject({ status: 'ok', entries: 2 });
  });

  it('selects by basename, ignoring ./ and * on the listed name', () => {
    const text = `${hex256b} *./dist/other.bin\n${hex256} *./dist/data.bin`;
    const parsed = parseExpectedChecksum(text, 'data.bin');
    expect(parsed.status === 'ok' && parsed.entry.hex).toBe(hex256);
  });

  it('reports multiple entries without a file, and no-match with the entry count', () => {
    const text = `${hex256b}  a.bin\n${hex256}  b.bin\n${hex256}  c.bin`;
    expect(parseExpectedChecksum(text)).toEqual({ status: 'multiple-entries', entries: 3 });
    expect(parseExpectedChecksum(text, 'd.bin')).toEqual({ status: 'no-match-for-file', entries: 3 });
    expect(parseExpectedChecksum(text, 'A.BIN')).toEqual({ status: 'no-match-for-file', entries: 3 });
  });

  it('flags several different digests for the same file name as ambiguous', () => {
    const text = `${hex256}  a.bin\n${hex256b}  a.bin`;
    expect(parseExpectedChecksum(text, 'a.bin')).toEqual({ status: 'ambiguous', entries: 2 });
    expect(parseExpectedChecksum(`${hex256}  a.bin\n${hex256}  ./a.bin`, 'a.bin').status).toBe('ok');
  });

  it('uses a single line even when its name differs from the selected file', () => {
    const parsed = parseExpectedChecksum(`${hex256}  other.bin`, 'data.bin');
    expect(parsed).toMatchObject({ status: 'ok', matchedByName: false, entries: 1 });
    expect(parsed.status === 'ok' && parsed.entry.fileName).toBe('other.bin');
  });

  it('reports empty and invalid input', () => {
    for (const text of ['', '   ', '\n\r\n', '# only a comment\n']) expect(parseExpectedChecksum(text).status).toBe('empty');
    for (const text of [
      'hello',
      'z'.repeat(64),
      hex256.slice(1),
      hex256 + 'ab',
      `${hex256}`.slice(0, 40),
      `md5:${'a'.repeat(32)}`,
      `${hex256}  ok.bin\nnot a checksum line`,
      `SHA256 (a.bin) ${hex256}`,
    ]) {
      expect(parseExpectedChecksum(text).status, text).toBe('invalid');
    }
  });
});
