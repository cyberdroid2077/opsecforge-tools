'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Lock } from 'lucide-react';

type Hashes = {
  sha1: string;
  sha256: string;
  sha512: string;
};

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

async function digest(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512', value: string) {
  const encoded = new TextEncoder().encode(value);
  const result = await window.crypto.subtle.digest(algorithm, encoded);
  return toHex(result);
}

export default function ShaHashTool() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<Hashes>({ sha1: '', sha256: '', sha512: '' });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!input) {
      setHashes({ sha1: '', sha256: '', sha512: '' });
      return () => {
        cancelled = true;
      };
    }

    const run = async () => {
      const [sha1, sha256, sha512] = await Promise.all([
        digest('SHA-1', input),
        digest('SHA-256', input),
        digest('SHA-512', input),
      ]);

      if (!cancelled) {
        setHashes({ sha1, sha256, sha512 });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [input]);

  const copyValue = async (key: string, value: string) => {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  const rows = [
    { key: 'sha1', label: 'SHA-1', value: hashes.sha1 },
    { key: 'sha256', label: 'SHA-256', value: hashes.sha256 },
    { key: 'sha512', label: 'SHA-512', value: hashes.sha512 },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">SHA Hash</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">SubtleCrypto Digests</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            SHA Hash Generator
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Generate SHA-1, SHA-256, and SHA-512 digests in real time
            </span>
          </h1>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Paste text to hash." className="mb-8 h-48 w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-6 font-mono text-sm leading-6 text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20" spellCheck={false} />

          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.key} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{row.label}</span>
                  <button onClick={() => copyValue(row.key, row.value)} disabled={!row.value} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 disabled:opacity-40">
                    {copiedKey === row.key ? <Check size={16} /> : <Copy size={16} />} Copy
                  </button>
                </div>
                <textarea readOnly value={row.value} className="h-24 w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-300 outline-none" spellCheck={false} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
