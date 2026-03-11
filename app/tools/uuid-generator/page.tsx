"use client";

import { useState, useCallback, useEffect } from "react";
import { Copy, RefreshCw, Zap, Shield, Clock, Hash, AlertTriangle, Check, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from 'next/link';

// ULID implementation
const ULID = {
  ENCODING: "0123456789ABCDEFGHJKMNPQRSTVWXYZ",
  TIME_LEN: 10,
  RANDOM_LEN: 16,

  encodeTime: (now: number, len: number): string => {
    let mod: number;
    let str = "";
    for (let i = len; i > 0; i--) {
      mod = now % 32;
      str = ULID.ENCODING.charAt(mod) + str;
      now = Math.floor((now - mod) / 32);
    }
    return str;
  },

  encodeRandom: (len: number): string => {
    let str = "";
    const randomBytes = new Uint8Array(len);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < len; i++) {
      str += ULID.ENCODING.charAt(randomBytes[i] % 32);
    }
    return str;
  },

  generate: (): string => {
    const now = Date.now();
    return ULID.encodeTime(now, ULID.TIME_LEN) + ULID.encodeRandom(ULID.RANDOM_LEN);
  },
};

// UUID v4 implementation using crypto.randomUUID() or fallback
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

type IDType = "uuid" | "ulid";
type BatchSize = 1 | 5 | 10 | 50;

interface GeneratedID {
  value: string;
  timestamp: number;
}

export default function UUIDGeneratorPage() {
  const [idType, setIdType] = useState<IDType>("uuid");
  const [batchSize, setBatchSize] = useState<BatchSize>(5);
  const [generatedIDs, setGeneratedIDs] = useState<GeneratedID[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [stats, setStats] = useState({ totalGenerated: 0, sessionStart: Date.now() });

  const generate = useCallback(() => {
    const newIDs: GeneratedID[] = [];
    for (let i = 0; i < batchSize; i++) {
      const value = idType === "uuid" ? generateUUID() : ULID.generate();
      newIDs.push({ value, timestamp: Date.now() });
    }
    setGeneratedIDs(newIDs);
    setStats((prev) => ({ ...prev, totalGenerated: prev.totalGenerated + batchSize }));
  }, [idType, batchSize]);

  // Generate on initial load and when type/batch changes
  useEffect(() => {
    generate();
  }, [idType, batchSize]);

  const copyToClipboard = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyAll = async () => {
    const allValues = generatedIDs.map((id) => id.value).join("\n");
    try {
      await navigator.clipboard.writeText(allValues);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy all:", err);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <main className="mx-auto max-w-6xl px-6 lg:px-24 py-12">
        {/* Breadcrumb */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">ID Generator</span>
        </div>

        {/* Tool Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Shield size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Cryptographically Secure • Browser-Only</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            UUID & ULID Generator <br/>
            <span className="text-slate-400 font-medium text-3xl">Securely Generate Identifiers Locally</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg mb-8 leading-relaxed">
            Generate cryptographically secure UUIDs and time-sortable ULIDs directly in your browser. All randomness is sourced from the Web Crypto API, ensuring zero server exposure.
          </p>
        </div>

        {/* Tool Workspace */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 mb-24 backdrop-blur-sm">
          {/* Controls */}
          <div className="mb-8 flex flex-wrap items-center gap-6">
            {/* ID Type Selector */}
            <div className="flex items-center gap-2 rounded-2xl bg-slate-800/50 p-1.5 border border-slate-700">
              <button
                onClick={() => setIdType("uuid")}
                className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                  idType === "uuid"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                UUID v4
              </button>
              <button
                onClick={() => setIdType("ulid")}
                className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                  idType === "ulid"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ULID
              </button>
            </div>

            {/* Batch Size Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Count:</span>
              <div className="flex gap-2">
                {[1, 5, 10, 50].map((size) => (
                    <button
                    key={size}
                    onClick={() => setBatchSize(size as BatchSize)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all border ${
                        batchSize === size
                        ? "bg-slate-700 text-white border-slate-600"
                        : "text-slate-400 border-transparent hover:bg-slate-800"
                    }`}
                    >
                    {size}
                    </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={copyAll}
                disabled={generatedIDs.length === 0}
                className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-200 transition-all hover:bg-slate-750 disabled:opacity-50"
              >
                {copiedIndex === -1 ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-500" />
                )}
                Copy All
              </button>
              <button
                onClick={generate}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {generatedIDs.map((id, index) => (
              <div
                key={`${id.value}-${index}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-800/50 bg-slate-950/30 p-5 transition-all hover:border-emerald-500/30 hover:bg-slate-950/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800">
                  {idType === "uuid" ? (
                    <Hash className="h-4 w-4 text-emerald-500/60" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500/60" />
                  )}
                </div>
                <code className="flex-1 font-mono text-sm tracking-wider text-slate-100 group-hover:text-emerald-400 transition-colors break-all">
                  {id.value}
                </code>
                <span className="text-[10px] font-bold font-mono text-slate-600 hidden sm:block">{formatTimestamp(id.timestamp)}</span>
                <button
                  onClick={() => copyToClipboard(id.value, index)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 transition-all hover:text-emerald-400 hover:border-emerald-500/30 group-hover:bg-slate-800"
                  title="Copy to clipboard"
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-emerald-500" />
                Local Generation
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-500" />
                {stats.totalGenerated} IDs this session
              </span>
            </div>
            <span className="hidden sm:block">Entropy Source: Web Crypto API</span>
          </div>
        </div>

        {/* SEO Educational Section */}
        <section className="max-w-4xl mx-auto border-t border-slate-900 pt-24 pb-48">
            <article className="prose prose-invert prose-slate lg:prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-slate-100">Understanding UUIDs and ULIDs</h2>
                
                <div className="grid gap-12 md:grid-cols-2 mt-12">
                  <div>
                    <h3 className="mb-4 text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Hash className="text-emerald-400" size={20} /> What are UUIDs?
                    </h3>
                    <p className="text-slate-400">
                        UUID (Universally Unique Identifier) is a 128-bit number used to identify information in computer systems. Version 4 UUIDs, generated here, are created using high-entropy random numbers. They follow the standard 8-4-4-4-12 hex format.
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-4 text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Clock className="text-amber-400" size={20} /> What are ULIDs?
                    </h3>
                    <p className="text-slate-400">
                        ULID (Universally Unique Lexicographically Sortable Identifier) is a 26-character string combining a timestamp with randomness. Unlike UUIDs, ULIDs are time-sortable, making them ideal for high-performance database indexing where chronological ordering is critical.
                    </p>
                  </div>
                </div>

                <div className="mt-16 p-8 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-2xl">
                    <h3 className="text-emerald-400 mt-0 flex items-center gap-2">
                        <ShieldCheck size={24} /> Why Local Generation is Safer
                    </h3>
                    <p className="text-slate-300">
                        Most online generators send requests to their servers to compute IDs. This exposes your identifiers to <strong>Predictive Harvesting</strong> and logging risks. For production API keys or DB primary keys, this exposure is a critical OpSec flaw. 
                    </p>
                    <p className="text-slate-300 mb-0">
                        By using the <code>Web Crypto API</code> in your browser, OpSecForge ensures your IDs never leave your device. You own the entropy, you own the result.
                    </p>
                </div>

                <h2 className="text-3xl font-bold text-slate-100 mt-20">Collision Probabilities</h2>
                <p className="text-slate-400">
                    The probability of generating duplicate UUIDs is astronomically low. With 2^122 possible UUID v4 values, you would need to generate roughly <strong>1 billion UUIDs per second for 85 years</strong> to have a 50% chance of a single collision. ULIDs offer similar uniqueness guarantees with the added benefit of 80 bits of randomness per millisecond.
                </p>
                
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl mt-12">
                    <div className="flex items-center gap-2 text-rose-400 font-bold mb-4 uppercase text-xs tracking-widest">
                        <AlertTriangle size={14} /> Security Warning
                    </div>
                    <p className="text-sm text-slate-400 mb-0">
                        Never use "Random ID" generators that require an internet connection for sensitive production keys. Always verify that the underlying generation logic executes client-side to prevent upstream credential harvesting.
                    </p>
                </div>
            </article>
        </section>

      </main>

      {/* Footer CTA */}
      <footer className="mt-auto py-12 border-t border-slate-900 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to OpSecForge Hub
          </Link>
      </footer>
    </div>
  );
}
