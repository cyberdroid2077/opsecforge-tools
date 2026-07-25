import type { Metadata } from 'next';
import { AlertCircle, ArrowLeft, ExternalLink, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sourced Security Incident Lessons',
  description: 'Concise engineering lessons from security incidents with direct links to authoritative sources.',
  alternates: { canonical: '/case-studies' },
};

const cases = [
  {
    title: 'Toyota T-Connect source exposure',
    date: '2022',
    description: 'Toyota reported that T-Connect source code had been publicly accessible on GitHub and contained a data-server access key. Toyota said 296,019 email addresses and customer management numbers may have been accessible.',
    tech: 'A contractor uploaded source with an access key under a public repository setting. Toyota reported making the source private and changing the key after discovery.',
    lesson: 'Keep credentials out of source, scan before publishing, monitor repository visibility, and revoke exposed keys rather than only deleting the file.',
    source: 'https://global.toyota/jp/newsroom/corporate/38095972.html',
    sourceLabel: 'Toyota notice',
    recommend: '/tools/env-sanitizer',
    toolName: 'Env Sanitizer',
  },
  {
    title: 'Log4Shell',
    date: '2021',
    description: 'CISA and partner agencies documented Log4Shell as a remote-code-execution vulnerability affecting specified versions of Apache Log4j.',
    tech: 'Affected Log4j versions allowed unsafe JNDI lookup behavior. CISA advised organizations to identify affected assets and update to fixed versions.',
    lesson: 'Maintain a dependency inventory, monitor authoritative advisories, and be able to patch high-impact components quickly.',
    source: 'https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-356a',
    sourceLabel: 'CISA advisory',
    recommend: '/glossary',
    toolName: 'Security Glossary',
  },
];

export default function CaseStudiesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-slate-950 p-6 text-slate-300 lg:p-24">
      <div className="w-full max-w-5xl">
        <Link href="/" className="mb-12 inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-emerald-400">
          <ArrowLeft size={16} /> Back to Hub
        </Link>

        <header className="mb-20">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-100">Sourced security incident lessons</h1>
          </div>
          <p className="max-w-3xl text-xl leading-relaxed text-slate-400">
            A deliberately small collection. Each summary links to an authoritative incident source; inferred lessons are labeled as engineering guidance.
          </p>
        </header>

        <div className="space-y-12">
          {cases.map((incident) => (
            <article key={incident.title} className="rounded-3xl border border-slate-800 bg-slate-900/40 p-10">
              <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-500">
                    <AlertCircle size={14} /> Reported incident {incident.date}
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-100">{incident.title}</h2>
                </div>
                <Link href={incident.recommend} className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  <ShieldCheck size={14} /> Open {incident.toolName}
                </Link>
              </div>

              <div className="grid gap-10 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Source summary</h3>
                  <p className="leading-relaxed text-slate-300">{incident.description}</p>
                  <a href={incident.source} rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-400 underline underline-offset-4">
                    {incident.sourceLabel} <ExternalLink size={14} />
                  </a>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Technical context</h3>
                  <p className="leading-relaxed text-slate-400">{incident.tech}</p>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-800/50 pt-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-lg bg-blue-500/10 p-2 text-blue-400">
                    <Terminal size={16} />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-bold uppercase tracking-widest text-blue-400">Engineering guidance</h3>
                    <p className="text-slate-300">{incident.lesson}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
