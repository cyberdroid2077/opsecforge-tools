import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JWT & JWE Decoder - Decode or Decrypt JSON Web Tokens Locally',
  description: 'Decode a JWT header and payload in your browser, or paste a five-part encrypted JWT (JWE) to read its header and part sizes and decrypt it with a test key. The token is not sent to OpsecForge. Optional local HS/RS/PS/ES/EdDSA signature check; a valid signature or a successful decryption does not by itself make a token trustworthy.',
  alternates: { canonical: '/tools/jwt-decoder' },
  keywords: ['JWT decoder', 'decode JWT', 'JWE decoder', 'decrypt JWE', 'JWT inspector', 'JSON Web Token decoder', 'JWT parser', 'JWT viewer', 'client-side JWT'],
  openGraph: {
    title: 'JWT & JWE Decoder - Decode or Decrypt JSON Web Tokens Locally | OpsecForge',
    description: 'Decodes JSON Web Tokens in your browser and reads or decrypts encrypted JWTs (JWE) with a key you paste. The pasted token is not uploaded for processing. Optional local signature check; decoding alone does not verify it.',
  },
};

export { default } from '../tool-layout';
