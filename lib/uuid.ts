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

export type UuidVariant = 'ncs' | 'rfc9562' | 'microsoft' | 'reserved';

export type UuidInspectionTimestamp = {
  /** Milliseconds since the Unix epoch (negative before 1970). */
  unixMs: number;
  /** ISO 8601 string, or null when the date is outside the range a JS Date can represent. */
  iso: string | null;
};

export type UuidInspection = {
  ok: true;
  /** Lowercase, hyphenated form. */
  canonical: string;
  variant: UuidVariant;
  variantLabel: string;
  /** Set for the Nil (all zero) and Max (all f) UUIDs, RFC 9562 sections 5.9 and 5.10. */
  special: 'nil' | 'max' | null;
  /** 1-8 for a defined version in the RFC 9562 variant; null when not applicable or undefined. */
  version: number | null;
  /** True when the variant is 10xx but the version nibble is 0 or 9-15. */
  undefinedVersion: boolean;
  /** Human-readable description of the version (or why it does not apply). */
  versionNote: string;
  timestamp: UuidInspectionTimestamp | null;
  /** 14-bit clock sequence for v1 and v6. */
  clockSequence: number | null;
  /** Node as xx:xx:xx:xx:xx:xx for v1 and v6. */
  node: string | null;
  /** Least significant bit of the first node octet (the IEEE 802 multicast bit). */
  nodeIsMulticast: boolean | null;
  nodeNote: string | null;
};

export type UuidInspectionError = { ok: false; error: string };

const GREGORIAN_TO_UNIX_100NS = BigInt('122192928000000000');
const TEN_THOUSAND = BigInt(10000);
const MAX_DATE_MS = 8.64e15;

function toIso(unixMs: number) {
  if (!Number.isFinite(unixMs) || Math.abs(unixMs) > MAX_DATE_MS) {
    return null;
  }
  return new Date(unixMs).toISOString();
}

function gregorianToTimestamp(ticks: bigint): UuidInspectionTimestamp {
  const unix100ns = ticks - GREGORIAN_TO_UNIX_100NS;
  let ms = unix100ns / TEN_THOUSAND;
  // BigInt division truncates toward zero; floor it for dates before 1970.
  if (unix100ns < BigInt(0) && unix100ns % TEN_THOUSAND !== BigInt(0)) {
    ms -= BigInt(1);
  }
  const unixMs = Number(ms);
  return { unixMs, iso: toIso(unixMs) };
}

function formatNode(hex: string) {
  return hex.match(/.{2}/g)!.join(':');
}

const VARIANT_LABELS: Record<UuidVariant, string> = {
  ncs: 'NCS backward compatibility (reserved)',
  rfc9562: 'RFC 9562 (formerly RFC 4122)',
  microsoft: 'Microsoft backward compatibility (reserved)',
  reserved: 'Reserved for future definition',
};

function normalizeUuidText(input: string): { hex: string } | { error: string } {
  let text = input.trim();
  if (text === '') {
    return { error: 'Enter a UUID to inspect.' };
  }

  if (/^urn:uuid:/i.test(text)) {
    text = text.slice('urn:uuid:'.length);
  } else if (text.startsWith('{') || text.endsWith('}')) {
    if (!(text.startsWith('{') && text.endsWith('}'))) {
      return { error: 'Braces must come as a pair: {…} around the whole UUID.' };
    }
    text = text.slice(1, -1);
  }

  const bad = Array.from(new Set(text.match(/[^0-9a-fA-F-]/g) ?? []));
  if (bad.length > 0) {
    const shown = bad
      .slice(0, 3)
      .map((char) => JSON.stringify(char))
      .join(', ');
    return {
      error: `Contains non-hexadecimal character${bad.length > 1 ? 's' : ''} (${shown}${bad.length > 3 ? ', …' : ''}). A UUID uses only 0-9, a-f and hyphens.`,
    };
  }

  const hex = text.replaceAll('-', '').toLowerCase();
  if (hex.length !== 32) {
    return { error: `A UUID has 32 hexadecimal digits; this input has ${hex.length}.` };
  }

  if (text.includes('-') && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(text)) {
    return {
      error: 'Hyphens must be in the standard 8-4-4-4-12 positions (or omitted entirely).',
    };
  }

  return { hex };
}

/**
 * Parses a UUID in the browser and reports its variant, version and embedded fields
 * (RFC 9562 sections 4.1, 4.2 and 5). Accepts hyphenated or compact hex in any case,
 * optionally wrapped in braces or prefixed with `urn:uuid:`.
 */
export function inspectUuid(input: string): UuidInspection | UuidInspectionError {
  const normalized = normalizeUuidText(input);
  if ('error' in normalized) {
    return { ok: false, error: normalized.error };
  }

  const { hex } = normalized;
  const canonical = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  const variantNibble = parseInt(hex[16], 16);
  const versionNibble = parseInt(hex[12], 16);

  let variant: UuidVariant;
  if ((variantNibble & 0x8) === 0) {
    variant = 'ncs';
  } else if ((variantNibble & 0xc) === 0x8) {
    variant = 'rfc9562';
  } else if ((variantNibble & 0xe) === 0xc) {
    variant = 'microsoft';
  } else {
    variant = 'reserved';
  }

  const result: UuidInspection = {
    ok: true,
    canonical,
    variant,
    variantLabel: VARIANT_LABELS[variant],
    special: null,
    version: null,
    undefinedVersion: false,
    versionNote: '',
    timestamp: null,
    clockSequence: null,
    node: null,
    nodeIsMulticast: null,
    nodeNote: null,
  };

  if (/^0{32}$/.test(hex)) {
    result.special = 'nil';
    result.variantLabel = 'Not applicable (special value)';
    result.versionNote = 'Nil UUID: all 128 bits are zero (RFC 9562 section 5.9). It has no version.';
    return result;
  }
  if (/^f{32}$/.test(hex)) {
    result.special = 'max';
    result.variantLabel = 'Not applicable (special value)';
    result.versionNote = 'Max UUID: all 128 bits are one (RFC 9562 section 5.10). It has no version.';
    return result;
  }

  if (variant !== 'rfc9562') {
    result.versionNote =
      'The version field is only defined for the RFC 9562 variant (10xx), so the version digit does not apply to this UUID.';
    return result;
  }

  if (versionNibble === 0 || versionNibble > 8) {
    result.undefinedVersion = true;
    result.versionNote = `Version ${versionNibble} is not defined by RFC 9562 (defined versions are 1 to 8).`;
    return result;
  }

  result.version = versionNibble;
  const timeHex = hex.slice(13, 16);

  switch (versionNibble) {
    case 1:
    case 6: {
      const ticks =
        versionNibble === 1
          ? BigInt('0x' + timeHex + hex.slice(8, 12) + hex.slice(0, 8))
          : BigInt('0x' + hex.slice(0, 8) + hex.slice(8, 12) + timeHex);
      result.timestamp = gregorianToTimestamp(ticks);
      result.clockSequence = ((parseInt(hex.slice(16, 18), 16) & 0x3f) << 8) | parseInt(hex.slice(18, 20), 16);
      const nodeHex = hex.slice(20);
      result.node = formatNode(nodeHex);
      result.nodeIsMulticast = (parseInt(nodeHex.slice(0, 2), 16) & 1) === 1;
      result.nodeNote = result.nodeIsMulticast
        ? 'The multicast bit is 1, which network card addresses never have (RFC 9562 section 6.10). This looks like a random or non-MAC node.'
        : 'The multicast bit is 0, so this node could be a network card MAC address. That cannot be confirmed from the UUID alone.';
      result.versionNote =
        versionNibble === 1
          ? 'Version 1: Gregorian time-based. 60-bit timestamp in 100 ns steps since 1582-10-15 (RFC 9562 section 5.1).'
          : 'Version 6: Gregorian time-based, reordered so it sorts by time. Same fields as v1 (RFC 9562 section 5.6).';
      break;
    }
    case 7: {
      result.timestamp = { unixMs: parseInt(hex.slice(0, 12), 16), iso: null };
      result.timestamp.iso = toIso(result.timestamp.unixMs);
      result.versionNote =
        'Version 7: Unix Epoch time-based. The first 48 bits are Unix milliseconds; the other 74 bits are random or a counter (RFC 9562 section 5.7).';
      break;
    }
    case 3:
      result.versionNote =
        'Version 3: name-based, MD5 of a namespace UUID plus a name (RFC 9562 section 5.3). There is no timestamp, and the name cannot be read back from the UUID, though a guessed name can be confirmed by hashing it again.';
      break;
    case 5:
      result.versionNote =
        'Version 5: name-based, SHA-1 of a namespace UUID plus a name (RFC 9562 section 5.5). There is no timestamp, and the name cannot be read back from the UUID, though a guessed name can be confirmed by hashing it again.';
      break;
    case 4:
      result.versionNote =
        'Version 4: 122 random bits, no embedded time (RFC 9562 section 5.4).';
      break;
    case 2:
      result.versionNote =
        'Version 2: DCE Security. RFC 9562 does not define its layout, so no fields are decoded here.';
      break;
    default:
      result.versionNote =
        'Version 8: custom layout (RFC 9562 section 5.8). Its fields are application-defined, so none are decoded here.';
  }

  return result;
}

/** Reads the embedded Unix millisecond timestamp from a v7 UUID, or null for anything else. */
export function readUuidV7Timestamp(uuid: string) {
  const hex = uuid.replaceAll('-', '');
  if (!/^[0-9a-fA-F]{32}$/.test(hex) || hex[12] !== '7') {
    return null;
  }
  return parseInt(hex.slice(0, 12), 16);
}
