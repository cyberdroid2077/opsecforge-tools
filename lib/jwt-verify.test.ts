// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { VECTORS } from './jwt-verify.test-vectors';
import { jwtKeyKindForAlg, verifyJwtSignature } from './jwt-verify';

// All tokens and keys in jwt-verify.test-vectors.ts were produced by an independent node:crypto script
// (not by lib/jwt-verify.ts). The RFC 7515 A.1 / A.2 vectors are copied from the RFC text.

const b64u = (bytes: Uint8Array | Buffer) => Buffer.from(bytes).toString('base64url');

/** Flips one bit of the first signature byte. */
const tamperSignature = (token: string) => {
  const [h, p, s] = token.split('.');
  const bytes = Buffer.from(s, 'base64url');
  bytes[0] ^= 0x01;
  return `${h}.${p}.${b64u(bytes)}`;
};

/** Replaces the payload with a still-valid JSON object the signature does not cover. */
const tamperPayload = (token: string) => {
  const [h, , s] = token.split('.');
  return `${h}.${Buffer.from('{"sub":"tampered"}').toString('base64url')}.${s}`;
};

const withSignature = (token: string, signature: string) => {
  const [h, p] = token.split('.');
  return `${h}.${p}.${signature}`;
};

const customHeaderToken = (header: Record<string, unknown>) =>
  `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from('{"sub":"test-user-123"}').toString('base64url')}.c2ln`;

const jwks = (...keys: unknown[]) => JSON.stringify({ keys });

/** A JWK without its kid, so a kid mismatch does not mask the check under test. */
const withoutKid = (jwk: Record<string, unknown>) => {
  const { kid: _kid, ...rest } = jwk;
  return JSON.stringify(rest);
};

describe('HMAC (HS256/384/512)', () => {
  it('accepts a correct secret for each algorithm', async () => {
    const cases = [
      ['HS256', VECTORS.hs.HS256, VECTORS.secrets.short],
      ['HS384', VECTORS.hs.HS384, VECTORS.secrets.long],
      ['HS512', VECTORS.hs.HS512, VECTORS.secrets.long],
    ] as const;
    for (const [alg, token, secret] of cases) {
      const result = await verifyJwtSignature(token, secret);
      expect(result.status).toBe('valid');
      expect(result.alg).toBe(alg);
      expect(result.warnings).toEqual([]);
      expect(result.message).toMatch(/does not make the token trustworthy/);
      expect(result.message).toMatch(/iss, aud, exp/);
    }
  });

  it('rejects a one-bit signature change for each algorithm', async () => {
    const cases = [
      [VECTORS.hs.HS256, VECTORS.secrets.short],
      [VECTORS.hs.HS384, VECTORS.secrets.long],
      [VECTORS.hs.HS512, VECTORS.secrets.long],
    ] as const;
    for (const [token, secret] of cases) {
      expect((await verifyJwtSignature(tamperSignature(token), secret)).status).toBe('invalid');
    }
  });

  it('rejects a changed payload and a wrong secret', async () => {
    expect((await verifyJwtSignature(tamperPayload(VECTORS.hs.HS256), VECTORS.secrets.short)).status).toBe('invalid');
    expect((await verifyJwtSignature(VECTORS.hs.HS256, `${VECTORS.secrets.short}x`)).status).toBe('invalid');
  });

  it('warns about a secret shorter than the hash output but still verifies', async () => {
    const result = await verifyJwtSignature(VECTORS.hs.HS512WithShortSecret, VECTORS.secrets.short);
    expect(result.status).toBe('valid');
    expect(result.warnings.join(' ')).toMatch(/41 bytes/);
    expect(result.warnings.join(' ')).toMatch(/RFC 7518 section 3\.2/);
    expect(result.warnings.join(' ')).toMatch(/64 bytes for HS512/);
  });

  it('warns when the secret has surrounding whitespace', async () => {
    const result = await verifyJwtSignature(VECTORS.hs.HS256, `${VECTORS.secrets.short}\n`);
    expect(result.status).toBe('invalid');
    expect(result.warnings.join(' ')).toMatch(/whitespace/);
  });

  it('requires a secret', async () => {
    const result = await verifyJwtSignature(VECTORS.hs.HS256, '');
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/shared secret/);
  });

  it('refuses a PEM public key as an HMAC secret (algorithm confusion)', async () => {
    // Token built the way the classic RS256 -> HS256 attack does: MAC keyed with the public key text.
    const result = await verifyJwtSignature(VECTORS.confusionToken, VECTORS.rsa.pem);
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/PEM/);
    expect(result.message).toMatch(/algorithm-confusion/);
    expect(result.message).toMatch(/RFC 8725/);
  });

  it('refuses a public JWK or JWKS as an HMAC secret', async () => {
    const jwk = await verifyJwtSignature(VECTORS.confusionToken, JSON.stringify(VECTORS.rsa.jwk));
    expect(jwk.status).toBe('error');
    expect(jwk.message).toMatch(/RSA JWK/);
    const set = await verifyJwtSignature(VECTORS.confusionToken, jwks(VECTORS.rsa.jwk));
    expect(set.status).toBe('error');
    expect(set.message).toMatch(/JWKS/);
  });

  it('rejects an oct JWK whose alg disagrees with the header', async () => {
    const key = JSON.stringify({ kty: 'oct', k: VECTORS.rfc7515.a1.k, alg: 'HS512' });
    const result = await verifyJwtSignature(VECTORS.rfc7515.a1.token, key);
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/HS512/);
  });
});

describe('RFC 7515 external vectors', () => {
  it('A.1 (HS256) verifies with the RFC oct JWK and fails when changed', async () => {
    const key = JSON.stringify({ kty: 'oct', k: VECTORS.rfc7515.a1.k });
    expect(VECTORS.rfc7515.a1.token.split('.')[2]).toBe('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
    const ok = await verifyJwtSignature(VECTORS.rfc7515.a1.token, key);
    expect(ok.status).toBe('valid');
    expect(ok.alg).toBe('HS256');
    expect(ok.warnings).toEqual([]);
    expect((await verifyJwtSignature(tamperSignature(VECTORS.rfc7515.a1.token), key)).status).toBe('invalid');
    expect((await verifyJwtSignature(tamperPayload(VECTORS.rfc7515.a1.token), key)).status).toBe('invalid');
  });

  it('A.2 (RS256) verifies with the RFC public key members', async () => {
    const key = JSON.stringify({ kty: 'RSA', n: VECTORS.rfc7515.a2.n, e: VECTORS.rfc7515.a2.e });
    const ok = await verifyJwtSignature(VECTORS.rfc7515.a2.token, key);
    expect(ok.status).toBe('valid');
    expect(ok.alg).toBe('RS256');
    expect(ok.warnings).toEqual([]);
    expect((await verifyJwtSignature(tamperSignature(VECTORS.rfc7515.a2.token), key)).status).toBe('invalid');
  });
});

describe('RSA (RS*, PS*)', () => {
  const algs: ('RS256' | 'RS384' | 'RS512' | 'PS256' | 'PS384' | 'PS512')[] = ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'];

  it.each(algs)('%s verifies with a PEM key and with a JWK', async (alg) => {
    const token = VECTORS.rsa.tokens[alg];
    const pem = await verifyJwtSignature(token, VECTORS.rsa.pem);
    expect(pem.status).toBe('valid');
    expect(pem.alg).toBe(alg);
    expect(pem.warnings).toEqual([]);
    const jwk = await verifyJwtSignature(token, JSON.stringify(VECTORS.rsa.jwk));
    expect(jwk.status).toBe('valid');
    expect(jwk.keyIdUsed).toBe('rsa-test-1');
  });

  it.each(algs)('%s rejects a one-bit signature change and a different key', async (alg) => {
    const token = VECTORS.rsa.tokens[alg];
    expect((await verifyJwtSignature(tamperSignature(token), VECTORS.rsa.pem)).status).toBe('invalid');
    expect((await verifyJwtSignature(token, withoutKid(VECTORS.rsa.otherJwk))).status).toBe('invalid');
  });

  it('warns about RSA keys shorter than 2048 bits but still verifies', async () => {
    const rs = await verifyJwtSignature(VECTORS.rsa1024.tokens.RS256, VECTORS.rsa1024.pem);
    expect(rs.status).toBe('valid');
    expect(rs.warnings.join(' ')).toMatch(/1024 bits/);
    expect(rs.warnings.join(' ')).toMatch(/RFC 7518 section 3\.3/);
    const ps = await verifyJwtSignature(VECTORS.rsa1024.tokens.PS256, VECTORS.rsa1024.pem);
    expect(ps.status).toBe('valid');
    expect(ps.warnings.join(' ')).toMatch(/RFC 7518 section 3\.5/);
  });
});

describe('ECDSA (ES*)', () => {
  type CurveSet = { token: string; pem: string; jwk: { kid: string } };
  const curves: [string, CurveSet][] = [
    ['ES256', VECTORS.ec.P256],
    ['ES384', VECTORS.ec.P384],
    ['ES512', VECTORS.ec.P521],
  ];

  it.each(curves)('%s verifies a raw r||s signature with PEM and JWK keys', async (alg, set) => {
    const pem = await verifyJwtSignature(set.token, set.pem);
    expect(pem.status).toBe('valid');
    expect(pem.alg).toBe(alg);
    expect(pem.warnings).toEqual([]);
    const jwk = await verifyJwtSignature(set.token, JSON.stringify(set.jwk));
    expect(jwk.status).toBe('valid');
    expect(jwk.keyIdUsed).toBe(set.jwk.kid);
  });

  it.each(curves)('%s rejects a one-bit signature change', async (_alg, set) => {
    expect((await verifyJwtSignature(tamperSignature(set.token), set.pem)).status).toBe('invalid');
  });

  it('rejects a DER-length signature, which is not a JWS ECDSA signature', async () => {
    const der = b64u(Buffer.alloc(70, 1));
    const result = await verifyJwtSignature(withSignature(VECTORS.ec.P256.token, der), VECTORS.ec.P256.pem);
    expect(result.status).toBe('invalid');
    expect(result.message).toMatch(/64 bytes/);
  });

  it('rejects a key on the wrong curve for the algorithm', async () => {
    const jwk = await verifyJwtSignature(VECTORS.ec.P256.token, withoutKid(VECTORS.ec.P384.jwk));
    expect(jwk.status).toBe('error');
    expect(jwk.message).toMatch(/P-256/);
    const pem = await verifyJwtSignature(VECTORS.ec.P256.token, VECTORS.ec.P384.pem);
    expect(pem.status).toBe('error');
    expect(pem.message).toMatch(/P-256/);
  });
});

describe('key selection and key/algorithm matching', () => {
  const token = VECTORS.rsa.tokens.RS256; // header kid "rsa-test-1"

  it('selects the JWKS entry matching the header kid', async () => {
    const set = jwks(VECTORS.ec.P256.jwk, VECTORS.rsa.otherJwk, VECTORS.rsa.jwk);
    const result = await verifyJwtSignature(token, set);
    expect(result.status).toBe('valid');
    expect(result.keyIdUsed).toBe('rsa-test-1');
  });

  it('uses the kid from the header even when another key would also import', async () => {
    const set = jwks(VECTORS.rsa.jwk, VECTORS.rsa.otherJwk);
    const result = await verifyJwtSignature(VECTORS.rsa.tokenKidOther, set);
    expect(result.status).toBe('invalid');
    expect(result.keyIdUsed).toBe('rsa-test-2');
  });

  it('reports a kid that is not in the JWKS and lists the available kids', async () => {
    const result = await verifyJwtSignature(VECTORS.rsa.tokenKidUnknown, jwks(VECTORS.rsa.jwk, VECTORS.rsa.otherJwk));
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/no-such-key/);
    expect(result.message).toMatch(/rsa-test-1, rsa-test-2/);
  });

  it('uses the only key of a JWKS when the header has no kid', async () => {
    const result = await verifyJwtSignature(VECTORS.rsa.tokenNoKid, jwks(VECTORS.rsa.jwk));
    expect(result.status).toBe('valid');
  });

  it('refuses to guess among several keys when the header has no kid', async () => {
    const result = await verifyJwtSignature(VECTORS.rsa.tokenNoKid, jwks(VECTORS.rsa.jwk, VECTORS.rsa.otherJwk));
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/no kid/);
  });

  it('rejects a single JWK whose kid differs from the header kid', async () => {
    const result = await verifyJwtSignature(VECTORS.rsa.tokenKidOther, JSON.stringify(VECTORS.rsa.jwk));
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/rsa-test-2/);
  });

  it('rejects a JWK whose alg differs from the header alg', async () => {
    const result = await verifyJwtSignature(token, JSON.stringify({ ...VECTORS.rsa.jwk, alg: 'RS384' }));
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/RS384/);
    expect(result.message).toMatch(/RS256/);
  });

  it('accepts a JWK whose alg matches the header alg', async () => {
    const result = await verifyJwtSignature(token, JSON.stringify({ ...VECTORS.rsa.jwk, alg: 'RS256' }));
    expect(result.status).toBe('valid');
  });

  it('rejects keys of the wrong type for the algorithm', async () => {
    expect((await verifyJwtSignature(token, VECTORS.ec.P256.pem)).status).toBe('error');
    expect((await verifyJwtSignature(token, withoutKid(VECTORS.ec.P256.jwk))).message).toMatch(/needs an RSA key/);
    expect((await verifyJwtSignature(VECTORS.ec.P256.token, withoutKid(VECTORS.rsa.jwk))).message).toMatch(/needs an EC key/);
  });

  it('rejects JWKs that carry private members', async () => {
    const result = await verifyJwtSignature(token, JSON.stringify({ ...VECTORS.rsa.jwk, d: 'AAAA' }));
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/private/);
  });

  it('rejects pasted private keys, certificates and unreadable key text', async () => {
    const priv = await verifyJwtSignature(token, '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----');
    expect(priv.message).toMatch(/private key/);
    const cert = await verifyJwtSignature(token, '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----');
    expect(cert.message).toMatch(/Certificates are not supported/);
    const text = await verifyJwtSignature(token, 'just some words');
    expect(text.status).toBe('error');
    expect((await verifyJwtSignature(token, '')).status).toBe('error');
  });

  it('warns that jku / jwk / x5u header fields are ignored', async () => {
    const result = await verifyJwtSignature(customHeaderToken({ alg: 'RS256', jku: 'https://example.invalid/jwks.json' }), VECTORS.rsa.pem);
    expect(result.warnings.join(' ')).toMatch(/"jku"/);
  });
});

describe('unsigned, unsupported and malformed tokens', () => {
  it('refuses alg none', async () => {
    const result = await verifyJwtSignature(VECTORS.noneToken, 'anything');
    expect(result.status).toBe('error');
    expect(result.alg).toBe('none');
    expect(result.message).toMatch(/unsigned/);
    expect((await verifyJwtSignature(customHeaderToken({ alg: 'None' }), 'x')).status).toBe('error');
  });

  it('refuses an empty signature for a signed algorithm', async () => {
    const result = await verifyJwtSignature(withSignature(VECTORS.hs.HS256, ''), VECTORS.secrets.short);
    expect(result.status).toBe('invalid');
    expect(result.message).toMatch(/empty/);
  });

  it('reports unsupported algorithms instead of guessing', async () => {
    const result = await verifyJwtSignature(customHeaderToken({ alg: 'EdDSA' }), VECTORS.rsa.pem);
    expect(result.status).toBe('error');
    expect(result.alg).toBe('EdDSA');
    expect(result.message).toMatch(/not supported/);
    expect((await verifyJwtSignature(customHeaderToken({}), 'x')).status).toBe('error');
  });

  it('never throws on malformed input', async () => {
    for (const token of ['', 'not-a-jwt', 'a.b.c', '....']) {
      const result = await verifyJwtSignature(token, 'x');
      expect(result.status).toBe('error');
    }
    const padded = await verifyJwtSignature(`${VECTORS.hs.HS256}==`, VECTORS.secrets.short);
    expect(padded.status).toBe('invalid');
  });

  it('reports a missing Web Crypto API', async () => {
    const none = await verifyJwtSignature(VECTORS.hs.HS256, VECTORS.secrets.short, null as unknown as SubtleCrypto);
    expect(none.status).toBe('error');
    expect(none.message).toMatch(/Web Crypto/);
  });
});

describe('jwtKeyKindForAlg', () => {
  it('maps header algorithms to the key the user must supply', () => {
    expect(jwtKeyKindForAlg('HS256')).toBe('secret');
    expect(jwtKeyKindForAlg('PS384')).toBe('public-key');
    expect(jwtKeyKindForAlg('ES512')).toBe('public-key');
    expect(jwtKeyKindForAlg('none')).toBeNull();
    expect(jwtKeyKindForAlg('toString')).toBeNull();
    expect(jwtKeyKindForAlg(undefined)).toBeNull();
  });
});
