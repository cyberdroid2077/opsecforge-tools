'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Hash, Lock, RefreshCw, ShieldCheck } from 'lucide-react';

function fallbackUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function createUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return fallbackUuid();
}

export default function UuidGeneratorTool() {
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [removeHyphens, setRemoveHyphens] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const normalizedCount = useMemo(() => Math.min(100, Math.max(1, count || 1)), [count]);

  const generateUuids = () => {
    const values = Array.from({ length: normalizedCount }, () => {
      let uuid = createUuid();

      if (removeHyphens) {
        uuid = uuid.replaceAll('-', '');
      }

      if (uppercase) {
        uuid = uuid.toUpperCase();
      }

      return uuid;
    });

    setOutput(values.join('\n'));
    setCopied(false);
  };

  const copyAll = async () => {
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
          <Link href="/" className="transition-colors hover:text-emerald-400">
            OpSecForge Hub
          </Link>
          <span>/</span>
          <span className="text-slate-300">UUID Generator</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Web Crypto Powered
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            UUID / GUID Generator
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Generate one or one hundred identifiers instantly in the browser
            </span>
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-400">
            Produce RFC-style v4 UUIDs locally with optional uppercase output and hyphen removal
            for systems that want compact or normalized identifiers.
          </p>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-6 grid gap-4 border-b border-slate-800 pb-6 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
            <div>
              <label className="mb-3 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                How Many To Generate?
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-lg text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(event) => setUppercase(event.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30"
              />
              Uppercase
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={removeHyphens}
                onChange={(event) => setRemoveHyphens(event.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30"
              />
              Remove Hyphens
            </label>

            <button
              onClick={generateUuids}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]"
            >
              <RefreshCw size={16} />
              Generate UUID(s)
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <div className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Output Buffer
              </div>
              <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-600">
                {output ? output.split('\n').length : 0} ids
              </div>
            </div>

            <button
              onClick={copyAll}
              disabled={!output}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy All'}
            </button>
          </div>

          <textarea
            readOnly
            value={output}
            placeholder="Generated UUIDs will appear here, one per line."
            className="h-[420px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm leading-6 text-emerald-300 outline-none placeholder:text-slate-700"
            spellCheck={false}
          />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                Local randomness
              </span>
              <span className="flex items-center gap-1.5">
                <Hash size={14} className="text-cyan-500" />
                Max batch size 100
              </span>
            </div>
            <span>Uses crypto.randomUUID() with fallback support</span>
          </div>
        </section>
      </div>
    </main>
  );
}
