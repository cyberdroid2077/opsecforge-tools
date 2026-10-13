import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JWT Decoder - Decode JSON Web Tokens Instantly',
  description: 'Free JWT decoder that decodes JSON Web Tokens instantly in your browser. The pasted token is not sent to OpsecForge for processing. Inspect JWT headers and payloads; decoding does not verify the signature.',
  alternates: { canonical: '/tools/jwt-decoder' },
  keywords: ['JWT decoder', 'decode JWT', 'JWT inspector', 'JSON Web Token decoder', 'JWT parser', 'JWT viewer', 'decode token', 'client-side JWT'],
  openGraph: {
    title: 'JWT Decoder - Decode JSON Web Tokens Instantly | OpsecForge',
    description: 'Free JWT decoder that decodes JSON Web Tokens in your browser. The pasted token is not uploaded for processing. Decoding does not verify the signature.',
  },
};

export { default } from '../tool-layout';
