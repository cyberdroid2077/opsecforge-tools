'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Link2, Lock, Trash2 } from 'lucide-react';

type Action = 'encode-component' | 'decode-component' | 'encode-uri';

export default function UrlEncoderTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const processValue = (action: Action) => {
    try {
      if (!input) {
        setOutput('');
        setError('');
        return;
      }

      const result =
        action === 'encode-component'
          ? encodeURIComponent(input)
          : action === 'decode-component'
            ? decodeURIComponent(input)
            : encodeURI(input);

      setOutput(result);
      setError('');
    } catch (err) {
      const message = err instanceof URIError ? err.message : 'Unable to process URI input.';
      setOutput('');
      setError(`Malformed URI: ${message}`);
    }
  };

  const copyOutput = async () => {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    setCopied(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">URL Encoder</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Safe URI Transforms</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            URL Encoder & Decoder
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Escape parameters, normalize URLs, and decode malformed strings safely
            </span>
          </h1>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-800 pb-6">
            <button onClick={() => processValue('encode-component')} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-500">Encode URI Component</button>
            <button onClick={() => processValue('decode-component')} className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300">Decode URI Component</button>
            <button onClick={() => processValue('encode-uri')} className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300">Encode URI</button>
            <button onClick={copyOutput} disabled={!output} className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-50 inline-flex items-center gap-2">{copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy Output'}</button>
            <button onClick={clearAll} className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-sm font-bold text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/15 inline-flex items-center gap-2"><Trash2 size={16} />Clear</button>
          </div>

          {error ? <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div> : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <label className="px-1 text-sm font-bold uppercase tracking-widest text-slate-400">Input</label>
              <textarea value={input} onChange={(event) => { setInput(event.target.value); setError(''); }} placeholder="Paste a URL or URI component here." className="h-[430px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-6 font-mono text-sm leading-6 text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20" spellCheck={false} />
            </div>
            <div className="flex flex-col gap-3">
              <label className="px-1 text-sm font-bold uppercase tracking-widest text-slate-400">Output</label>
              <textarea readOnly value={output} placeholder="Converted URL output will appear here." className="h-[430px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm leading-6 text-emerald-300 outline-none placeholder:text-slate-700" spellCheck={false} />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
            <Link2 size={14} className="text-emerald-500" /> Uses native `encodeURIComponent`, `decodeURIComponent`, and `encodeURI`
          </div>
        </section>
      </div>
    </main>
  );
}
