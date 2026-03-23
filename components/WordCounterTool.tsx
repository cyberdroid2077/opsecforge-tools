'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpenText, Check, Copy, FileText, Lock, Sigma, Trash2, BarChart3, Hash } from 'lucide-react';

const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','is','it','as','be','are','was','were','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','shall','can','this','that','these','those','i','you','he','she','we','they','what','which','who','when','where','why','how','not','no','nor','so','too','very','just','also','now','then','than','there','here','if','else','while','about','up','down','out','off','over','under','again','once','all','any','both','each','few','more','most','other','some','such','only','own','same','than']);

export default function WordCounterTool() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [statsCopied, setStatsCopied] = useState(false);

  const stats = useMemo(() => {
    const trimmed = input.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(w => w.length > 0) : [];
    const wordCount = words.length;
    const characters = input.length;
    const charactersNoSpaces = input.replace(/\s/g, '').length;
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter((part) => part.trim()).length : 0;
    const paragraphs = trimmed ? input.split(/\n\s*\n/).filter((part) => part.trim()).length : 0;
    const lines = input ? input.split('\n').length : 0;
    const readingTime = wordCount === 0 ? '0 min' : `${Math.max(1, Math.ceil(wordCount / 200))} min`;
    const avgWordLength = wordCount > 0
      ? (words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0) / words.filter(w => w.replace(/[^a-zA-Z]/g, '').length > 0).toFixed(1)
      : '0';

    // Keyword density - top 5 words (min 3 chars, excluding stop words)
    const wordFreq: Record<string, number> = {};
    words.forEach(w => {
      const cleaned = w.toLowerCase().replace(/[^a-zA-Z]/g, '');
      if (cleaned.length >= 3 && !STOP_WORDS.has(cleaned)) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    });

    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count, density: wordCount > 0 ? ((count / wordCount) * 100).toFixed(1) : '0' }));

    return {
      words: wordCount,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      lines,
      readingTime,
      avgWordLength,
      topKeywords,
    };
  }, [input]);

  const copyText = async () => {
    if (!input) return;
    await navigator.clipboard.writeText(input);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const copyStats = async () => {
    const summary = [
      `Words: ${stats.words}`,
      `Characters: ${stats.characters}`,
      `Characters (no spaces): ${stats.charactersNoSpaces}`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Lines: ${stats.lines}`,
      `Reading time: ${stats.readingTime}`,
      `Avg word length: ${stats.avgWordLength}`,
      stats.topKeywords.length > 0 ? `Top keywords: ${stats.topKeywords.map(k => `${k.word}(${k.density}%)`).join(', ')}` : '',
    ].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(summary);
    setStatsCopied(true);
    window.setTimeout(() => setStatsCopied(false), 1800);
  };

  const clearText = () => {
    setInput('');
    setCopied(false);
    setStatsCopied(false);
  };

  const cards = [
    { label: 'Words', value: stats.words.toLocaleString(), icon: <FileText size={18} className="text-emerald-400" /> },
    { label: 'Characters', value: stats.characters.toLocaleString(), icon: <Sigma size={18} className="text-cyan-400" /> },
    { label: 'No Spaces', value: stats.charactersNoSpaces.toLocaleString(), icon: <Sigma size={18} className="text-amber-400" /> },
    { label: 'Sentences', value: stats.sentences, icon: <BookOpenText size={18} className="text-rose-400" /> },
    { label: 'Paragraphs', value: stats.paragraphs, icon: <FileText size={18} className="text-violet-400" /> },
    { label: 'Lines', value: stats.lines, icon: <Hash size={18} className="text-sky-400" /> },
    { label: 'Reading Time', value: stats.readingTime, icon: <BookOpenText size={18} className="text-emerald-400" /> },
    { label: 'Avg Word Len', value: stats.avgWordLength, icon: <Sigma size={18} className="text-cyan-400" /> },
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

        <section className="mb-12 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Statistics</h2>
          </div>
          <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

          {/* Keyword Density */}
          {stats.topKeywords.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <BarChart3 size={14} className="text-cyan-400" />
                Keyword Density (Top 5)
              </div>
              <div className="flex flex-wrap gap-3">
                {stats.topKeywords.map(({ word, count, density }) => (
                  <div key={word} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5">
                    <span className="font-mono text-sm font-medium text-cyan-300">{word}</span>
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-mono text-cyan-400">{count}x</span>
                    <span className="text-xs text-slate-500">{density}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button onClick={clearText} className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-sm font-bold text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/15">
              <Trash2 size={16} />Clear Text
            </button>
            <button onClick={copyText} disabled={!input} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
            <button onClick={copyStats} disabled={stats.words === 0} className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-2.5 text-sm font-bold text-cyan-300 transition-all hover:border-cyan-500/40 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50">
              {statsCopied ? <Check size={16} className="text-emerald-400" /> : <BarChart3 size={16} />}
              {statsCopied ? 'Stats Copied' : 'Copy Stats'}
            </button>
          </div>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste or type text here to see live stats."
            className="h-[420px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm leading-7 text-cyan-300 outline-none placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
            spellCheck={false}
          />
        </section>
      </div>
    </main>
  );
}
