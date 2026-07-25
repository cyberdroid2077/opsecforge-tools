import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JWT Decoder - Decode JSON Web Tokens Instantly',
  description: 'Free JWT decoder that decodes JSON Web Tokens instantly in your browser. No data sent to servers. Inspect JWT headers, payloads, and signatures privately.',
  alternates: { canonical: '/tools/jwt-decoder' },
  keywords: ['JWT decoder', 'decode JWT', 'JWT inspector', 'JSON Web Token decoder', 'JWT parser', 'JWT viewer', 'decode token', 'client-side JWT'],
  openGraph: {
    title: 'JWT Decoder - Decode JSON Web Tokens Instantly | OpsecForge',
    description: 'Free JWT decoder that decodes JSON Web Tokens in your browser. Zero data transmission. 100% private.',
  },
};

export { default } from '../tool-layout';
