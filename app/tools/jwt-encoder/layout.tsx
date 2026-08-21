import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JWT Encoder - Create Synthetic HS256 and HS512 Test Tokens',
  description: 'Create synthetic HS256 or HS512 JWT fixtures in your browser for development and protocol testing. Do not use production signing keys or real identity data.',
  alternates: { canonical: '/tools/jwt-encoder' },
  keywords: ['JWT encoder', 'create JWT', 'sign JWT', 'JSON Web Token encoder', 'HS256', 'HS512', 'JWT generator', 'client-side JWT'],
  openGraph: {
    title: 'JWT Encoder for Synthetic Test Tokens | OpsecForge',
    description: 'Create browser-local HS256 or HS512 JWT fixtures with invented claims and throwaway test keys.',
  },
};

export { default } from '../tool-layout';
