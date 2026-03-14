'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Diff } from 'diff';
import { GitCompareArrows, Lock } from 'lucide-react';

const differ = new Diff();

export default function TextDiffTool() {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [compareNonce, setCompareNonce] = useState(0);

  const parts = useMemo(() => {
    if (compareNonce === 0 || (!original && !modified)) {
      return [];
    }
    return differ.diffWords(original, modified);
  }, [compareNonce, modified, original]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Text Diff</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Client-Side Difference Engine</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            Text Diff Checker
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Compare two snippets and highlight insertions and deletions clearly
            </span>
          </h1>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-6 flex items-center gap-4 border-b border-slate-800 pb-6">
            <button onClick={() => setCompareNonce((value) => value + 1)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]">
              <GitCompareArrows size={16} />
              Compare Texts
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
            <div className="flex flex-col gap-3">
              <label className="px-1 text-sm font-bold uppercase tracking-widest text-slate-400">Original Text</label>
              <textarea value={original} onChange={(event) => setOriginal(event.target.value)} className="h-[320px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-6 font-mono text-sm leading-7 text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20" spellCheck={false} />
            </div>
            <div className="flex flex-col gap-3">
              <label className="px-1 text-sm font-bold uppercase tracking-widest text-slate-400">Modified Text</label>
              <textarea value={modified} onChange={(event) => setModified(event.target.value)} className="h-[320px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-6 font-mono text-sm leading-7 text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20" spellCheck={false} />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 min-h-48">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Visual Diff</div>
            <div className="whitespace-pre-wrap leading-8 text-sm">
              {parts.length === 0 ? (
                <span className="text-slate-600">Run a comparison to see additions in green and removals in red.</span>
              ) : (
                parts.map((part, index) => (
                  <span
                    key={`${compareNonce}-${index}`}
                    className={part.added ? 'bg-emerald-500/20 text-emerald-300 px-1 rounded' : part.removed ? 'bg-rose-500/20 text-rose-300 px-1 rounded line-through' : 'text-slate-300'}
                  >
                    {part.value}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
