/**
 * Local JWT signature verification (JWS compact serialization) with the Web Crypto API.
 *
 * Nothing here touches the DOM, React, the network or storage, and nothing throws to the caller:
 * every failure is returned as a structured result.
 *
 * A valid signature only shows that the token was signed with the supplied key (and not changed
 * since). It does not show that the token is trustworthy; issuer, audience, expiry, token type and
 * the origin of the key still have to be checked by the application that accepts the token.
 *
 * References: RFC 7515 (JWS), RFC 7518 (JWA), RFC 8037 (EdDSA / OKP keys in JOSE), RFC 8032 (Ed25519),
 * RFC 8725 (JWT best current practices).
 */

import { base64UrlDecodeBytes, decodeJwt, type DecodedJwt } from './jwt';

export type JwtVerifyStatus = 'valid' | 'invalid' | 'error';

export type JwtVerifyResult = {
  status: JwtVerifyStatus;
  /** The "alg" header value, or null when it could not be read. */
  alg: string | null;
  /** The "kid" of the key that was used, when that key had one. */
  keyIdUsed?: string;
  warnings: string[];
  message: string;
};

/** What the user has to supply for an algorithm. */
export type JwtKeyKind = 'secret' | 'public-key';

type AlgSpec =
  | { kind: 'hmac'; hash: 'SHA-256' | 'SHA-384' | 'SHA-512'; minKeyBytes: number }
  | { kind: 'rsa'; hash: 'SHA-256' | 'SHA-384' | 'SHA-512' }
  | { kind: 'rsa-pss'; hash: 'SHA-256' | 'SHA-384' | 'SHA-512'; saltLength: number }
  | {
      kind: 'ecdsa';
      hash: 'SHA-256' | 'SHA-384' | 'SHA-512';
      curve: 'P-256' | 'P-384' | 'P-521';
      /** Length of the raw r||s signature (RFC 7518 section 3.4). */
      signatureBytes: number;
    }
  | {
      kind: 'eddsa';
      curve: 'Ed25519';
      /** Length of an Ed25519 signature (RFC 8032 section 5.1.6). */
      signatureBytes: 64;
    };

const ALGORITHMS: Record<string, AlgSpec> = {
  HS256: { kind: 'hmac', hash: 'SHA-256', minKeyBytes: 32 },
  HS384: { kind: 'hmac', hash: 'SHA-384', minKeyBytes: 48 },
  HS512: { kind: 'hmac', hash: 'SHA-512', minKeyBytes: 64 },
  RS256: { kind: 'rsa', hash: 'SHA-256' },
  RS384: { kind: 'rsa', hash: 'SHA-384' },
  RS512: { kind: 'rsa', hash: 'SHA-512' },
  // RFC 7518 section 3.5: the salt is the same size as the hash output.
  PS256: { kind: 'rsa-pss', hash: 'SHA-256', saltLength: 32 },
  PS384: { kind: 'rsa-pss', hash: 'SHA-384', saltLength: 48 },
  PS512: { kind: 'rsa-pss', hash: 'SHA-512', saltLength: 64 },
  ES256: { kind: 'ecdsa', hash: 'SHA-256', curve: 'P-256', signatureBytes: 64 },
  ES384: { kind: 'ecdsa', hash: 'SHA-384', curve: 'P-384', signatureBytes: 96 },
  ES512: { kind: 'ecdsa', hash: 'SHA-512', curve: 'P-521', signatureBytes: 132 },
  // RFC 8037 section 3.1: "EdDSA" with an OKP key; only the Ed25519 curve is handled here.
  EdDSA: { kind: 'eddsa', curve: 'Ed25519', signatureBytes: 64 },
};

export const SUPPORTED_JWT_VERIFY_ALGORITHMS = Object.keys(ALGORITHMS);

/** Which kind of key a header "alg" needs, or null for unsupported / unsigned algorithms. */
export function jwtKeyKindForAlg(alg: unknown): JwtKeyKind | null {
  if (typeof alg !== 'string' || !Object.prototype.hasOwnProperty.call(ALGORITHMS, alg)) return null;
  return ALGORITHMS[alg].kind === 'hmac' ? 'secret' : 'public-key';
}

const TRUST_REMINDER =
  'A valid signature does not make the token trustworthy: still check iss, aud, exp and token type, and where the key came from.';

/** Internal: carries a user-facing message out of the helpers below. */
class VerifyFailure extends Error {}

const encoder = new TextEncoder();

/* ------------------------------------------------------------------ */
/* Key parsing                                                         */
/* ------------------------------------------------------------------ */

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const PUBLIC_PEM = /-----BEGIN PUBLIC KEY-----([\s\S]*?)-----END PUBLIC KEY-----/;

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Decodes a plain Base64 PEM body to bytes. Throws VerifyFailure on bad input. */
function pemBodyToBytes(body: string): Uint8Array {
  const compact = body.replace(/\s+/g, '');
  if (compact === '' || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
    throw new VerifyFailure('The PEM body is not valid Base64.');
  }
  try {
    const binary = atob(compact);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    throw new VerifyFailure('The PEM body is not valid Base64.');
  }
}

/** Rejects text that is clearly not a usable public key, with a specific explanation. */
function rejectNonPublicKeyText(text: string): void {
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) {
    throw new VerifyFailure(
      'This looks like a private key. Do not paste private keys into a web page; paste the public key (BEGIN PUBLIC KEY) instead.',
    );
  }
  if (/-----BEGIN CERTIFICATE-----/.test(text)) {
    throw new VerifyFailure(
      'Certificates are not supported. Extract the public key as a PEM "BEGIN PUBLIC KEY" block (for example with openssl x509 -pubkey -noout) or paste its JWK.',
    );
  }
  if (/-----BEGIN RSA PUBLIC KEY-----/.test(text)) {
    throw new VerifyFailure(
      'PKCS#1 "BEGIN RSA PUBLIC KEY" is not supported. Convert it to an SPKI "BEGIN PUBLIC KEY" block (openssl rsa -RSAPublicKey_in -pubout) or paste a JWK.',
    );
  }
}

type PublicKeyMaterial =
  | { format: 'spki'; der: Uint8Array; keyId?: undefined }
  | { format: 'jwk'; jwk: JsonObject; keyId?: string };

function selectFromJwks(keys: unknown[], headerKid: unknown): JsonObject {
  const candidates = keys.filter(isObject);
  if (candidates.length === 0) {
    throw new VerifyFailure('The JWKS has no keys.');
  }
  const kids = candidates.map((k) => (typeof k.kid === 'string' ? k.kid : '(no kid)'));

  if (typeof headerKid === 'string' && headerKid !== '') {
    const match = candidates.find((k) => k.kid === headerKid);
    if (!match) {
      throw new VerifyFailure(
        `The token header has kid "${headerKid}", but no key in the JWKS has that kid. Kids in the JWKS: ${kids.join(', ')}.`,
      );
    }
    return match;
  }
  if (candidates.length === 1) return candidates[0];
  throw new VerifyFailure(
    `The token header has no kid and the JWKS has ${candidates.length} keys (${kids.join(', ')}), so the key cannot be chosen. Paste only the key that issued this token.`,
  );
}

function parsePublicKey(text: string, headerKid: unknown): PublicKeyMaterial {
  const trimmed = text.trim();
  if (trimmed === '') {
    throw new VerifyFailure('Paste a public key (PEM "BEGIN PUBLIC KEY", a JWK, or a JWKS).');
  }
  rejectNonPublicKeyText(trimmed);

  const pem = PUBLIC_PEM.exec(trimmed);
  if (pem) {
    return { format: 'spki', der: pemBodyToBytes(pem[1]) };
  }

  if (trimmed.startsWith('{')) {
    const parsed = parseJson(trimmed);
    if (!isObject(parsed)) throw new VerifyFailure('The key is not valid JSON.');

    let jwk: JsonObject;
    if (Array.isArray(parsed.keys)) {
      jwk = selectFromJwks(parsed.keys, headerKid);
    } else {
      jwk = parsed;
      if (
        typeof headerKid === 'string' &&
        typeof jwk.kid === 'string' &&
        jwk.kid !== headerKid
      ) {
        throw new VerifyFailure(
          `The token header has kid "${headerKid}", but the pasted key has kid "${jwk.kid}".`,
        );
      }
    }
    return { format: 'jwk', jwk, keyId: typeof jwk.kid === 'string' ? jwk.kid : undefined };
  }

  throw new VerifyFailure(
    'Could not read the key. Expected a PEM "BEGIN PUBLIC KEY" block, a single JWK (JSON), or a JWKS ({"keys":[...]}).',
  );
}

/* ------------------------------------------------------------------ */
/* Verification                                                        */
/* ------------------------------------------------------------------ */

const bufferSource = (bytes: Uint8Array) => bytes as BufferSource;

function importParams(spec: AlgSpec): Parameters<SubtleCrypto['importKey']>[2] {
  switch (spec.kind) {
    case 'hmac':
      return { name: 'HMAC', hash: { name: spec.hash } };
    case 'rsa':
      return { name: 'RSASSA-PKCS1-v1_5', hash: { name: spec.hash } };
    case 'rsa-pss':
      return { name: 'RSA-PSS', hash: { name: spec.hash } };
    case 'ecdsa':
      return { name: 'ECDSA', namedCurve: spec.curve };
    case 'eddsa':
      return { name: 'Ed25519' };
  }
}

function verifyParams(spec: AlgSpec): Parameters<SubtleCrypto['verify']>[0] {
  switch (spec.kind) {
    case 'hmac':
      return 'HMAC';
    case 'rsa':
      return 'RSASSA-PKCS1-v1_5';
    case 'rsa-pss':
      return { name: 'RSA-PSS', saltLength: spec.saltLength };
    case 'ecdsa':
      return { name: 'ECDSA', hash: { name: spec.hash } };
    case 'eddsa':
      return { name: 'Ed25519' };
  }
}

/** Resolves HMAC key bytes, refusing public-key material (algorithm confusion). */
function hmacKeyBytes(keyText: string, alg: string, warnings: string[]): { bytes: Uint8Array; keyId?: string } {
  if (keyText === '') {
    throw new VerifyFailure('Enter the shared secret.');
  }
  const confusion = `${alg} is an HMAC algorithm, which needs a shared secret. A public key must never be used as an HMAC secret: that is the algorithm-confusion attack described in RFC 8725 sections 2.1 and 3.1.`;

  if (/-----BEGIN [A-Z ]*-----/.test(keyText)) {
    throw new VerifyFailure(`You pasted a PEM block. ${confusion} If the token should be verified with a public key, its header alg should be RS*, PS*, ES* or EdDSA.`);
  }

  if (keyText.trimStart().startsWith('{')) {
    const parsed = parseJson(keyText.trim());
    if (isObject(parsed)) {
      if (Array.isArray(parsed.keys)) {
        throw new VerifyFailure(`You pasted a JWKS. ${confusion}`);
      }
      if (parsed.kty === 'oct') {
        if (typeof parsed.k !== 'string') throw new VerifyFailure('The oct JWK has no "k" member.');
        if (typeof parsed.alg === 'string' && parsed.alg !== alg) {
          throw new VerifyFailure(
            `The JWK says alg "${parsed.alg}" but the token header says "${alg}". A key must be used with exactly one algorithm (RFC 8725 section 3.1).`,
          );
        }
        try {
          return {
            bytes: base64UrlDecodeBytes(parsed.k),
            keyId: typeof parsed.kid === 'string' ? parsed.kid : undefined,
          };
        } catch {
          throw new VerifyFailure('The "k" member of the oct JWK is not valid Base64URL.');
        }
      }
      if (typeof parsed.kty === 'string') {
        throw new VerifyFailure(`You pasted a ${parsed.kty} JWK. ${confusion}`);
      }
    }
  }

  if (keyText !== keyText.trim()) {
    warnings.push(
      'The secret has leading or trailing whitespace (such as a newline). It is part of the key as typed; remove it if it was not in the original secret.',
    );
  }
  return { bytes: encoder.encode(keyText) };
}

/** Builds the public-member-only JWK that is handed to Web Crypto. */
function publicJwkFor(jwk: JsonObject, spec: AlgSpec, alg: string): JsonWebKey {
  if (typeof jwk.alg === 'string' && jwk.alg !== alg) {
    throw new VerifyFailure(
      `The JWK says alg "${jwk.alg}" but the token header says "${alg}". A key must be used with exactly one algorithm (RFC 8725 section 3.1), so this token is not accepted for that key.`,
    );
  }
  if (jwk.use === 'enc') {
    throw new VerifyFailure('The JWK is marked use "enc" (encryption), not "sig", so it is not a signature key.');
  }
  if ('d' in jwk || 'p' in jwk || 'q' in jwk) {
    throw new VerifyFailure(
      'The JWK contains private key members. Do not paste private keys into a web page; remove them and paste only the public JWK.',
    );
  }

  if (spec.kind === 'eddsa') {
    if (jwk.kty !== 'OKP') {
      throw new VerifyFailure(
        `${alg} needs an OKP key (RFC 8037 section 2), but the JWK has kty "${String(jwk.kty)}".`,
      );
    }
    if (jwk.crv === 'Ed448') {
      throw new VerifyFailure(
        'Ed448 is not supported here (Web Crypto has no Ed448 in most browsers). Only Ed25519 keys can be checked.',
      );
    }
    if (jwk.crv !== spec.curve) {
      throw new VerifyFailure(
        `${alg} is checked here only with curve ${spec.curve} (RFC 8037 section 2), but the JWK has crv "${String(jwk.crv)}".`,
      );
    }
    if (typeof jwk.x !== 'string') {
      throw new VerifyFailure('The OKP JWK needs an "x" member (the public key).');
    }
    return { kty: 'OKP', crv: spec.curve, x: jwk.x };
  }

  if (spec.kind === 'ecdsa') {
    if (jwk.kty !== 'EC') {
      throw new VerifyFailure(`${alg} needs an EC key, but the JWK has kty "${String(jwk.kty)}".`);
    }
    if (jwk.crv !== spec.curve) {
      throw new VerifyFailure(
        `${alg} needs curve ${spec.curve} (RFC 7518 section 3.4), but the JWK has crv "${String(jwk.crv)}".`,
      );
    }
    if (typeof jwk.x !== 'string' || typeof jwk.y !== 'string') {
      throw new VerifyFailure('The EC JWK needs both "x" and "y".');
    }
    return { kty: 'EC', crv: spec.curve, x: jwk.x, y: jwk.y };
  }

  if (jwk.kty !== 'RSA') {
    throw new VerifyFailure(`${alg} needs an RSA key, but the JWK has kty "${String(jwk.kty)}".`);
  }
  if (typeof jwk.n !== 'string' || typeof jwk.e !== 'string') {
    throw new VerifyFailure('The RSA JWK needs both "n" and "e".');
  }
  return { kty: 'RSA', n: jwk.n, e: jwk.e };
}

async function importPublicKey(
  subtle: SubtleCrypto,
  material: PublicKeyMaterial,
  spec: AlgSpec,
  alg: string,
): Promise<CryptoKey> {
  const params = importParams(spec);
  const mismatch = `The key could not be imported for ${alg}. Check that the key type${
    spec.kind === 'ecdsa' || spec.kind === 'eddsa' ? ` and curve (${spec.curve})` : ''
  } match the token's alg.`;
  try {
    if (material.format === 'spki') {
      return await subtle.importKey('spki', bufferSource(material.der), params, false, ['verify']);
    }
    return await subtle.importKey('jwk', publicJwkFor(material.jwk, spec, alg), params, false, ['verify']);
  } catch (err) {
    if (err instanceof VerifyFailure) throw err;
    if (spec.kind === 'eddsa' && (err as { name?: unknown } | null)?.name === 'NotSupportedError') {
      throw new VerifyFailure(
        "This browser's Web Crypto does not support Ed25519, so EdDSA tokens cannot be checked here. It is supported in Chrome and Edge 137+, Firefox 129+ and Safari 17+.",
      );
    }
    throw new VerifyFailure(mismatch);
  }
}

const isBase64UrlSegment = (segment: string) => /^[A-Za-z0-9_-]*$/.test(segment);

/**
 * Verifies the signature of a compact JWS using the algorithm named in its own header, provided the
 * supplied key matches that algorithm's key type. Reading the algorithm from the token is a
 * debugging convenience: a real verifier must fix the accepted algorithm(s) in its own
 * configuration (RFC 8725 section 3.1).
 *
 * `key` is, depending on the header alg:
 *  - HS*: the shared secret as UTF-8 text (an `oct` JWK is also accepted);
 *  - RS*, PS*, ES*, EdDSA: a PEM "BEGIN PUBLIC KEY" (SPKI) block, a single JWK, or a JWKS. For EdDSA
 *    only Ed25519 (an OKP JWK with crv "Ed25519") is handled, and the browser must support it.
 */
export async function verifyJwtSignature(
  token: string,
  key: string,
  subtle: SubtleCrypto | undefined = globalThis.crypto?.subtle,
): Promise<JwtVerifyResult> {
  const warnings: string[] = [];
  let alg: string | null = null;
  let keyIdUsed: string | undefined;

  const fail = (status: 'error' | 'invalid', message: string): JwtVerifyResult => ({
    status,
    alg,
    ...(keyIdUsed !== undefined ? { keyIdUsed } : {}),
    warnings,
    message,
  });

  try {
    let decoded: DecodedJwt;
    try {
      decoded = decodeJwt(token);
    } catch (err) {
      return fail('error', err instanceof Error ? err.message : 'The token could not be decoded.');
    }

    const headerAlg = decoded.header.alg;
    if (typeof headerAlg !== 'string' || headerAlg === '') {
      return fail('error', 'The header has no usable "alg" value, so there is nothing to verify against.');
    }
    alg = headerAlg;

    if (headerAlg.toLowerCase() === 'none') {
      return fail('error', 'This token is unsigned (alg "none"), so there is no signature to verify. Do not accept unsigned tokens where a signature is expected.');
    }
    if (!Object.prototype.hasOwnProperty.call(ALGORITHMS, headerAlg)) {
      return fail(
        'error',
        `Algorithm "${headerAlg}" is not supported here. Supported: ${SUPPORTED_JWT_VERIFY_ALGORITHMS.join(', ')}.`,
      );
    }
    const spec = ALGORITHMS[headerAlg];

    for (const field of ['jku', 'jwk', 'x5u', 'x5c'] as const) {
      if (field in decoded.header) {
        warnings.push(
          `The header carries "${field}". It is ignored: the key you pasted is the only key used. A verifier should not trust a key or key location chosen by the token itself.`,
        );
      }
    }

    if (!subtle) {
      return fail('error', 'Web Crypto (crypto.subtle) is not available in this browser context. It requires a secure context (HTTPS or localhost).');
    }

    const [headerSegment, payloadSegment, signatureSegment] = decoded.parts;
    if (signatureSegment === '') {
      return fail('invalid', 'The signature segment is empty, so the token is not validly signed.');
    }
    if (!isBase64UrlSegment(signatureSegment)) {
      return fail('invalid', 'The signature segment is not valid unpadded Base64URL.');
    }
    const signature = base64UrlDecodeBytes(signatureSegment);
    // The signing input is the first two segments exactly as received, never re-encoded.
    const signingInput = encoder.encode(`${headerSegment}.${payloadSegment}`);

    let cryptoKey: CryptoKey;
    if (spec.kind === 'hmac') {
      const secret = hmacKeyBytes(key, headerAlg, warnings);
      keyIdUsed = secret.keyId;
      if (secret.bytes.length === 0) throw new VerifyFailure('The shared secret is empty.');
      if (secret.bytes.length < spec.minKeyBytes) {
        warnings.push(
          `The secret is ${secret.bytes.length} bytes; RFC 7518 section 3.2 requires a key at least as long as the hash output (${spec.minKeyBytes} bytes for ${headerAlg}). A short key is weak even though it can be checked here.`,
        );
      }
      try {
        cryptoKey = await subtle.importKey('raw', bufferSource(secret.bytes), importParams(spec), false, ['verify']);
      } catch {
        throw new VerifyFailure('The shared secret could not be used as an HMAC key.');
      }
    } else {
      const material = parsePublicKey(key, decoded.header.kid);
      keyIdUsed = material.format === 'jwk' ? material.keyId : undefined;
      cryptoKey = await importPublicKey(subtle, material, spec, headerAlg);

      if (spec.kind === 'rsa' || spec.kind === 'rsa-pss') {
        const bits = (cryptoKey.algorithm as RsaHashedKeyAlgorithm).modulusLength;
        if (typeof bits === 'number' && bits < 2048) {
          const section = spec.kind === 'rsa' ? '3.3' : '3.5';
          warnings.push(
            `The RSA key is ${bits} bits; RFC 7518 section ${section} requires 2048 bits or larger for ${headerAlg}. It can still be checked here, but it is below the required strength.`,
          );
        }
      }
      if (spec.kind === 'ecdsa' && signature.length !== spec.signatureBytes) {
        return fail(
          'invalid',
          `An ${headerAlg} signature must be ${spec.signatureBytes} bytes (raw r||s, RFC 7518 section 3.4), but this one is ${signature.length} bytes. DER-encoded ECDSA signatures are not valid JWS signatures.`,
        );
      }
      if (spec.kind === 'eddsa' && signature.length !== spec.signatureBytes) {
        return fail(
          'invalid',
          `An Ed25519 signature must be ${spec.signatureBytes} bytes (RFC 8032 section 5.1.6), but this one is ${signature.length} bytes.`,
        );
      }
    }

    let ok = false;
    try {
      ok = await subtle.verify(verifyParams(spec), cryptoKey, bufferSource(signature), bufferSource(signingInput));
    } catch {
      ok = false;
    }

    if (!ok) {
      return fail(
        'invalid',
        `The signature does not match for ${headerAlg} with the supplied key. The token may have been changed, signed with a different key, or the key may be wrong or for another issuer. This result does not say which.`,
      );
    }
    return {
      status: 'valid',
      alg: headerAlg,
      ...(keyIdUsed !== undefined ? { keyIdUsed } : {}),
      warnings,
      message: `The ${headerAlg} signature matches the supplied key. ${TRUST_REMINDER}`,
    };
  } catch (err) {
    if (err instanceof VerifyFailure) return fail('error', err.message);
    return fail('error', 'Verification could not be completed.');
  }
}
