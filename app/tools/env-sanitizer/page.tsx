'use client';

import React, { useState, useEffect } from 'react';
import SocialShare from '@/components/ui/SocialShare';
import { FileCode, ShieldCheck, Lock, Copy, Check, Trash2, ArrowRight, ShieldAlert, Cpu, Network, ScanFace, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function EnvSanitizer() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [detections, setDetections] = useState<string[]>([]);

  const patterns = [
    { name: 'Stripe API Key', pattern: /sk_(live|test)_[a-zA-Z0-9]{24,}/g },
    { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
    { name: 'AWS Secret Key', pattern: /[a-zA-Z0-9+/]{40}/g },
    { name: 'GitHub Token', pattern: /gh[pous]_[a-zA-Z0-9]{36,}/g },
    { name: 'Database URL', pattern: /postgresql:\/\/([^:]+):([^@]+)@/g },
    { name: 'Generic Password/Secret', pattern: /(_PASSWORD|_SECRET|_KEY)=[^\s\n]+/gi }
  ];

  useEffect(() => {
    if (!input) {
      setOutput('');
      setDetections([]);
      return;
    }

    let sanitized = input;
    const found: string[] = [];

    patterns.forEach(({ name, pattern }) => {
      const matches = sanitized.match(pattern);
      if (matches) {
        found.push(`${name} (${matches.length})`);
        sanitized = sanitized.replace(pattern, (match) => {
          if (name === 'Database URL') {
            return match.replace(/:[^@]+@/, ':********@');
          }
          return match.split('=')[0] + '=****************';
        });
      }
    });

    setOutput(sanitized);
    setDetections(Array.from(new Set(found)));
  }, [input]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      <div className="z-10 w-full max-w-6xl font-sans text-slate-300">
        
        {/* Breadcrumb */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">.env Sanitizer</span>
        </div>

        {/* Tool Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Auto-Detection • Local Redaction</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            .env File Sanitizer <br/>
            <span className="text-slate-400 font-medium text-3xl">Scrub Secrets Before You Share</span>
          </h1>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                <ScanFace size={14} /> Pattern-Based Identification
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                <EyeOff size={14} /> Browser-Only Scrubbing
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Input RAW .env</label>
              <button 
                onClick={() => setInput('')}
                className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs font-bold uppercase"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="STRIPE_KEY=sk_live_...&#10;AWS_SECRET=...&#10;DATABASE_URL=postgresql://user:pass@host..."
              className="w-full h-[400px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none placeholder:text-slate-700 text-amber-500/80"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sanitized Result</label>
              <div className="flex gap-2">
                {detections.map((d, i) => (
                    <span key={i} className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold uppercase">{d}</span>
                ))}
              </div>
            </div>
            <div className="relative group h-[400px]">
              <textarea
                readOnly
                value={output}
                placeholder="Scrubbed version will appear here..."
                className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono text-sm text-emerald-300/80 outline-none resize-none"
              />
              {output && (
                <button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                >
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Clean .env</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SEO & Educational Content Section */}
        <section className="max-w-4xl mx-auto border-t border-slate-900 pt-24 pb-48">
            <article className="prose prose-invert prose-slate lg:prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-slate-100">What is the .env Sanitizer?</h2>
                <p>
                    Environment variable files (<code>.env</code>) store critical infrastructure keys like database passwords and API tokens. The .env Sanitizer is a tool that automatically identifies and masks these secrets, allowing you to safely share configuration templates or debug logs.
                </p>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">How it works locally</h2>
                <p>
                    This tool uses <strong>RegEx-based pattern matching</strong> that runs entirely within your browser. It doesn&apos;t just replace strings; it intelligently parses key-value pairs and recognizes specific formats for providers like AWS, Stripe, and GitHub.
                </p>

                <div className="bg-amber-500/5 border-l-4 border-amber-500 p-8 my-16 rounded-r-2xl">
                    <h3 className="text-amber-400 mt-0 flex items-center gap-2">
                        <ShieldAlert size={24} /> The Danger of "Beautifiers"
                    </h3>
                    <p className="text-slate-300">
                        Many &quot;env formatters&quot; on the web are simple proxies that send your secrets to their servers for processing. In 2026, <strong>Credential Stuffing</strong> and <strong>Secret Scraping</strong> are at an all-time high. Never upload production secrets to any server-side tool.
                    </p>
                </div>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">FAQ</h2>
                <div className="space-y-8 mt-8">
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">Which secrets do you detect?</h4>
                        <p className="text-slate-400 mb-0">We currently detect Stripe keys, AWS credentials, GitHub tokens, PostgreSQL URLs, and generic keys ending in _PASSWORD, _SECRET, or _KEY.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">Is the redaction reversible?</h4>
                        <p className="text-slate-400 mb-0">No. The masking is permanent in the output. This ensures that even if the sanitized text is intercepted, your original secrets cannot be recovered.</p>
                    </div>
                </div>
            </article>
        </section>

        <div className="mt-12 mb-24">
          <SocialShare url="https://opsecforge.com/tools/env-sanitizer" title="Env Sanitizer - OpsecForge" />
        </div>

      </div>
    </main>
  );
}
