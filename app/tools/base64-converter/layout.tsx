import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Base64 & Base64URL Converter - Encode and Decode Text or Files',
  description: 'Encode or decode text and files with standard Base64 and Base64URL locally in your browser. Convert Base64 or a data: URL back to a file, preview images, and check padding errors.',
  alternates: { canonical: '/tools/base64-converter' },
  keywords: ['Base64 encoder', 'Base64 decoder', 'Base64URL converter', 'encode Base64', 'decode Base64URL', 'Base64 to file'],
  openGraph: {
    title: 'Base64 & Base64URL Converter | OpsecForge',
    description: 'Encode and decode text and files with standard or URL-safe Base64 in your browser.',
  },
};

export { default } from '../tool-layout';
