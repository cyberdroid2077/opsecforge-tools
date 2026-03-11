"use client";

import React, { useState, useMemo } from 'react';
import { ShieldCheck, Copy, RefreshCw, FileCode, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function EnvSanitizer() {
  const [inputEnv, setInputEnv] = useState('');
  const [copied, setCopied] = useState(false);

  const sanitizedData = useMemo(() => {
    if (!inputEnv.trim()) return null;

    // Secret detection regexes
    const secretPatterns = [
      { name: 'Stripe Secret Key', pattern: /sk_live_[a-zA-Z0-9]{24,}/g },
      { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
      { name: 'AWS Secret Key', pattern: /secret[_-]?key=['"]?[a-zA-Z0-9/+=]{40}['"]?/gi },
      { name: 'Google API Key', pattern: /AIza[0-9A-Za-z\\-_]{35}/g },
      { name: 'GitHub Token', pattern: /gh[pous]_[a-zA-Z0-9]{36,}/g },
      { name: 'Database Connection', pattern: /(mongodb\+srv|postgres|mysql|redis):\/\/[^:\s]+:[^@\s]+@[^\s]+/gi },
      { name: 'Generic Password/Secret', pattern: /(password|secret|key|auth|token|credential|pwd)['"]?\s*[:=]\s*['"]?([^'"\s]{8,})['"]?/gi },
    ];

    let sanitized = inputEnv;
    let detections: string[] = [];

    secretPatterns.forEach(({ name, pattern }) => {
      const matches = sanitized.match(pattern);
      if (matches) {
        detections.push(\`\${name} (\${matches.length})\`);
        // We use a more careful replace for the generic pattern to preserve keys
        if (name === 'Generic Password/Secret' || name === 'AWS Secret Key') {
            sanitized = sanitized.replace(pattern, (match, p1, p2) => {
                return match.replace(p2, '********');
            });
        } else {
            sanitized = sanitized.replace(pattern, '********');
        }
      }
    });

    return {
      output: sanitized,
      detections,
      hasSecrets: detections.length > 0
    };
  }, [inputEnv]);

  const handleCopy = () => {
    if (sanitizedData) {
      navigator.clipboard.writeText(sanitizedData.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-amber-500/30">
      <h1 className="sr-only">.env File Sanitizer - Remove Secrets & API Keys Locally</h1>
      
      <div className="z-10 w-full max-w-6xl items-center justify-between font-mono text-sm">
        
        {/* Navigation Breadcrumbs */}
        <div className="mb-8 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">.env Sanitizer</span>
        </div>

        {/* Header Section */}
        <div className="mb-12 text-center lg:text-left flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <Lock size={14} />
                <span className="text-xs font-bold tracking-wider">ZERO SERVER EXPOSURE</span>
              </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-4 flex items-center gap-3 justify-center lg:justify-start">
              <FileCode className="text-amber-500" size={40} />
              .env Sanitizer
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl font-sans">
              Safely share your environment variables. Automatically detect and mask production secrets before sharing logs or configs.
            </p>
          </div>
        </div>
        
        {/* Workspace */}
        <div className="flex flex-col xl:flex-row gap-6 w-full">
          {/* Input Area */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Raw .env / Config Input
              </label>
              <button 
                onClick={() => setInputEnv('')}
                className="text-xs text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1 bg-slate-900/50 px-3 py-1 rounded-md border border-slate-800"
              >
                <RefreshCw size={12} /> Clear
              </button>
            </div>
            <textarea 
              value={inputEnv}
              onChange={(e) => setInputEnv(e.target.value)}
              className="w-full h-[450px] p-5 bg-[#0f172a]/90 border border-slate-800 rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-amber-100/90 font-mono text-sm resize-none shadow-inner placeholder:text-slate-700 leading-relaxed custom-scrollbar"
              placeholder="STRIPE_KEY=sk_live_...\nDATABASE_URL=postgres://..."
              spellCheck="false"
            />
          </div>

          {/* Output Area */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Sanitized Output
              </label>
              <button 
                onClick={handleCopy}
                disabled={!sanitizedData}
                className={\`text-xs flex items-center gap-1 transition-colors px-3 py-1 rounded-md border \${sanitizedData ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-amber-400' : 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed'}\`}
              >
                <Copy size={12} /> {copied ? 'Copied!' : 'Copy Safe Config'}
              </button>
            </div>
            
            <div className="w-full h-[450px] bg-[#0f172a]/90 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
              {!inputEnv.trim() ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center gap-4">
                  <ShieldCheck size={48} className="opacity-20 mb-2" />
                  <p className="font-sans text-lg text-slate-400">Scan for Secrets Locally</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Status Banner */}
                  <div className={\`p-4 border-b flex items-center gap-3 \${sanitizedData?.hasSecrets ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}\`}>
                    {sanitizedData?.hasSecrets ? <ShieldAlert size={20} /> : <CheckCircle2 size={20} />}
                    <div className="flex-1">
                      <p className="font-bold text-xs uppercase tracking-tight">
                        {sanitizedData?.hasSecrets ? 'Secrets Detected & Masked' : 'No Common Secrets Detected'}
                      </p>
                      {sanitizedData?.hasSecrets && (
                        <p className="text-[10px] opacity-80">{sanitizedData.detections.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Code View */}
                  <div className="flex-1 overflow-auto p-5 text-sm custom-scrollbar">
                    <pre className="text-slate-300 bg-slate-950 p-4 rounded-lg border border-slate-800/80 shadow-inner overflow-auto h-full font-mono text-xs">
                      {sanitizedData?.output}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tool Info Section */}
        <section className="mt-16 prose prose-invert max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <h4 className="text-amber-400 flex items-center gap-2 mb-3 mt-0 uppercase text-xs tracking-widest font-bold">
                <Lock size={16} /> Privacy First
              </h4>
              <p className="text-sm text-slate-400 m-0">
                Your .env file is never transmitted. All pattern matching and secret masking happens directly in your browser's JS engine.
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <h4 className="text-amber-400 flex items-center gap-2 mb-3 mt-0 uppercase text-xs tracking-widest font-bold">
                <ShieldCheck size={16} /> Pattern Matching
              </h4>
              <p className="text-sm text-slate-400 m-0">
                Automatic detection for Stripe, AWS, GitHub, Google Cloud, and generic password assignments across .env and YAML formats.
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <h4 className="text-amber-400 flex items-center gap-2 mb-3 mt-0 uppercase text-xs tracking-widest font-bold">
                <RefreshCw size={16} /> Instant Masking
              </h4>
              <p className="text-sm text-slate-400 m-0">
                Instantly generates a shareable version of your config with sensitive values replaced by asterisks while preserving the structure.
              </p>
            </div>
          </div>
        </section>

      </div>
      <style dangerouslySetInnerHTML={{__html: \`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      \`}} />
    </main>
  );
}