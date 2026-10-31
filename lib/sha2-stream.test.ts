import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createSha256, createSha512, type StreamingHash } from './sha2-stream';

// Small deterministic PRNG so failures are reproducible.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBytes(length: number, rand: () => number) {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = Math.floor(rand() * 256);
  return out;
}

/** Feeds the data in random pieces, including empty and 1-byte pieces. */
function feedRandomly(hash: StreamingHash, data: Uint8Array, rand: () => number) {
  let pos = 0;
  hash.update(new Uint8Array(0));
  while (pos < data.length) {
    const r = rand();
    const size = r < 0.15 ? 0 : r < 0.35 ? 1 : Math.floor(rand() * 300) + 1;
    hash.update(data.subarray(pos, Math.min(pos + size, data.length)));
    pos += size;
  }
}

const algorithms = [
  { name: 'sha256', create: createSha256 },
  { name: 'sha512', create: createSha512 },
] as const;

const boundaryLengths = [0, 1, 55, 56, 63, 64, 65, 111, 112, 119, 120, 127, 128, 129, 1000];

describe.each(algorithms)('$name streaming implementation', ({ name, create }) => {
  it('matches the NIST vectors for the empty string and "abc"', () => {
    const vectors = {
      sha256: [
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      ],
      sha512: [
        'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
      ],
    };
    expect(create().digestHex()).toBe(vectors[name][0]);
    const h = create();
    h.update(new TextEncoder().encode('abc'));
    expect(h.digestHex()).toBe(vectors[name][1]);
  });

  it('matches node:crypto at block-boundary lengths with random chunking', () => {
    const rand = mulberry32(12345);
    for (const length of boundaryLengths) {
      const data = randomBytes(length, rand);
      const h = create();
      feedRandomly(h, data, rand);
      expect(h.digestHex(), `length ${length}`).toBe(createHash(name).update(data).digest('hex'));
    }
  });

  it('matches node:crypto at random lengths with random chunking', () => {
    const rand = mulberry32(987654321);
    for (let n = 0; n < 60; n++) {
      const length = Math.floor(rand() * 3000);
      const data = randomBytes(length, rand);
      const h = create();
      feedRandomly(h, data, rand);
      expect(h.digestHex(), `length ${length}`).toBe(createHash(name).update(data).digest('hex'));
    }
  });

  it('gives the same result for one big update and for byte-by-byte updates', () => {
    const data = randomBytes(517, mulberry32(7));
    const whole = create();
    whole.update(data);
    const bytewise = create();
    for (let i = 0; i < data.length; i++) bytewise.update(data.subarray(i, i + 1));
    expect(bytewise.digestHex()).toBe(whole.digestHex());
  });

  it('hashes a ~5 MiB random buffer fed in uneven pieces', () => {
    const rand = mulberry32(2024);
    const data = randomBytes(5 * 1024 * 1024 + 123, rand);
    const h = create();
    let pos = 0;
    const sizes = [1, 0, 4096, 65537, 1048576, 3];
    for (let i = 0; pos < data.length; i++) {
      const end = Math.min(pos + sizes[i % sizes.length], data.length);
      h.update(data.subarray(pos, end));
      pos = end;
    }
    expect(h.digestHex()).toBe(createHash(name).update(data).digest('hex'));
  });

  it('can report the digest more than once and rejects updates after finalizing', () => {
    const h = create();
    h.update(new Uint8Array([1, 2, 3]));
    const first = h.digestHex();
    expect(h.digestHex()).toBe(first);
    expect(() => h.update(new Uint8Array([4]))).toThrow();
  });
});
