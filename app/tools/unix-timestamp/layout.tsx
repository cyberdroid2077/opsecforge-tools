import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unix Timestamp Converter - Epoch to Date & Back',
  description: 'Convert Unix timestamps to local or UTC dates and convert dates back to epoch seconds or milliseconds in your browser.',
  alternates: { canonical: '/tools/unix-timestamp' },
  keywords: ['Unix timestamp converter', 'epoch converter', 'Unix time', 'timestamp converter', 'epoch to date'],
  openGraph: {
    title: 'Unix Timestamp Converter - Epoch to Date & Back | OpsecForge',
    description: 'Convert epoch seconds or milliseconds to dates and dates back to Unix time in your browser.',
  },
};

export { default } from '../tool-layout';
