import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hash Generator - SHA-256, SHA-1, MD5 & bcrypt',
  description: 'Generate SHA-256, SHA-1, MD5, and bcrypt output for text locally in your browser. Legacy algorithms are clearly labeled and no input is submitted for processing.',
  alternates: { canonical: '/tools/hash-generator' },
  keywords: ['hash generator', 'SHA256 generator', 'SHA-1 generator', 'MD5 generator', 'bcrypt generator', 'crypto hash', 'client-side hash'],
  openGraph: {
    title: 'Hash Generator - SHA-256, SHA-1, MD5 & bcrypt | OpsecForge',
    description: 'Generate text hashes locally in your browser, with clear guidance for legacy algorithms and bcrypt.',
  },
};

export { default } from '../tool-layout';
