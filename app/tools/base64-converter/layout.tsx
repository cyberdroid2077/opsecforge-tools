import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base64 & Base64URL Converter - Encode and Decode Text',
  description: 'Encode or decode UTF-8 text with standard Base64 and URL-safe Base64URL locally in your browser.',
  alternates: { canonical: '/tools/base64-converter' },
  keywords: ['Base64 encoder', 'Base64 decoder', 'Base64URL converter', 'encode Base64', 'decode Base64URL'],
  openGraph: {
    title: 'Base64 & Base64URL Converter | OpsecForge',
    description: 'Encode and decode UTF-8 text with standard or URL-safe Base64 in your browser.',
  },
};

export { default } from '../tool-layout';
