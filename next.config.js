const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

// Legacy URLs retired in the AdSense readiness clean-up: 301 to a same-topic page, or 410 Gone.
// The redirects kept below point at a page on the same topic. An old article with no same-topic
// replacement belongs in config/retired-urls.json under "gone" (410), not here.
// Single source of truth, shared with lib/retired-urls.test.ts.
const retired = require('./config/retired-urls.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  async redirects() {
    return [
      ...retired.redirects.map(({ source, destination }) => ({ source, destination, statusCode: 301 })),
      {
        source: '/blog/base64-vs-base64url-a-developer-s-guide-to-secure-encoding',
        destination: '/blog/base64-vs-base64url',
        permanent: true,
      },
      {
        source: '/blog/how-to-generate-cryptographic-hashes-offline',
        destination: '/blog/hash-generator-tools-data-integrity-security',
        permanent: true,
      },
      {
        source: '/blog/ai-opsec-checklist-how-to-use-llms-safely',
        destination: '/blog/ai-agent-credential-security-nhi-governance-2026',
        permanent: true,
      },
      {
        source: '/blog/how-to-safely-share-env-files',
        destination: '/blog/environment-variable-security-secrets-management',
        permanent: true,
      },
      {
        source: '/blog/how-to-securely-share-environment-variables-across-remote-teams',
        destination: '/blog/environment-variable-security-secrets-management',
        permanent: true,
      },
      {
        source: '/blog/how-to-validate-jwts-offline-without-exposing-your-secret-key',
        destination: '/blog/jwt-token-vulnerabilities-authentication-security',
        permanent: true,
      },
      {
        source: '/blog/stop-pasting-sensitive-json-online',
        destination: '/blog/api-json-response-security-blindspot-2026',
        permanent: true,
      },
      {
        source: '/blog/the-developer-s-guide-to-json-minification-for-production-apis',
        destination: '/tools/json-beautifier',
        permanent: true,
      },
      {
        source: '/blog/the-hidden-risks-of-pasting-sql-queries-into-online-formatters',
        destination: '/tools/sql-formatter',
        permanent: true,
      },
      {
        source: '/blog/the-ultimate-checklist-for-developer-operational-security-opsec',
        destination: '/blog/secure-coding-practices-development-security',
        permanent: true,
      },
      {
        source: '/blog/understanding-ulid-vs-uuid-which-should-you-choose-in-2026',
        destination: '/blog/how-to-generate-uuids-in-browser',
        permanent: true,
      },
      {
        source: '/blog/what-is-a-webhook-signature-and-why-must-you-validate-it',
        destination: '/blog/webhook-signature-validation-hmac-sha256-best-practices-2026',
        permanent: true,
      },
      {
        source: '/tools/json-formatter',
        destination: '/tools/json-beautifier',
        permanent: true,
      },
      {
        source: '/tools/sha256-hash',
        destination: '/tools/hash-generator',
        permanent: true,
      },
    ];
  },

  // HTTP 410 for retired URLs: rewritten (before the filesystem/dynamic routes) to a route handler
  // that answers 410. Only the listed paths are matched, so no other request is affected.
  async rewrites() {
    return {
      beforeFiles: retired.gone.map((source) => ({ source, destination: '/api/gone' })),
    };
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = withPWA(nextConfig);
