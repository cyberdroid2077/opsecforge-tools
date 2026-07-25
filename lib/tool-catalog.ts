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
  '/tools/sha256-hash',
  '/tools/base64-converter',
] as const;

export const toolGroups: ToolGroup[] = [
  {
    id: 'encoding-formatting',
    name: 'Encoding & Formatting',
    description:
      'Convert, format, compare, and inspect text or structured data locally in your browser.',
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
        name: 'URL Encoder & Decoder',
        href: '/tools/url-encoder',
        description: 'Encode URI components and decode escaped URL text.',
      },
      {
        name: 'JSON Beautifier',
        href: '/tools/json-beautifier',
        description: 'Format and inspect JSON without submitting the payload to a server.',
        article: {
          title: 'Stop pasting sensitive JSON online',
          href: '/blog/stop-pasting-sensitive-json-online',
        },
      },
      {
        name: 'JSON Formatter',
        href: '/tools/json-formatter',
        description: 'Validate, format, and minify JSON in the browser.',
      },
      {
        name: 'SQL Formatter & Minifier',
        href: '/tools/sql-formatter',
        description: 'Format MySQL and PostgreSQL queries locally.',
        article: {
          title: 'Risks of online SQL formatters',
          href: '/blog/the-hidden-risks-of-pasting-sql-queries-into-online-formatters',
        },
      },
      {
        name: 'Markdown to HTML',
        href: '/tools/markdown-to-html',
        description: 'Preview Markdown and inspect generated HTML side by side.',
      },
      {
        name: 'Text Diff Checker',
        href: '/tools/text-diff',
        description: 'Compare two text versions and highlight additions and removals.',
      },
      {
        name: 'Text Case Converter',
        href: '/tools/text-case',
        description: 'Convert text between common programming and writing case styles.',
      },
      {
        name: 'Hex RGB Converter',
        href: '/tools/hex-rgb-converter',
        description: 'Convert color values between hex, RGB, and HSL formats.',
      },
      {
        name: 'Word & Character Counter',
        href: '/tools/word-counter',
        description: 'Measure words, characters, sentences, paragraphs, and reading time.',
      },
      {
        name: 'Lorem Ipsum Generator',
        href: '/tools/lorem-ipsum',
        description: 'Generate placeholder words, sentences, or paragraphs locally.',
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
          title: 'Validate JWTs offline safely',
          href: '/blog/how-to-validate-jwts-offline-without-exposing-your-secret-key',
        },
      },
      {
        name: 'JWT Encoder',
        href: '/tools/jwt-encoder',
        description: 'Create signed test JWTs locally for development workflows.',
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
      },
      {
        name: 'SHA Hash Generator',
        href: '/tools/sha256-hash',
        description: 'Generate SHA-1, SHA-256, and SHA-512 digests in the browser.',
        article: {
          title: 'Generate cryptographic hashes offline',
          href: '/blog/how-to-generate-cryptographic-hashes-offline',
        },
      },
      {
        name: 'Secure Hash Generator',
        href: '/tools/hash-generator',
        description: 'Generate Bcrypt, SHA-256, and MD5 output locally for appropriate use cases.',
      },
    ],
  },
  {
    id: 'debugging-validation',
    name: 'Debugging & Validation',
    description:
      'Inspect signatures, identifiers, timestamps, and shareable development artifacts.',
    tools: [
      {
        name: 'Webhook Signature Verifier',
        href: '/tools/webhook-debugger',
        description: 'Check whether supplied payload, secret, and signature values match locally.',
        article: {
          title: 'Why webhook signatures must be validated',
          href: '/blog/what-is-a-webhook-signature-and-why-must-you-validate-it',
        },
      },
      {
        name: 'UUID Generator',
        href: '/tools/uuid-generator',
        description: 'Generate RFC 4122 version 4 UUIDs using the browser crypto API.',
        article: {
          title: 'ULID vs UUID',
          href: '/blog/understanding-ulid-vs-uuid-which-should-you-choose-in-2026',
        },
      },
      {
        name: 'Unix Timestamp Converter',
        href: '/tools/unix-timestamp',
        description: 'Convert Unix seconds or milliseconds to local and UTC date values.',
      },
      {
        name: 'QR Code Generator',
        href: '/tools/qr-generator',
        description: 'Create and download QR codes locally from text or URLs.',
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
