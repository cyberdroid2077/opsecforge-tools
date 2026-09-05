import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Blocks, Bug, KeyRound } from 'lucide-react';
import { allTools, toolGroups } from '@/lib/tool-catalog';

const groupIcons = {
  'encoding-formatting': Blocks,
  'credentials-security': KeyRound,
  'debugging-validation': Bug,
};

export const metadata: Metadata = {
  title: 'Privacy-First Developer Tools',
  description:
    'Browse browser-local developer tools for encoding, formatting, credentials, security, debugging, and validation.',
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
              {allTools.length} browser-local utilities
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
            {toolGroups.map((group) => (
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
            {toolGroups.map((group) => {
              const Icon = groupIcons[group.id];

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
