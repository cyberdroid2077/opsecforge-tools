'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, FileText, Lock, RefreshCw } from 'lucide-react';

type Mode = 'paragraphs' | 'words' | 'sentences';

const WORD_BANK = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
const STARTER = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function generateWords(count: number, withStarter: boolean) {
  const words = Array.from({ length: count }, (_, index) => WORD_BANK[index % WORD_BANK.length]);
  if (!withStarter) {
    return words.join(' ');
  }

  const starterWords = STARTER.toLowerCase().replace(/[.,]/g, '').split(' ');
  return [...starterWords, ...words].slice(0, count).join(' ');
}

function generateSentences(count: number, withStarter: boolean) {
  const sentences = Array.from({ length: count }, (_, index) => {
    const start = (index * 8) % WORD_BANK.length;
    const slice = Array.from({ length: 8 }, (_, offset) => WORD_BANK[(start + offset) % WORD_BANK.length]).join(' ');
    return `${capitalize(slice)}.`;
  });

  if (withStarter && sentences.length > 0) {
    sentences[0] = STARTER;
  }

  return sentences.join(' ');
}

function generateParagraphs(count: number, withStarter: boolean) {
  return Array.from({ length: count }, (_, index) => {
    const sentences = generateSentences(4, withStarter && index === 0);
    return sentences;
  }).join('\n\n');
}

export default function LoremIpsumTool() {
  const [mode, setMode] = useState<Mode>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const safeCount = Math.min(100, Math.max(1, count || 1));
    const result =
      mode === 'paragraphs'
        ? generateParagraphs(safeCount, startWithLorem)
        : mode === 'sentences'
          ? generateSentences(safeCount, startWithLorem)
          : generateWords(safeCount, startWithLorem);

    setOutput(result);
    setCopied(false);
  };

  const copyOutput = async () => {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Lorem Ipsum</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Local Placeholder Generation</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            Lorem Ipsum Generator
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Generate paragraphs, words, or sentences for layouts and mocks
            </span>
          </h1>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_160px_auto]">
            <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/60 p-1.5">
              {(['paragraphs', 'sentences', 'words'] as Mode[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setMode(item)}
                  className={`rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                    mode === item ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-lg text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
            />

            <button
              onClick={generate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]"
            >
              <RefreshCw size={16} />
              Generate Text
            </button>
          </div>

          <label className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4 text-sm text-slate-300 w-fit">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(event) => setStartWithLorem(event.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30"
            />
            Start with &quot;Lorem ipsum dolor sit amet...&quot;
          </label>

          <div className="mb-4 flex items-center justify-between px-1">
            <div className="text-sm font-bold uppercase tracking-widest text-slate-400">Output Buffer</div>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-50"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <textarea
            readOnly
            value={output}
            placeholder="Generated lorem ipsum will appear here."
            className="h-[440px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm leading-7 text-emerald-300 outline-none placeholder:text-slate-700"
            spellCheck={false}
          />

          <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
            <FileText size={14} className="text-emerald-500" /> Pure client-side generation from a local Latin word bank
          </div>
        </section>
      </div>
    </main>
  );
}
