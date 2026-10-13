// @vitest-environment node
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  JwtError,
  analyzeJwt,
  analyzeTimeClaim,
  base64UrlEncodeString,
  decodeJwt,
  encodeJwt,
  formatRelativeTime,
  parseJsonObject,
  validateJsonObject,
} from './jwt';

// All tokens below are synthetic: made from invented claims and a throwaway "secret".
const NOW = Date.UTC(2026, 5, 15, 12, 0, 0); // 2026-06-15T12:00:00Z
const nowSec = NOW / 1000;
const HOUR = 3600;
const DAY = 86400;

const makeToken = (
  payload: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'HS256', typ: 'JWT' },
  signature = 'c2lnbmF0dXJl',
) =>
  [
    base64UrlEncodeString(JSON.stringify(header)),
    base64UrlEncodeString(JSON.stringify(payload)),
    signature,
  ].join('.');

const analyze = (payload: Record<string, unknown>, header?: Record<string, unknown>, sig?: string) =>
  analyzeJwt(decodeJwt(makeToken(payload, header, sig)), NOW);

const messages = (alerts: { message: string }[]) => alerts.map((a) => a.message).join('\n');

describe('decodeJwt', () => {
  it('decodes header, payload and the raw signature, including non-ASCII claims', () => {
    const token = makeToken({ sub: 'test-user-123', name: 'Synthetic Üser 测试' });
    const decoded = decodeJwt(token);

    expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(decoded.payload).toEqual({ sub: 'test-user-123', name: 'Synthetic Üser 测试' });
    expect(decoded.signature).toBe('c2lnbmF0dXJl');
    expect(decoded.parts.join('.')).toBe(token);
  });

  it('tolerates surrounding whitespace and padded segments', () => {
    const token = makeToken({ a: 1 });
    expect(decodeJwt(`  ${token}\n`).payload).toEqual({ a: 1 });
    const [h, p, s] = token.split('.');
    expect(decodeJwt(`${h}==.${p}.${s}`).payload).toEqual({ a: 1 });
  });

  it.each([
    ['', 'Must have 3 parts'],
    ['only.two', 'Must have 3 parts'],
    ['a.b.c.d', 'Must have 3 parts'],
    ['..sig', 'header segment is empty'],
    ['!!!!.e30.sig', 'header segment is not valid Base64URL'],
    ['a.e30.sig', 'header segment is not valid Base64URL'], // length % 4 === 1
    [`${base64UrlEncodeString('not json')}.e30.sig`, 'header segment is not valid JSON'],
    [`e30.${base64UrlEncodeString('[1,2]')}.sig`, 'must be JSON objects'],
    [`e30.${base64UrlEncodeString('null')}.sig`, 'must be JSON objects'],
    ['/w.e30.sig', 'not valid UTF-8'], // 0xFF is not valid UTF-8
  ])('rejects malformed token %j', (token, fragment) => {
    expect(() => decodeJwt(token)).toThrow(JwtError);
    expect(() => decodeJwt(token)).toThrow(fragment);
  });
});

describe('analyzeTimeClaim semantics', () => {
  it('does not treat a past iat as expired', () => {
    const info = analyzeTimeClaim('iat', nowSec - 30 * DAY, NOW);
    expect(info.status).toBe('issued');
    expect(info.display).not.toMatch(/EXPIRED/);
    expect(info.display).toMatch(/ago\)$/);
  });

  it('does not treat a past nbf or auth_time as expired or pending', () => {
    expect(analyzeTimeClaim('nbf', nowSec - HOUR, NOW).status).toBe('in-effect');
    const authTime = analyzeTimeClaim('auth_time', nowSec - HOUR, NOW);
    expect(authTime.status).toBe('issued');
    expect(authTime.badge).toBeUndefined();
  });

  it('flags a past exp as expired and a future exp as not expired', () => {
    const past = analyzeTimeClaim('exp', nowSec - 2 * HOUR, NOW);
    expect(past.status).toBe('expired');
    expect(past.badge).toMatch(/EXPIRED/);
    expect(past.relative).toBe('2 hours ago');

    const future = analyzeTimeClaim('exp', nowSec + 2 * HOUR, NOW);
    expect(future.status).toBe('not-expired');
    expect(future.badge).toBeUndefined();
    expect(future.relative).toBe('in 2 hours');
  });

  it('treats exp equal to now as expired (RFC 7519: on or after exp is rejected)', () => {
    expect(analyzeTimeClaim('exp', nowSec, NOW).status).toBe('expired');
  });

  it('flags a future nbf as not yet valid', () => {
    const info = analyzeTimeClaim('nbf', nowSec + 3 * DAY, NOW);
    expect(info.status).toBe('not-yet-valid');
    expect(info.badge).toMatch(/NOT YET VALID/);
    expect(info.relative).toBe('in 3 days');
  });

  it('flags a future iat as a possible clock skew rather than expired', () => {
    const info = analyzeTimeClaim('iat', nowSec + 10 * 60, NOW);
    expect(info.status).toBe('issued-in-future');
    expect(info.badge).toMatch(/clock skew/);
    expect(info.display).not.toMatch(/EXPIRED/);
  });

  it('uses "in ..." for the future and "... ago" for the past', () => {
    expect(formatRelativeTime(30_000)).toBe('in less than a minute');
    expect(formatRelativeTime(-30_000)).toBe('less than a minute ago');
    expect(formatRelativeTime(60_000)).toBe('in 1 minute');
    expect(formatRelativeTime(-5 * 60_000)).toBe('5 minutes ago');
    expect(formatRelativeTime(DAY * 1000)).toBe('in 1 day');
    expect(formatRelativeTime(-45 * DAY * 1000)).toBe('1 month ago');
    expect(formatRelativeTime(3 * 365 * DAY * 1000)).toBe('in 3 years');
  });

  it('interprets 13-digit values as milliseconds and says so', () => {
    const info = analyzeTimeClaim('iat', NOW - HOUR * 1000, NOW);
    expect(info.interpretedAsMilliseconds).toBe(true);
    expect(info.seconds).toBe(nowSec - HOUR);
    expect(info.relative).toBe('1 hour ago');
  });

  it('accepts numeric strings (lenient) and rejects other values as invalid', () => {
    expect(analyzeTimeClaim('exp', String(nowSec - 5), NOW).status).toBe('expired');
    const invalid = analyzeTimeClaim('exp', 'soon', NOW);
    expect(invalid.status).toBe('invalid');
    expect(invalid.display).toContain('"soon"');
    expect(analyzeTimeClaim('exp', null, NOW).status).toBe('invalid');
    expect(analyzeTimeClaim('exp', { a: 1 }, NOW).status).toBe('invalid');
    expect(analyzeTimeClaim('exp', true, NOW).status).toBe('invalid');
  });

  it.each([1e20, -1e20, 9e15, 1e308, Infinity, -Infinity, '1e999'])(
    'degrades gracefully instead of throwing for out-of-range value %s',
    (value) => {
      let info: ReturnType<typeof analyzeTimeClaim> | undefined;
      expect(() => {
        info = analyzeTimeClaim('exp', value, NOW);
      }).not.toThrow();
      expect(info?.status).toBe('out-of-range');
      expect(info?.display).toContain('out of representable date range');
      expect(info?.display).toContain(String(value));
      expect(info?.utc).toBeUndefined();
    },
  );

  it('handles the largest representable date', () => {
    const info = analyzeTimeClaim('exp', 8.64e15, NOW); // read as milliseconds: the Date maximum
    expect(info.status).toBe('not-expired');
    expect(info.utc).toMatch(/UTC$/);
  });
});

describe('analyzeJwt', () => {
  it('does not raise any expiry alert for a normal token with a past iat and a future exp', () => {
    const { alerts, timeClaims } = analyze({
      sub: 'test-user-123',
      iat: nowSec - DAY,
      exp: nowSec + DAY,
    });

    expect(timeClaims.iat?.status).toBe('issued');
    expect(timeClaims.exp?.status).toBe('not-expired');
    expect(messages(alerts)).not.toMatch(/expired|not valid yet|future/i);
    expect(alerts.every((a) => a.type === 'info')).toBe(true);
  });

  it('warns when exp is in the past', () => {
    const { alerts } = analyze({ iat: nowSec - 2 * DAY, exp: nowSec - DAY });
    const alert = alerts.find((a) => /expired/i.test(a.message));
    expect(alert?.type).toBe('warning');
    expect(alert?.message).toContain('1 day ago');
  });

  it('warns when nbf is in the future', () => {
    const { alerts } = analyze({ iat: nowSec, exp: nowSec + DAY, nbf: nowSec + HOUR });
    const alert = alerts.find((a) => /not valid yet/i.test(a.message));
    expect(alert?.type).toBe('warning');
    expect(alert?.message).toContain('in 1 hour');
  });

  it('warns about a future iat with "in ..." wording and without calling it expired', () => {
    const { alerts } = analyze({ iat: nowSec + 2 * HOUR, exp: nowSec + DAY });
    const alert = alerts.find((a) => /"iat"/.test(a.message));
    expect(alert?.message).toContain('in 2 hours');
    expect(alert?.message).toMatch(/clock skew/);
    expect(messages(alerts)).not.toMatch(/expired/i);
  });

  it('does not throw on out-of-range or nonsensical time claims and reports them', () => {
    let result: ReturnType<typeof analyzeJwt> | undefined;
    expect(() => {
      result = analyze({ exp: 1e20, iat: 'yesterday', nbf: 1e308 });
    }).not.toThrow();
    const text = messages(result!.alerts);
    expect(text).toMatch(/"exp" is outside the representable date range/);
    expect(text).toMatch(/"iat" is not a numeric date/);
    expect(result!.timeClaims.nbf?.status).toBe('out-of-range');
  });

  it('flags alg none (any casing) as an error', () => {
    for (const alg of ['none', 'None', 'NONE']) {
      const { alerts } = analyze({ iat: nowSec, exp: nowSec + DAY }, { alg, typ: 'JWT' }, '');
      const alert = alerts.find((a) => /alg: none/.test(a.message));
      expect(alert?.type).toBe('error');
    }
  });

  it('says HS* signatures cannot be verified offline, and does not say it for RS256', () => {
    for (const alg of ['HS256', 'HS384', 'HS512']) {
      const { alerts } = analyze({ iat: nowSec, exp: nowSec + DAY }, { alg });
      expect(messages(alerts)).toMatch(/cannot be verified offline/);
    }
    const rs = analyze({ iat: nowSec, exp: nowSec + DAY }, { alg: 'RS256' });
    expect(messages(rs.alerts)).not.toMatch(/HMAC/);
  });

  it('notes missing exp and iat claims', () => {
    const { alerts } = analyze({ sub: 'test-user-123' });
    const text = messages(alerts);
    expect(text).toMatch(/no "exp"/);
    expect(text).toMatch(/no "iat"/);
  });

  it('warns about a missing alg, an empty signature and self-referencing key headers', () => {
    expect(messages(analyze({ exp: nowSec + DAY, iat: nowSec }, { typ: 'JWT' }).alerts)).toMatch(
      /no usable "alg"/,
    );
    expect(
      messages(analyze({ exp: nowSec + DAY, iat: nowSec }, { alg: 'RS256' }, '').alerts),
    ).toMatch(/signature segment is empty/);
    expect(
      messages(
        analyze({ exp: nowSec + DAY, iat: nowSec }, { alg: 'RS256', jku: 'https://keys.test.example/jwks' })
          .alerts,
      ),
    ).toMatch(/"jku"/);
  });
});

describe('encodeJwt', () => {
  const base = {
    headerJson: '{"alg":"HS256","typ":"JWT"}',
    payloadJson: '{"sub":"1234567890","name":"John Doe","iat":1516239022}',
    secret: 'your-256-bit-secret', // the public jwt.io demo value, not a real secret
    algorithm: 'HS256' as const,
  };

  it('reproduces the well-known HS256 test vector', async () => {
    const { token } = await encodeJwt(base);
    expect(token).toBe(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    );
  });

  it('matches an independent HMAC implementation for HS256 and HS512', async () => {
    for (const [algorithm, hash] of [
      ['HS256', 'sha256'],
      ['HS512', 'sha512'],
    ] as const) {
      const { token, parts } = await encodeJwt({ ...base, algorithm });
      const expected = createHmac(hash, base.secret)
        .update(`${parts[0]}.${parts[1]}`)
        .digest('base64url');
      expect(token.split('.')[2]).toBe(expected);
    }
  });

  it('forces the header alg to the selected algorithm and round-trips through decodeJwt', async () => {
    const { token } = await encodeJwt({
      ...base,
      headerJson: '{"alg":"none","typ":"JWT","kid":"test-key-1"}',
      payloadJson: '{"name":"Synthetic Üser 测试","scope":"records:read"}',
      algorithm: 'HS512',
    });
    const decoded = decodeJwt(token);
    expect(decoded.header).toEqual({ alg: 'HS512', typ: 'JWT', kid: 'test-key-1' });
    expect(decoded.payload).toEqual({ name: 'Synthetic Üser 测试', scope: 'records:read' });
  });

  it('produces tokens whose segments contain URL-safe characters and still decode', async () => {
    // "???>>>" is "Pz8/Pj4+" in plain Base64, which uses '/' and '+'
    const { token, payload } = await encodeJwt({ ...base, payloadJson: '{"x":"???>>>"}' });
    expect(token).not.toMatch(/[+/=]/);
    expect(decodeJwt(token).payload).toEqual(payload);
  });

  it('rejects an empty secret, invalid JSON and non-object JSON with readable errors', async () => {
    await expect(encodeJwt({ ...base, secret: '   ' })).rejects.toThrow('Secret key is required');
    await expect(encodeJwt({ ...base, headerJson: '{oops' })).rejects.toThrow(
      'Header is not valid JSON',
    );
    await expect(encodeJwt({ ...base, payloadJson: '[1]' })).rejects.toThrow(
      'Payload must be a JSON object',
    );
    await expect(encodeJwt({ ...base, headerJson: 'null' })).rejects.toThrow(
      'Header must be a JSON object',
    );
  });

  it('exposes JSON object validation for editors', () => {
    expect(validateJsonObject('{"a":1}', 'Header')).toBe('');
    expect(validateJsonObject('nope', 'Header')).toBe('Header is not valid JSON');
    expect(validateJsonObject('42', 'Payload')).toBe('Payload must be a JSON object');
    expect(parseJsonObject('{"a":1}', 'Payload')).toEqual({ a: 1 });
  });
});
