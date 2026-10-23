export type Tool = {
  name: string;
  href: string;
  description: string;
  article?: {
    title: string;
    href: string;
  };
};

export type ToolGroup = {
  id: 'encoding-formatting' | 'credentials-security' | 'debugging-validation';
  name: string;
  description: string;
  tools: Tool[];
};

export const primaryToolHrefs = [
  '/tools/env-sanitizer',
  '/tools/webhook-debugger',
  '/tools/hash-generator',
  '/tools/base64-converter',
] as const;

/*
 * Only live, indexable tools are listed here. The generic tools that have no
 * security-related article or purpose (Lorem Ipsum, Markdown to HTML, QR, Text
 * Case, Text Diff, URL Encoder, Word Counter, Hex RGB Converter) were retired and
 * answer HTTP 410 (see config/retired-urls.json). Keep this list aligned with the
 * sitemap; lib/tool-catalog.test.ts enforces that.
 */
export const toolGroups: ToolGroup[] = [
  {
    id: 'encoding-formatting',
    name: 'Encoding & Formatting',
    description:
      'Convert, format, and inspect text or structured data locally in your browser.',
    tools: [
      {
        name: 'Base64 Converter',
        href: '/tools/base64-converter',
        description: 'Encode and decode standard Base64 and Base64URL strings locally.',
        article: {
          title: 'Base64 vs Base64URL',
          href: '/blog/base64-vs-base64url',
        },
      },
      {
        name: 'JSON Beautifier',
        href: '/tools/json-beautifier',
        description: 'Format and inspect JSON without submitting the payload to a server.',
        article: {
          title: 'Why API JSON responses are a security blind spot',
          href: '/blog/api-json-response-security-blindspot-2026',
        },
      },
      {
        name: 'SQL Formatter & Minifier',
        href: '/tools/sql-formatter',
        description: 'Format MySQL and PostgreSQL queries locally.',
        article: {
          title: 'SQL injection and parameterized queries',
          href: '/blog/sql-injection-modern-apis-parameterized-queries-2026',
        },
      },
    ],
  },
  {
    id: 'credentials-security',
    name: 'Credentials & Security',
    description:
      'Inspect tokens, sanitize configuration, and generate security-related values without uploading sensitive input.',
    tools: [
      {
        name: 'JWT Decoder',
        href: '/tools/jwt-decoder',
        description: 'Decode JWT headers and payloads locally. Decoding does not verify a signature.',
        article: {
          title: 'JWT vulnerabilities and safe validation',
          href: '/blog/jwt-token-vulnerabilities-authentication-security',
        },
      },
      {
        name: 'JWT Encoder',
        href: '/tools/jwt-encoder',
        description: 'Create signed test JWTs locally for development workflows.',
        article: {
          title: 'JWT signing: safe token issuance and validation',
          href: '/blog/jwt-encoder-security-token-generation-best-practices',
        },
      },
      {
        name: 'Safe-to-Share Sanitizer',
        href: '/tools/env-sanitizer',
        description: 'Heuristically mask likely credentials before sharing text. Review the result.',
        article: {
          title: 'API-key leak prevention',
          href: '/blog/api-key-leaks-credential-security',
        },
      },
      {
        name: 'Password Generator',
        href: '/tools/password-generator',
        description: 'Generate random passwords using browser cryptography.',
        article: {
          title: 'Password security best practices',
          href: '/blog/password-security-vulnerabilities-best-practices',
        },
      },
      {
        name: 'File Checksum & Hash Generator',
        href: '/tools/hash-generator',
        description: 'Compare SHA-256 or SHA-512 file checksums locally, without uploading files.',
        article: {
          title: 'What a matching checksum proves',
          href: '/blog/hash-collision-attacks-data-integrity',
        },
      },
    ],
  },
  {
    id: 'debugging-validation',
    name: 'Debugging & Validation',
    description:
      'Inspect signatures, identifiers, and timestamps.',
    tools: [
      {
        name: 'Webhook Signature Verifier',
        href: '/tools/webhook-debugger',
        description: 'Check whether supplied payload, secret, and signature values match locally.',
        article: {
          title: 'Webhook signature validation best practices',
          href: '/blog/webhook-signature-validation-hmac-sha256-best-practices-2026',
        },
      },
      {
        name: 'UUID Generator',
        href: '/tools/uuid-generator',
        description: 'Generate RFC 4122 version 4 UUIDs using the browser crypto API.',
        article: {
          title: 'How to generate a UUID v4 in the browser',
          href: '/blog/how-to-generate-uuids-in-browser',
        },
      },
      {
        name: 'Unix Timestamp Converter',
        href: '/tools/unix-timestamp',
        description: 'Convert Unix seconds or milliseconds to local and UTC date values.',
      },
    ],
  },
];

export const allTools = toolGroups.flatMap((group) => group.tools);

export const primaryTools = primaryToolHrefs.map((href) => {
  const tool = allTools.find((candidate) => candidate.href === href);

  if (!tool) {
    throw new Error(`Primary tool is missing from the catalog: ${href}`);
  }

  return tool;
});
