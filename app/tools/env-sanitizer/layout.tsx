import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Env Sanitizer - Redact Secrets from .env Files',
  description: 'Free env sanitizer that automatically detects and redacts API keys, passwords, and secrets from .env files before sharing. 100% client-side processing.',
  keywords: ['env sanitizer', 'redact secrets', '.env cleaner', 'hide API keys', 'env file security', 'Stripe key redaction', 'AWS credential masking', 'client-side'],
  openGraph: {
    title: 'Env Sanitizer - Redact Secrets from .env Files | OpsecForge',
    description: 'Free tool to redact secrets from .env files. Detect Stripe, AWS, GitHub keys and more. 100% private.',
  },
};

export { default } from '../../layout';
