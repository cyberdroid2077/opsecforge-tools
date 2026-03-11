'use client';

import React, { useState, useEffect } from 'react';
import { Code, ShieldCheck, Lock, Copy, Check, Trash2, ArrowRight, ShieldAlert, Cpu, Network, FileJson, Zap } from 'lucide-react';
import Link from 'next/link';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!input) {
      setOutput('');
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
      setOutput('');
    }
  }, [input]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minifyJson = () => {
    try {
        const parsed = JSON.parse(input);
        setOutput(JSON.stringify(parsed));
    } catch (err: any) {
        setError('Cannot minify: ' + err.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      <div className="z-10 w-full max-w-6xl font-sans text-slate-300">
        
        {/* Breadcrumb */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">JSON Formatter</span>
        </div>

        {/* Tool Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Local Processing • Private by Design</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            JSON Formatter & Validator <br/>
            <span className="text-slate-400 font-medium text-3xl">Clean Data Without Data Exposure</span>
          </h1>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                <Cpu size={14} /> 100% Client-Side
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                <Network size={14} /> Zero Network Leakage
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Raw Input</label>
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
              placeholder='Paste minified or raw JSON here... e.g. {"key": "value"}'
              className="w-full h-[500px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none placeholder:text-slate-700 text-blue-400"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Beautified Output</label>
              <div className="flex gap-4">
                <button onClick={minifyJson} className="text-slate-500 hover:text-emerald-400 transition-colors text-xs font-bold uppercase flex items-center gap-1">
                    <Zap size={12} /> Minify
                </button>
              </div>
            </div>
            <div className="relative group h-[500px]">
              <textarea
                readOnly
                value={output}
                placeholder="Pretty JSON will appear here..."
                className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono text-sm text-emerald-300/80 outline-none resize-none"
              />
              {output && (
                <button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                >
                  {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy JSON</>}
                </button>
              )}
              {error && (
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono">
                    <div className="flex items-center gap-2 mb-1 font-bold">
                        <ShieldAlert size={14} /> JSON Syntax Error
                    </div>
                    {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO & Educational Content Section */}
        <section className="max-w-4xl mx-auto border-t border-slate-900 pt-24 pb-48">
            <article className="prose prose-invert prose-slate lg:prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-slate-100">What is a JSON Formatter & Validator?</h2>
                <p>
                    JSON (JavaScript Object Notation) is the universal data interchange format for modern APIs and databases. A JSON Formatter transforms unreadable, minified JSON into indented, highlighted structures, while a Validator detects syntax errors like missing commas or trailing brackets.
                </p>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">How it works locally</h2>
                <p>
                    Unlike traditional formatters, our tool uses <strong>JavaScript native parsing</strong> in your browser memory. Your data is processed in a transient state and is never saved to a database or sent across the network.
                </p>

                <div className="bg-emerald-500/5 border-l-4 border-emerald-500 p-8 my-16 rounded-r-2xl">
                    <h3 className="text-emerald-400 mt-0 flex items-center gap-2">
                        <FileCheck2 className="text-emerald-500" size={24} /> Why Local Formatting is Crucial for OpSec
                    </h3>
                    <p className="text-slate-300">
                        API logs often contain <strong>Customer PII</strong>, <strong>Internal IP addresses</strong>, or <strong>Auth tokens</strong>. Pasting these into a 3rd-party online formatter is a massive compliance risk. Local processing ensures you maintain 100% data sovereignty.
                    </p>
                </div>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">FAQ</h2>
                <div className="space-y-8 mt-8">
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">What is the maximum file size?</h4>
                        <p className="text-slate-400 mb-0">Our local formatter handles files up to 5MB easily. Beyond that, browser performance may vary depending on your hardware.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">Does it support comments?</h4>
                        <p className="text-slate-400 mb-0">Strict JSON (RFC 8259) does not support comments. This validator adheres to the strict standard to ensure compatibility with your backend systems.</p>
                    </div>
                </div>
            </article>
        </section>

      </div>
    </main>
  );
}
import { FileCheck2 } from 'lucide-react';