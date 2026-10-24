import { createHash, createHmac } from 'node:crypto';
import CryptoJS from 'crypto-js';
import { describe, expect, it } from 'vitest';
import { compareDigest, digestFile } from './file-checksum';
import { analyzeTimeClaim, decodeJwt, encodeJwt } from './jwt';
import { decodeBase64Text, encodeBase64Text } from './base64-codec';
import { beautifyJson, findUnsafeIntegers, minifyJson } from './json-format';
import { countStringsUsingEveryPool, estimateEntropyBits, policyEntropyBits } from './password';
import { SQLFormatter } from './sql-formatter';
import {
  BASE64_BASIC_AUTH,
  BASE64_GUIDE_ROWS,
  BASE64_JWT_HEADER,
  HASH_GUIDE_VECTOR,
  JWT_ENCODER_GUIDE,
  JSON_GUIDE_ERRORS,
  JSON_GUIDE_PRECISION,
  PASSWORD_GUIDE_ROWS,
  PASSWORD_POLICY_EXAMPLE,
  SQL_GUIDE_EXAMPLE,
  UNIX_GUIDE_EXAMPLE,
  UUID_GUIDE_EXAMPLE,
  WEBHOOK_GITHUB_VECTOR,
  WEBHOOK_REFORMAT_EXAMPLE,
  WEBHOOK_STRIPE_EXAMPLE,
} from './tool-guide-examples';
import { unixTimestampToDate } from './unix-timestamp';
import { formatUuidV4 } from './uuid';
import { verifyGenericWebhook, verifyGitHubWebhook, verifyStripeWebhook } from './webhook-verifier';

const isoOf = (input: string, unit: 'seconds' | 'milliseconds') => {
  const { date, error } = unixTimestampToDate(input, unit);
  return date ? date.toISOString() : error;
};

describe('unix timestamp guide examples', () => {
  const ex = UNIX_GUIDE_EXAMPLE;

  it('converts the same instant from seconds and milliseconds', () => {
    expect(isoOf(ex.seconds, 'seconds')).toBe(ex.utc);
    expect(isoOf(ex.milliseconds, 'milliseconds')).toBe(ex.utc);
  });

  it('shows what happens when the unit is wrong', () => {
    expect(isoOf(ex.seconds, 'milliseconds')).toBe(ex.secondsReadAsMilliseconds);
    expect(isoOf(ex.milliseconds, 'seconds')).toBe(ex.millisecondsReadAsSeconds);
  });

  it('rejects microseconds as an out-of-range value in the seconds field', () => {
    expect(isoOf(ex.microseconds, 'seconds')).toBe('The timestamp is outside the supported JavaScript date range.');
    expect(isoOf(String(Number(ex.microseconds) / 1000), 'milliseconds')).toBe(ex.utc);
  });

  it.each(ex.zones)('renders the instant in $zone', ({ zone, local }) => {
    const rendered = new Date(ex.utc).toLocaleString('sv-SE', { timeZone: zone, hour12: false });
    expect(rendered).toBe(local);
  });

  it.each(ex.y2038)('converts $seconds around the 32-bit limit', ({ seconds, utc }) => {
    expect(isoOf(seconds, 'seconds')).toBe(utc);
  });

  it('matches the signed 32-bit limits', () => {
    expect(2 ** 31 - 1).toBe(2147483647);
    expect(new Int32Array([2147483648])[0]).toBe(-2147483648);
  });
});

describe('password guide examples', () => {
  it.each(PASSWORD_GUIDE_ROWS)('computes entropy for $label', ({ length, poolSize, bits }) => {
    expect(estimateEntropyBits(length, poolSize).toFixed(1)).toBe(bits);
  });

  it('shows how much the one-from-each-set rule trims', () => {
    const { length, poolSizes, formulaBits, policyBits } = PASSWORD_POLICY_EXAMPLE;

    expect(estimateEntropyBits(length, poolSizes.reduce((a, b) => a + b, 0)).toFixed(2)).toBe(formulaBits);
    expect(policyEntropyBits(length, poolSizes).toFixed(2)).toBe(policyBits);
  });

  it('counts policy strings by inclusion-exclusion on a case small enough to enumerate', () => {
    // Two pools of 2 symbols, length 3: 4^3 strings minus those missing a pool.
    // Missing pool A: 2^3, missing pool B: 2^3, missing both: 0 -> 64 - 16 = 48.
    expect(countStringsUsingEveryPool(3, [2, 2])).toBe(BigInt(48));

    const symbols = ['a', 'b', 'x', 'y'];
    let brute = 0;
    for (const p of symbols) for (const q of symbols) for (const r of symbols) {
      const s = p + q + r;
      if (/[ab]/.test(s) && /[xy]/.test(s)) brute += 1;
    }
    expect(brute).toBe(48);
  });
});

describe('uuid guide examples', () => {
  const ex = UUID_GUIDE_EXAMPLE;

  it('sets the version and variant bits on known bytes', () => {
    const bytes = Uint8Array.from(ex.bytesHex.match(/../g)!.map((pair) => Number.parseInt(pair, 16)));

    expect(formatUuidV4(bytes)).toBe(ex.uuid);
    expect(formatUuidV4(new Uint8Array(16).fill(0xff))).toBe(ex.allOnesUuid);
  });

  it('matches the collision arithmetic quoted on the page', () => {
    const n = 1e9;
    expect((n * n) / 2 ** 123).toBeCloseTo(9.4e-20, 21);
    expect(Number((1.1774 * 2 ** 61).toPrecision(2))).toBe(2.7e18);
    expect(ex.collisionAfterOneBillion).toBe('9.4e-20');
  });
});

describe('base64 guide examples', () => {
  it.each(BASE64_GUIDE_ROWS)('encodes $input', ({ input, standard, url }) => {
    expect(encodeBase64Text(input, 'standard')).toBe(standard);
    expect(encodeBase64Text(input, 'url')).toBe(url);
    expect(decodeBase64Text(standard, 'standard')).toBe(input);
    expect(decodeBase64Text(url, 'url')).toBe(input);
  });

  it('encodes the RFC 7617 Basic authentication example', () => {
    expect(encodeBase64Text(BASE64_BASIC_AUTH.credentials, 'standard')).toBe(BASE64_BASIC_AUTH.encoded);
  });

  it('decodes a JWT header segment', () => {
    expect(decodeBase64Text(BASE64_JWT_HEADER.encoded, 'url')).toBe(BASE64_JWT_HEADER.decoded);
  });

  it('shows the troubleshooting cases', () => {
    expect(decodeBase64Text('SGVsbG8', 'standard')).toBe('Hello');
    expect(() => decodeBase64Text('SGVsbG8==', 'standard')).toThrow('Invalid Base64 input.');
    expect(() => decodeBase64Text('SGVsb', 'standard')).toThrow('Invalid Base64 input.');
    expect(() => decodeBase64Text('PDw_Pz8-Pg', 'standard')).toThrow('Invalid Base64 input.');
    expect(() => decodeBase64Text('PDw/Pz8+Pg==', 'url')).toThrow('Invalid Base64URL input.');
    expect(() => decodeBase64Text('/w==', 'standard')).toThrow('not valid UTF-8');
  });
});

describe('json guide examples', () => {
  it('shows the precision change for integers beyond 2^53 - 1', () => {
    expect(minifyJson(JSON_GUIDE_PRECISION.input)).toBe(JSON_GUIDE_PRECISION.minified);
    expect(findUnsafeIntegers(JSON_GUIDE_PRECISION.input)).toEqual([...JSON_GUIDE_PRECISION.unsafe]);
  });

  it('ignores digits inside strings and decimals when looking for unsafe integers', () => {
    expect(findUnsafeIntegers('{"s":"99999999999999999999","f":99999999999999999999.5,"ok":9007199254740991}')).toEqual([]);
    expect(findUnsafeIntegers('[-9007199254740993]')).toEqual(['-9007199254740993']);
  });

  it('keeps the last value for duplicate keys', () => {
    expect(beautifyJson('{"a":1,"a":2}', 2)).toBe('{\n  "a": 2\n}');
  });

  it.each(JSON_GUIDE_ERRORS)('rejects: $mistake', ({ input, expect: fragments, v8 }) => {
    expect(() => beautifyJson(input, 2)).toThrow(SyntaxError);
    try {
      beautifyJson(input, 2);
    } catch (error) {
      for (const fragment of fragments) {
        expect((error as Error).message).toContain(fragment);
      }
    }
    expect(v8.length).toBeGreaterThan(0);
  });
});

describe('webhook guide examples', () => {
  it('verifies the official GitHub test vector and rejects near misses', async () => {
    const { secret, payload, header } = WEBHOOK_GITHUB_VECTOR;

    await expect(verifyGitHubWebhook({ payload, secret, signatureHeader: header })).resolves.toBe(true);
    await expect(verifyGitHubWebhook({ payload: `${payload}\n`, secret, signatureHeader: header })).resolves.toBe(false);
    await expect(verifyGitHubWebhook({ payload, secret: secret.toLowerCase(), signatureHeader: header })).resolves.toBe(false);
  });

  it('shows that re-serialized JSON no longer matches the signed bytes', async () => {
    const ex = WEBHOOK_REFORMAT_EXAMPLE;

    expect(JSON.stringify(JSON.parse(ex.original))).toBe(ex.reserialized);
    expect(createHmac('sha256', ex.secret).update(ex.original).digest('hex')).toBe(ex.originalDigest);
    expect(createHmac('sha256', ex.secret).update(ex.reserialized).digest('hex')).toBe(ex.reserializedDigest);
    expect(createHmac('sha256', ex.secret).update(`${ex.original}\n`).digest('hex')).toBe(ex.trailingNewlineDigest);

    const verify = (payload: string) =>
      verifyGenericWebhook({ payload, secret: ex.secret, signature: ex.originalDigest, algorithm: 'sha256' });
    await expect(verify(ex.original)).resolves.toBe(true);
    await expect(verify(ex.reserialized)).resolves.toBe(false);
    await expect(verify(`${ex.original}\n`)).resolves.toBe(false);
  });

  it('verifies the synthetic Stripe header and reports it as outside tolerance today', async () => {
    const ex = WEBHOOK_STRIPE_EXAMPLE;
    const base = { payload: ex.payload, secret: ex.secret, signatureHeader: ex.header };

    const atSigningTime = await verifyStripeWebhook({ ...base, nowSeconds: ex.timestamp + 10 });
    expect(atSigningTime).toMatchObject({ signatureMatched: true, withinTolerance: true });

    const today = await verifyStripeWebhook({ ...base, toleranceSeconds: 86400 });
    expect(today.signatureMatched).toBe(true);
    expect(today.withinTolerance).toBe(false);
  });
});

describe('sql guide example', () => {
  const options = { indentSize: 2, uppercaseKeywords: true, commaPosition: 'after', maxLineLength: 120 } as const;

  it('formats the example exactly as shown', () => {
    expect(new SQLFormatter(options, 'standard').format(SQL_GUIDE_EXAMPLE.input)).toBe(SQL_GUIDE_EXAMPLE.output);
  });

  it('shows the dialect difference for RETURNING', () => {
    expect(new SQLFormatter(options, 'postgresql').format(SQL_GUIDE_EXAMPLE.returningInput)).toBe(SQL_GUIDE_EXAMPLE.returningPostgres);
    expect(new SQLFormatter(options, 'standard').format(SQL_GUIDE_EXAMPLE.returningInput)).toBe(SQL_GUIDE_EXAMPLE.returningStandard);
    expect(new SQLFormatter(options, 'mysql').format(SQL_GUIDE_EXAMPLE.returningInput)).toBe(SQL_GUIDE_EXAMPLE.returningStandard);
  });
});

describe('hash generator guide vector', () => {
  const v = HASH_GUIDE_VECTOR;
  const digest = (algorithm: string, input: string) => createHash(algorithm).update(input).digest('hex');

  it('matches node:crypto for every algorithm shown', () => {
    expect(digest('md5', v.message)).toBe(v.md5);
    expect(digest('sha1', v.message)).toBe(v.sha1);
    expect(digest('sha256', v.message)).toBe(v.sha256);
    expect(digest('sha512', v.message)).toBe(v.sha512);
    expect(digest('sha256', '')).toBe(v.sha256Empty);
  });

  it('is the published NIST FIPS 180-4 digest of "abc"', () => {
    expect(v.sha256.slice(0, 16)).toBe('ba7816bf8f01cfea');
    expect(v.sha256.slice(-8)).toBe('f20015ad');
  });

  it('matches the page tool: CryptoJS MD5, Web Crypto SHA-1/SHA-256', async () => {
    expect(CryptoJS.MD5(v.message).toString()).toBe(v.md5);
    const hex = async (alg: string) =>
      Array.from(new Uint8Array(await crypto.subtle.digest(alg, new TextEncoder().encode(v.message))), (b) => b.toString(16).padStart(2, '0')).join('');
    expect(await hex('SHA-1')).toBe(v.sha1);
    expect(await hex('SHA-256')).toBe(v.sha256);
  });

  it('the file checksum tool gives the same SHA-256 and SHA-512, and compareDigest accepts it', async () => {
    const bytes = new TextEncoder().encode(v.message);
    const file = { size: bytes.byteLength, arrayBuffer: async () => bytes.buffer as ArrayBuffer };
    const sha256 = await digestFile(file, 'SHA-256');
    expect(sha256).toBe(v.sha256);
    expect(await digestFile(file, 'SHA-512')).toBe(v.sha512);
    expect(compareDigest(sha256, v.sha256.toUpperCase(), 'SHA-256')).toBe('match');
  });

  it('shows why echo and printf give different checksums', () => {
    expect(digest('sha256', v.message + '\n')).toBe(v.sha256WithNewline);
    expect(v.sha256WithNewline).not.toBe(v.sha256);
    expect(compareDigest(v.sha256, v.sha256WithNewline, 'SHA-256')).toBe('mismatch');
  });

  it('HMAC with a key differs from the plain hash', () => {
    expect(createHmac('sha256', v.hmacKey).update(v.message).digest('hex')).toBe(v.hmacSha256);
    expect(v.hmacSha256).not.toBe(v.sha256);
  });
});

describe('jwt encoder guide example', () => {
  const ex = JWT_ENCODER_GUIDE;
  const b64u = (text: string) => Buffer.from(text).toString('base64url');

  it('the secret is at least 256 bits, as RFC 7518 section 3.2 requires for HS256', () => {
    expect(Buffer.byteLength(ex.secret)).toBeGreaterThanOrEqual(32);
  });

  it('the encoder produces exactly the token shown', async () => {
    const result = await encodeJwt({ headerJson: ex.header, payloadJson: ex.payload, secret: ex.secret, algorithm: 'HS256' });
    expect(result.token).toBe(ex.token);
    expect(result.parts[2]).toBe(ex.signature);
  });

  it('node:crypto agrees with the page signature', () => {
    const signingInput = `${b64u(ex.header)}.${b64u(ex.payload)}`;
    expect(`${signingInput}.${createHmac('sha256', ex.secret).update(signingInput).digest('base64url')}`).toBe(ex.token);
  });

  it('decodes back to the claims, and the time claims are seconds', () => {
    const decoded = decodeJwt(ex.token);
    expect(JSON.stringify(decoded.header)).toBe(ex.header);
    expect(JSON.stringify(decoded.payload)).toBe(ex.payload);
    expect(new Date(ex.iat * 1000).toISOString()).toBe(ex.iatUtc);
    expect(new Date(ex.exp * 1000).toISOString()).toBe(ex.expUtc);
    expect(ex.exp - ex.iat).toBe(3600);
  });

  it('the decoder flags the token as expired a day later but not inside the window', () => {
    expect(analyzeTimeClaim('exp', ex.exp, (ex.iat + 60) * 1000).status).toBe('not-expired');
    expect(analyzeTimeClaim('exp', ex.exp, (ex.exp + 86400) * 1000).status).toBe('expired');
    expect(analyzeTimeClaim('nbf', ex.iat + 600, ex.iat * 1000).status).toBe('not-yet-valid');
  });

  it('changing one payload byte breaks the signature', () => {
    const [h, , sig] = ex.token.split('.');
    const tampered = `${h}.${b64u(ex.payload.replace('test-user-123', 'test-user-124'))}`;
    const expected = createHmac('sha256', ex.secret).update(tampered).digest('base64url');
    expect(expected).not.toBe(sig);
  });
});
