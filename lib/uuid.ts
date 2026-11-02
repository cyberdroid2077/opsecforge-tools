type SecureRandom = {
  randomUUID?: () => string;
  getRandomValues: (bytes: Uint8Array) => Uint8Array;
};

export type UuidVersion = 'v4' | 'v7';

export function formatUuidV4(bytes: Uint8Array) {
  if (bytes.length !== 16) {
    throw new Error('UUID v4 generation requires exactly 16 random bytes.');
  }

  const value = Uint8Array.from(bytes);
  value[6] = (value[6] & 0x0f) | 0x40;
  value[8] = (value[8] & 0x3f) | 0x80;

  const hex = Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createUuidV4(random: SecureRandom | null = globalThis.crypto) {
  if (!random) {
    throw new Error('Secure browser randomness is unavailable.');
  }

  if (typeof random.randomUUID === 'function') {
    return random.randomUUID();
  }

  const bytes = new Uint8Array(16);
  random.getRandomValues(bytes);
  return formatUuidV4(bytes);
}

export function normalizeUuidCount(count: number) {
  if (!Number.isFinite(count)) {
    return 1;
  }

  return Math.min(100, Math.max(1, Math.trunc(count)));
}

const MAX_UNIX_MS = 2 ** 48 - 1;
const RAND_MASK = (BigInt(1) << BigInt(74)) - BigInt(1);
const RAND_B_MASK = (BigInt(1) << BigInt(62)) - BigInt(1);

/**
 * RFC 9562 section 5.7 layout: 48-bit Unix ms timestamp, version 7, 12 bits rand_a,
 * variant 10, 62 bits rand_b. `random74` supplies rand_a (high 12 bits) and rand_b (low 62).
 */
export function formatUuidV7(unixMs: number, random74: bigint) {
  if (!Number.isInteger(unixMs) || unixMs < 0 || unixMs > MAX_UNIX_MS) {
    throw new Error('UUID v7 timestamp must be an integer from 0 to 2^48 - 1 milliseconds.');
  }

  if (random74 < BigInt(0) || random74 > RAND_MASK) {
    throw new Error('UUID v7 random part must fit in 74 bits.');
  }

  const randA = random74 >> BigInt(62);
  const randB = random74 & RAND_B_MASK;
  const hex =
    unixMs.toString(16).padStart(12, '0') +
    (BigInt('0x7000') | randA).toString(16).padStart(4, '0') +
    ((BigInt('0b10') << BigInt(62)) | randB).toString(16).padStart(16, '0');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function randomBits74(random: SecureRandom) {
  const bytes = new Uint8Array(10);
  random.getRandomValues(bytes);
  let value = BigInt(0);
  for (const byte of bytes) {
    value = (value << BigInt(8)) | BigInt(byte);
  }
  // Clear the top bit so a same-millisecond run has room to count up.
  return (value & RAND_MASK) >> BigInt(1);
}

/**
 * Generates `count` v7 UUIDs that sort in generation order. Within one millisecond the
 * 74 random bits are incremented by one (the monotonic-counter idea from RFC 9562
 * section 6.2); if the clock steps back, the previous timestamp is kept.
 */
export function createUuidV7Batch(
  count: number,
  random: SecureRandom | null = globalThis.crypto,
  now: () => number = Date.now,
) {
  if (!random) {
    throw new Error('Secure browser randomness is unavailable.');
  }

  const values: string[] = [];
  let lastMs = -1;
  let lastRandom = BigInt(0);

  for (let i = 0; i < count; i += 1) {
    let ms = Math.max(Math.trunc(now()), lastMs);
    let rand: bigint;

    if (ms === lastMs) {
      rand = lastRandom + BigInt(1);
      if (rand > RAND_MASK) {
        ms += 1;
        rand = randomBits74(random);
      }
    } else {
      rand = randomBits74(random);
    }

    values.push(formatUuidV7(ms, rand));
    lastMs = ms;
    lastRandom = rand;
  }

  return values;
}

/** Reads the embedded Unix millisecond timestamp from a v7 UUID, or null for anything else. */
export function readUuidV7Timestamp(uuid: string) {
  const hex = uuid.replaceAll('-', '');
  if (!/^[0-9a-fA-F]{32}$/.test(hex) || hex[12] !== '7') {
    return null;
  }
  return parseInt(hex.slice(0, 12), 16);
}
