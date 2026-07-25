import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Blocks, Bug, KeyRound } from 'lucide-react';

type Tool = {
  name: string;
  href: string;
  description: string;
  article?: {
    title: string;
    href: string;
  };
};

type ToolGroup = {
  id: string;
  name: string;
  description: string;
  icon: typeof Blocks;
  tools: Tool[];
};

const groups: ToolGroup[] = [
  {
    id: 'encoding-formatting',
    name: 'Encoding & Formatting',
    description:
      'Convert, format, compare, and inspect text or structured data locally in your browser.',
    icon: Blocks,
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
    icon: KeyRound,
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
        name: 'Env Sanitizer',
        href: '/tools/env-sanitizer',
        description: 'Detect and mask likely credentials before sharing environment files.',
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
    icon: Bug,
    tools: [
      {
        name: 'Webhook Debugger',
        href: '/tools/webhook-debugger',
        description: 'Test common webhook HMAC signatures locally with non-production samples.',
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

const allTools = groups.flatMap((group) => group.tools);

export const metadata: Metadata = {
  title: 'Privacy-First Developer Tools',
  description:
    'Browse 21 browser-local developer tools for encoding, formatting, credentials, security, debugging, and validation.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Privacy-First Developer Tools',
    description:
      'Browser-local utilities for JWTs, environment files, hashes, JSON, SQL, webhooks, and more.',
    url: '/tools',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.opsecforge.com/' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Tools',
      item: 'https://www.opsecforge.com/tools',
    },
  ],
};

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'OpsecForge browser-local developer tools',
  numberOfItems: allTools.length,
  itemListElement: allTools.map((tool, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: tool.name,
    url: `https://www.opsecforge.com${tool.href}`,
  })),
};

export default function ToolsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-300 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <header className="mb-14 max-w-3xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-400">
              21 browser-local utilities
            </p>
            <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-6xl">
              Privacy-first developer tools
            </h1>
            <p className="text-lg leading-8 text-slate-400">
              Choose a task below. Core transformations run in your browser, so sensitive input is
              not submitted to OpsecForge for processing unless a tool page explicitly says
              otherwise.
            </p>
          </header>

          <nav aria-label="Tool categories" className="mb-14 flex flex-wrap gap-3">
            {groups.map((group) => (
              <a
                key={group.id}
                href={`#${group.id}`}
                className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400"
              >
                {group.name}
              </a>
            ))}
          </nav>

          <div className="space-y-20">
            {groups.map((group) => {
              const Icon = group.icon;

              return (
                <section key={group.id} id={group.id} className="scroll-mt-28">
                  <div className="mb-7 flex items-start gap-4">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                      <Icon className="text-emerald-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-100">{group.name}</h2>
                      <p className="mt-2 max-w-3xl text-slate-400">{group.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {group.tools.map((tool) => (
                      <article
                        key={tool.href}
                        className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
                      >
                        <h3 className="text-xl font-bold text-slate-100">{tool.name}</h3>
                        <p className="mt-3 flex-1 leading-7 text-slate-400">{tool.description}</p>
                        <Link
                          href={tool.href}
                          className="mt-6 inline-flex items-center gap-2 font-bold text-emerald-400"
                        >
                          Open tool <ArrowRight size={16} />
                        </Link>
                        {tool.article && (
                          <Link
                            href={tool.article.href}
                            className="mt-3 text-sm text-slate-500 underline underline-offset-4 hover:text-slate-300"
                          >
                            Guide: {tool.article.title}
                          </Link>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
