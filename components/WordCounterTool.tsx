'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpenText, Check, Copy, FileText, Lock, Sigma, Trash2 } from 'lucide-react';

export default function WordCounterTool() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const trimmed = input.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = input.length;
    const charactersNoSpaces = input.replace(/\s/g, '').length;
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter((part) => part.trim()).length : 0;
    const paragraphs = trimmed ? input.split(/\n\s*\n/).filter((part) => part.trim()).length : 0;
    const readingTime = words === 0 ? '0 min' : `${Math.max(1, Math.ceil(words / 200))} min`;

    return { words, characters, charactersNoSpaces, sentences, paragraphs, readingTime };
  }, [input]);

  const copyText = async () => {
    if (!input) {
      return;
    }

    await navigator.clipboard.writeText(input);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const clearText = () => {
    setInput('');
    setCopied(false);
  };

  const cards = [
    { label: 'Words', value: stats.words, icon: <FileText size={18} className="text-emerald-400" /> },
    { label: 'Characters', value: stats.characters, icon: <Sigma size={18} className="text-cyan-400" /> },
    { label: 'No Spaces', value: stats.charactersNoSpaces, icon: <Sigma size={18} className="text-amber-400" /> },
    { label: 'Sentences', value: stats.sentences, icon: <BookOpenText size={18} className="text-rose-400" /> },
    { label: 'Paragraphs', value: stats.paragraphs, icon: <FileText size={18} className="text-violet-400" /> },
    { label: 'Reading Time', value: stats.readingTime, icon: <BookOpenText size={18} className="text-emerald-400" /> },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Word Counter</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Real-Time Local Analysis</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            Word & Character Counter
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Inspect text density, reading time, and structural metrics as you type
            </span>
          </h1>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div key={card.label} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                  {card.icon}
                  {card.label}
                </div>
                <div className="font-mono text-3xl font-bold text-slate-100">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button onClick={clearText} className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-sm font-bold text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/15 inline-flex items-center gap-2"><Trash2 size={16} />Clear Text</button>
            <button onClick={copyText} disabled={!input} className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-50 inline-flex items-center gap-2">{copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy Text'}</button>
          </div>

          <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Paste or type text here to see live stats." className="h-[470px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm leading-7 text-cyan-300 outline-none placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20" spellCheck={false} />
        </section>
      </div>
    </main>
  );
}
