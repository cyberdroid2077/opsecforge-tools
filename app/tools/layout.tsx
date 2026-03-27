import ToolsShell from '@/components/tools/ToolsShell';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Free Developer Tools | OpsecForge',
    template: '%s | OpsecForge',
  },
  description: 'Collection of 100% free, privacy-first developer tools. All tools run client-side — your data never leaves your browser. No logs, no tracking, no ads.',
  keywords: ['developer tools', 'privacy tools', 'client-side tools', 'no-log tools', 'free tools', 'security tools', 'JWT decoder', 'hash generator', 'env sanitizer'],
  authors: [{ name: 'OpsecForge' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://opsecforge.com/tools',
    siteName: 'OpsecForge',
    title: 'Free Developer Tools | OpsecForge',
    description: 'Collection of 100% free, privacy-first developer tools. All tools run client-side — your data never leaves your browser.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Developer Tools | OpsecForge',
    description: 'Collection of 100% free, privacy-first developer tools. All tools run client-side.',
    site: '@opsecforge',
  },
};

const toolKeywords: Record<string, string[]> = {
  'jwt-decoder': ['JWT decoder', 'JSON Web Token decoder', 'JWT inspector', 'token decoder', 'decode JWT', 'JWT parser'],
  'jwt-encoder': ['JWT encoder', 'JSON Web Token encoder', 'create JWT', 'sign JWT', 'JWT generator'],
  'hash-generator': ['hash generator', 'SHA256 generator', 'MD5 generator', 'bcrypt generator', 'password hash'],
  'env-sanitizer': ['env sanitizer', '.env cleaner', 'hide secrets', 'redact env', 'env file security'],
  'base64-converter': ['Base64 encoder', 'Base64 decoder', 'Base64 converter', 'encode Base64'],
  'hash-generator': ['SHA256 hash', 'SHA512 hash', 'MD5 hash', 'crypto hash'],
  'password-generator': ['password generator', 'secure password', 'random password', 'password creator'],
  'qr-generator': ['QR code generator', 'QR code creator', 'make QR code', 'QR code'],
  'uuid-generator': ['UUID generator', 'GUID generator', 'unique ID generator', 'UUID creator'],
  'url-encoder': ['URL encoder', 'URL decoder', 'encode URL', 'percent encoding'],
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToolsShell>{children}</ToolsShell>;
}
