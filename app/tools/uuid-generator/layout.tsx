import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UUID Generator (v4, v7) & UUID Decoder',
  description: 'Generate v4 and v7 UUIDs, or decode an existing UUID to see its version, variant and timestamp. Everything runs locally in your browser.',
  alternates: { canonical: '/tools/uuid-generator' },
  keywords: ['UUID generator', 'GUID generator', 'unique ID generator', 'UUID v4', 'generate UUID', 'UUID decoder', 'UUID v7 timestamp'],
  openGraph: {
    title: 'UUID Generator (v4, v7) & UUID Decoder | OpsecForge',
    description: 'Generate v4 and v7 UUIDs or decode an existing one, all in your browser.',
  },
};

export { default } from '../tool-layout';
