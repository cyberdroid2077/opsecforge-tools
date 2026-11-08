'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, Check, Copy, Lock, ShieldCheck, Trash2, Type } from 'lucide-react';
import {
  type Base64Analysis,
  type Base64Variant,
  analyzeBase64Input,
  convertBase64Variant,
  decodeBase64Detailed,
  encodeBase64Text,
  formatHexView,
} from '@/lib/base64-codec';

type Mode = 'encode' | 'decode';

type BinaryResult = ReturnType<typeof formatHexView>;

const variantLabel = (item: Base64Variant) => (item === 'url' ? 'Base64URL' : 'Standard');

const describeAnalysis = (analysis: Base64Analysis) => {
  const rows: Array<[string, string]> = [];
  const detected = {
    standard: 'Standard (+ /)',
    url: 'URL-safe (- _)',
    ambiguous: 'Ambiguous (only characters shared by both)',
    'invalid-mixed': 'Invalid: mixes + / with - _',
  }[analysis.variant];
  const padding = {
    'none-needed': 'Not needed',
    correct: `Correct (${analysis.paddingCount})`,
    missing: 'Missing (accepted by this decoder)',
    incorrect: `Incorrect (${analysis.paddingCount} supplied)`,
  }[analysis.paddingStatus];

  rows.push(['Variant', detected]);
  rows.push(['Padding', padding]);
  rows.push([
    'Length mod 4',
    analysis.malformedLength ? `${analysis.lengthMod4} (malformed: input may be cut off)` : String(analysis.lengthMod4),
  ]);
  rows.push([
    'Invalid characters',
    analysis.invalidChar
      ? `${JSON.stringify(analysis.invalidChar.char)} at position ${analysis.invalidChar.index + 1}`
      : 'None',
  ]);
  rows.push(['Whitespace stripped', String(analysis.whitespaceStripped)]);
  rows.push(['Decoded size', analysis.byteLength === null ? 'n/a' : `${analysis.byteLength} byte${analysis.byteLength === 1 ? '' : 's'}`]);

  return rows;
};

export default function Base64ConverterTool({ children }: { children?: ReactNode }) {
  const [mode, setMode] = useState<Mode>('encode');
  const [variant, setVariant] = useState<Base64Variant>('standard');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [binary, setBinary] = useState<BinaryResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [hexCopied, setHexCopied] = useState(false);
  const [convertInput, setConvertInput] = useState('');
  const [convertTo, setConvertTo] = useState<Base64Variant>('url');
  const [convertPadding, setConvertPadding] = useState(false);
  const [convertCopied, setConvertCopied] = useState(false);

  const analysis = mode === 'decode' && input ? analyzeBase64Input(input) : null;
  const suggestedVariant: Base64Variant | null =
    analysis && (analysis.variant === 'standard' || analysis.variant === 'url') && analysis.variant !== variant
      ? analysis.variant
      : null;

  let converted = '';
  let convertError = '';
  if (convertInput.trim()) {
    try {
      converted = convertBase64Variant(convertInput, convertTo, { padding: convertPadding });
    } catch (err) {
      convertError = err instanceof Error ? err.message : 'Unable to convert input.';
    }
  }

  const runConversion = (nextInput: string, nextMode: Mode, nextVariant = variant) => {
    setInput(nextInput);
    setError('');
    setBinary(null);
    setHexCopied(false);

    if (!nextInput) {
      setOutput('');
      return;
    }

    try {
      if (nextMode === 'encode') {
        setOutput(encodeBase64Text(nextInput, nextVariant));
      } else {
        const { bytes, text } = decodeBase64Detailed(nextInput, nextVariant);
        setOutput(text ?? '');
        setBinary(text === null ? formatHexView(bytes) : null);
      }
    } catch (err) {
      setOutput('');
      setError(`Invalid Base64: ${err instanceof Error ? err.message : 'Unable to decode input.'}`);
    }
  };

  const changeVariant = (nextVariant: Base64Variant) => {
    setVariant(nextVariant);
    runConversion(input, mode, nextVariant);
  };

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    runConversion(input, nextMode);
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
    setBinary(null);
    setError('');
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setBinary(null);
    setError('');
    setCopied(false);
    setHexCopied(false);
  };

  const copyHex = async () => {
    if (!binary) {
      return;
    }

    await navigator.clipboard.writeText(binary.hex);
    setHexCopied(true);
    window.setTimeout(() => setHexCopied(false), 1800);
  };

  const copyConverted = async () => {
    if (!converted) {
      return;
    }

    await navigator.clipboard.writeText(converted);
    setConvertCopied(true);
    window.setTimeout(() => setConvertCopied(false), 1800);
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
            OpsecForge Hub
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
            Flip between plain text and Base64 while debugging headers, credentials, and small
            config fragments. Conversion runs in this browser tab; OpsecForge does not send the
            pasted text to a tool-processing backend. The page itself still loads site resources
            and aggregate analytics.
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
                Encode UTF-8 text as standard Base64 or unpadded Base64URL, then decode it back. Decoded bytes that are not valid UTF-8 are shown as hex instead of text.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/60 p-1.5" aria-label="Base64 variant">
                {(['standard', 'url'] as Base64Variant[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => changeVariant(item)}
                    aria-pressed={variant === item}
                    className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      variant === item
                        ? 'bg-cyan-700 text-white'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {item === 'url' ? 'Base64URL' : 'Standard'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/60 p-1.5">
                {(['encode', 'decode'] as Mode[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => changeMode(item)}
                    aria-pressed={mode === item}
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
                  {mode === 'encode' ? 'Plain Text Input' : `${variant === 'url' ? 'Base64URL' : 'Base64'} Input`}
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
                  {mode === 'encode' ? `${variant === 'url' ? 'Base64URL' : 'Base64'} Output` : 'Decoded Text'}
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

          {analysis ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5" role="region" aria-label="Input check">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Input check</div>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {describeAnalysis(analysis).map(([label, value]) => (
                  <div key={label} className="flex flex-col">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
                    <dd className="font-mono text-slate-300">{value}</dd>
                  </div>
                ))}
              </dl>
              {suggestedVariant ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                  <span>
                    This looks like {suggestedVariant === 'url' ? 'Base64URL' : 'standard Base64'}, but{' '}
                    {variantLabel(variant)} is selected.
                  </span>
                  <button
                    onClick={() => changeVariant(suggestedVariant)}
                    className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-100 transition-all hover:bg-amber-400/15"
                  >
                    Switch to {variantLabel(suggestedVariant)}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {binary ? (
            <div className="mt-6 rounded-2xl border border-amber-400/30 bg-slate-950/60 p-5" role="region" aria-label="Hex view">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">Not UTF-8 text</div>
                  <p className="mt-1 text-sm text-slate-400">
                    The decoded data is {binary.total} byte{binary.total === 1 ? '' : 's'} and is not valid UTF-8, so it is shown as hex.
                  </p>
                </div>
                <button
                  onClick={copyHex}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300"
                >
                  {hexCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {hexCopied ? 'Copied' : 'Copy hex'}
                </button>
              </div>
              <pre
                data-testid="hex-view"
                className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-emerald-300"
              >
                {binary.hex}
              </pre>
              {binary.truncated ? (
                <p className="mt-2 text-xs text-amber-200">
                  Showing the first {binary.shown} of {binary.total} bytes. The remaining {binary.total - binary.shown} bytes are not displayed.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5" role="region" aria-label="Convert variant">
            <div className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              Convert Standard ⇄ URL-safe
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Swaps <span className="font-mono">+ /</span> and <span className="font-mono">- _</span> and adds or removes padding without decoding the data.
            </p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <textarea
                aria-label="Base64 string to convert"
                value={convertInput}
                onChange={(event) => setConvertInput(event.target.value)}
                placeholder="Paste a Base64 or Base64URL string."
                className="h-28 w-full resize-none rounded-2xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-sm leading-6 text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                spellCheck={false}
              />
              <textarea
                aria-label="Converted string"
                readOnly
                value={converted}
                placeholder="Converted string will appear here."
                className="h-28 w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-emerald-300 outline-none placeholder:text-slate-700"
                spellCheck={false}
              />
            </div>
            {convertError ? <p className="mt-3 text-sm text-rose-300">{convertError}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/60 p-1.5" aria-label="Convert to">
                {(['url', 'standard'] as Base64Variant[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setConvertTo(item)}
                    aria-pressed={convertTo === item}
                    className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      convertTo === item ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    To {variantLabel(item)}
                  </button>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={convertPadding}
                  onChange={(event) => setConvertPadding(event.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                Include = padding
              </label>
              <button
                onClick={copyConverted}
                disabled={!converted}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {convertCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {convertCopied ? 'Copied' : 'Copy converted'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Type size={14} className="text-emerald-500" />
                UTF-8 text and hex view
              </span>
              <span className="flex items-center gap-1.5">
                <Lock size={14} className="text-cyan-500" />
                Browser-only execution
              </span>
            </div>
            <span>No tool-input upload</span>
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
