export const PASSWORD_CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*',
} as const;

export type PasswordCharset = keyof typeof PASSWORD_CHARSETS;

export type RandomSource = {
  getRandomValues: <T extends ArrayBufferView | null>(array: T) => T;
};

const UINT32_RANGE = 2 ** 32;

/**
 * Uniform random integer in [0, max) from crypto.getRandomValues.
 *
 * A plain `value % max` over a 32-bit value favours the low results whenever
 * max does not divide 2^32 (for example 70 or 26). To remove that bias, draws
 * at or above the largest multiple of max below 2^32 are rejected and redrawn.
 */
export function randomIndex(max: number, random: RandomSource = globalThis.crypto): number {
  if (!Number.isInteger(max) || max < 1 || max > UINT32_RANGE) {
    throw new RangeError('max must be an integer between 1 and 2^32.');
  }

  const limit = Math.floor(UINT32_RANGE / max) * max;
  const buffer = new Uint32Array(1);

  do {
    random.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
}

/**
 * Builds a password that contains at least one character from every selected
 * pool, fills the rest from the merged pools, then Fisher-Yates shuffles.
 */
export function generatePassword(
  length: number,
  pools: readonly string[],
  random: RandomSource = globalThis.crypto,
): string {
  const merged = pools.join('');

  if (!merged) {
    return '';
  }

  if (length < pools.length) {
    throw new RangeError('Length must be at least the number of selected character sets.');
  }

  const generated = pools.map((pool) => pool[randomIndex(pool.length, random)]);

  while (generated.length < length) {
    generated.push(merged[randomIndex(merged.length, random)]);
  }

  for (let index = generated.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, random);
    [generated[index], generated[swapIndex]] = [generated[swapIndex], generated[index]];
  }

  return generated.join('');
}

/** Upper bound on entropy in bits for `length` independent uniform picks from `poolSize` symbols. */
export function estimateEntropyBits(length: number, poolSize: number): number {
  if (length < 1 || poolSize < 2) {
    return 0;
  }

  return length * Math.log2(poolSize);
}

/**
 * Number of strings of `length` over disjoint pools that contain at least one
 * character from every pool (inclusion-exclusion). The "one from each set"
 * rule can only choose among these strings, so log2 of this count caps the
 * entropy of the generator.
 */
export function countStringsUsingEveryPool(length: number, poolSizes: readonly number[]): bigint {
  const total = poolSizes.reduce((sum, size) => sum + size, 0);
  let count = BigInt(0);

  for (let mask = 0; mask < 1 << poolSizes.length; mask += 1) {
    let remaining = total;
    let bits = 0;

    poolSizes.forEach((size, index) => {
      if (mask & (1 << index)) {
        remaining -= size;
        bits += 1;
      }
    });

    const term = BigInt(remaining) ** BigInt(length);
    count += bits % 2 === 0 ? term : -term;
  }

  return count;
}

export function policyEntropyBits(length: number, poolSizes: readonly number[]): number {
  const count = countStringsUsingEveryPool(length, poolSizes);
  return count > BigInt(0) ? Math.log2(Number(count)) : 0;
}

export type PasswordStrength = {
  label: 'Weak' | 'Fair' | 'Strong' | 'Very strong';
  tone: string;
  bar: string;
  percent: number;
};

/**
 * The thresholds are this tool's own convention, not a published standard.
 */
export function classifyEntropy(bits: number): PasswordStrength {
  if (bits >= 112) {
    return { label: 'Very strong', tone: 'text-emerald-400', bar: 'bg-emerald-500', percent: 100 };
  }
  if (bits >= 80) {
    return { label: 'Strong', tone: 'text-cyan-400', bar: 'bg-cyan-500', percent: 75 };
  }
  if (bits >= 50) {
    return { label: 'Fair', tone: 'text-amber-400', bar: 'bg-amber-500', percent: 50 };
  }
  return { label: 'Weak', tone: 'text-rose-400', bar: 'bg-rose-500', percent: 25 };
}
