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
      },
      {
        source: '/blog/ai-opsec-checklist-how-to-use-llms-safely',
        destination: '/blog/ai-agent-credential-security-nhi-governance-2026',
        permanent: true,
      },
      {
        source: '/blog/global-privacy-compliance-guide-2026',
        destination: '/privacy',
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
        source: '/blog/why-client-side-execution-is-the-future-of-developer-utilities',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/blog/why-soc2-compliance-means-you-should-stop-using-cloud-formatters',
        destination: '/about',
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

  async headers() {
    return [
      {
        source: '/tools/:path(lorem-ipsum|markdown-to-html|qr-generator|text-case|text-diff|url-encoder|word-counter)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = withPWA(nextConfig);
