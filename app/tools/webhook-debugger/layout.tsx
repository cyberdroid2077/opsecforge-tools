import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webhook Signature Verifier - GitHub, Stripe & HMAC',
  description: 'Paste an exact raw body, signature, and secret to verify GitHub, Stripe, or generic HMAC values locally in your browser. No input upload or storage.',
  keywords: ['webhook signature verifier', 'GitHub webhook signature', 'Stripe webhook signature', 'HMAC verification', 'webhook debugging'],
  openGraph: {
    title: 'Webhook Signature Verifier | OpsecForge',
    description: 'Verify supplied GitHub, Stripe, and generic HMAC values in your browser with explicit replay and authenticity boundaries.',
  },
};

export { default } from '../../layout';
