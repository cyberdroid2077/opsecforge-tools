/**
 * Pure JWT helpers shared by the JWT decoder/encoder pages (and, later, a local MCP server).
 *
 * Nothing here touches the DOM, React, the network or storage. Functions that depend on the
 * clock take an explicit `now` (milliseconds since the epoch) so behaviour is deterministic.
 *
 * Decoding is NOT validation: nothing in this module verifies a signature.
 */

export type JwtPart = Record<string, unknown>;

export type DecodedJwt = {
  header: JwtPart;
  payload: JwtPart;
  /** Raw (still encoded) signature segment. */
  signature: string;
  /** The three raw compact-serialization segments. */
  parts: [string, string, string];
};

export class JwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtError';
  }
}

/* ------------------------------------------------------------------ */
/* Base64URL                                                           */
/* ------------------------------------------------------------------ */

const BASE64_ALPHABET = /^[A-Za-z0-9+/_-]*={0,2}$/;

export function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlEncodeString(text: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(text));
}

/** Decodes a Base64URL (or lenient Base64) segment to bytes. Throws JwtError on bad input. */
export function base64UrlDecodeBytes(segment: string): Uint8Array {
  if (!BASE64_ALPHABET.test(segment)) {
    throw new JwtError('not valid Base64URL');
  }
  const base64 = segment.replace(/=+$/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (base64.length % 4 === 1) {
    throw new JwtError('not valid Base64URL');
  }
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new JwtError('not valid Base64URL');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ------------------------------------------------------------------ */
/* Decoding                                                            */
/* ------------------------------------------------------------------ */

function decodeJsonSegment(segment: string, label: 'header' | 'payload'): JwtPart {
  if (!segment) {
    throw new JwtError(`Invalid JWT format: the ${label} segment is empty`);
  }

  let bytes: Uint8Array;
  try {
    bytes = base64UrlDecodeBytes(segment);
  } catch {
    throw new JwtError(`Invalid JWT format: the ${label} segment is not valid Base64URL`);
  }

  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new JwtError(`Invalid JWT format: the ${label} segment is not valid UTF-8 text`);
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new JwtError(`Invalid JWT format: the ${label} segment is not valid JSON`);
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new JwtError('Invalid JWT format: Header and payload must be JSON objects');
  }
  return value as JwtPart;
}

/** Decodes a compact JWS (header.payload.signature). Throws JwtError when it is malformed. */
export function decodeJwt(token: string): DecodedJwt {
  const parts = (token ?? '').trim().split('.');
  if (parts.length !== 3) {
    throw new JwtError('Invalid JWT format: Must have 3 parts separated by dots');
  }
  return {
    header: decodeJsonSegment(parts[0], 'header'),
    payload: decodeJsonSegment(parts[1], 'payload'),
    signature: parts[2],
    parts: [parts[0], parts[1], parts[2]],
  };
}

/* ------------------------------------------------------------------ */
/* Time claims                                                         */
/* ------------------------------------------------------------------ */

export const TIME_CLAIMS = ['exp', 'iat', 'nbf', 'auth_time'] as const;
export type TimeClaimName = (typeof TIME_CLAIMS)[number];

export const isTimeClaim = (key: string): key is TimeClaimName =>
  (TIME_CLAIMS as readonly string[]).includes(key);

/** ECMAScript Date range: +/- 8.64e15 milliseconds around the epoch. */
const MAX_DATE_MS = 8.64e15;

export type TimeClaimStatus =
  | 'expired' // exp is at or before now
  | 'not-expired' // exp is after now
  | 'not-yet-valid' // nbf is after now
  | 'in-effect' // nbf is at or before now
  | 'issued-in-future' // iat / auth_time is after now
  | 'issued' // iat / auth_time is at or before now
  | 'out-of-range' // numeric, but not representable as a Date
  | 'invalid'; // not a numeric date at all

export type TimeClaimAnalysis = {
  claim: TimeClaimName;
  raw: unknown;
  status: TimeClaimStatus;
  /** Seconds since the epoch after millisecond normalisation. Only set for representable dates. */
  seconds?: number;
  utc?: string;
  local?: string;
  /** "in 3 hours" / "3 hours ago". */
  relative?: string;
  /** True when a value above 1e12 was treated as milliseconds. */
  interpretedAsMilliseconds?: boolean;
  /** Complete one-line description for display, derived only from the claim value. */
  display: string;
  /** Short badge text for the status, if the status deserves one. */
  badge?: string;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
};

/** Finite numeric value of a claim (number or numeric string), or null. */
export const toNumericDate = (value: unknown): number | null => {
  const numeric = toNumber(value);
  return numeric !== null && Number.isFinite(numeric) ? numeric : null;
};

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** `diffMs` = target - now. Positive means the target is in the future. */
export function formatRelativeTime(diffMs: number): string {
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;
  const wrap = (phrase: string) => (future ? `in ${phrase}` : `${phrase} ago`);

  if (abs < 60_000) return wrap('less than a minute');
  if (abs < 3_600_000) return wrap(plural(Math.floor(abs / 60_000), 'minute'));
  if (abs < 86_400_000) return wrap(plural(Math.floor(abs / 3_600_000), 'hour'));
  if (abs < 2_592_000_000) return wrap(plural(Math.floor(abs / 86_400_000), 'day'));
  if (abs < 31_536_000_000) return wrap(plural(Math.floor(abs / 2_592_000_000), 'month'));
  return wrap(plural(Math.floor(abs / 31_536_000_000), 'year'));
}

const rawText = (value: unknown): string => {
  if (typeof value === 'number') return String(value); // JSON.stringify(Infinity) is "null"
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/**
 * Interprets one of exp / iat / nbf / auth_time against `now` (ms since epoch).
 * Never throws, whatever the claim value is.
 *
 * Semantics:
 *  - exp: expired when it is at or before now (RFC 7519 4.1.4).
 *  - nbf: "not yet valid" only when it is after now.
 *  - iat / auth_time: informational; a time after now is flagged as a possible clock skew.
 */
export function analyzeTimeClaim(
  claim: TimeClaimName,
  value: unknown,
  now: number = Date.now(),
): TimeClaimAnalysis {
  const numeric = toNumber(value);
  if (numeric === null) {
    return {
      claim,
      raw: value,
      status: 'invalid',
      display: `${rawText(value)} (not a numeric date)`,
      badge: 'invalid value',
    };
  }

  let seconds = numeric;
  let interpretedAsMilliseconds = false;
  if (Number.isFinite(seconds) && Math.abs(seconds) > 1e12) {
    seconds /= 1000; // heuristic: values this large are milliseconds, not seconds
    interpretedAsMilliseconds = true;
  }
  const ms = seconds * 1000;

  if (!Number.isFinite(ms) || Math.abs(ms) > MAX_DATE_MS) {
    return {
      claim,
      raw: value,
      status: 'out-of-range',
      display: `${rawText(value)} (out of representable date range)`,
      badge: 'out of range',
    };
  }

  const date = new Date(ms);
  const utc = date.toISOString().replace('T', ' ').replace('Z', ' UTC');
  const relative = formatRelativeTime(ms - now);
  const isPast = ms <= now;

  let status: TimeClaimStatus;
  let badge: string | undefined;
  if (claim === 'exp') {
    status = isPast ? 'expired' : 'not-expired';
    if (isPast) badge = '⛔ EXPIRED';
  } else if (claim === 'nbf') {
    status = isPast ? 'in-effect' : 'not-yet-valid';
    if (!isPast) badge = '⏳ NOT YET VALID';
  } else {
    status = isPast ? 'issued' : 'issued-in-future';
    if (!isPast) badge = '⚠ in the future (clock skew?)';
  }

  return {
    claim,
    raw: value,
    status,
    seconds,
    utc,
    local: date.toLocaleString(),
    relative,
    interpretedAsMilliseconds: interpretedAsMilliseconds || undefined,
    display: `${utc} (${relative})${badge ? ` ${badge}` : ''}`,
    badge,
  };
}

/* ------------------------------------------------------------------ */
/* Header / claim risk analysis                                        */
/* ------------------------------------------------------------------ */

export type JwtAlert = {
  type: 'error' | 'warning' | 'info';
  message: string;
};

export type JwtAnalysis = {
  alerts: JwtAlert[];
  /** Per-claim interpretation for whichever of exp/iat/nbf/auth_time are present. */
  timeClaims: Partial<Record<TimeClaimName, TimeClaimAnalysis>>;
};

const HMAC_ALGS = new Set(['HS256', 'HS384', 'HS512']);

export function analyzeJwt(
  decoded: Pick<DecodedJwt, 'header' | 'payload' | 'signature'>,
  now: number = Date.now(),
): JwtAnalysis {
  const { header, payload, signature } = decoded;
  const alerts: JwtAlert[] = [];
  const timeClaims: JwtAnalysis['timeClaims'] = {};

  // --- header ---
  const alg = header.alg;
  if (typeof alg !== 'string' || alg === '') {
    alerts.push({
      type: 'warning',
      message: 'Header has no usable "alg" value, so the signing algorithm is unknown.',
    });
  } else if (alg.toLowerCase() === 'none') {
    alerts.push({
      type: 'error',
      message:
        'Dangerous: "alg: none" detected. Token is not cryptographically signed and can be forged.',
    });
  } else {
    if (HMAC_ALGS.has(alg)) {
      alerts.push({
        type: 'info',
        message:
          'HMAC algorithm detected. The signature cannot be verified offline without the shared secret.',
      });
    }
    if (signature === '') {
      alerts.push({
        type: 'warning',
        message: `The signature segment is empty although the header declares "${alg}".`,
      });
    }
  }

  for (const field of ['jku', 'jwk', 'x5u'] as const) {
    if (field in header) {
      alerts.push({
        type: 'warning',
        message: `Header carries "${field}", which lets the token point at its own key material. A verifier must not trust it unless the key source is allow-listed.`,
      });
    }
  }

  // --- time claims ---
  for (const claim of TIME_CLAIMS) {
    if (!(claim in payload)) continue;
    const info = analyzeTimeClaim(claim, payload[claim], now);
    timeClaims[claim] = info;

    if (info.status === 'invalid' || info.status === 'out-of-range') {
      alerts.push({
        type: 'warning',
        message: `Claim "${claim}" is ${
          info.status === 'invalid' ? 'not a numeric date' : 'outside the representable date range'
        }: ${rawText(payload[claim])}`,
      });
    } else if (info.status === 'expired') {
      alerts.push({
        type: 'warning',
        message: `Token expired on ${info.utc} (${info.relative}).`,
      });
    } else if (info.status === 'not-yet-valid') {
      alerts.push({
        type: 'warning',
        message: `Token is not valid yet: "nbf" is ${info.utc} (${info.relative}).`,
      });
    } else if (info.status === 'issued-in-future') {
      alerts.push({
        type: 'warning',
        message: `"${claim}" is ${info.relative}. The issuer's clock may be ahead of this device (clock skew?).`,
      });
    }
  }

  if (!('exp' in payload)) {
    alerts.push({ type: 'info', message: 'Token has no "exp" (expiration) claim.' });
  }
  if (!('iat' in payload)) {
    alerts.push({ type: 'info', message: 'Token has no "iat" (issued at) claim.' });
  }

  return { alerts, timeClaims };
}

/* ------------------------------------------------------------------ */
/* Encoding (HMAC-signed synthetic fixtures)                           */
/* ------------------------------------------------------------------ */

export type JwtHmacAlg = 'HS256' | 'HS512';

const HMAC_HASH: Record<JwtHmacAlg, 'SHA-256' | 'SHA-512'> = {
  HS256: 'SHA-256',
  HS512: 'SHA-512',
};

/** Parses editor text that must be a JSON object. Throws JwtError with a short message. */
export function parseJsonObject(text: string, label: string): JwtPart {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new JwtError(`${label} is not valid JSON`);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new JwtError(`${label} must be a JSON object`);
  }
  return value as JwtPart;
}

/** Returns an error message for editor text, or '' when it is a valid JSON object. */
export function validateJsonObject(text: string, label: string): string {
  try {
    parseJsonObject(text, label);
    return '';
  } catch (err) {
    return err instanceof Error ? err.message : `${label} is invalid`;
  }
}

export async function signHmac(
  data: string,
  secret: string,
  algorithm: JwtHmacAlg,
  subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle,
): Promise<string> {
  if (!subtle) throw new JwtError('Web Crypto API not available');
  const encoder = new TextEncoder();
  const key = await subtle.importKey(
    'raw',
    encoder.encode(secret) as BufferSource,
    { name: 'HMAC', hash: { name: HMAC_HASH[algorithm] } },
    false,
    ['sign'],
  );
  const signature = await subtle.sign('HMAC', key, encoder.encode(data) as BufferSource);
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

export type EncodedJwt = {
  token: string;
  header: JwtPart;
  payload: JwtPart;
  parts: [string, string, string];
};

/**
 * Builds and HMAC-signs a compact JWT. The header's `alg` is forced to `algorithm`.
 * Intended for synthetic development fixtures only.
 */
export async function encodeJwt(input: {
  headerJson: string;
  payloadJson: string;
  secret: string;
  algorithm: JwtHmacAlg;
}): Promise<EncodedJwt> {
  if (!(input.algorithm in HMAC_HASH)) {
    throw new JwtError(`Unsupported algorithm: ${String(input.algorithm)}`);
  }
  if (!input.secret.trim()) {
    throw new JwtError('Secret key is required');
  }

  const header = { ...parseJsonObject(input.headerJson, 'Header'), alg: input.algorithm };
  const payload = parseJsonObject(input.payloadJson, 'Payload');

  const headerSegment = base64UrlEncodeString(JSON.stringify(header));
  const payloadSegment = base64UrlEncodeString(JSON.stringify(payload));
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const signatureSegment = await signHmac(signingInput, input.secret, input.algorithm);

  return {
    token: `${signingInput}.${signatureSegment}`,
    header,
    payload,
    parts: [headerSegment, payloadSegment, signatureSegment],
  };
}
