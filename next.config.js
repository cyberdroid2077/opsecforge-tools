const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/blog/jwt-none-algorithm-security-risk',
        destination: '/blog/jwt-none-algorithm-dangers',
        permanent: true,
      },
      {
        source: '/blog/jwt-none-algorithm-security-risks',
        destination: '/blog/jwt-none-algorithm-dangers',
        permanent: true,
      },
      {
        source: '/blog/jwt-algorithm-bypass',
        destination: '/blog/jwt-none-algorithm-dangers',
        permanent: true,
      },
      {
        source: '/blog/base64-vs-base64url-a-developer-s-guide-to-secure-encoding',
        destination: '/blog/base64-vs-base64url',
        permanent: true,
      },
      {
        source: '/blog/how-to-generate-cryptographic-hashes-offline',
        destination: '/blog/hash-generator-tools-data-integrity-security',
        permanent: true,
      }
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = withPWA(nextConfig);
