import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Text Case Converter - Change Text Case',
  description: 'Free text case converter. Transform text to uppercase, lowercase, title case, and more. Instant conversion in your browser.',
  alternates: { canonical: '/tools/text-case' },
  keywords: ['text case converter', 'uppercase', 'lowercase', 'title case', 'change case', 'text transformer'],
  openGraph: {
    title: 'Text Case Converter - Change Text Case | OpsecForge',
    description: 'Free text case converter. 100% browser-side.',
  },
};

export { default } from '../tool-layout';
