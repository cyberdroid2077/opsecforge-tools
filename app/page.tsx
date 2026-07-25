import {
  ArrowRight,
  Blocks,
  Bug,
  FileCode,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  UploadCloud,
  Webhook,
} from 'lucide-react';
import Link from 'next/link';
import { primaryToolHrefs, primaryTools, toolGroups } from '@/lib/tool-catalog';

const primaryIcons = {
  '/tools/env-sanitizer': FileCode,
  '/tools/webhook-debugger': Webhook,
  '/tools/sha256-hash': Fingerprint,
  '/tools/base64-converter': UploadCloud,
};

const groupIcons = {
  'encoding-formatting': Blocks,
  'credentials-security': KeyRound,
  'debugging-validation': Bug,
};

const primaryHrefSet = new Set<string>(primaryToolHrefs);

const featuredArticles = [
  {
    label: 'Credential hygiene',
    title: 'How to Sanitize .env Files Before Sharing',
    description: 'Learn where heuristic redaction helps, where it can miss, and why human review still matters.',
    href: '/blog/how-to-sanitize-env-files-before-sharing',
  },
  {
    label: 'Webhook security',
    title: 'What Is a Webhook Signature and Why Must You Validate It?',
    description: 'Understand signature matching, timestamp checks, and replay defenses for production receivers.',
    href: '/blog/what-is-a-webhook-signature-and-why-must-you-validate-it',
  },
  {
    label: 'Cryptography',
    title: 'How to Generate Cryptographic Hashes Offline',
    description: 'Choose an appropriate digest and keep sensitive source text out of remote utilities.',
    href: '/blog/how-to-generate-cryptographic-hashes-offline',
  },
  {
    label: 'Encoding',
    title: 'Base64 vs Base64URL',
    description: 'See how the alphabets, padding, and URL-safe variants differ before converting data.',
    href: '/blog/base64-vs-base64url',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-300 selection:bg-emerald-500/30 lg:px-24 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <header className="mb-14 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-slate-300">
            <ShieldCheck aria-hidden="true" size={14} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Browser-local developer tools</span>
          </div>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-6xl">
            Handle sensitive developer data without uploading it
          </h1>
          <p className="text-lg leading-8 text-slate-400">
            OpSecForge provides practical security and developer utilities whose core input
            processing runs in your browser. Tool inputs are not sent to OpSecForge analytics.
            Check each tool&apos;s stated limitations before using its output.
          </p>
        </header>

        <section aria-labelledby="primary-tasks" className="mb-16">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
                Start with a task
              </p>
              <h2 id="primary-tasks" className="text-3xl font-bold text-slate-100">
                Security workflows
              </h2>
            </div>
            <Link
              href="/tools"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Browse all 21 tools <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {primaryTools.map((tool) => {
              const Icon = primaryIcons[tool.href as keyof typeof primaryIcons];

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition-colors hover:border-emerald-500/40 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                      <Icon aria-hidden="true" className="text-emerald-400" size={22} />
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-emerald-300">
                      {tool.name}
                    </h3>
                  </div>
                  <p className="leading-7 text-slate-400">{tool.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-400">
                    Open tool <ArrowRight aria-hidden="true" size={15} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="more-tools" className="border-t border-slate-800 pt-14">
          <div className="mb-9 max-w-3xl">
            <h2 id="more-tools" className="text-3xl font-bold text-slate-100">
              More tools by purpose
            </h2>
            <p className="mt-3 leading-7 text-slate-400">
              Choose a category for the rest of the toolkit, or use the complete tools center for
              descriptions and related guides.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {toolGroups.map((group) => {
              const Icon = groupIcons[group.id];
              const remainingTools = group.tools.filter((tool) => !primaryHrefSet.has(tool.href));

              return (
                <section
                  key={group.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
                  aria-labelledby={`home-${group.id}`}
                >
                  <div className="mb-5 flex items-center gap-3">
                    <Icon aria-hidden="true" className="text-emerald-400" size={21} />
                    <h3 id={`home-${group.id}`} className="text-xl font-bold text-slate-100">
                      {group.name}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {remainingTools.map((tool) => (
                      <li key={tool.href}>
                        <Link
                          href={tool.href}
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        >
                          {tool.name}
                          <ArrowRight aria-hidden="true" className="shrink-0" size={14} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="guides" className="mt-20 border-t border-slate-800 pt-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="guides" className="text-3xl font-bold text-slate-100">
              Practical security guides
            </h2>
            <Link
              href="/blog"
              className="hidden items-center gap-2 text-sm font-bold text-emerald-400 sm:inline-flex"
            >
              View all articles <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {featuredArticles.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-colors hover:border-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  {article.label}
                </p>
                <h3 className="text-xl font-bold text-slate-100 group-hover:text-emerald-300">
                  {article.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-400">{article.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
