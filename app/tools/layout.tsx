import ToolsShell from '@/components/tools/ToolsShell';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Free Developer Tools | OpsecForge',
    template: '%s | OpsecForge',
  },
  description: 'Collection of free, privacy-first developer tools. Core tool inputs stay in your browser and are never sent to OpsecForge analytics.',
  keywords: ['developer tools', 'privacy tools', 'client-side tools', 'no-log tools', 'free tools', 'security tools', 'JWT decoder', 'hash generator', 'env sanitizer'],
  authors: [{ name: 'OpsecForge' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.opsecforge.com/tools',
    siteName: 'OpsecForge',
    title: 'Free Developer Tools | OpsecForge',
    description: 'Free, privacy-first developer tools whose core inputs stay in your browser and are never included in analytics events.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Developer Tools | OpsecForge',
    description: 'Free developer tools whose core inputs stay in your browser and out of analytics.',
    site: '@opsecforge',
  },
};

const toolKeywords: Record<string, string[]> = {
  'jwt-decoder': ['JWT decoder', 'JSON Web Token decoder', 'JWT inspector', 'token decoder', 'decode JWT', 'JWT parser'],
  'jwt-encoder': ['JWT encoder', 'JSON Web Token encoder', 'create JWT', 'sign JWT', 'JWT generator'],
  'hash-generator': ['hash generator', 'SHA256 generator', 'MD5 generator', 'bcrypt generator', 'password hash', 'SHA256 hash', 'SHA512 hash', 'crypto hash'],
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
