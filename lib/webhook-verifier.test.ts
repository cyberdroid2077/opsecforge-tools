import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  verifyGenericWebhook,
  verifyGitHubWebhook,
  verifyStripeWebhook,
  webCryptoHashName,
} from './webhook-verifier';

describe('webhook verifier', () => {
  it('maps UI algorithm names to valid Web Crypto identifiers', () => {
    expect(webCryptoHashName('sha1')).toBe('SHA-1');
    expect(webCryptoHashName('sha256')).toBe('SHA-256');
    expect(webCryptoHashName('sha512')).toBe('SHA-512');
  });

  it('matches the official GitHub HMAC-SHA256 test vector', async () => {
    const matched = await verifyGitHubWebhook({
      payload: 'Hello, World!',
      secret: "It's a Secret to Everybody",
      signatureHeader: 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17',
    });

    expect(matched).toBe(true);
  });

  it('rejects a modified GitHub payload and a wrong header prefix', async () => {
    await expect(
      verifyGitHubWebhook({
        payload: 'Hello, World?',
        secret: "It's a Secret to Everybody",
        signatureHeader: 'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17',
      }),
    ).resolves.toBe(false);

    await expect(
      verifyGitHubWebhook({
        payload: 'Hello, World!',
        secret: "It's a Secret to Everybody",
        signatureHeader: 'sha1=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17',
      }),
    ).rejects.toThrow('sha256=');
  });

  it('verifies generic HMAC values and rejects malformed hex', async () => {
    const payload = '{"synthetic":true}';
    const secret = 'synthetic-generic-secret';
    const signature = createHmac('sha512', secret).update(payload).digest('hex');

    await expect(
      verifyGenericWebhook({ payload, secret, signature, algorithm: 'sha512' }),
    ).resolves.toBe(true);
    await expect(
      verifyGenericWebhook({ payload, secret, signature: 'not-hex', algorithm: 'sha256' }),
    ).rejects.toThrow('64 hexadecimal');
  });

  it('verifies Stripe v1 over timestamp.rawBody within the selected tolerance', async () => {
    const timestamp = 1_700_000_000;
    const payload = '{"id":"evt_synthetic"}';
    const secret = 'synthetic-endpoint-secret';
    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const result = await verifyStripeWebhook({
      payload,
      secret,
      signatureHeader: `t=${timestamp},v1=${signature}`,
      toleranceSeconds: 300,
      nowSeconds: timestamp + 120,
    });

    expect(result).toEqual({
      signatureMatched: true,
      timestamp,
      ageSeconds: 120,
      withinTolerance: true,
    });
  });

  it('checks every Stripe v1 value during secret rotation', async () => {
    const timestamp = 1_700_000_000;
    const payload = '{"id":"evt_rotation"}';
    const secret = 'synthetic-rotation-secret';
    const matchingSignature = createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const result = await verifyStripeWebhook({
      payload,
      secret,
      signatureHeader: `t=${timestamp},v1=${'0'.repeat(64)},v1=${matchingSignature}`,
      nowSeconds: timestamp,
    });

    expect(result.signatureMatched).toBe(true);
  });

  it('reports a matching but stale Stripe signature without treating it as accepted', async () => {
    const timestamp = 1_700_000_000;
    const payload = '{"id":"evt_stale"}';
    const secret = 'synthetic-stale-secret';
    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const result = await verifyStripeWebhook({
      payload,
      secret,
      signatureHeader: `t=${timestamp},v1=${signature}`,
      toleranceSeconds: 300,
      nowSeconds: timestamp + 301,
    });

    expect(result.signatureMatched).toBe(true);
    expect(result.withinTolerance).toBe(false);
    expect(result.ageSeconds).toBe(301);
  });

  it('rejects incomplete Stripe headers and disabled tolerance checks', async () => {
    await expect(
      verifyStripeWebhook({
        payload: '{}',
        secret: 'synthetic-secret',
        signatureHeader: 'v1=abc',
      }),
    ).rejects.toThrow('t= Unix timestamp');

    await expect(
      verifyStripeWebhook({
        payload: '{}',
        secret: 'synthetic-secret',
        signatureHeader: `t=1700000000,v1=${'0'.repeat(64)}`,
        toleranceSeconds: 0,
      }),
    ).rejects.toThrow('greater than zero');
  });
});
