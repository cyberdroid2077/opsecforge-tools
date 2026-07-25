import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safe-to-Share Sanitizer - Redact Common Secrets Locally',
  description: 'Heuristically redact common secrets from .env, JSON, YAML, logs, headers, URLs, and cURL commands in your browser. Review output before sharing.',
  keywords: ['env sanitizer', 'redact secrets', 'log sanitizer', 'hide API keys', 'env file security', 'credential redaction', 'client-side'],
  openGraph: {
    title: 'Safe-to-Share Sanitizer | OpsecForge',
    description: 'Make a browser-local, heuristic redaction pass over configuration, logs, headers, and cURL commands. Human review is still required.',
  },
};

export { default } from '../tool-layout';
