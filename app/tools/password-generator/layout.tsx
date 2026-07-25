import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Password Generator - Create Secure Random Passwords',
  description: 'Free password generator that creates strong, secure random passwords in your browser. Customizable length and complexity. No passwords stored or transmitted.',
  alternates: { canonical: '/tools/password-generator' },
  keywords: ['password generator', 'secure password', 'random password', 'password creator', 'strong password'],
  openGraph: {
    title: 'Password Generator - Create Secure Random Passwords | OpsecForge',
    description: 'Free customizable password generator with browser-local generation.',
  },
};

export { default } from '../tool-layout';
