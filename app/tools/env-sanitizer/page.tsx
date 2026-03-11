'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Lock, ArrowRight, Copy, Check, Trash2, Github, Key, Database, Mail } from 'lucide-react';
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
    sanitize(input);
  }, [input]);

  const sanitize = (text: string) => {
    if (!text) {
      setOutput('');
      setDetections([]);
      return;
    }

    let sanitized = text;
    const found: string[] = [];

    patterns.forEach(({ name, pattern }) => {
      const matches = sanitized.match(pattern);
      if (matches) {
        found.push(`${name} (${matches.length})`);
        sanitized = sanitized.replace(pattern, (match) => {
          if (name === 'Database URL') {
            return match.replace(/:[^@]+@/, ':********@');
          }
          if (match.length > 8) {
            return match.substring(0, 4) + '********' + match.substring(match.length - 4);
          }
          return '********';
        });
      }
    });

    setOutput(sanitized);
    setDetections(Array.from(new Set(found)));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      <div className="z-10 w-full max-w-6xl font-sans text-slate-300">
        
        {/* Header */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">.env Sanitizer</span>
        </div>

        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Local Only • Browser Based</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            .env File Sanitizer <br/>
            <span className="text-slate-400 font-medium text-3xl">Remove Secrets & API Keys Locally</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg mb-8 leading-relaxed">
            Safely prepare your environment files for sharing. Paste your <code className="text-emerald-400/80 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">.env</code> content below to automatically mask sensitive values. Processing happens entirely in your browser.
          </p>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Input Side */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Input Raw Content</label>
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
              placeholder="PASTE YOUR .ENV FILE CONTENT HERE...&#10;&#10;STRIPE_KEY=sk_live_...&#10;AWS_SECRET=...&#10;DATABASE_URL=postgresql://user:pass@host..."
              className="w-full h-[400px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none placeholder:text-slate-700"
            />
          </div>

          {/* Output Side */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sanitized Output</label>
              <div className="flex gap-4">
                {detections.length > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    {detections.length} Pattern(s) Found
                  </span>
                )}
              </div>
            </div>
            <div className="relative group h-[400px]">
              <textarea
                readOnly
                value={output}
                placeholder="Sanitized version will appear here..."
                className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono text-sm text-emerald-300/80 outline-none resize-none"
              />
              {output && (
                <button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                >
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Sanitized</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Security Checklist */}
        <div className="p-8 lg:p-12 bg-slate-900/30 border border-slate-800 rounded-3xl mb-24">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-100">Why this is safe</h2>
              </div>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong>No Network:</strong> Your data never leaves your browser. We don&apos;t even have a backend database for this tool.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong>Zero Retention:</strong> We don&apos;t store, log, or track what you paste. Once you refresh the page, it&apos;s gone.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong>Open Logic:</strong> Pure JavaScript Regex processing. No hidden API calls or analytics scripts.</span>
                </li>
              </ul>
            </div>
            <div className="w-px bg-slate-800 hidden lg:block" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="text-amber-500" />
                <h2 className="text-2xl font-bold text-slate-100">Active Protections</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {patterns.map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 text-xs font-mono flex items-center gap-2">
                    <Check size={12} className="text-emerald-500" /> {p.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center pb-12 border-t border-slate-900 pt-12">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors font-bold text-sm uppercase tracking-widest">
            Back to Hub <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}