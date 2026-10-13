import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Formatter - Validate and Format JSON',
  description: 'Free JSON formatter with syntax validation. Format, minify, and validate JSON data. See errors in real-time. Runs in your browser.',
  alternates: { canonical: '/tools/json-beautifier' },
  keywords: ['JSON formatter', 'JSON validator', 'format JSON', 'minify JSON', 'JSON syntax checker'],
  openGraph: {
    title: 'JSON Formatter - Validate and Format JSON | OpsecForge',
    description: 'Free JSON formatter with real-time validation. Runs in your browser.',
  },
};

export { default } from '../tool-layout';
