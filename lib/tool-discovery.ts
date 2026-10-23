import { allTools } from './tool-catalog';

/*
 * Discovery data for the indexable tool pages: related guides, adjacent tools
 * and JSON-LD. Every href here must be a sitemap URL; lib/tool-discovery.test.ts
 * checks that guides exist as reviewed Markdown posts and tools exist in the
 * catalog.
 */

const SITE_URL = 'https://www.opsecforge.com';

export type RelatedGuide = {
  title: string;
  href: string;
  /** What the guide covers and where it stops. */
  note: string;
};

export type RelatedTool = {
  href: string;
  /** The specific adjacent task, not a generic invitation. */
  note: string;
};

export type ToolDiscovery = {
  guides: RelatedGuide[];
  tools: RelatedTool[];
};

const jwtVulnerabilities: RelatedGuide = {
  title: 'JWT vulnerabilities and safe validation',
  href: '/blog/jwt-token-vulnerabilities-authentication-security',
  note: 'Why decoding a token is not validating it, and what a verifier must check.',
};

const jwtSigning: RelatedGuide = {
  title: 'JWT signing: safe token issuance and validation',
  href: '/blog/jwt-encoder-security-token-generation-best-practices',
  note: 'Algorithm choice, claims, lifetimes, and why test tokens should use throwaway keys.',
};

export const toolDiscovery: Record<string, ToolDiscovery> = {
  'webhook-debugger': {
    guides: [
      {
        title: 'Webhook signature validation best practices',
        href: '/blog/webhook-signature-validation-hmac-sha256-best-practices-2026',
        note: 'Raw-body handling, constant-time comparison, secrets, and replay defenses for production receivers.',
      },
      {
        title: 'CVE-2026-33143: a webhook handler that skipped signature checks',
        href: '/blog/cve-2026-33143-webhook-signature-verification-bypass-2026',
        note: 'What the advisory establishes and how to test that unsigned requests are rejected.',
      },
    ],
    tools: [
      {
        href: '/tools/base64-converter',
        note: 'When a provider sends the signature Base64-encoded, check the encoding before comparing values.',
      },
      {
        href: '/tools/unix-timestamp',
        note: 'For providers that put a timestamp in the signature header, such as Stripe, convert it to see how old a delivery is.',
      },
    ],
  },
  'base64-converter': {
    guides: [
      {
        title: 'Base64 vs Base64URL',
        href: '/blog/base64-vs-base64url',
        note: 'How the alphabets and padding differ, and which one a receiving protocol expects.',
      },
    ],
    tools: [
      {
        href: '/tools/jwt-decoder',
        note: 'JWT segments are Base64URL; decode a whole token and read its claims.',
      },
    ],
  },
  'hash-generator': {
    guides: [
      {
        title: 'Hash generator guide: SHA-256, password hashing, and verification',
        href: '/blog/hash-generator-tools-data-integrity-security',
        note: 'Choosing an algorithm and verifying a download against a trusted checksum.',
      },
      {
        title: 'Hash collision attacks: MD5, SHA-1, and safe verification',
        href: '/blog/hash-collision-attacks-data-integrity',
        note: 'What a matching digest does and does not prove.',
      },
    ],
    tools: [
      {
        href: '/tools/webhook-debugger',
        note: 'A keyed HMAC check is a different task from a plain hash; use it for webhook signatures.',
      },
    ],
  },
  'env-sanitizer': {
    guides: [
      {
        title: 'How to sanitize .env files before sharing',
        href: '/blog/how-to-sanitize-env-files-before-sharing',
        note: 'A review workflow for redacted drafts, including what a heuristic cannot know.',
      },
      {
        title: 'API key leaks: detection, response, and prevention',
        href: '/blog/api-key-leaks-credential-security',
        note: 'What to do when a real credential has already left your control.',
      },
      {
        title: 'Are environment variables secure?',
        href: '/blog/environment-variable-security-secrets-management',
        note: 'Storage and delivery patterns for development, CI/CD, containers, and production.',
      },
    ],
    tools: [],
  },
  'uuid-generator': {
    guides: [
      {
        title: 'How to generate a UUID v4 in your browser',
        href: '/blog/how-to-generate-uuids-in-browser',
        note: 'Web Crypto usage, collision odds, v4 versus v7, and why a UUID is not a secret.',
      },
    ],
    tools: [],
  },
  'jwt-decoder': {
    guides: [
      jwtVulnerabilities,
      jwtSigning,
      {
        title: 'CVE-2026-29000: pac4j-jwt authentication bypass',
        href: '/blog/cve-2026-29000-pac4j-jwt-authentication-bypass-2026',
        note: 'A bounded look at a verification failure in one library and its fix.',
      },
    ],
    tools: [
      {
        href: '/tools/unix-timestamp',
        note: 'Convert exp, iat, and nbf values between epoch seconds and dates.',
      },
      {
        href: '/tools/jwt-encoder',
        note: 'Create a synthetic, throwaway-key test token for development.',
      },
    ],
  },
  'jwt-encoder': {
    guides: [jwtSigning, jwtVulnerabilities],
    tools: [
      {
        href: '/tools/jwt-decoder',
        note: 'Decode a token to inspect its header and claims. Decoding does not verify the signature.',
      },
      {
        href: '/tools/unix-timestamp',
        note: 'Work out epoch values for exp, iat, and nbf.',
      },
    ],
  },
  'password-generator': {
    guides: [
      {
        title: 'Password security best practices',
        href: '/blog/password-security-vulnerabilities-best-practices',
        note: 'Length, uniqueness, storage, and the limits of a generator.',
      },
    ],
    tools: [],
  },
  'json-beautifier': {
    guides: [
      {
        title: 'Why API JSON responses are a security blind spot',
        href: '/blog/api-json-response-security-blindspot-2026',
        note: 'What response bodies can expose and how to review them before sharing.',
      },
      {
        title: 'Mass assignment in APIs',
        href: '/blog/mass-assignment-api-vulnerability-orm-auto-binding-2026',
        note: 'How unsafe object binding turns extra JSON fields into state changes.',
      },
    ],
    tools: [
      {
        href: '/tools/env-sanitizer',
        note: 'Mask likely credentials in a payload before pasting it into a ticket or chat. Review the result.',
      },
    ],
  },
  'sql-formatter': {
    guides: [
      {
        title: 'SQL injection in modern APIs',
        href: '/blog/sql-injection-modern-apis-parameterized-queries-2026',
        note: 'Why parameterized queries matter. Formatting a query does not make it safe.',
      },
    ],
    tools: [],
  },
  'unix-timestamp': {
    guides: [jwtVulnerabilities],
    tools: [
      {
        href: '/tools/jwt-decoder',
        note: 'Read exp, iat, and nbf claims directly from a token.',
      },
    ],
  },
};

export function getToolSlug(pathname: string | null | undefined): string | null {
  const match = pathname?.match(/^\/tools\/([a-z0-9-]+)\/?$/);
  return match && toolDiscovery[match[1]] ? match[1] : null;
}

export function getToolByHref(href: string) {
  return allTools.find((tool) => tool.href === href);
}

export function buildToolStructuredData(slug: string) {
  const href = `/tools/${slug}`;
  const tool = getToolByHref(href);

  if (!tool) {
    return null;
  }

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      url: `${SITE_URL}${href}`,
      description: tool.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      publisher: {
        '@type': 'Organization',
        name: 'OpsecForge',
        url: SITE_URL,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: `${SITE_URL}/tools` },
        { '@type': 'ListItem', position: 3, name: tool.name, item: `${SITE_URL}${href}` },
      ],
    },
  ];
}
