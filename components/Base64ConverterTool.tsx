'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, Check, Copy, Lock, ShieldCheck, Trash2, Type } from 'lucide-react';

type Mode = 'encode' | 'decode';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeBase64(value: string) {
  const bytes = encoder.encode(value);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return decoder.decode(bytes);
}

export default function Base64ConverterTool() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const runConversion = (nextInput: string, nextMode: Mode) => {
    setInput(nextInput);
    setError('');

    if (!nextInput) {
      setOutput('');
      return;
    }

    try {
      const result = nextMode === 'encode' ? encodeBase64(nextInput) : decodeBase64(nextInput.trim());
      setOutput(result);
    } catch (err) {
      setOutput('');
      setError(`Invalid Base64: ${err instanceof Error ? err.message : 'Unable to decode input.'}`);
    }
  };

  const toggleMode = () => {
    const nextMode: Mode = mode === 'encode' ? 'decode' : 'encode';
    setMode(nextMode);

    if (!output) {
      setError('');
      return;
    }

    setInput(output);
    setOutput(input);
    setError('');
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
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
          <Link href="/" className="transition-colors hover:text-emerald-400">
            OpSecForge Hub
          </Link>
          <span>/</span>
          <span className="text-slate-300">Base64 Converter</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Local Encoding Pipeline
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            Base64 Encoder & Decoder
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Convert payloads without exposing raw text to third-party tools
            </span>
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-400">
            Flip between plain text and Base64 in a zero-network workspace built for debugging
            headers, credentials, and small config fragments locally in the browser.
          </p>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                <ShieldCheck size={14} className="text-emerald-400" />
                Text Conversion Mode
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
                Encode UTF-8 text into Base64 or decode a Base64 string back into readable text.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/60 p-1.5">
                {(['encode', 'decode'] as Mode[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setMode(item)}
                    className={`rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      mode === item
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <button
                onClick={toggleMode}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300"
              >
                <ArrowLeftRight size={16} />
                Swap Panels
              </button>

              <button
                onClick={copyOutput}
                disabled={!output}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy Output'}
              </button>

              <button
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-sm font-bold text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/15"
              >
                <Trash2 size={16} />
                Clear
              </button>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              <div className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-rose-200">
                Decode Error
              </div>
              <p>{error}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  {mode === 'encode' ? 'Plain Text Input' : 'Base64 Input'}
                </label>
                <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-600">
                  {input.length} chars
                </span>
              </div>
              <textarea
                value={input}
                onChange={(event) => runConversion(event.target.value, mode)}
                placeholder={
                  mode === 'encode'
                    ? 'Paste raw text, JSON fragments, or credentials here.'
                    : 'Paste a Base64 string here.'
                }
                className="h-[420px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-6 font-mono text-sm leading-6 text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  {mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
                </label>
                <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-600">
                  {output.length} chars
                </span>
              </div>
              <textarea
                readOnly
                value={output}
                placeholder="Converted output will appear here."
                className="h-[420px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm leading-6 text-emerald-300 outline-none placeholder:text-slate-700"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Type size={14} className="text-emerald-500" />
                UTF-8 safe conversion
              </span>
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-cyan-500" />
                Browser-only execution
              </span>
            </div>
            <span>No backend calls, no upload step</span>
          </div>
        </section>
      </div>
    </main>
  );
}
