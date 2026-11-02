import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UUID Generator - Create Unique Identifiers',
  description: 'Free UUID generator for random v4 and time-ordered v7 (RFC 9562) identifiers. Generated locally in your browser with the Web Crypto API. Batch up to 100, uppercase or no hyphens.',
  alternates: { canonical: '/tools/uuid-generator' },
  keywords: ['UUID generator', 'GUID generator', 'unique ID generator', 'UUID v4', 'generate UUID'],
  openGraph: {
    title: 'UUID Generator - Create Unique Identifiers | OpsecForge',
    description: 'Free UUID v4 and v7 generator with browser-local generation.',
  },
};

export { default } from '../tool-layout';
