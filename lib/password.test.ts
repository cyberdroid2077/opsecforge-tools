import { describe, expect, it } from 'vitest';
import {
  PASSWORD_CHARSETS,
  classifyEntropy,
  generatePassword,
  randomIndex,
  type RandomSource,
} from './password';

/** A RandomSource that replays fixed 32-bit values, then fails loudly. */
function replay(values: number[]): RandomSource {
  let cursor = 0;
  return {
    getRandomValues: ((array: Uint32Array) => {
      if (cursor >= values.length) throw new Error('ran out of scripted values');
      array[0] = values[cursor];
      cursor += 1;
      return array;
    }) as RandomSource['getRandomValues'],
  };
}

describe('randomIndex', () => {
  it('rejects draws from the biased tail instead of folding them with modulo', () => {
    // 2^32 = 61356675 * 70 + 46, so draws >= 61356675 * 70 are over-represented by modulo.
    const limit = Math.floor(2 ** 32 / 70) * 70;
    expect(limit).toBe(4294967250);

    // 4294967250 would map to 0 under plain modulo; it must be redrawn.
    expect(randomIndex(70, replay([limit, 4294967295, 7]))).toBe(7);
    // The largest accepted value maps to the last index.
    expect(randomIndex(70, replay([limit - 1]))).toBe(69);
  });

  it('accepts everything when max divides 2^32', () => {
    expect(randomIndex(16, replay([4294967295]))).toBe(15);
  });

  it('is uniform over a small range with a counting source', () => {
    const counts = new Array(7).fill(0);
    const limit = Math.floor(2 ** 32 / 7) * 7;
    // Walk every residue pattern evenly: values 0..(7*1000-1) plus rejected tails.
    const values: number[] = [];
    for (let i = 0; i < 7000; i += 1) values.push(i, limit + (i % 3));
    const source = replay(values);
    for (let i = 0; i < 7000; i += 1) counts[randomIndex(7, source)] += 1;
    expect(counts.every((count) => count === 1000)).toBe(true);
  });

  it('validates max', () => {
    expect(() => randomIndex(0)).toThrow(RangeError);
    expect(() => randomIndex(1.5)).toThrow(RangeError);
  });
});

describe('generatePassword', () => {
  const pools = Object.values(PASSWORD_CHARSETS);

  it('returns the requested length and uses only the selected sets', () => {
    for (let run = 0; run < 50; run += 1) {
      const password = generatePassword(24, pools);
      expect(password).toHaveLength(24);
      expect(password).toMatch(/^[A-Za-z0-9!@#$%^&*]+$/);
    }
  });

  it('includes at least one character from every selected set', () => {
    for (let run = 0; run < 200; run += 1) {
      const password = generatePassword(8, pools);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[!@#$%^&*]/);
    }
  });

  it('returns an empty string when no set is selected and rejects impossible lengths', () => {
    expect(generatePassword(16, [])).toBe('');
    expect(() => generatePassword(3, pools)).toThrow(RangeError);
  });
});

describe('classifyEntropy', () => {
  it('uses the documented thresholds', () => {
    expect(classifyEntropy(49.9).label).toBe('Weak');
    expect(classifyEntropy(50).label).toBe('Fair');
    expect(classifyEntropy(79.9).label).toBe('Fair');
    expect(classifyEntropy(80).label).toBe('Strong');
    expect(classifyEntropy(111.9).label).toBe('Strong');
    expect(classifyEntropy(112).label).toBe('Very strong');
  });
});
