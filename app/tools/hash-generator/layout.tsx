import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'File Checksum Verifier & SHA-256 Hash Generator',
  description: 'Calculate and compare SHA-256 or SHA-512 file checksums locally, up to 32 MiB. No file upload. Includes text hashes and clear mismatch troubleshooting.',
  alternates: { canonical: '/tools/hash-generator' },
  keywords: ['hash generator', 'SHA256 generator', 'SHA-1 generator', 'MD5 generator', 'bcrypt generator', 'crypto hash', 'client-side hash'],
  openGraph: {
    title: 'File Checksum Verifier & SHA-256 Hash Generator | OpsecForge',
    description: 'Compare a local file with a trusted SHA-256 or SHA-512 checksum. Up to 32 MiB, without uploading the file.',
  },
};

export { default } from '../tool-layout';
