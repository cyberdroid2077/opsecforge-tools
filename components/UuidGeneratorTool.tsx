'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check, Copy, Hash, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  createUuidV4,
  createUuidV7Batch,
  inspectUuid,
  normalizeUuidCount,
  readUuidV7Timestamp,
  type UuidVersion,
} from '@/lib/uuid';

export default function UuidGeneratorTool({ children }: { children?: ReactNode }) {
  const [version, setVersion] = useState<UuidVersion>('v4');
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [removeHyphens, setRemoveHyphens] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [v7Time, setV7Time] = useState<number | null>(null);

  const [inspectInput, setInspectInput] = useState('');

  const normalizedCount = useMemo(() => normalizeUuidCount(count), [count]);
  const inspection = useMemo(
    () => (inspectInput.trim() === '' ? null : inspectUuid(inspectInput)),
    [inspectInput],
  );

  const generateUuids = () => {
    try {
      const raw =
        version === 'v7'
          ? createUuidV7Batch(normalizedCount)
          : Array.from({ length: normalizedCount }, () => createUuidV4());
      const values = raw.map((generated) => {
        let uuid = generated;

        if (removeHyphens) {
          uuid = uuid.replaceAll('-', '');
        }

        if (uppercase) {
          uuid = uuid.toUpperCase();
        }

        return uuid;
      });

      setOutput(values.join('\n'));
      setV7Time(version === 'v7' ? readUuidV7Timestamp(raw[0]) : null);
      setCopied(false);
      setError('');
    } catch {
      setOutput('');
      setError('Secure browser randomness is unavailable, so no UUID was generated.');
    }
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
            OpsecForge Hub
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
              Generate identifiers, or decode an existing one, in the browser
            </span>
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-400">
            Produce random v4 or time-ordered v7 UUIDs (RFC 9562) locally, with optional uppercase
            output and hyphen removal. To check an ID you already have, use{' '}
            <a className="text-emerald-400 underline hover:text-emerald-300" href="#inspect">
              Inspect a UUID
            </a>{' '}
            to read its version, variant and any embedded timestamp.
          </p>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-6 grid gap-4 border-b border-slate-800 pb-6 lg:grid-cols-[1fr_1.2fr_1fr_1fr_auto] lg:items-end">
            <div>
              <label
                htmlFor="uuid-version"
                className="mb-3 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500"
              >
                Version
              </label>
              <select
                id="uuid-version"
                value={version}
                onChange={(event) => setVersion(event.target.value as UuidVersion)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-lg text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
              >
                <option value="v4">v4 (random)</option>
                <option value="v7">v7 (time-ordered)</option>
              </select>
            </div>

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

          <p className="mt-4 min-h-[2.5rem] text-sm text-slate-500">
            {version === 'v7'
              ? v7Time !== null
                ? `First v7 ID carries timestamp ${new Date(v7Time).toISOString()} (${v7Time} ms since the Unix epoch). IDs in one batch sort in the order generated.`
                : 'v7 IDs start with a 48-bit Unix millisecond timestamp, so they sort by creation time. The timestamp is readable by anyone who sees the ID.'
              : 'v4 IDs are 122 random bits with no embedded time.'}
          </p>

          {error ? (
            <p role="alert" className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
              {error}
            </p>
          ) : null}

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
            <span>Uses crypto.randomUUID() or crypto.getRandomValues(); v7 adds Date.now()</span>
          </div>
        </section>

        <section
          aria-labelledby="inspect"
          className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8"
        >
          <h2 id="inspect" className="mb-2 scroll-mt-24 text-2xl font-bold tracking-tight text-slate-100">
            Inspect a UUID
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-slate-400">
            Paste an existing UUID to read its variant, version and embedded fields. Parsing happens in this page; the
            value is not sent anywhere or stored.
          </p>

          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <label
              htmlFor="uuid-inspect-input"
              className="block text-xs font-bold uppercase tracking-[0.22em] text-slate-500"
            >
              UUID to inspect
            </label>
            <button
              type="button"
              onClick={() => setInspectInput(output.split('\n')[0])}
              disabled={!output}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Inspect first generated ID
            </button>
          </div>
          <input
            id="uuid-inspect-input"
            type="text"
            value={inspectInput}
            onChange={(event) => setInspectInput(event.target.value)}
            placeholder="e.g. 017f22e2-79b0-7cc3-98c4-dc0c0c07398f, {…} or urn:uuid:…"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-base text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
          />

          <div aria-live="polite" className="mt-6">
            {inspection === null ? (
              <p className="text-sm text-slate-500">
                Accepts hyphenated or compact hex in any case, optionally in braces or with a urn:uuid: prefix.
              </p>
            ) : inspection.ok ? (
              <>
                <dl className="grid gap-x-8 gap-y-4 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-sm sm:grid-cols-[11rem_1fr]">
                  <dt className="font-bold uppercase tracking-widest text-slate-500">Canonical form</dt>
                  <dd className="break-all font-mono text-emerald-300">{inspection.canonical}</dd>

                  <dt className="font-bold uppercase tracking-widest text-slate-500">Variant</dt>
                  <dd className="text-slate-200">{inspection.variantLabel}</dd>

                  <dt className="font-bold uppercase tracking-widest text-slate-500">Version</dt>
                  <dd className="text-slate-200">
                    <span className="font-mono text-cyan-300">
                      {inspection.special === 'nil'
                        ? 'Nil'
                        : inspection.special === 'max'
                          ? 'Max'
                          : inspection.version !== null
                            ? `v${inspection.version}`
                            : inspection.undefinedVersion
                              ? 'Undefined'
                              : 'Not applicable'}
                    </span>
                    <span className="mt-1 block text-slate-400">{inspection.versionNote}</span>
                  </dd>

                  {inspection.timestamp ? (
                    <>
                      <dt className="font-bold uppercase tracking-widest text-slate-500">Timestamp</dt>
                      <dd className="font-mono text-slate-200">
                        {inspection.timestamp.iso ?? 'Outside the range a JavaScript Date can show'}
                        <span className="mt-1 block text-slate-400">{inspection.timestamp.unixMs} ms since the Unix epoch</span>
                      </dd>
                    </>
                  ) : null}

                  {inspection.clockSequence !== null ? (
                    <>
                      <dt className="font-bold uppercase tracking-widest text-slate-500">Clock sequence</dt>
                      <dd className="font-mono text-slate-200">
                        {inspection.clockSequence}
                        <span className="text-slate-400"> (0x{inspection.clockSequence.toString(16).padStart(4, '0')})</span>
                      </dd>
                    </>
                  ) : null}

                  {inspection.node ? (
                    <>
                      <dt className="font-bold uppercase tracking-widest text-slate-500">Node</dt>
                      <dd className="text-slate-200">
                        <span className="font-mono">{inspection.node}</span>
                        <span className="mt-1 block text-slate-400">{inspection.nodeNote}</span>
                      </dd>
                    </>
                  ) : null}
                </dl>

                {inspection.timestamp ? (
                  <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
                    Privacy: anyone who sees this ID can read when it was created.
                    {inspection.nodeIsMulticast === false
                      ? ' The node field may also be the MAC address of the machine that generated it.'
                      : ''}
                  </p>
                ) : null}
              </>
            ) : (
              <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-300">
                {inspection.error}
              </p>
            )}
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
