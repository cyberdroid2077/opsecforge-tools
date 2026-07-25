import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UUID Generator - Create Unique Identifiers',
  description: 'Free UUID v4 generator that creates unique identifiers instantly in your browser. No server requests. Generate multiple UUIDs at once.',
  alternates: { canonical: '/tools/uuid-generator' },
  keywords: ['UUID generator', 'GUID generator', 'unique ID generator', 'UUID v4', 'generate UUID'],
  openGraph: {
    title: 'UUID Generator - Create Unique Identifiers | OpsecForge',
    description: 'Free UUID v4 generator with browser-local generation.',
  },
};

export { default } from '../tool-layout';
