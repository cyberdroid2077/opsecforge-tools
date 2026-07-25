'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Copy, Check, Trash2, ShieldAlert, ScanFace, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { sanitizeForSharing } from '@/lib/safe-share-sanitizer';

export default function EnvSanitizer() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [detections, setDetections] = useState<string[]>([]);

  useEffect(() => {
    if (!input) {
      setOutput('');
      setDetections([]);
      return;
    }

    const result = sanitizeForSharing(input);
    setOutput(result.output);
    setDetections(result.findings.map(({ kind, count }) => `${kind} (${count})`));
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
          <span className="text-slate-300">Safe-to-Share Sanitizer</span>
        </div>

        {/* Tool Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Auto-Detection • Local Redaction</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            Safe-to-Share Sanitizer <br/>
            <span className="text-slate-400 font-medium text-3xl">Review and redact common secrets locally</span>
          </h1>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                <ScanFace size={14} /> Heuristic Detection
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
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Text to review</label>
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
              placeholder={'Paste .env, JSON, YAML, logs, headers, or a cURL command.\n\nAPI_KEY=synthetic-example\nAuthorization: Bearer synthetic-example'}
              className="w-full h-[400px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none placeholder:text-slate-700 text-amber-500/80"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Redacted draft — review before sharing</label>
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
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Redacted Draft</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SEO & Educational Content Section */}
        <section className="max-w-4xl mx-auto border-t border-slate-900 pt-24 pb-48">
            <article className="prose prose-invert prose-slate lg:prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-slate-100">What does the Safe-to-Share Sanitizer do?</h2>
                <p>
                    It makes a local, heuristic pass over <code>.env</code>, JSON, YAML, logs,
                    headers, URLs, and cURL commands. It masks common credential formats and
                    values stored under sensitive field names while preserving the surrounding
                    text where feasible.
                </p>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">How it works locally</h2>
                <p>
                    Pattern matching and redaction run in this browser tab. The tool does not send
                    the pasted text to OpsecForge, store it in local storage, or include it in
                    analytics events. Closing or refreshing the page clears the current React state.
                </p>

                <div className="bg-amber-500/5 border-l-4 border-amber-500 p-8 my-16 rounded-r-2xl">
                    <h3 className="text-amber-400 mt-0 flex items-center gap-2">
                        <ShieldAlert size={24} /> The Danger of "Beautifiers"
                    </h3>
                    <p className="text-slate-300">
                        Detection is not exhaustive and a clean-looking result is not proof that all
                        sensitive data was removed. Review every output before sharing. If a real
                        credential was exposed, rotate or revoke it; redaction does not undo an
                        earlier leak.
                    </p>
                </div>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">FAQ</h2>
                <div className="space-y-8 mt-8">
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">Which secrets do you detect?</h4>
                        <p className="text-slate-400 mb-0">The heuristic checks common provider tokens, private-key blocks, authorization and cookie headers, credentials in URLs, sensitive query parameters, JWT-like strings, and values under common password, token, secret, and API-key field names. It can miss custom formats and may flag benign values.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">Is the redaction reversible?</h4>
                        <p className="text-slate-400 mb-0">No mapping is retained. The output contains replacement markers, not an encrypted or reversible copy. Keep the original private and manually confirm that the draft still contains enough context.</p>
                    </div>
                </div>
            </article>
        </section>

      </div>
    </main>
  );
}
