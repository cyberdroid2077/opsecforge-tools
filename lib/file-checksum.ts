import { createSha256, createSha512, type StreamingHash } from './sha2-stream';

export type FileHashAlgorithm = 'SHA-256' | 'SHA-512';

/** Files up to this size are hashed in one call with SubtleCrypto (fast, whole buffer in memory). */
export const DIRECT_HASH_MAX_BYTES = 32 * 1024 * 1024;
/** Larger files are read in slices of this size and hashed incrementally. */
export const STREAM_CHUNK_BYTES = 4 * 1024 * 1024;
/** Upper bound for this page. Beyond it, a command-line tool is the better choice. */
export const MAX_CHECKSUM_BYTES = 8 * 1024 * 1024 * 1024;

/** Error whose message is written for the user and is safe to show as is. */
export class ChecksumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChecksumError';
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function abortError() {
  const error = new Error('Checksum calculation cancelled.');
  error.name = 'AbortError';
  return error;
}

export interface ChecksumSource {
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice?(start: number, end: number): { arrayBuffer(): Promise<ArrayBuffer> };
}

export interface DigestOptions {
  /** Called with (bytesDone, total) while a large file is processed. Not called on the direct path. */
  onProgress?: (bytesDone: number, total: number) => void;
  signal?: AbortSignal;
  /** Overrides for tests. */
  directLimit?: number;
  chunkSize?: number;
  maxBytes?: number;
}

const yieldToEventLoop = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const UPDATE_PIECE_BYTES = 256 * 1024;
const YIELD_AFTER_MS = 30;

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function digestFile(
  file: ChecksumSource,
  algorithm: FileHashAlgorithm,
  options: DigestOptions = {},
): Promise<string> {
  if (algorithm !== 'SHA-256' && algorithm !== 'SHA-512') throw new Error('Unsupported algorithm.');
  const { onProgress, signal, directLimit = DIRECT_HASH_MAX_BYTES, chunkSize = STREAM_CHUNK_BYTES, maxBytes = MAX_CHECKSUM_BYTES } = options;
  if (signal?.aborted) throw abortError();
  if (file.size > maxBytes) {
    throw new ChecksumError('This file is larger than 8 GiB. Use a command-line tool such as sha256sum, shasum -a 256 or Get-FileHash for files this large.');
  }
  if (file.size <= directLimit) {
    const bytes = await file.arrayBuffer();
    if (signal?.aborted) throw abortError();
    const digest = await crypto.subtle.digest(algorithm, bytes);
    return toHex(new Uint8Array(digest));
  }
  if (!file.slice) throw new ChecksumError('This browser cannot read the file in pieces. Use a command-line tool for large files.');

  const hash: StreamingHash = algorithm === 'SHA-256' ? createSha256() : createSha512();
  const total = file.size;
  let done = 0;
  let lastYield = now();
  onProgress?.(0, total);
  while (done < total) {
    if (signal?.aborted) throw abortError();
    const end = Math.min(done + chunkSize, total);
    const buffer = await file.slice(done, end).arrayBuffer();
    if (signal?.aborted) throw abortError();
    if (buffer.byteLength !== end - done) throw new ChecksumError('The file changed or could not be read completely. Select it again and retry.');
    const bytes = new Uint8Array(buffer);
    // Hash in small pieces and yield whenever a slice of work has run long, so slow devices keep responding.
    for (let offset = 0; offset < bytes.length; offset += UPDATE_PIECE_BYTES) {
      hash.update(bytes.subarray(offset, offset + UPDATE_PIECE_BYTES));
      if (now() - lastYield > YIELD_AFTER_MS) {
        await yieldToEventLoop();
        if (signal?.aborted) throw abortError();
        lastYield = now();
      }
    }
    done = end;
    onProgress?.(done, total);
    await yieldToEventLoop();
    lastYield = now();
  }
  return hash.digestHex();
}

// ---------------------------------------------------------------------------
// Parsing of pasted expected checksums
// ---------------------------------------------------------------------------

export interface ChecksumEntry {
  hex: string;
  /** Algorithm named by a prefix or BSD tag, otherwise inferred from the hex length. */
  algorithm: FileHashAlgorithm;
  /** True when the algorithm came from the text (tag or prefix) rather than from the length. */
  algorithmNamed: boolean;
  /** File name from a GNU or BSD line, normalized to its basename. */
  fileName?: string;
}

export type ParsedChecksum =
  | { status: 'empty' }
  | { status: 'invalid' }
  /** Several entries and no file selected to choose between them. */
  | { status: 'multiple-entries'; entries: number }
  /** Several entries, none for the selected file name. */
  | { status: 'no-match-for-file'; entries: number }
  /** Several entries for the selected file name with different digests. */
  | { status: 'ambiguous'; entries: number }
  | { status: 'ok'; entry: ChecksumEntry; entries: number; matchedByName: boolean };

const HEX = /^[0-9a-f]+$/i;
const BSD_LINE = /^(SHA-?256|SHA-?512)\s*\((.+)\)\s*=\s*([0-9a-f]+)$/i;
const PREFIX_LINE = /^(SHA-?256|SHA-?512)\s*[:=]\s*([0-9a-f]+)$/i;
const GNU_LINE = /^\\?([0-9a-f]+)\s+\*?(.+)$/i;

export function basename(name: string): string {
  const cleaned = name.trim().replace(/^\*/, '').replace(/\\/g, '/');
  const parts = cleaned.split('/').filter((part) => part && part !== '.');
  return parts.length ? parts[parts.length - 1] : '';
}

function algorithmFromName(name: string): FileHashAlgorithm {
  return name.replace('-', '').toUpperCase() === 'SHA256' ? 'SHA-256' : 'SHA-512';
}

function algorithmFromLength(length: number): FileHashAlgorithm | null {
  if (length === 64) return 'SHA-256';
  if (length === 128) return 'SHA-512';
  return null;
}

function makeEntry(hex: string, named: FileHashAlgorithm | null, fileName?: string): ChecksumEntry | null {
  const inferred = algorithmFromLength(hex.length);
  if (!inferred) return null;
  if (named && named !== inferred) return null;
  const name = fileName === undefined ? undefined : basename(fileName);
  return { hex: hex.toLowerCase(), algorithm: named ?? inferred, algorithmNamed: !!named, fileName: name || undefined };
}

function parseLine(line: string): ChecksumEntry | null {
  const bsd = BSD_LINE.exec(line);
  if (bsd) return makeEntry(bsd[3], algorithmFromName(bsd[1]), bsd[2]);
  const prefixed = PREFIX_LINE.exec(line);
  if (prefixed) return makeEntry(prefixed[2], algorithmFromName(prefixed[1]));
  if (HEX.test(line)) return makeEntry(line, null);
  const gnu = GNU_LINE.exec(line);
  if (gnu) return makeEntry(gnu[1], null, gnu[2]);
  return null;
}

/**
 * Accepts a bare digest, `sha256:<hex>`, a GNU line (`<hex>  name` or `<hex> *name`),
 * a BSD line (`SHA256 (name) = <hex>`), or the full text of a SHA256SUMS-style file.
 * Blank lines and lines starting with # are ignored. With several entries, the one whose
 * file name equals the selected file name is used.
 */
export function parseExpectedChecksum(text: string, fileName?: string): ParsedChecksum {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  if (!lines.length) return { status: 'empty' };
  const entries: ChecksumEntry[] = [];
  for (const line of lines) {
    const entry = parseLine(line);
    if (!entry) return { status: 'invalid' };
    entries.push(entry);
  }
  if (entries.length === 1) return { status: 'ok', entry: entries[0], entries: 1, matchedByName: false };
  const wanted = fileName ? basename(fileName) : '';
  if (!wanted) return { status: 'multiple-entries', entries: entries.length };
  const matches = entries.filter((entry) => entry.fileName === wanted);
  if (!matches.length) return { status: 'no-match-for-file', entries: entries.length };
  if (matches.some((entry) => entry.hex !== matches[0].hex || entry.algorithm !== matches[0].algorithm)) {
    return { status: 'ambiguous', entries: entries.length };
  }
  return { status: 'ok', entry: matches[0], entries: entries.length, matchedByName: true };
}

export type ComparisonStatus =
  | 'empty'
  | 'invalid'
  | 'multiple-entries'
  | 'no-match-for-file'
  | 'ambiguous'
  | 'algorithm-mismatch'
  | 'pending'
  | 'match'
  | 'mismatch';

export function compareParsed(actual: string, parsed: ParsedChecksum, algorithm: FileHashAlgorithm): ComparisonStatus {
  if (parsed.status !== 'ok') return parsed.status;
  if (parsed.entry.algorithm !== algorithm) return 'algorithm-mismatch';
  if (!actual) return 'pending';
  return actual.toLowerCase() === parsed.entry.hex ? 'match' : 'mismatch';
}

export function compareDigest(actual: string, expected: string, algorithm: FileHashAlgorithm, fileName?: string): ComparisonStatus {
  return compareParsed(actual, parseExpectedChecksum(expected, fileName), algorithm);
}
