'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Code2,
  Copy,
  Cpu,
  FileJson,
  Lock,
  Network,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wand2,
  Zap,
} from 'lucide-react';

type JsonBeautifierToolProps = {
  breadcrumbLabel?: string;
};

export default function JsonBeautifierTool({
  breadcrumbLabel = 'JSON Beautifier',
}: JsonBeautifierToolProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [indentation, setIndentation] = useState<2 | 4>(2);

  const parseJson = () => {
    if (!input.trim()) {
      throw new Error('Paste JSON into the input panel before running a transform.');
    }

    return JSON.parse(input);
  };

  const formatJson = () => {
    try {
      const data = parseJson();
      setOutput(JSON.stringify(data, null, indentation));
      setError('');
    } catch (err) {
      setOutput('');
      setError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unable to parse input.'}`);
    }
  };

  const minifyJson = () => {
    try {
      const data = parseJson();
      setOutput(JSON.stringify(data));
      setError('');
    } catch (err) {
      setOutput('');
      setError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unable to parse input.'}`);
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const inputMetrics = {
    lines: input ? input.split('\n').length : 0,
    chars: input.length,
  };

  const outputMetrics = {
    lines: output ? output.split('\n').length : 0,
    chars: output.length,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">
            OpSecForge Hub
          </Link>
          <span>/</span>
          <span className="text-slate-300">{breadcrumbLabel}</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Browser-Only JSON Processing
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            JSON Beautifier & Validator
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Format, minify, and verify payloads without leaving your browser
            </span>
          </h1>

          <p className="max-w-3xl text-lg leading-relaxed text-slate-400">
            Paste raw API payloads, log fragments, or minified config blobs into a local-only
            workspace. OpSecForge parses them client-side with native JSON APIs, so nothing is
            transmitted to a server while you clean up the structure.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-emerald-400">
              <Cpu size={14} />
              Native JSON.parse()
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-emerald-400">
              <Network size={14} />
              Zero Network Requests
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-emerald-400">
              <FileJson size={14} />
              Copy-Ready Output
            </div>
          </div>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                <Sparkles size={14} className="text-emerald-400" />
                Transform Controls
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
                Use beautify to normalize spacing with native stringification, or minify to compress
                the same JSON into a single line. Invalid payloads surface an immediate parser error.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/60 p-1.5">
                {[2, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => setIndentation(size as 2 | 4)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      indentation === size
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {size} spaces
                  </button>
                ))}
              </div>

              <button
                onClick={formatJson}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]"
              >
                <Wand2 size={16} />
                Format / Beautify
              </button>

              <button
                onClick={minifyJson}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300"
              >
                <Zap size={16} />
                Minify
              </button>

              <button
                onClick={copyToClipboard}
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
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              <ShieldAlert className="mt-0.5 shrink-0" size={18} />
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-rose-200">
                  Validation Error
                </div>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Input Buffer
                </label>
                <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-600">
                  {inputMetrics.lines}L / {inputMetrics.chars}C
                </span>
              </div>
              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setError('');
                }}
                placeholder='Paste raw JSON here, for example {"service":"api","status":"ok"}'
                className="h-[460px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-6 font-mono text-sm leading-6 text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Output Console
                </label>
                <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-600">
                  {outputMetrics.lines}L / {outputMetrics.chars}C
                </span>
              </div>
              <textarea
                readOnly
                value={output}
                placeholder="Formatted or minified JSON will appear here after a successful parse."
                className="h-[460px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm leading-6 text-emerald-300 outline-none placeholder:text-slate-700"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Code2 size={14} className="text-emerald-500" />
                JSON.stringify(data, null, {indentation})
              </span>
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-cyan-500" />
                No backend calls
              </span>
            </div>
            <span>Strict syntax validation via native parser</span>
          </div>
        </section>

        <section className="mx-auto max-w-4xl border-t border-slate-900 pt-20 pb-40">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                Beautify
              </div>
              <p className="text-sm leading-7 text-slate-400">
                Normalize nested payloads with either 2-space or 4-space indentation for easier
                debugging, diffing, and incident review.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
                Validate
              </div>
              <p className="text-sm leading-7 text-slate-400">
                Catch malformed commas, unexpected tokens, and broken quotes instantly with the same
                parser your JavaScript runtime uses.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-amber-400">
                Minify
              </div>
              <p className="text-sm leading-7 text-slate-400">
                Collapse valid JSON into a single-line payload when you need compact fixtures,
                compact logs, or quick copy-paste into headers and requests.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
