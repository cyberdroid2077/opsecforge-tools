/**
 * Synthetic encrypted JWT shown in the JWT decoder guide. The key is a made-up test value that
 * protects nothing; lib/jwe-example.test.ts checks that the token really decrypts to these claims.
 */
export const JWE_EXAMPLE = {
  /** 256-bit test key, hex. */
  keyHex: '0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0',
  header: { alg: 'dir', enc: 'A256GCM', typ: 'JWT' },
  claims: {
    iss: 'https://issuer.example.test',
    sub: 'test-user-123',
    aud: 'test-audience',
    iat: 1700000000,
    exp: 4102444800,
  },
  token:
    'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwidHlwIjoiSldUIn0..AAECAwQFBgcICQoL.7mJ5qTJXaSFPwyOceYGMFCIAOyYwODrDyV6KsokzwiPEyR5FwVoyuuaWce2WdJ9WG4ID8pXqBvXm5hoNzf1hnZpVfi-jA4n1zsXfHf3wBLOogrEJ60D3OGjNXG-X_-QH5F_9FI5Y0yUIX2hA1nWYMD0dlQ.5aycbBlxP3ltTC1sMQC1tg',
} as const;
