import { describe, expect, it, vi } from 'vitest';
import {
  createUuidV4,
  createUuidV7Batch,
  formatUuidV4,
  formatUuidV7,
  inspectUuid,
  normalizeUuidCount,
  readUuidV7Timestamp,
} from './uuid';

describe('UUID v4 generation', () => {
  it('sets the RFC version and variant bits for a Web Crypto fallback', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(0xff);
      return bytes;
    });

    expect(createUuidV4({ getRandomValues })).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(getRandomValues).toHaveBeenCalledOnce();
  });

  it('uses randomUUID when the browser provides it', () => {
    const randomUUID = vi.fn(() => '12345678-1234-4234-9234-123456789abc');
    const getRandomValues = vi.fn();

    expect(createUuidV4({ randomUUID, getRandomValues })).toBe('12345678-1234-4234-9234-123456789abc');
    expect(getRandomValues).not.toHaveBeenCalled();
  });

  it('refuses to generate an identifier without secure randomness', () => {
    expect(() => createUuidV4(null)).toThrow('Secure browser randomness is unavailable.');
  });

  it('requires exactly 16 bytes', () => {
    expect(() => formatUuidV4(new Uint8Array(15))).toThrow('exactly 16 random bytes');
  });
});

describe('UUID v7 generation', () => {
  it('matches the RFC 9562 appendix A.6 example', () => {
    // unix_ts_ms 0x017F22E279B0, rand_a 0xCC3, rand_b 0x18C4DC0C0C07398F
    const random74 = (BigInt('0xcc3') << BigInt(62)) | BigInt('0x18c4dc0c0c07398f');
    expect(formatUuidV7(0x017f22e279b0, random74)).toBe('017f22e2-79b0-7cc3-98c4-dc0c0c07398f');
  });

  it('reads the timestamp back out', () => {
    expect(readUuidV7Timestamp('017f22e2-79b0-7cc3-98c4-dc0c0c07398f')).toBe(1645557742000);
    expect(readUuidV7Timestamp('00010203-0405-4607-8809-0a0b0c0d0e0f')).toBeNull();
    expect(readUuidV7Timestamp('not a uuid')).toBeNull();
  });

  it('rejects out-of-range inputs', () => {
    expect(() => formatUuidV7(-1, BigInt(0))).toThrow('timestamp');
    expect(() => formatUuidV7(2 ** 48, BigInt(0))).toThrow('timestamp');
    expect(() => formatUuidV7(1.5, BigInt(0))).toThrow('timestamp');
    expect(() => formatUuidV7(0, BigInt(1) << BigInt(74))).toThrow('74 bits');
  });

  it('produces sorted, unique ids inside one millisecond', () => {
    const random = {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(0xff);
        return bytes;
      },
    };
    const ids = createUuidV7Batch(50, random, () => 1700000000000);
    expect(new Set(ids).size).toBe(50);
    expect([...ids].sort()).toEqual(ids);
    expect(ids.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))).toBe(true);
    expect(readUuidV7Timestamp(ids[0])).toBe(1700000000000);
  });

  it('never lets the timestamp go backwards', () => {
    const random = { getRandomValues: (bytes: Uint8Array) => bytes };
    const times = [1000, 999, 1001];
    let i = 0;
    const ids = createUuidV7Batch(3, random, () => times[i++]);
    expect(ids.map(readUuidV7Timestamp)).toEqual([1000, 1000, 1001]);
    expect([...ids].sort()).toEqual(ids);
  });

  it('refuses to generate without secure randomness', () => {
    expect(() => createUuidV7Batch(1, null)).toThrow('Secure browser randomness is unavailable.');
  });
});

describe('inspectUuid with RFC 9562 appendix test vectors', () => {
  function inspectOk(input: string) {
    const result = inspectUuid(input);
    if (!result.ok) {
      throw new Error(`expected ${input} to parse, got: ${result.error}`);
    }
    return result;
  }

  it('A.1 v1: timestamp, clock sequence and node', () => {
    const r = inspectOk('C232AB00-9414-11EC-B3C8-9F6BDECED846');
    expect(r.canonical).toBe('c232ab00-9414-11ec-b3c8-9f6bdeced846');
    expect(r.variant).toBe('rfc9562');
    expect(r.version).toBe(1);
    expect(r.timestamp).toEqual({ unixMs: 1645557742000, iso: '2022-02-22T19:22:22.000Z' });
    expect(r.clockSequence).toBe(0x33c8);
    expect(r.node).toBe('9f:6b:de:ce:d8:46');
    expect(r.nodeIsMulticast).toBe(true);
  });

  it('A.1 v1 with the multicast bit cleared reads as a possible MAC address', () => {
    // RFC 9562 appendix A: the starting random node was 0x9E6BDECED846 before bit 0 was set.
    const r = inspectOk('C232AB00-9414-11EC-B3C8-9E6BDECED846');
    expect(r.node).toBe('9e:6b:de:ce:d8:46');
    expect(r.nodeIsMulticast).toBe(false);
    expect(r.nodeNote).toMatch(/could be a network card MAC/);
  });

  it('A.2 v3', () => {
    const r = inspectOk('5df41881-3aed-3515-88a7-2f4a814cf09e');
    expect(r.version).toBe(3);
    expect(r.variant).toBe('rfc9562');
    expect(r.timestamp).toBeNull();
    expect(r.node).toBeNull();
    expect(r.versionNote).toMatch(/MD5/);
  });

  it('A.3 v4', () => {
    const r = inspectOk('919108f7-52d1-4320-9bac-f847db4148a8');
    expect(r.version).toBe(4);
    expect(r.timestamp).toBeNull();
    expect(r.versionNote).toMatch(/122 random bits/);
  });

  it('A.4 v5', () => {
    const r = inspectOk('2ed6657d-e927-568b-95e1-2665a8aea6a2');
    expect(r.version).toBe(5);
    expect(r.timestamp).toBeNull();
    expect(r.versionNote).toMatch(/SHA-1/);
  });

  it('A.5 v6 carries the same time, clock sequence and node as A.1', () => {
    const r = inspectOk('1EC9414C-232A-6B00-B3C8-9F6BDECED846');
    expect(r.version).toBe(6);
    expect(r.timestamp).toEqual({ unixMs: 1645557742000, iso: '2022-02-22T19:22:22.000Z' });
    expect(r.clockSequence).toBe(0x33c8);
    expect(r.node).toBe('9f:6b:de:ce:d8:46');
    expect(r.nodeIsMulticast).toBe(true);
  });

  it('A.6 v7', () => {
    const r = inspectOk('017F22E2-79B0-7CC3-98C4-DC0C0C07398F');
    expect(r.version).toBe(7);
    expect(r.timestamp).toEqual({ unixMs: 1645557742000, iso: '2022-02-22T19:22:22.000Z' });
    expect(r.clockSequence).toBeNull();
    expect(r.node).toBeNull();
    expect(r.versionNote).toMatch(/74 bits/);
  });

  it('B.1 v8 reports only the version', () => {
    const r = inspectOk('2489E9AD-2EE2-8E00-8EC9-32D5F69181C0');
    expect(r.version).toBe(8);
    expect(r.variant).toBe('rfc9562');
    expect(r.timestamp).toBeNull();
    expect(r.node).toBeNull();
  });

  it('v2 is labelled but not decoded', () => {
    const r = inspectOk('000003e8-9414-21ec-b3c8-9f6bdeced846');
    expect(r.version).toBe(2);
    expect(r.timestamp).toBeNull();
    expect(r.versionNote).toMatch(/DCE Security/);
  });
});

describe('inspectUuid variants and special values', () => {
  it('recognises the Nil UUID', () => {
    const r = inspectUuid('00000000-0000-0000-0000-000000000000');
    expect(r).toMatchObject({ ok: true, special: 'nil', version: null, variant: 'ncs' });
  });

  it('recognises the Max UUID', () => {
    const r = inspectUuid('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF');
    expect(r).toMatchObject({
      ok: true,
      special: 'max',
      version: null,
      variant: 'reserved',
      canonical: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    });
  });

  it.each([
    ['00000000-0000-1000-7000-000000000001', 'ncs'],
    ['00000000-0000-1000-8000-000000000001', 'rfc9562'],
    ['00000000-0000-1000-b000-000000000001', 'rfc9562'],
    ['00000000-0000-1000-c000-000000000001', 'microsoft'],
    ['00000000-0000-1000-d000-000000000001', 'microsoft'],
    ['00000000-0000-1000-e000-000000000001', 'reserved'],
    ['00000000-0000-1000-f000-000000000001', 'reserved'],
  ])('classifies %s as %s', (uuid, variant) => {
    expect(inspectUuid(uuid)).toMatchObject({ ok: true, variant });
  });

  it('ignores the version digit outside the RFC 9562 variant', () => {
    for (const uuid of [
      '12345678-1234-1234-7234-123456789abc',
      '12345678-1234-4234-c234-123456789abc',
      '12345678-1234-7234-e234-123456789abc',
    ]) {
      const r = inspectUuid(uuid);
      expect(r).toMatchObject({ ok: true, version: null, undefinedVersion: false, timestamp: null });
      expect(r.ok && r.versionNote).toMatch(/does not apply/);
    }
  });

  it('flags versions 0 and 9-15 in the RFC 9562 variant as undefined', () => {
    for (const digit of ['0', '9', 'a', 'f']) {
      const r = inspectUuid(`12345678-1234-${digit}234-8234-123456789abc`);
      expect(r).toMatchObject({ ok: true, version: null, undefinedVersion: true });
      expect(r.ok && r.versionNote).toMatch(/not defined by RFC 9562/);
    }
  });

  it('floors timestamps before 1970 instead of truncating toward zero', () => {
    // 60-bit timestamp 0x1B21DD213813FFF is one 100 ns tick before the Unix epoch
    // (time_low 13813fff, time_mid 1dd2, time_high 1b2).
    const r = inspectUuid('13813fff-1dd2-11b2-8000-000000000000');
    expect(r).toMatchObject({
      ok: true,
      timestamp: { unixMs: -1, iso: '1969-12-31T23:59:59.999Z' },
    });
  });
});

describe('inspectUuid input forms', () => {
  const canonical = '017f22e2-79b0-7cc3-98c4-dc0c0c07398f';

  it.each([
    ['017f22e279b07cc398c4dc0c0c07398f'],
    ['017F22E2-79B0-7CC3-98C4-DC0C0C07398F'],
    ['017f22E2-79b0-7Cc3-98C4-dc0c0c07398f'],
    ['{017f22e2-79b0-7cc3-98c4-dc0c0c07398f}'],
    ['urn:uuid:017f22e2-79b0-7cc3-98c4-dc0c0c07398f'],
    ['URN:UUID:017F22E2-79B0-7CC3-98C4-DC0C0C07398F'],
    ['  017f22e2-79b0-7cc3-98c4-dc0c0c07398f\n'],
  ])('accepts %s', (input) => {
    expect(inspectUuid(input)).toMatchObject({ ok: true, canonical, version: 7 });
  });

  it('rejects empty input', () => {
    expect(inspectUuid('   ')).toEqual({ ok: false, error: 'Enter a UUID to inspect.' });
  });

  it('reports the actual digit count when the length is wrong', () => {
    expect(inspectUuid('017f22e2-79b0-7cc3-98c4-dc0c0c07398')).toEqual({
      ok: false,
      error: 'A UUID has 32 hexadecimal digits; this input has 31.',
    });
    expect(inspectUuid('017f22e279b07cc398c4dc0c0c07398f00')).toMatchObject({
      ok: false,
      error: expect.stringContaining('this input has 34'),
    });
  });

  it('names non-hex characters', () => {
    const r = inspectUuid('017f22e2-79b0-7cc3-98c4-dc0c0c07398g');
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('"g"') });
    expect(r.ok === false && r.error).toMatch(/non-hexadecimal/);
  });

  it('rejects hyphens outside the 8-4-4-4-12 positions', () => {
    const r = inspectUuid('017f22e27-9b0-7cc3-98c4-dc0c0c07398f');
    expect(r).toMatchObject({ ok: false, error: expect.stringContaining('8-4-4-4-12') });
    expect(inspectUuid('017f22e2-79b07cc3-98c4-dc0c0c07398f')).toMatchObject({ ok: false });
  });

  it('rejects unbalanced braces and mixed wrappers', () => {
    expect(inspectUuid('{017f22e2-79b0-7cc3-98c4-dc0c0c07398f')).toMatchObject({ ok: false });
    expect(inspectUuid('017f22e2-79b0-7cc3-98c4-dc0c0c07398f}')).toMatchObject({ ok: false });
    expect(inspectUuid('urn:uuid:{017f22e2-79b0-7cc3-98c4-dc0c0c07398f}')).toMatchObject({ ok: false });
  });
});

describe('UUID batch count normalization', () => {
  it.each([
    [Number.NaN, 1],
    [-2, 1],
    [3.9, 3],
    [101, 100],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeUuidCount(input)).toBe(expected);
  });
});
