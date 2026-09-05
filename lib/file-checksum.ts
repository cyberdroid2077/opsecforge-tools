export type FileHashAlgorithm = 'SHA-256' | 'SHA-512';
// SubtleCrypto digests the whole buffer. Bound memory use on mobile devices.
export const MAX_CHECKSUM_BYTES = 32 * 1024 * 1024;

export async function digestFile(
  file: Pick<File, 'size' | 'arrayBuffer'>,
  algorithm: FileHashAlgorithm,
): Promise<string> {
  if (algorithm !== 'SHA-256' && algorithm !== 'SHA-512') throw new Error('Unsupported algorithm.');
  if (file.size > MAX_CHECKSUM_BYTES) throw new Error('Choose a file up to 32 MiB. Use a local command for larger files.');
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_CHECKSUM_BYTES) throw new Error('File exceeds 32 MiB.');
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function compareDigest(actual: string, expected: string, algorithm: FileHashAlgorithm) {
  const normalized = expected.trim().toLowerCase();
  if (!normalized) return 'empty';
  const length = algorithm === 'SHA-256' ? 64 : 128;
  if (!new RegExp(`^[a-f0-9]{${length}}$`).test(normalized)) return 'invalid';
  if (!actual) return 'pending';
  return actual === normalized ? 'match' : 'mismatch';
}
