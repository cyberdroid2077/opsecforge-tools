import { MAX_CHECKSUM_FILE_BYTES, ToolError, formatBytes, readRegularFile } from '../fsutil';
import { compareDigest, digestFile, type FileHashAlgorithm } from '../../../../lib/file-checksum';

const NAMES: Record<'sha256' | 'sha512', FileHashAlgorithm> = {
  sha256: 'SHA-256',
  sha512: 'SHA-512',
};

/** Accepts "<hex>", "sha256:<hex>" and the "<hex>  filename" form printed by sha256sum. */
function cleanExpected(expected: string, algorithm: 'sha256' | 'sha512'): string {
  let value = expected.trim().split(/\s+/)[0] ?? '';
  value = value.replace(new RegExp(`^${algorithm}[:=-]`, 'i'), '');
  return value;
}

export async function fileChecksum(args: {
  path: string;
  algorithm: 'sha256' | 'sha512';
  expected?: string;
}): Promise<string> {
  const algorithm = NAMES[args.algorithm];
  if (!algorithm) throw new ToolError('"algorithm" must be "sha256" or "sha512".');

  const { absolutePath, bytes } = await readRegularFile(args.path, MAX_CHECKSUM_FILE_BYTES);
  const actual = await digestFile(
    { size: bytes.length, arrayBuffer: async () => new Uint8Array(bytes).buffer },
    algorithm,
  );

  const lines = [
    `File: ${absolutePath} (${formatBytes(bytes.length)})`,
    `${args.algorithm}: ${actual}`,
  ];
  if (args.expected !== undefined) {
    const status = compareDigest(actual, cleanExpected(args.expected, args.algorithm), algorithm);
    const wrongLength = /^[a-f0-9]+$/i.test(cleanExpected(args.expected, args.algorithm));
    const text: Record<string, string> = {
      match: 'MATCH: the file hashes to the expected value.',
      mismatch: 'MISMATCH: the file does NOT hash to the expected value. Do not trust or run it until you know why.',
      invalid: `INVALID expected value: ${args.algorithm} needs ${args.algorithm === 'sha256' ? 64 : 128} hexadecimal characters${wrongLength ? ' (the value you gave has a different length; did you pick the wrong algorithm?)' : ''}.`,
      empty: 'The expected value was empty, so nothing was compared.',
      pending: 'No digest was computed.',
    };
    lines.push(`Comparison: ${text[status]}`);
  }
  lines.push(
    'Note: a matching checksum only proves the file equals whatever the expected value was taken from; it is only as trustworthy as where you got that value.',
  );
  return lines.join('\n');
}
