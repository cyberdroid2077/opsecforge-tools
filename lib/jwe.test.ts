// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { base64UrlDecodeBytes, base64UrlEncodeBytes, base64UrlEncodeString } from './jwt';
import {
  decryptJwe,
  inspectJwe,
  isJweCompact,
  jweKeyKindForAlg,
  JWE_MAX_INFLATED_BYTES,
  JWE_MAX_PBES2_COUNT,
} from './jwe';
import { JWE_VECTORS as V } from './jwe.test-vectors';

const subtle = webcrypto.subtle as unknown as SubtleCrypto;
const jwk = (value: unknown) => JSON.stringify(value);
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/** Builds a dir + A128GCM token from scratch so tests can vary the header and plaintext. */
async function dirGcmToken(header: Record<string, unknown>, plaintext: Uint8Array, keyBytes = new Uint8Array(16).fill(7)) {
  const protectedSegment = base64UrlEncodeString(JSON.stringify(header));
  const iv = new Uint8Array(12).fill(3);
  const key = await subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
  const sealed = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(protectedSegment), tagLength: 128 }, key, plaintext as BufferSource),
  );
  const token = [
    protectedSegment,
    '',
    base64UrlEncodeBytes(iv),
    base64UrlEncodeBytes(sealed.subarray(0, sealed.length - 16)),
    base64UrlEncodeBytes(sealed.subarray(sealed.length - 16)),
  ].join('.');
  return { token, keyHex: hex(keyBytes) };
}

describe('isJweCompact', () => {
  it('recognises five segments and nothing else', () => {
    expect(isJweCompact(V.dir.token)).toBe(true);
    expect(isJweCompact(`  ${V.dir.token}\n`)).toBe(true);
    expect(isJweCompact('a.b.c')).toBe(false);
    expect(isJweCompact('')).toBe(false);
  });
});

describe('inspectJwe', () => {
  it('reads the protected header and part sizes of the RFC 7520 section 5.6 token (dir, A128GCM)', () => {
    const info = inspectJwe(V.dir.token);
    expect(info.header).toEqual({ alg: 'dir', kid: '77c7e2b8-6e13-45cf-8672-617b5b45243a', enc: 'A128GCM' });
    expect(info.sizes).toMatchObject({ encryptedKey: 0, iv: 12, tag: 16 });
    expect(info.sizes.ciphertext).toBe(new TextEncoder().encode(V.plaintext).length);
    expect(info.algLabel).toMatch(/directly/);
    expect(info.encLabel).toMatch(/AES-GCM with a 128-bit key/);
    expect(info.notes.filter((n) => n.type !== 'info')).toEqual([]);
  });

  it('accepts every RFC 7520 section 5 compact example without a size warning', () => {
    for (const name of ['rsa15', 'rsaOaep', 'pbes2', 'ecdhEsKw', 'ecdhEs', 'dir', 'gcmKw', 'aesKw', 'zip'] as const) {
      const info = inspectJwe(V[name].token);
      const sizeWarnings = info.notes.filter((n) => /bytes;|bits;|must be empty|must not be empty/.test(n.message) && n.type === 'warning');
      expect(sizeWarnings, name).toEqual([]);
    }
  });

  it('reports the RSA key size from the encrypted key length', () => {
    expect(inspectJwe(V.rsaOaep.token).notes.map((n) => n.message).join('\n')).toMatch(/512 bytes, so the recipient's RSA key is 4096 bits/);
    const rsa15 = inspectJwe(V.rsa15.token).notes.map((n) => n.message).join('\n');
    expect(rsa15).toMatch(/2048 bits/);
    expect(rsa15).toMatch(/RFC 8725 section 3\.2/);
  });

  it('notes compression and nested JWTs', async () => {
    expect(inspectJwe(V.zip.token).notes.some((n) => n.type === 'warning' && /RFC 8725 section 3\.6/.test(n.message))).toBe(true);
    const { token } = await dirGcmToken({ alg: 'dir', enc: 'A128GCM', cty: 'JWT' }, new TextEncoder().encode('a.b.c'));
    expect(inspectJwe(token).notes.some((n) => /nested JWT/.test(n.message))).toBe(true);
  });

  it('flags sizes that do not fit the declared algorithms', () => {
    const [h, , iv, ct, tag] = V.dir.token.split('.');
    const withKey = inspectJwe([h, 'AAAA', iv, ct, tag].join('.'));
    expect(withKey.notes.some((n) => /encrypted key part must be empty/.test(n.message))).toBe(true);

    const shortIv = inspectJwe([h, '', 'AAAAAAAAAAA', ct, tag].join('.'));
    expect(shortIv.notes.some((n) => /initialization vector is 64 bits; "A128GCM" uses 96 bits/.test(n.message))).toBe(true);

    const shortTag = inspectJwe([h, '', iv, ct, 'AAAAAAAAAAA'].join('.'));
    expect(shortTag.notes.some((n) => /authentication tag is 64 bits/.test(n.message))).toBe(true);

    const [kh, , kiv, kct, ktag] = V.aesKw.token.split('.');
    const wrongWrap = inspectJwe([kh, 'AAAAAAAAAAAAAAAAAAAAAA', kiv, kct, ktag].join('.'));
    expect(wrongWrap.notes.some((n) => /encrypted key is 16 bytes; "A128KW" wrapping a 128-bit "A128GCM" key gives 24 bytes/.test(n.message))).toBe(true);
  });

  it('flags unknown or missing algorithms and weak PBES2 counts', () => {
    const make = (header: unknown) => `${base64UrlEncodeString(JSON.stringify(header))}..AAAA.AAAA.AAAA`;
    expect(inspectJwe(make({ alg: 'XYZ', enc: 'A128GCM' })).notes.some((n) => /not one of the JWE key management algorithms/.test(n.message))).toBe(true);
    expect(inspectJwe(make({ alg: 'dir' })).notes.some((n) => /no usable "enc"/.test(n.message))).toBe(true);
    expect(inspectJwe(make({ alg: 'toString', enc: 'constructor' })).algLabel).toBeNull();
    const weak = inspectJwe(make({ alg: 'PBES2-HS256+A128KW', enc: 'A128GCM', p2c: 10, p2s: 'AAAA' }));
    expect(weak.notes.some((n) => /"p2c" is 10/.test(n.message))).toBe(true);
  });

  it('throws a readable error for malformed input', () => {
    expect(() => inspectJwe('a.b.c')).toThrow(/5 parts/);
    expect(() => inspectJwe('!!!.a.b.c.d')).toThrow(/protected header/);
    expect(() => inspectJwe(`${base64UrlEncodeString('[1]')}.a.b.c.d`)).toThrow(/JSON object/);
    expect(() => inspectJwe(`${base64UrlEncodeString('{"alg":"dir"}')}..a+b.c.d`)).toThrow(/initialization vector segment is not valid Base64URL/);
  });
});

describe('jweKeyKindForAlg', () => {
  it('maps algorithms to the key the user has to supply', () => {
    expect(jweKeyKindForAlg('dir')).toBe('symmetric');
    expect(jweKeyKindForAlg('A256KW')).toBe('symmetric');
    expect(jweKeyKindForAlg('A128GCMKW')).toBe('symmetric');
    expect(jweKeyKindForAlg('PBES2-HS512+A256KW')).toBe('password');
    expect(jweKeyKindForAlg('RSA-OAEP-256')).toBe('rsa-private');
    expect(jweKeyKindForAlg('ECDH-ES+A128KW')).toBe('ec-private');
    expect(jweKeyKindForAlg('RSA1_5')).toBeNull();
    expect(jweKeyKindForAlg('HS256')).toBeNull();
    expect(jweKeyKindForAlg('constructor')).toBeNull();
    expect(jweKeyKindForAlg(undefined)).toBeNull();
  });
});

describe('decryptJwe: RFC 7520 section 5 examples', () => {
  const expectPlaintext = async (token: string, key: string) => {
    const result = await decryptJwe(token, key, subtle);
    expect(result.message).toMatch(/^Decrypted with/);
    expect(result.status).toBe('decrypted');
    expect(result.plaintext).toEqual({ kind: 'text', text: V.plaintext });
    return result;
  };

  it('5.6 dir + A128GCM, with the key as JWK, Base64URL or hex', async () => {
    await expectPlaintext(V.dir.token, jwk(V.dir.jwk));
    await expectPlaintext(V.dir.token, V.dir.jwk.k);
    await expectPlaintext(V.dir.token, hex(base64UrlDecodeBytes(V.dir.jwk.k)));
  });

  it('5.8 A128KW + A128GCM', async () => {
    await expectPlaintext(V.aesKw.token, jwk(V.aesKw.jwk));
  });

  it('5.7 A256GCMKW + A128CBC-HS256', async () => {
    await expectPlaintext(V.gcmKw.token, jwk(V.gcmKw.jwk));
  });

  it('5.2 RSA-OAEP + A256GCM, with the private key as JWK or PKCS#8 PEM', async () => {
    await expectPlaintext(V.rsaOaep.token, jwk(V.rsaOaep.jwk));

    const key = await subtle.importKey('jwk', { ...V.rsaOaep.jwk, alg: undefined, use: undefined } as JsonWebKey, { name: 'RSA-OAEP', hash: 'SHA-1' }, true, ['decrypt']);
    const der = Buffer.from(await subtle.exportKey('pkcs8', key)).toString('base64');
    const pem = `-----BEGIN PRIVATE KEY-----\n${der.replace(/(.{64})/g, '$1\n')}\n-----END PRIVATE KEY-----\n`;
    await expectPlaintext(V.rsaOaep.token, pem);
  });

  it('5.4 ECDH-ES+A128KW on P-384 and 5.5 ECDH-ES direct on P-256', async () => {
    await expectPlaintext(V.ecdhEsKw.token, jwk(V.ecP384Jwk));
    await expectPlaintext(V.ecdhEs.token, jwk(V.ecP256Jwk));
  });

  it('5.3 PBES2-HS512+A256KW with the password as UTF-8 text', async () => {
    const result = await decryptJwe(V.pbes2.token, V.pbes2Password, subtle);
    expect(result.status).toBe('decrypted');
    expect(result.plaintext?.kind).toBe('claims');
    const claims = (result.plaintext as unknown as { claims: { keys: { kid: string }[] } }).claims;
    expect(claims.keys.map((k) => k.kid)).toEqual([
      '77c7e2b8-6e13-45cf-8672-617b5b45243a',
      '81b20965-8332-43d9-a468-82160ad91ac8',
      '18ec08e1-bfa9-4d95-b205-2b4dd1d4321d',
    ]);
  });

  it('5.9 inflates a "zip": "DEF" plaintext', async () => {
    await expectPlaintext(V.zip.token, jwk(V.aesKw.jwk));
  });

  it('5.1 RSA1_5 is reported as not available in Web Crypto rather than attempted', async () => {
    const result = await decryptJwe(V.rsa15.token, jwk(V.rsa15.jwk), subtle);
    expect(result.status).toBe('error');
    expect(result.message).toMatch(/RSA1_5 .* cannot be decrypted here/);
  });
});

describe('decryptJwe: rejections', () => {
  it('fails closed on a wrong key, for every key management family', async () => {
    const wrongOct = jwk({ kty: 'oct', k: base64UrlEncodeBytes(new Uint8Array(16).fill(1)) });
    expect((await decryptJwe(V.dir.token, wrongOct, subtle)).status).toBe('failed');
    expect((await decryptJwe(V.aesKw.token, wrongOct, subtle)).status).toBe('failed');
    expect((await decryptJwe(V.gcmKw.token, jwk({ kty: 'oct', k: base64UrlEncodeBytes(new Uint8Array(32).fill(1)) }), subtle)).status).toBe('failed');
    expect((await decryptJwe(V.pbes2.token, 'not the password', subtle)).status).toBe('failed');
    // The 2048-bit RSA key from 5.1 against the token encrypted to the 4096-bit key from 5.2.
    expect((await decryptJwe(V.rsaOaep.token, jwk(V.rsa15.jwk), subtle)).status).toBe('failed');
    // A P-256 key against a token encrypted to P-384.
    const crossCurve = await decryptJwe(V.ecdhEsKw.token, jwk(V.ecP256Jwk), subtle);
    expect(crossCurve.status).toBe('error');
    expect(crossCurve.message).toMatch(/encrypted to a P-384 key/);
    for (const result of [await decryptJwe(V.dir.token, wrongOct, subtle)]) {
      expect(result.plaintext).toBeUndefined();
      expect(result.message).toMatch(/does not say which/);
    }
  });

  it('fails when any part of the token is changed', async () => {
    const parts = V.gcmKw.token.split('.');
    const flip = (segment: string) => (segment[0] === 'A' ? 'B' : 'A') + segment.slice(1);
    for (const index of [1, 2, 3, 4]) {
      const changed = parts.map((p, i) => (i === index ? flip(p) : p)).join('.');
      const result = await decryptJwe(changed, jwk(V.gcmKw.jwk), subtle);
      expect(result.status, `part ${index}`).toBe('failed');
      expect(result.plaintext).toBeUndefined();
    }
    // Re-encoding the header with a different (still valid) JSON layout changes the AAD.
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecodeBytes(parts[0])));
    const reencoded = [base64UrlEncodeString(JSON.stringify(header, null, 1)), ...parts.slice(1)].join('.');
    expect((await decryptJwe(reencoded, jwk(V.gcmKw.jwk), subtle)).status).toBe('failed');
  });

  it('rejects a truncated CBC-HS tag and a truncated GCM tag before decrypting', async () => {
    const cbc = V.gcmKw.token.split('.');
    cbc[4] = cbc[4].slice(0, 11);
    const cbcResult = await decryptJwe(cbc.join('.'), jwk(V.gcmKw.jwk), subtle);
    expect(cbcResult.status).toBe('failed');
    expect(cbcResult.message).toMatch(/authentication tag 128 bits/);

    const gcm = V.dir.token.split('.');
    gcm[4] = gcm[4].slice(0, 11);
    expect((await decryptJwe(gcm.join('.'), jwk(V.dir.jwk), subtle)).status).toBe('failed');
  });

  it('explains key material that cannot work', async () => {
    const message = async (token: string, key: string) => (await decryptJwe(token, key, subtle)).message;
    expect(await message(V.dir.token, '')).toMatch(/Paste the shared key/);
    expect(await message(V.dir.token, 'abcd')).toMatch(/needs a 128-bit key \(16 bytes\)/);
    expect(await message(V.dir.token, jwk(V.gcmKw.jwk))).toMatch(/JWK holds 32 bytes/);
    expect(await message(V.dir.token, jwk(V.ecP256Jwk))).toMatch(/needs a symmetric key/);
    expect(await message(V.dir.token, '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----')).toMatch(/not a PEM key pair/);
    expect(await message(V.rsaOaep.token, '-----BEGIN RSA PRIVATE KEY-----\nAAAA\n-----END RSA PRIVATE KEY-----')).toMatch(/openssl pkcs8 -topk8/);
    expect(await message(V.rsaOaep.token, '-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----')).toMatch(/can only encrypt/);
    const publicOnly: Record<string, unknown> = { ...V.rsaOaep.jwk };
    delete publicOnly.d;
    expect(await message(V.rsaOaep.token, jwk(publicOnly))).toMatch(/no "d" member/);
    expect(await message(V.rsaOaep.token, jwk(V.ecP256Jwk))).toMatch(/needs an RSA key/);
    expect(await message(V.rsaOaep.token, '{not json')).toMatch(/not valid JSON/);
    expect(await message(V.ecdhEs.token, jwk({ keys: [V.ecP256Jwk] }))).toMatch(/single JWK/);
    expect(await message(V.pbes2.token, '')).toMatch(/Enter the password/);
  });

  it('refuses an oversized PBKDF2 count, critical extensions and unknown compression', async () => {
    const make = (header: unknown) => `${base64UrlEncodeString(JSON.stringify(header))}.AAAA.AAAAAAAAAAAAAAAA.AAAA.AAAAAAAAAAAAAAAAAAAAAA`;
    const huge = await decryptJwe(make({ alg: 'PBES2-HS256+A128KW', enc: 'A128GCM', p2c: JWE_MAX_PBES2_COUNT + 1, p2s: 'AAAA' }), 'pw', subtle);
    expect(huge.status).toBe('error');
    expect(huge.message).toMatch(/refuses more than/);

    const crit = await decryptJwe(make({ alg: 'dir', enc: 'A128GCM', crit: ['exp'] }), '00'.repeat(16), subtle);
    expect(crit.message).toMatch(/"exp" as critical/);

    const zip = await decryptJwe(make({ alg: 'dir', enc: 'A128GCM', zip: 'GZIP' }), '00'.repeat(16), subtle);
    expect(zip.message).toMatch(/only compression RFC 7516 defines is "DEF"/);

    expect((await decryptJwe(make({ alg: 'XYZ', enc: 'A128GCM' }), 'k', subtle)).message).toMatch(/"XYZ" is not supported/);
    expect((await decryptJwe(make({ alg: 'dir', enc: 'XYZ' }), 'k', subtle)).message).toMatch(/"XYZ" is not supported/);
    expect((await decryptJwe('a.b.c', 'k', subtle)).status).toBe('error');
  });
});

describe('decryptJwe: plaintext handling', () => {
  const bytes = (text: string) => new TextEncoder().encode(text);

  it('returns a claims set as JSON', async () => {
    const { token, keyHex } = await dirGcmToken({ alg: 'dir', enc: 'A128GCM' }, bytes('{"sub":"test-user-123","exp":4102444800}'));
    const result = await decryptJwe(token, keyHex, subtle);
    expect(result.plaintext).toMatchObject({ kind: 'claims', claims: { sub: 'test-user-123', exp: 4102444800 } });
  });

  it('recognises a nested JWT', async () => {
    const inner = `${base64UrlEncodeString('{"alg":"HS256"}')}.${base64UrlEncodeString('{"sub":"test-user-123"}')}.c2ln`;
    const { token, keyHex } = await dirGcmToken({ alg: 'dir', enc: 'A128GCM', cty: 'JWT' }, bytes(inner));
    expect((await decryptJwe(token, keyHex, subtle)).plaintext).toEqual({ kind: 'jwt', text: inner });
  });

  it('shows non-UTF-8 plaintext as hex', async () => {
    const { token, keyHex } = await dirGcmToken({ alg: 'dir', enc: 'A128GCM' }, new Uint8Array([0xff, 0x00, 0x10]));
    expect((await decryptJwe(token, keyHex, subtle)).plaintext).toEqual({ kind: 'binary', hex: 'ff 00 10', bytes: 3 });
  });

  it('stops inflating at the size limit and reports corrupt DEFLATE data', async () => {
    const bomb = new Uint8Array(deflateRawSync(Buffer.alloc(JWE_MAX_INFLATED_BYTES + 1024)));
    expect(bomb.length).toBeLessThan(4096);
    const big = await dirGcmToken({ alg: 'dir', enc: 'A128GCM', zip: 'DEF' }, bomb);
    const bigResult = await decryptJwe(big.token, big.keyHex, subtle);
    expect(bigResult.status).toBe('error');
    expect(bigResult.message).toMatch(/inflates to more than/);
    expect(bigResult.plaintext).toBeUndefined();

    const bad = await dirGcmToken({ alg: 'dir', enc: 'A128GCM', zip: 'DEF' }, new Uint8Array([0xff, 0xff, 0xff, 0xff]));
    expect((await decryptJwe(bad.token, bad.keyHex, subtle)).message).toMatch(/not valid DEFLATE data/);
  });

  it('decrypts A192CBC-HS384 and A256CBC-HS512 content built with node:crypto', async () => {
    const { createCipheriv, createHmac } = await import('node:crypto');
    for (const [enc, hash, size] of [['A192CBC-HS384', 'sha384', 48], ['A256CBC-HS512', 'sha512', 64]] as const) {
      const cek = Buffer.from(Array.from({ length: size }, (_, i) => i + 1));
      const iv = Buffer.alloc(16, 9);
      const protectedSegment = base64UrlEncodeString(JSON.stringify({ alg: 'dir', enc }));
      const cipher = createCipheriv(`aes-${(size / 2) * 8}-cbc`, cek.subarray(size / 2), iv);
      const ciphertext = Buffer.concat([cipher.update('{"sub":"test-user-123"}'), cipher.final()]);
      const al = Buffer.alloc(8);
      al.writeUInt32BE(protectedSegment.length * 8, 4);
      const tag = createHmac(hash, cek.subarray(0, size / 2))
        .update(Buffer.concat([Buffer.from(protectedSegment), iv, ciphertext, al]))
        .digest()
        .subarray(0, size / 2);
      const token = [protectedSegment, '', iv.toString('base64url'), ciphertext.toString('base64url'), tag.toString('base64url')].join('.');
      const result = await decryptJwe(token, cek.toString('hex'), subtle);
      expect(result.plaintext, enc).toMatchObject({ kind: 'claims', claims: { sub: 'test-user-123' } });
    }
  });
});
