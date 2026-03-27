const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence Turbopack/Webpack conflict warning for now
  // as next-pwa still relies on some webpack internal injection
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
      }
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = withPWA(nextConfig);
