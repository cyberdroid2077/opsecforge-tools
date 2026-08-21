export type JwtHmacAlgorithm = 'HS256' | 'HS512';

type CryptoRandom = Pick<Crypto, 'getRandomValues'>;

export function generateJwtTestSecret(
  algorithm: JwtHmacAlgorithm,
  cryptoApi: CryptoRandom | null | undefined = globalThis.crypto,
): string {
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Secure browser randomness is unavailable.');
  }

  const bytes = new Uint8Array(algorithm === 'HS512' ? 64 : 32);
  cryptoApi.getRandomValues(bytes);

  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
