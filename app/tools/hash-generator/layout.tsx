import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hash Generator - SHA256, SHA512, MD5, Bcrypt',
  description: 'Free hash generator that creates SHA256, SHA512, MD5, and Bcrypt hashes instantly in your browser. Zero network requests. Your strings never leave your device.',
  keywords: ['hash generator', 'SHA256 generator', 'SHA512 generator', 'MD5 generator', 'bcrypt generator', 'password hash', 'crypto hash', 'client-side hash'],
  openGraph: {
    title: 'Hash Generator - SHA256, SHA512, MD5, Bcrypt | OpsecForge',
    description: 'Free hash generator. SHA256, SHA512, MD5, Bcrypt. 100% browser-side.',
  },
};

export { default } from '../../layout';
