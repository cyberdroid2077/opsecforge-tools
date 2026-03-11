"use client";

import React, { useState, useMemo } from 'react';
import { ShieldCheck, TerminalSquare, Copy, RefreshCw, Code, Lock } from 'lucide-react';
import Link from 'next/link';

export default function JsonFormatter() {
  const [inputJson, setInputJson] = useState('');
  const [copied, setCopied] = useState(false);

  const parsedData = useMemo(() => {
    if (!inputJson.trim()) return null;
    
    try {
      const parsed = JSON.parse(inputJson);
      return {
        formatted: JSON.stringify(parsed, null, 2),
        minified: JSON.stringify(parsed),
        valid: true,
      };
    } catch (err: any) {
      return {
        error: err.message || 'Invalid JSON format.',
        valid: false,
      };
    }
  }, [inputJson]);

  const handleCopy = (type: 'formatted' | 'minified') => {
    if (parsedData?.valid) {
      navigator.clipboard.writeText(type === 'formatted' ? parsedData.formatted : parsedData.minified);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-blue-500/30">
      
      {/* Hidden SEO Metadata for Crawlers */}
      <h1 className="sr-only">Offline JSON Formatter & Validator - Private, No Tracking</h1>
      
      <div className="z-10 w-full max-w-6xl items-center justify-between font-mono text-sm">
        
        {/* Navigation Breadcrumbs */}
        <div className="mb-8 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">JSON Formatter</span>
        </div>

        {/* Header Section */}
        <div className="mb-12 text-center lg:text-left flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Lock size={14} />
                <span className="text-xs font-bold tracking-wider">SECURE CLIENT-SIDE VALIDATION</span>
              </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-4 flex items-center gap-3 justify-center lg:justify-start">
              <Code className="text-blue-500" size={40} />
              JSON Formatter
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl font-sans">
              Stop pasting sensitive user data into online JSON validators. Format, minify, and validate offline.
            </p>
          </div>
        </div>
        
        {/* Decoder Workspace */}
        <div className="flex flex-col xl:flex-row gap-6 w-full">
          {/* Input Area */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                Raw JSON Input
              </label>
              <button 
                onClick={() => setInputJson('')}
                className="text-xs text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1 bg-slate-900/50 px-3 py-1 rounded-md border border-slate-800"
              >
                <RefreshCw size={12} /> Clear
              </button>
            </div>
            <textarea 
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              className="w-full h-[500px] p-5 bg-[#0f172a]/90 border border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-blue-300/90 font-mono text-sm resize-none shadow-inner placeholder:text-slate-700 leading-relaxed custom-scrollbar"
              placeholder='{"paste": "your sensitive JSON here", "status": "safe"}'
              spellCheck="false"
            />
          </div>

          {/* Output Area */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                Formatted Output
              </label>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopy('minified')}
                  disabled={!parsedData?.valid}
                  className={`text-xs flex items-center gap-1 transition-colors px-3 py-1 rounded-md border ${parsedData?.valid ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-blue-400' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <Copy size={12} /> Minify
                </button>
                <button 
                  onClick={() => handleCopy('formatted')}
                  disabled={!parsedData?.valid}
                  className={`text-xs flex items-center gap-1 transition-colors px-3 py-1 rounded-md border ${parsedData?.valid ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-blue-400' : 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed'}`}
                >
                  <Copy size={12} /> {copied ? 'Copied!' : 'Copy Formatted'}
                </button>
              </div>
            </div>
            
            <div className="w-full h-[500px] bg-[#0f172a]/90 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
              {!inputJson.trim() ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center gap-4">
                  <ShieldCheck size={48} className="opacity-20 mb-2" />
                  <p className="font-sans text-lg text-slate-400">100% Local Validation</p>
                </div>
              ) : parsedData?.valid ? (
                <div className="flex-1 overflow-auto p-5 text-sm custom-scrollbar">
                  <pre className="text-indigo-300 bg-slate-950 p-4 rounded-lg border border-slate-800/80 shadow-inner overflow-auto h-full">
                    {parsedData.formatted}
                  </pre>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-rose-500 p-8 text-center gap-4">
                  <TerminalSquare size={48} className="opacity-50 mb-2" />
                  <p className="font-mono text-sm max-w-[300px] break-words">{parsedData?.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}