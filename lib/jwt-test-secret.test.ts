import { describe, expect, it, vi } from 'vitest';
import { generateJwtTestSecret } from './jwt-test-secret';

describe('JWT synthetic HMAC secret generation', () => {
  it.each([
    ['HS256' as const, 32, 43],
    ['HS512' as const, 64, 86],
  ])('uses the required random-byte length for %s', (algorithm, byteLength, encodedLength) => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(0xff);
      return bytes;
    });

    const secret = generateJwtTestSecret(algorithm, { getRandomValues });

    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(getRandomValues.mock.calls[0][0]).toHaveLength(byteLength);
    expect(secret).toHaveLength(encodedLength);
    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(secret).not.toContain('=');
  });

  it('refuses generation without secure randomness', () => {
    expect(() => generateJwtTestSecret('HS256', null)).toThrow(
      'Secure browser randomness is unavailable.',
    );
  });
});
