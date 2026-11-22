/**
 * Local inspection and optional decryption of encrypted JWTs (JWE compact serialization) with the
 * Web Crypto API.
 *
 * Nothing here touches the DOM, React, the network or storage. `inspectJwe` throws JwtError on
 * malformed input; `decryptJwe` never throws and returns every failure as a structured result.
 *
 * Decrypting a JWE shows what the holder of the key can read. It does not show who created the
 * token: anyone with the recipient's public key (or the shared key) can produce a valid JWE, so
 * the content still has to be validated by the application that accepts it.
 *
 * References: RFC 7516 (JWE), RFC 7518 (JWA) sections 4 and 5, RFC 7519 section 5.2 ("cty": "JWT"),
 * RFC 8725 sections 3.2 and 3.6.
 */

import { base64UrlDecodeBytes, JwtError, type JwtAlert, type JwtPart } from './jwt';

/* ------------------------------------------------------------------ */
/* Algorithm tables (RFC 7518 sections 4.1 and 5.1)                    */
/* ------------------------------------------------------------------ */

type Hash = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

type AlgSpec =
  | { kind: 'dir'; label: string }
  | { kind: 'aes-kw'; kekBytes: number; label: string }
  | { kind: 'aes-gcm-kw'; kekBytes: number; label: string }
  | { kind: 'rsa-oaep'; hash: Hash; label: string }
  | { kind: 'rsa1_5'; label: string }
  /** kekBytes is 0 for direct key agreement, where the derived key is the CEK itself. */
  | { kind: 'ecdh-es'; kekBytes: number; label: string }
  | { kind: 'pbes2'; hash: Hash; kekBytes: number; label: string };

const KEY_ALGORITHMS: Record<string, AlgSpec> = {
  dir: { kind: 'dir', label: 'the shared symmetric key is used directly as the content encryption key' },
  A128KW: { kind: 'aes-kw', kekBytes: 16, label: 'AES Key Wrap with a 128-bit key' },
  A192KW: { kind: 'aes-kw', kekBytes: 24, label: 'AES Key Wrap with a 192-bit key' },
  A256KW: { kind: 'aes-kw', kekBytes: 32, label: 'AES Key Wrap with a 256-bit key' },
  A128GCMKW: { kind: 'aes-gcm-kw', kekBytes: 16, label: 'key wrapping with AES-GCM and a 128-bit key' },
  A192GCMKW: { kind: 'aes-gcm-kw', kekBytes: 24, label: 'key wrapping with AES-GCM and a 192-bit key' },
  A256GCMKW: { kind: 'aes-gcm-kw', kekBytes: 32, label: 'key wrapping with AES-GCM and a 256-bit key' },
  'RSA-OAEP': { kind: 'rsa-oaep', hash: 'SHA-1', label: 'RSAES-OAEP with the default parameters (SHA-1 and MGF1 with SHA-1)' },
  'RSA-OAEP-256': { kind: 'rsa-oaep', hash: 'SHA-256', label: 'RSAES-OAEP with SHA-256 and MGF1 with SHA-256' },
  RSA1_5: { kind: 'rsa1_5', label: 'RSAES-PKCS1-v1_5' },
  'ECDH-ES': { kind: 'ecdh-es', kekBytes: 0, label: 'ECDH Ephemeral-Static key agreement; the derived key is the content encryption key' },
  'ECDH-ES+A128KW': { kind: 'ecdh-es', kekBytes: 16, label: 'ECDH Ephemeral-Static key agreement, then AES Key Wrap with a 128-bit key' },
  'ECDH-ES+A192KW': { kind: 'ecdh-es', kekBytes: 24, label: 'ECDH Ephemeral-Static key agreement, then AES Key Wrap with a 192-bit key' },
  'ECDH-ES+A256KW': { kind: 'ecdh-es', kekBytes: 32, label: 'ECDH Ephemeral-Static key agreement, then AES Key Wrap with a 256-bit key' },
  'PBES2-HS256+A128KW': { kind: 'pbes2', hash: 'SHA-256', kekBytes: 16, label: 'a password stretched with PBKDF2 (HMAC SHA-256), then AES Key Wrap with a 128-bit key' },
  'PBES2-HS384+A192KW': { kind: 'pbes2', hash: 'SHA-384', kekBytes: 24, label: 'a password stretched with PBKDF2 (HMAC SHA-384), then AES Key Wrap with a 192-bit key' },
  'PBES2-HS512+A256KW': { kind: 'pbes2', hash: 'SHA-512', kekBytes: 32, label: 'a password stretched with PBKDF2 (HMAC SHA-512), then AES Key Wrap with a 256-bit key' },
};

type EncSpec =
  | { kind: 'gcm'; cekBytes: number; ivBytes: 12; tagBytes: 16; label: string }
  | { kind: 'cbc-hs'; cekBytes: number; ivBytes: 16; tagBytes: number; hash: Hash; label: string };

const CONTENT_ALGORITHMS: Record<string, EncSpec> = {
  A128GCM: { kind: 'gcm', cekBytes: 16, ivBytes: 12, tagBytes: 16, label: 'AES-GCM with a 128-bit key' },
  A192GCM: { kind: 'gcm', cekBytes: 24, ivBytes: 12, tagBytes: 16, label: 'AES-GCM with a 192-bit key' },
  A256GCM: { kind: 'gcm', cekBytes: 32, ivBytes: 12, tagBytes: 16, label: 'AES-GCM with a 256-bit key' },
  // RFC 7518 section 5.2: the key is a MAC key followed by an AES key of the same size.
  'A128CBC-HS256': { kind: 'cbc-hs', cekBytes: 32, ivBytes: 16, tagBytes: 16, hash: 'SHA-256', label: 'AES-128-CBC with HMAC SHA-256 (a 256-bit key: half for the MAC, half for AES)' },
  'A192CBC-HS384': { kind: 'cbc-hs', cekBytes: 48, ivBytes: 16, tagBytes: 24, hash: 'SHA-384', label: 'AES-192-CBC with HMAC SHA-384 (a 384-bit key: half for the MAC, half for AES)' },
  'A256CBC-HS512': { kind: 'cbc-hs', cekBytes: 64, ivBytes: 16, tagBytes: 32, hash: 'SHA-512', label: 'AES-256-CBC with HMAC SHA-512 (a 512-bit key: half for the MAC, half for AES)' },
};

const own = <T,>(table: Record<string, T>, key: unknown): T | null =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(table, key) ? table[key] : null;

/* ------------------------------------------------------------------ */
/* Inspection                                                          */
/* ------------------------------------------------------------------ */

export type JweInspection = {
  /** The decoded JWE Protected Header. This is the only part readable without the key. */
  header: JwtPart;
  /** protected header, encrypted key, IV, ciphertext, authentication tag: still encoded. */
  parts: [string, string, string, string, string];
  alg: string | null;
  enc: string | null;
  /** Plain-language description of "alg" / "enc", or null for values this page does not know. */
  algLabel: string | null;
  encLabel: string | null;
  /** Decoded length of each binary part, in bytes. */
  sizes: { encryptedKey: number; iv: number; ciphertext: number; tag: number };
  notes: JwtAlert[];
};

const isUnpaddedBase64Url = (segment: string) => /^[A-Za-z0-9_-]*$/.test(segment);

/** True when the text has the five dot-separated segments of a JWE compact serialization. */
export function isJweCompact(token: string): boolean {
  return (token ?? '').trim().split('.').length === 5;
}

function decodeProtectedHeader(segment: string): JwtPart {
  if (!segment) throw new JwtError('Invalid JWE format: the protected header segment is empty');
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(base64UrlDecodeBytes(segment));
  } catch {
    throw new JwtError('Invalid JWE format: the protected header segment is not Base64URL-encoded UTF-8 text');
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new JwtError('Invalid JWE format: the protected header segment is not valid JSON');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new JwtError('Invalid JWE format: the protected header must be a JSON object');
  }
  return value as JwtPart;
}

/**
 * Decodes the protected header of a compact JWE and checks the sizes of the other four parts
 * against what the declared algorithms require. Throws JwtError when the token is malformed.
 */
export function inspectJwe(token: string): JweInspection {
  const parts = (token ?? '').trim().split('.');
  if (parts.length !== 5) {
    throw new JwtError('Invalid JWE format: a compact JWE has 5 parts separated by dots');
  }
  const header = decodeProtectedHeader(parts[0]);

  const names = ['encrypted key', 'initialization vector', 'ciphertext', 'authentication tag'];
  const decoded = parts.slice(1).map((segment, i) => {
    if (!isUnpaddedBase64Url(segment) || segment.length % 4 === 1) {
      throw new JwtError(`Invalid JWE format: the ${names[i]} segment is not valid Base64URL`);
    }
    return base64UrlDecodeBytes(segment);
  });
  const sizes = {
    encryptedKey: decoded[0].length,
    iv: decoded[1].length,
    ciphertext: decoded[2].length,
    tag: decoded[3].length,
  };

  const alg = typeof header.alg === 'string' && header.alg !== '' ? header.alg : null;
  const enc = typeof header.enc === 'string' && header.enc !== '' ? header.enc : null;
  const algSpec = own(KEY_ALGORITHMS, alg);
  const encSpec = own(CONTENT_ALGORITHMS, enc);
  const notes: JwtAlert[] = [];

  notes.push({
    type: 'info',
    message:
      'This is an encrypted JWT (JWE). Only the protected header below is readable without the key; the claims are inside the ciphertext.',
  });

  if (!alg) {
    notes.push({ type: 'warning', message: 'The header has no usable "alg" value, so the key management algorithm is unknown.' });
  } else if (!algSpec) {
    notes.push({ type: 'warning', message: `"alg" is "${alg}", which is not one of the JWE key management algorithms in RFC 7518 section 4.1.` });
  }
  if (!enc) {
    notes.push({ type: 'warning', message: 'The header has no usable "enc" value. A JWE must name its content encryption algorithm (RFC 7516 section 4.1.2).' });
  } else if (!encSpec) {
    notes.push({ type: 'warning', message: `"enc" is "${enc}", which is not one of the content encryption algorithms in RFC 7518 section 5.1.` });
  }

  if (algSpec) {
    const direct = algSpec.kind === 'dir' || (algSpec.kind === 'ecdh-es' && algSpec.kekBytes === 0);
    if (direct && sizes.encryptedKey !== 0) {
      notes.push({
        type: 'warning',
        message: `With "${alg}" the encrypted key part must be empty (RFC 7516 section 5.1), but it is ${sizes.encryptedKey} bytes.`,
      });
    }
    if (!direct && sizes.encryptedKey === 0) {
      notes.push({ type: 'warning', message: `With "${alg}" the encrypted key part must not be empty, but it is.` });
    }
    if (encSpec && sizes.encryptedKey !== 0) {
      // AES Key Wrap output is 8 bytes longer than its input (RFC 3394); AES-GCM key wrapping keeps the length.
      const wrapsWithAesKw = algSpec.kind === 'aes-kw' || algSpec.kind === 'pbes2' || (algSpec.kind === 'ecdh-es' && algSpec.kekBytes > 0);
      const expected = wrapsWithAesKw ? encSpec.cekBytes + 8 : algSpec.kind === 'aes-gcm-kw' ? encSpec.cekBytes : null;
      if (expected !== null && sizes.encryptedKey !== expected) {
        notes.push({
          type: 'warning',
          message: `The encrypted key is ${sizes.encryptedKey} bytes; "${alg}" wrapping a ${encSpec.cekBytes * 8}-bit "${enc}" key gives ${expected} bytes.`,
        });
      }
    }
    if (algSpec.kind === 'rsa-oaep' || algSpec.kind === 'rsa1_5') {
      if (sizes.encryptedKey > 0) {
        notes.push({
          type: sizes.encryptedKey < 256 ? 'warning' : 'info',
          message: `The encrypted key is ${sizes.encryptedKey} bytes, so the recipient's RSA key is ${sizes.encryptedKey * 8} bits.${
            sizes.encryptedKey < 256 ? ' RFC 7518 sections 4.2 and 4.3 require 2048 bits or larger.' : ''
          }`,
        });
      }
    }
    if (algSpec.kind === 'rsa1_5') {
      notes.push({
        type: 'warning',
        message: 'RSA1_5 is RSAES-PKCS1-v1_5. RFC 8725 section 3.2 recommends avoiding it in favour of RSAES-OAEP.',
      });
    }
    if (algSpec.kind === 'pbes2') {
      const count = header.p2c;
      if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        notes.push({ type: 'warning', message: 'A PBES2 header needs "p2c" (the PBKDF2 iteration count) as a positive integer.' });
      } else if (count < 1000) {
        notes.push({ type: 'warning', message: `"p2c" is ${count}; RFC 7518 section 4.8.1.2 recommends an iteration count of at least 1000.` });
      }
      if (typeof header.p2s !== 'string') {
        notes.push({ type: 'warning', message: 'A PBES2 header needs "p2s" (the salt input).' });
      }
    }
    if (algSpec.kind === 'ecdh-es' && (typeof header.epk !== 'object' || header.epk === null)) {
      notes.push({ type: 'warning', message: 'An ECDH-ES header needs "epk", the sender\'s ephemeral public key.' });
    }
    if (algSpec.kind === 'aes-gcm-kw' && (typeof header.iv !== 'string' || typeof header.tag !== 'string')) {
      notes.push({ type: 'warning', message: 'An AES-GCM key wrapping header needs both "iv" and "tag" (RFC 7518 section 4.7.1).' });
    }
  }

  if (encSpec) {
    if (sizes.iv !== encSpec.ivBytes) {
      notes.push({
        type: 'warning',
        message: `The initialization vector is ${sizes.iv * 8} bits; "${enc}" uses ${encSpec.ivBytes * 8} bits (RFC 7518 section ${encSpec.kind === 'gcm' ? '5.3' : '5.2'}).`,
      });
    }
    if (sizes.tag !== encSpec.tagBytes) {
      notes.push({
        type: 'warning',
        message: `The authentication tag is ${sizes.tag * 8} bits; "${enc}" uses ${encSpec.tagBytes * 8} bits.`,
      });
    }
  }

  if ('zip' in header) {
    notes.push({
      type: 'warning',
      message: `The plaintext was compressed before encryption ("zip": ${JSON.stringify(header.zip)}). RFC 8725 section 3.6 advises against compressing before encrypting, because the ciphertext length can reveal information about the plaintext.`,
    });
  }
  if (typeof header.cty === 'string' && header.cty.toUpperCase() === 'JWT') {
    notes.push({
      type: 'info',
      message: '"cty" is "JWT": the plaintext is itself a JWT (a nested JWT, usually signed first and then encrypted).',
    });
  }

  return {
    header,
    parts: [parts[0], parts[1], parts[2], parts[3], parts[4]],
    alg,
    enc,
    algLabel: algSpec ? algSpec.label : null,
    encLabel: encSpec ? encSpec.label : null,
    sizes,
    notes,
  };
}

/* ------------------------------------------------------------------ */
/* Decryption                                                          */
/* ------------------------------------------------------------------ */

/** What the user has to supply to decrypt a token with a given "alg". */
export type JweKeyKind = 'symmetric' | 'password' | 'rsa-private' | 'ec-private';

/** Which kind of key a header "alg" needs, or null when it cannot be decrypted here. */
export function jweKeyKindForAlg(alg: unknown): JweKeyKind | null {
  const spec = own(KEY_ALGORITHMS, alg);
  if (!spec) return null;
  switch (spec.kind) {
    case 'dir':
    case 'aes-kw':
    case 'aes-gcm-kw':
      return 'symmetric';
    case 'pbes2':
      return 'password';
    case 'rsa-oaep':
      return 'rsa-private';
    case 'ecdh-es':
      return 'ec-private';
    case 'rsa1_5':
      return null;
  }
}

export type JwePlaintext =
  /** UTF-8 JSON object: normally the JWT claims set. */
  | { kind: 'claims'; claims: JwtPart; text: string }
  /** A compact JWS or JWE carried inside this one (nested JWT). */
  | { kind: 'jwt'; text: string }
  | { kind: 'text'; text: string }
  /** Not UTF-8. `hex` covers at most the first 256 bytes. */
  | { kind: 'binary'; hex: string; bytes: number };

export type JweDecryptResult = {
  /** 'failed' means the cryptographic checks rejected the key or the token. */
  status: 'decrypted' | 'failed' | 'error';
  alg: string | null;
  enc: string | null;
  warnings: string[];
  message: string;
  plaintext?: JwePlaintext;
};

/** Internal: carries a user-facing message out of the helpers below. */
class DecryptFailure extends Error {
  constructor(
    message: string,
    readonly status: 'failed' | 'error' = 'error',
  ) {
    super(message);
  }
}

const encoder = new TextEncoder();
const bufferSource = (bytes: Uint8Array) => bytes as BufferSource;

type JsonObject = Record<string, unknown>;
const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

const uint32be = (value: number) => new Uint8Array([value >>> 24, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);

function parseJsonKey(text: string): JsonObject | null {
  if (!text.trimStart().startsWith('{')) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return isObject(parsed) ? parsed : null;
  } catch {
    throw new DecryptFailure('The key looks like JSON but is not valid JSON.');
  }
}

const WRONG_KEY =
  'Decryption failed: the key does not match this token, or the token was changed after it was encrypted. The check does not say which.';

/** Reads a symmetric key of exactly `needed` bytes from an oct JWK, hex, or Base64URL / Base64 text. */
function symmetricKeyBytes(keyText: string, needed: number, alg: string): Uint8Array {
  if (keyText.trim() === '') throw new DecryptFailure('Paste the shared key.');
  if (/-----BEGIN /.test(keyText)) {
    throw new DecryptFailure(`"${alg}" uses a shared symmetric key, not a PEM key pair.`);
  }
  const lengthHint = `"${alg}" with this token needs a ${needed * 8}-bit key (${needed} bytes)`;

  const jwk = parseJsonKey(keyText);
  if (jwk) {
    if (Array.isArray(jwk.keys)) throw new DecryptFailure('Paste a single JWK, not a JWK Set.');
    if (jwk.kty !== 'oct' || typeof jwk.k !== 'string') {
      throw new DecryptFailure(`"${alg}" needs a symmetric key: an "oct" JWK with a "k" member, or the key as hex or Base64URL.`);
    }
    let bytes: Uint8Array;
    try {
      bytes = base64UrlDecodeBytes(jwk.k);
    } catch {
      throw new DecryptFailure('The "k" member of the oct JWK is not valid Base64URL.');
    }
    if (bytes.length !== needed) {
      throw new DecryptFailure(`${lengthHint}, but the JWK holds ${bytes.length} bytes.`);
    }
    return bytes;
  }

  const compact = keyText.replace(/\s+/g, '');
  if (/^[0-9a-fA-F]+$/.test(compact) && compact.length === needed * 2) {
    const bytes = new Uint8Array(needed);
    for (let i = 0; i < needed; i += 1) bytes[i] = parseInt(compact.slice(i * 2, i * 2 + 2), 16);
    return bytes;
  }
  try {
    const bytes = base64UrlDecodeBytes(compact);
    if (bytes.length === needed) return bytes;
  } catch {
    // fall through to the length message
  }
  throw new DecryptFailure(
    `${lengthHint}. The input is not that length as hex (${needed * 2} characters) or as Base64URL. Paste the raw key in one of those forms, or an oct JWK.`,
  );
}

const PRIVATE_PEM = /-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/;

type PrivateKeyMaterial = { format: 'pkcs8'; der: Uint8Array } | { format: 'jwk'; jwk: JsonObject };

function parsePrivateKey(keyText: string, alg: string, family: 'RSA' | 'EC'): PrivateKeyMaterial {
  const trimmed = keyText.trim();
  if (trimmed === '') throw new DecryptFailure(`Paste the recipient's ${family} private key (PKCS#8 PEM or JWK).`);

  if (/-----BEGIN (RSA|EC) PRIVATE KEY-----/.test(trimmed)) {
    throw new DecryptFailure(
      'This is a traditional "BEGIN RSA PRIVATE KEY" / "BEGIN EC PRIVATE KEY" block, which Web Crypto cannot import. Convert it to PKCS#8 ("BEGIN PRIVATE KEY") with: openssl pkcs8 -topk8 -nocrypt -in key.pem',
    );
  }
  if (/-----BEGIN ENCRYPTED PRIVATE KEY-----/.test(trimmed)) {
    throw new DecryptFailure('Password-protected private keys are not supported. Use an unencrypted PKCS#8 test key.');
  }
  if (/-----BEGIN (PUBLIC KEY|CERTIFICATE)-----/.test(trimmed)) {
    throw new DecryptFailure(`A public key or certificate can only encrypt. Decrypting "${alg}" needs the matching private key.`);
  }
  const pem = PRIVATE_PEM.exec(trimmed);
  if (pem) {
    const compact = pem[1].replace(/\s+/g, '');
    try {
      const binary = atob(compact);
      const der = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) der[i] = binary.charCodeAt(i);
      return { format: 'pkcs8', der };
    } catch {
      throw new DecryptFailure('The PEM body is not valid Base64.');
    }
  }

  const jwk = parseJsonKey(trimmed);
  if (jwk) {
    if (Array.isArray(jwk.keys)) throw new DecryptFailure('Paste a single JWK, not a JWK Set.');
    if (jwk.kty !== family) {
      throw new DecryptFailure(`"${alg}" needs an ${family} key, but the JWK has kty "${String(jwk.kty)}".`);
    }
    if (typeof jwk.d !== 'string') {
      throw new DecryptFailure(`This JWK has no "d" member, so it is a public key. Decrypting "${alg}" needs the private key.`);
    }
    return { format: 'jwk', jwk };
  }
  throw new DecryptFailure('Could not read the key. Expected a PKCS#8 PEM block ("BEGIN PRIVATE KEY") or a single private JWK (JSON).');
}

const pick = (jwk: JsonObject, names: string[]): JsonWebKey => {
  const out: Record<string, unknown> = {};
  for (const name of names) if (typeof jwk[name] === 'string') out[name] = jwk[name];
  return out as JsonWebKey;
};

/** Unwraps a CEK with AES Key Wrap (RFC 3394). The CEK is imported as an HMAC key so any length can be exported. */
async function aesKwUnwrap(subtle: SubtleCrypto, kekBytes: Uint8Array, wrapped: Uint8Array): Promise<Uint8Array> {
  let kek: CryptoKey;
  try {
    kek = await subtle.importKey('raw', bufferSource(kekBytes), 'AES-KW', false, ['unwrapKey']);
  } catch {
    throw new DecryptFailure(`This browser's Web Crypto would not import a ${kekBytes.length * 8}-bit AES key. Some browsers do not support 192-bit AES.`);
  }
  try {
    const cek = await subtle.unwrapKey('raw', bufferSource(wrapped), kek, 'AES-KW', { name: 'HMAC', hash: 'SHA-256' }, true, ['sign']);
    return new Uint8Array(await subtle.exportKey('raw', cek));
  } catch {
    throw new DecryptFailure(WRONG_KEY, 'failed');
  }
}

const EC_CURVES: Record<string, number> = { 'P-256': 256, 'P-384': 384, 'P-521': 528 };

/** Concat KDF with SHA-256, parameters as set by RFC 7518 section 4.6.2. */
async function concatKdf(subtle: SubtleCrypto, z: Uint8Array, algorithmId: string, header: JwtPart, keyBytes: number): Promise<Uint8Array> {
  const info = (name: 'apu' | 'apv') => {
    const value = header[name];
    if (value === undefined) return uint32be(0);
    if (typeof value !== 'string') throw new DecryptFailure(`The "${name}" header value must be a Base64URL string.`);
    try {
      const bytes = base64UrlDecodeBytes(value);
      return concatBytes(uint32be(bytes.length), bytes);
    } catch {
      throw new DecryptFailure(`The "${name}" header value is not valid Base64URL.`);
    }
  };
  const id = encoder.encode(algorithmId);
  const otherInfo = concatBytes(uint32be(id.length), id, info('apu'), info('apv'), uint32be(keyBytes * 8));
  const rounds = Math.ceil(keyBytes / 32);
  const out: Uint8Array[] = [];
  for (let counter = 1; counter <= rounds; counter += 1) {
    out.push(new Uint8Array(await subtle.digest('SHA-256', bufferSource(concatBytes(uint32be(counter), z, otherInfo)))));
  }
  return concatBytes(...out).subarray(0, keyBytes);
}

async function ecdhSharedSecret(subtle: SubtleCrypto, keyText: string, header: JwtPart, alg: string): Promise<Uint8Array> {
  const epk = header.epk;
  if (!isObject(epk) || epk.kty !== 'EC' || typeof epk.crv !== 'string' || typeof epk.x !== 'string' || typeof epk.y !== 'string') {
    if (isObject(epk) && epk.kty === 'OKP') {
      throw new DecryptFailure(`The sender's "epk" is an OKP key (${String(epk.crv)}). Only the NIST curves P-256, P-384 and P-521 are handled here.`);
    }
    throw new DecryptFailure('The header has no usable "epk" (an EC public key with "crv", "x" and "y").');
  }
  const bits = own(EC_CURVES, epk.crv);
  if (!bits) throw new DecryptFailure(`Curve "${epk.crv}" is not supported here. Supported: P-256, P-384, P-521.`);
  const params = { name: 'ECDH', namedCurve: epk.crv };

  const material = parsePrivateKey(keyText, alg, 'EC');
  if (material.format === 'jwk' && material.jwk.crv !== epk.crv) {
    throw new DecryptFailure(`The token was encrypted to a ${epk.crv} key, but the pasted JWK has crv "${String(material.jwk.crv)}".`);
  }
  let privateKey: CryptoKey;
  try {
    privateKey =
      material.format === 'pkcs8'
        ? await subtle.importKey('pkcs8', bufferSource(material.der), params, false, ['deriveBits'])
        : await subtle.importKey('jwk', pick(material.jwk, ['kty', 'crv', 'x', 'y', 'd']), params, false, ['deriveBits']);
  } catch {
    throw new DecryptFailure(`The private key could not be imported as an ECDH key on ${epk.crv}. The token was encrypted to a ${epk.crv} key.`);
  }
  let publicKey: CryptoKey;
  try {
    publicKey = await subtle.importKey('jwk', { kty: 'EC', crv: epk.crv, x: epk.x, y: epk.y }, params, false, []);
  } catch {
    throw new DecryptFailure(`The "epk" in the header is not a valid public key on ${epk.crv}.`);
  }
  try {
    return new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, bits));
  } catch {
    throw new DecryptFailure('The ECDH key agreement could not be computed with this key.');
  }
}

/** PBKDF2 iteration counts above this are refused, so a hostile header cannot freeze the tab. */
export const JWE_MAX_PBES2_COUNT = 5_000_000;

/** Resolves the content encryption key for the token. */
async function resolveCek(
  subtle: SubtleCrypto,
  algSpec: AlgSpec,
  encSpec: EncSpec,
  alg: string,
  header: JwtPart,
  encryptedKey: Uint8Array,
  keyText: string,
  warnings: string[],
): Promise<Uint8Array> {
  switch (algSpec.kind) {
    case 'dir':
      if (encryptedKey.length !== 0) throw new DecryptFailure('With "dir" the encrypted key part must be empty (RFC 7516 section 5.1).');
      return symmetricKeyBytes(keyText, encSpec.cekBytes, alg);

    case 'aes-kw':
      return aesKwUnwrap(subtle, symmetricKeyBytes(keyText, algSpec.kekBytes, alg), encryptedKey);

    case 'aes-gcm-kw': {
      const kekBytes = symmetricKeyBytes(keyText, algSpec.kekBytes, alg);
      if (typeof header.iv !== 'string' || typeof header.tag !== 'string') {
        throw new DecryptFailure(`"${alg}" needs the "iv" and "tag" header values (RFC 7518 section 4.7.1), and this header does not have both.`);
      }
      let iv: Uint8Array;
      let tag: Uint8Array;
      try {
        iv = base64UrlDecodeBytes(header.iv);
        tag = base64UrlDecodeBytes(header.tag);
      } catch {
        throw new DecryptFailure('The "iv" or "tag" header value is not valid Base64URL.');
      }
      if (iv.length !== 12 || tag.length !== 16) {
        throw new DecryptFailure(`"${alg}" uses a 96-bit "iv" and a 128-bit "tag" (RFC 7518 section 4.7); this header has ${iv.length * 8} and ${tag.length * 8} bits.`);
      }
      let kek: CryptoKey;
      try {
        kek = await subtle.importKey('raw', bufferSource(kekBytes), 'AES-GCM', false, ['decrypt']);
      } catch {
        throw new DecryptFailure(`This browser's Web Crypto would not import a ${kekBytes.length * 8}-bit AES key. Some browsers do not support 192-bit AES.`);
      }
      try {
        return new Uint8Array(
          await subtle.decrypt({ name: 'AES-GCM', iv: bufferSource(iv), tagLength: 128 }, kek, bufferSource(concatBytes(encryptedKey, tag))),
        );
      } catch {
        throw new DecryptFailure(WRONG_KEY, 'failed');
      }
    }

    case 'rsa-oaep': {
      const material = parsePrivateKey(keyText, alg, 'RSA');
      const params = { name: 'RSA-OAEP', hash: { name: algSpec.hash } };
      let key: CryptoKey;
      try {
        key =
          material.format === 'pkcs8'
            ? await subtle.importKey('pkcs8', bufferSource(material.der), params, false, ['decrypt'])
            : await subtle.importKey('jwk', pick(material.jwk, ['kty', 'n', 'e', 'd', 'p', 'q', 'dp', 'dq', 'qi']), params, false, ['decrypt']);
      } catch {
        throw new DecryptFailure('The private key could not be imported as an RSA key. A JWK needs n, e, d, p, q, dp, dq and qi.');
      }
      const bits = (key.algorithm as RsaHashedKeyAlgorithm).modulusLength;
      if (typeof bits === 'number' && bits < 2048) {
        warnings.push(`The RSA key is ${bits} bits; RFC 7518 section 4.3 requires 2048 bits or larger for ${alg}.`);
      }
      try {
        return new Uint8Array(await subtle.decrypt({ name: 'RSA-OAEP' }, key, bufferSource(encryptedKey)));
      } catch {
        throw new DecryptFailure(WRONG_KEY, 'failed');
      }
    }

    case 'ecdh-es': {
      const z = await ecdhSharedSecret(subtle, keyText, header, alg);
      if (algSpec.kekBytes === 0) {
        if (encryptedKey.length !== 0) throw new DecryptFailure('With "ECDH-ES" the encrypted key part must be empty (RFC 7516 section 5.1).');
        return concatKdf(subtle, z, String(header.enc), header, encSpec.cekBytes);
      }
      return aesKwUnwrap(subtle, await concatKdf(subtle, z, alg, header, algSpec.kekBytes), encryptedKey);
    }

    case 'pbes2': {
      if (keyText === '') throw new DecryptFailure('Enter the password.');
      const count = header.p2c;
      if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
        throw new DecryptFailure('The header has no usable "p2c" (PBKDF2 iteration count).');
      }
      if (count > JWE_MAX_PBES2_COUNT) {
        throw new DecryptFailure(
          `"p2c" asks for ${count} PBKDF2 iterations. This page refuses more than ${JWE_MAX_PBES2_COUNT} so that a token cannot tie up the browser.`,
        );
      }
      if (typeof header.p2s !== 'string') throw new DecryptFailure('The header has no "p2s" (salt input).');
      let saltInput: Uint8Array;
      try {
        saltInput = base64UrlDecodeBytes(header.p2s);
      } catch {
        throw new DecryptFailure('The "p2s" header value is not valid Base64URL.');
      }
      if (keyText !== keyText.trim()) {
        warnings.push('The password has leading or trailing whitespace (such as a newline). It is used as typed.');
      }
      // RFC 7518 section 4.8.1.1: salt = UTF8(alg) || 0x00 || p2s.
      const salt = concatBytes(encoder.encode(alg), new Uint8Array([0]), saltInput);
      let derived: Uint8Array;
      try {
        const password = await subtle.importKey('raw', bufferSource(encoder.encode(keyText)), 'PBKDF2', false, ['deriveBits']);
        derived = new Uint8Array(
          await subtle.deriveBits({ name: 'PBKDF2', hash: algSpec.hash, salt: bufferSource(salt), iterations: count }, password, algSpec.kekBytes * 8),
        );
      } catch {
        throw new DecryptFailure('The key could not be derived from the password.');
      }
      return aesKwUnwrap(subtle, derived, encryptedKey);
    }

    case 'rsa1_5':
      throw new DecryptFailure(
        'RSA1_5 (RSAES-PKCS1-v1_5) cannot be decrypted here: the Web Crypto API in browsers does not offer that algorithm. The header and part sizes above are still accurate.',
      );
  }
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function decryptContent(
  subtle: SubtleCrypto,
  encSpec: EncSpec,
  cek: Uint8Array,
  aad: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array,
): Promise<Uint8Array> {
  if (cek.length !== encSpec.cekBytes) {
    throw new DecryptFailure(
      `The key carried in the token is ${cek.length * 8} bits, but "enc" needs a ${encSpec.cekBytes * 8}-bit content encryption key.`,
      'failed',
    );
  }
  if (iv.length !== encSpec.ivBytes || tag.length !== encSpec.tagBytes) {
    throw new DecryptFailure(
      `The initialization vector must be ${encSpec.ivBytes * 8} bits and the authentication tag ${encSpec.tagBytes * 8} bits for this "enc"; this token has ${iv.length * 8} and ${tag.length * 8}.`,
      'failed',
    );
  }
  const unsupported = () =>
    new DecryptFailure(`This browser's Web Crypto would not import a ${(encSpec.kind === 'gcm' ? cek.length : cek.length / 2) * 8}-bit AES key. Some browsers do not support 192-bit AES.`);

  if (encSpec.kind === 'gcm') {
    let key: CryptoKey;
    try {
      key = await subtle.importKey('raw', bufferSource(cek), 'AES-GCM', false, ['decrypt']);
    } catch {
      throw unsupported();
    }
    try {
      return new Uint8Array(
        await subtle.decrypt(
          { name: 'AES-GCM', iv: bufferSource(iv), additionalData: bufferSource(aad), tagLength: 128 },
          key,
          bufferSource(concatBytes(ciphertext, tag)),
        ),
      );
    } catch {
      throw new DecryptFailure(WRONG_KEY, 'failed');
    }
  }

  // AES_CBC_HMAC_SHA2 (RFC 7518 section 5.2.2): check the tag first, then decrypt.
  const half = cek.length / 2;
  const macKey = await subtle.importKey('raw', bufferSource(cek.subarray(0, half)), { name: 'HMAC', hash: encSpec.hash }, false, ['sign']);
  // AL is the bit length of the AAD as a 64-bit big-endian integer; the high word is 0 for any real header.
  const al = concatBytes(uint32be(0), uint32be(aad.length * 8));
  const mac = new Uint8Array(await subtle.sign('HMAC', macKey, bufferSource(concatBytes(aad, iv, ciphertext, al))));
  if (!constantTimeEqual(mac.subarray(0, encSpec.tagBytes), tag)) {
    throw new DecryptFailure(WRONG_KEY, 'failed');
  }
  let encKey: CryptoKey;
  try {
    encKey = await subtle.importKey('raw', bufferSource(cek.subarray(half)), 'AES-CBC', false, ['decrypt']);
  } catch {
    throw unsupported();
  }
  try {
    return new Uint8Array(await subtle.decrypt({ name: 'AES-CBC', iv: bufferSource(iv) }, encKey, bufferSource(ciphertext)));
  } catch {
    throw new DecryptFailure(WRONG_KEY, 'failed');
  }
}

/** Decompressed plaintext larger than this is refused. */
export const JWE_MAX_INFLATED_BYTES = 1024 * 1024;

type StreamCtor = new (format: string) => { readable: ReadableStream<Uint8Array>; writable: WritableStream<BufferSource> };

/** Inflates raw DEFLATE data (RFC 1951), stopping once the output passes the size limit. */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const Ctor = (globalThis as { DecompressionStream?: StreamCtor }).DecompressionStream;
  if (!Ctor) {
    throw new DecryptFailure('The token decrypted, but its plaintext is DEFLATE-compressed and this browser has no DecompressionStream to inflate it.');
  }
  const corrupt = () => new DecryptFailure('The token decrypted, but its plaintext is not valid DEFLATE data although the header says "zip": "DEF".');
  let stream: InstanceType<StreamCtor>;
  try {
    stream = new Ctor('deflate-raw');
  } catch {
    throw new DecryptFailure('The token decrypted, but this browser cannot inflate raw DEFLATE data.');
  }
  const writer = stream.writable.getWriter();
  // Errors surface on the reader; these promises only need to not go unhandled.
  writer.write(bufferSource(data)).catch(() => undefined);
  writer.close().catch(() => undefined);

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > JWE_MAX_INFLATED_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new DecryptFailure(`The token decrypted, but its plaintext inflates to more than ${JWE_MAX_INFLATED_BYTES} bytes, so it is not shown.`);
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof DecryptFailure) throw err;
    throw corrupt();
  }
  return concatBytes(...chunks);
}

const COMPACT_JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*(\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*)?$/;

function classifyPlaintext(bytes: Uint8Array): JwePlaintext {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    const head = bytes.subarray(0, 256);
    return { kind: 'binary', hex: Array.from(head, (b) => b.toString(16).padStart(2, '0')).join(' '), bytes: bytes.length };
  }
  if (COMPACT_JWT.test(text.trim())) return { kind: 'jwt', text: text.trim() };
  try {
    const parsed: unknown = JSON.parse(text);
    if (isObject(parsed)) return { kind: 'claims', claims: parsed, text };
  } catch {
    // not JSON: plain text
  }
  return { kind: 'text', text };
}

const TRUST_REMINDER =
  'Decryption shows what the key holder can read; it does not show who created the token. Anyone with the public or shared key can encrypt, so a verifier still has to validate the content.';

/**
 * Decrypts a compact JWE with the key the user supplies, using the algorithms named in its own
 * protected header. Reading the algorithms from the token is a debugging convenience: a real
 * recipient fixes the algorithms it accepts in its own configuration (RFC 8725 section 3.1).
 *
 * `key` is, depending on the header alg:
 *  - dir, A*KW, A*GCMKW: the shared key as an oct JWK, hex or Base64URL;
 *  - PBES2-*: the password as UTF-8 text, used exactly as given;
 *  - RSA-OAEP, RSA-OAEP-256: the RSA private key as PKCS#8 PEM or JWK;
 *  - ECDH-ES*: the EC private key (P-256, P-384 or P-521) as PKCS#8 PEM or JWK.
 */
export async function decryptJwe(
  token: string,
  key: string,
  subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle,
): Promise<JweDecryptResult> {
  const warnings: string[] = [];
  let alg: string | null = null;
  let enc: string | null = null;
  const fail = (status: 'failed' | 'error', message: string): JweDecryptResult => ({ status, alg, enc, warnings, message });

  try {
    let inspected: JweInspection;
    try {
      inspected = inspectJwe(token);
    } catch (err) {
      return fail('error', err instanceof Error ? err.message : 'The token could not be read.');
    }
    ({ alg, enc } = inspected);
    const { header } = inspected;

    if (!alg) return fail('error', 'The header has no usable "alg" value, so there is no way to tell how the key was protected.');
    const algSpec = own(KEY_ALGORITHMS, alg);
    if (!algSpec) return fail('error', `Key management algorithm "${alg}" is not supported here.`);
    if (!enc) return fail('error', 'The header has no usable "enc" value.');
    const encSpec = own(CONTENT_ALGORITHMS, enc);
    if (!encSpec) return fail('error', `Content encryption algorithm "${enc}" is not supported here.`);

    if (Array.isArray(header.crit) && header.crit.length > 0) {
      return fail(
        'error',
        `The header marks ${header.crit.map((name) => `"${String(name)}"`).join(', ')} as critical ("crit"). This page does not implement those extensions, and a token with a critical parameter the recipient does not understand is invalid (RFC 7516 section 4.1.13, RFC 7515 section 4.1.11).`,
      );
    }
    if ('zip' in header && header.zip !== 'DEF') {
      return fail('error', `"zip" is ${JSON.stringify(header.zip)}; the only compression RFC 7516 defines is "DEF".`);
    }
    if (!subtle) {
      return fail('error', 'Web Crypto (crypto.subtle) is not available in this browser context. It requires a secure context (HTTPS or localhost).');
    }

    const [protectedSegment, keySegment, ivSegment, ciphertextSegment, tagSegment] = inspected.parts;
    const cek = await resolveCek(subtle, algSpec, encSpec, alg, header, base64UrlDecodeBytes(keySegment), key, warnings);
    // The additional authenticated data is the protected header segment exactly as received, never re-encoded.
    let plain = await decryptContent(
      subtle,
      encSpec,
      cek,
      encoder.encode(protectedSegment),
      base64UrlDecodeBytes(ivSegment),
      base64UrlDecodeBytes(ciphertextSegment),
      base64UrlDecodeBytes(tagSegment),
    );
    if (header.zip === 'DEF') plain = await inflateRaw(plain);

    return {
      status: 'decrypted',
      alg,
      enc,
      warnings,
      message: `Decrypted with ${alg} and ${enc}: ${plain.length} bytes of plaintext. ${TRUST_REMINDER}`,
      plaintext: classifyPlaintext(plain),
    };
  } catch (err) {
    if (err instanceof DecryptFailure) return fail(err.status, err.message);
    return fail('error', 'Decryption could not be completed.');
  }
}
