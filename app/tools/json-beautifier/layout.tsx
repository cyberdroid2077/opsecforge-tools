import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSON Beautifier - Format and Indent JSON',
  description: 'Free JSON beautifier that formats and indents JSON data. Validate JSON syntax while you edit. Processed in your browser tab, not uploaded to OpsecForge.',
  alternates: { canonical: '/tools/json-beautifier' },
  keywords: ['JSON beautifier', 'format JSON', 'JSON formatter', 'indent JSON', 'JSON validator'],
  openGraph: {
    title: 'JSON Beautifier - Format and Indent JSON | OpsecForge',
    description: 'Free JSON beautifier that formats JSON in your browser.',
  },
};

export { default } from '../tool-layout';
