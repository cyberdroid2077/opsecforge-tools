import React from 'react';
import type { Metadata } from 'next';
import { Book, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { glossary } from '../../lib/glossary';

export const metadata: Metadata = {
  title: 'Developer Security Glossary',
  description:
    'Short definitions of the API and web security terms used in OpsecForge articles and tools, each linked to the in-depth page and to a primary source.',
  alternates: { canonical: '/glossary' },
};

export default function GlossaryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>

        <header className="mb-16 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <Book size={32} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-100 tracking-tight">Security Glossary</h1>
          </div>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl">
            {glossary.length} terms that come up in OpsecForge articles and tools. Each entry links to the page on this site that covers it in depth and to one primary source (an RFC, OWASP, NIST or vendor documentation).
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {glossary.map((item) => (
            <section
              key={item.id}
              id={item.id}
              className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all flex flex-col group scroll-mt-8"
            >
              <h2 className="text-2xl font-bold text-slate-100 font-mono tracking-tight group-hover:text-emerald-400 transition-colors mb-4">
                {item.term}
              </h2>
              {item.full && (
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                  {item.full}
                </p>
              )}
              <p className="text-slate-300 mb-6 leading-relaxed font-sans">{item.def}</p>
              <div className="mt-auto space-y-3 text-sm font-sans">
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {item.internal.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="text-slate-500">
                  Source:{' '}
                  <a
                    href={item.source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-400 underline underline-offset-2 hover:text-slate-200"
                  >
                    {item.source.label} <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
