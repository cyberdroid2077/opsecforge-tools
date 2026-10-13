import type { FileHashAlgorithm } from './file-checksum';

// Public test vector: the three ASCII bytes abc, with no newline.
export const EXAMPLE_CHECKSUMS: Record<FileHashAlgorithm, string> = {
  'SHA-256': 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  'SHA-512': 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
};

export function checksumExample() {
  return { size: 3, arrayBuffer: async () => new Uint8Array([97, 98, 99]).buffer };
}

export function mismatchingExample(algorithm: FileHashAlgorithm) {
  const expected = EXAMPLE_CHECKSUMS[algorithm];
  return `0${expected.slice(1)}`;
}
