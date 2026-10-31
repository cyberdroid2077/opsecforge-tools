import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'File Checksum Verifier & SHA-256 Hash Generator',
  description: 'Verify a download against its SHA-256 or SHA-512 checksum in your browser, including ISO images up to 8 GiB. Paste the digest or a SHA256SUMS line. No file upload.',
  alternates: { canonical: '/tools/hash-generator' },
  keywords: ['hash generator', 'SHA256 generator', 'SHA-1 generator', 'MD5 generator', 'bcrypt generator', 'crypto hash', 'client-side hash'],
  openGraph: {
    title: 'File Checksum Verifier & SHA-256 Hash Generator | OpsecForge',
    description: 'Compare a local file with a trusted SHA-256 or SHA-512 checksum. Files up to 8 GiB, without uploading the file.',
  },
};

export { default } from '../tool-layout';
