"use client";

import React from 'react';
import { ShieldCheck, TerminalSquare, Code, Hash, Lock, FileCode, Webhook, KeyRound, ArrowRight, Zap, UploadCloud, Database } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const tools = [
    {
      id: 'jwt-decoder',
      name: 'JWT Decoder',
      description: 'Decode and inspect JSON Web Tokens with complete data sovereignty. No external transmission. Includes intelligent timestamp parsing and validation.',
      icon: <TerminalSquare className="text-emerald-500" size={32} />,
      status: 'Live',
      color: 'emerald'
    },
    {
      id: 'json-formatter',
      name: 'JSON Formatter & Validator',
      description: 'Securely format, validate, and minify sensitive JSON payloads entirely in your browser.',
      icon: <Code className="text-blue-500" size={32} />,
      status: 'Live',
      color: 'blue'
    },
    {
      id: 'env-sanitizer',
      name: '.env Sanitizer',
      description: 'Automatically detect and mask secrets in your environment variables before sharing.',
      icon: <FileCode className="text-amber-500" size={32} />,
      status: 'Live',
      color: 'amber'
    },
    {
      id: 'uuid-generator',
      name: 'UUID & ULID Generator',
      description: 'Generate cryptographically secure, time-sortable identifiers locally. No server-side ID harvesting.',
      icon: <Hash className="text-emerald-500" size={32} />,
      status: 'Live',
      color: 'emerald'
    },
    {
      id: 'base64-converter',
      name: 'Base64 Converter',
      description: 'Securely encode and decode text or files to Base64 locally. Supports drag-and-drop and binary downloads.',
      icon: <UploadCloud className="text-blue-500" size={32} />,
      status: 'Live',
      color: 'blue'
    },
    {
      id: 'sql-formatter',
      name: 'SQL Formatter & Minifier',
      description: 'Beautify and optimize SQL queries locally. Supports MySQL and PostgreSQL dialects with zero data leakage.',
      icon: <Database className="text-amber-500" size={32} />,
      status: 'Live',
      color: 'amber'
    },
    {
      id: 'webhook-debugger',
      name: 'Webhook Debugger',
      description: 'Debug and verify Stripe, GitHub, and Shopify webhook signatures client-side.',
      icon: <Webhook className="text-rose-500" size={32} />,
      status: 'Live',
      color: 'rose'
    },
    {
      id: 'hash-generator',
      name: 'Secure Hash Generator',
      description: 'Generate Bcrypt, SHA-256, and MD5 hashes locally without logging your plaintext passwords.',
      icon: <Zap className="text-purple-500" size={32} />,
      status: 'In Dev',
      color: 'purple'
    }
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      <div className="z-10 w-full max-w-6xl items-center justify-between font-mono text-sm">
        
        {/* Header Section */}
        <div className="mb-16 text-center lg:text-left flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 mb-6 shadow-sm">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-xs font-bold tracking-wider">THE OFFLINE-FIRST DEVELOPER SUITE</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-100 mb-4 flex items-center gap-3 justify-center lg:justify-start">
              OpSecForge <span className="text-emerald-500">Hub</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl font-sans">
              A zero-trust, client-side developer toolkit engineered for secure data operations. All processing occurs locally within your browser—no data transmission, no server exposure, no exceptions.
            </p>
          </div>
        </div>
        
        {/* Tool Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-24">
          {tools.map((tool) => (
            <Link href={tool.status === 'Live' ? `/tools/${tool.id}` : '#'} key={tool.id} className={`block group ${tool.status !== 'Live' && 'cursor-not-allowed opacity-60'}`}>
              <div className="h-full flex flex-col p-6 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800/80 hover:border-slate-600 transition-all shadow-lg hover:shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                    {tool.icon}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${tool.status === 'Live' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    {tool.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-200 mb-2 font-sans group-hover:text-white transition-colors">
                  {tool.name}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-sans flex-1">
                  {tool.description}
                </p>
                <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center gap-2 text-xs text-slate-500 font-bold tracking-wider">
                  <Lock size={12} /> 100% LOCAL
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Blog Teaser / SEO Section */}
        <div className="w-full max-w-4xl mx-auto py-24 border-t border-slate-800/50">
            <h2 className="text-3xl font-bold text-slate-200 mb-12 text-center lg:text-left">Security Briefings & Dev Tips</h2>
            <div className="grid grid-cols-1 gap-8">
                <Link href="/blog/how-to-safely-share-env-files" className="group block">
                    <div className="p-8 bg-slate-900/30 border border-slate-800 rounded-2xl hover:border-amber-500/30 transition-all">
                        <div className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">Security Best Practices</div>
                        <h3 className="text-2xl font-bold text-slate-200 group-hover:text-amber-400 transition-colors mb-4">
                            How to Safely Share .env Files: A Guide to Local Secret Masking
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            AWS keys, database passwords, and API tokens are the keys to your kingdom. Learn why sharing plain-text environment files is a catastrophe waiting to happen.
                        </p>
                        <div className="text-amber-500 font-bold text-sm flex items-center gap-2">
                            Read Security Guide <ShieldCheck size={16} />
                        </div>
                    </div>
                </Link>

                <Link href="/blog/stop-pasting-sensitive-json-online" className="group block">
                    <div className="p-8 bg-slate-900/30 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all">
                        <div className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-4">Privacy & Security</div>
                        <h3 className="text-2xl font-bold text-slate-200 group-hover:text-emerald-400 transition-colors mb-4">
                            Stop Pasting Sensitive JSON Online: How to Format API Logs Locally Without Exposing Customer Data
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            We&apos;ve all been there. You&apos;re debugging a production API issue at 2 AM. The logs are spewing malformed JSON across your terminal, and you just need to make sense of it—fast.
                        </p>
                        <div className="text-emerald-500 font-bold text-sm flex items-center gap-2">
                            Read Full Report <TerminalSquare size={16} />
                        </div>
                    </div>
                </Link>
            </div>
            
            <div className="text-center mt-12">
                <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 font-bold uppercase text-xs tracking-widest transition-colors">
                    View All Articles <ArrowRight size={14} />
                </Link>
            </div>
        </div>

                {/* Footer and Compliance */}
                <footer className="mt-24 pt-12 border-t border-slate-900 pb-24 text-center">
                    <div className="flex justify-center flex-wrap gap-8 md:gap-12 mb-12">
                        <Link href="/about" className="text-slate-500 hover:text-emerald-400 font-bold uppercase text-xs tracking-widest transition-colors">About</Link>
                        <Link href="/case-studies" className="text-slate-500 hover:text-emerald-400 font-bold uppercase text-xs tracking-widest transition-colors">Case Studies</Link>
                        <Link href="/glossary" className="text-slate-500 hover:text-emerald-400 font-bold uppercase text-xs tracking-widest transition-colors">Glossary</Link>
                        <Link href="/faq" className="text-slate-500 hover:text-emerald-400 font-bold uppercase text-xs tracking-widest transition-colors">FAQ</Link>
                        <Link href="/privacy" className="text-slate-500 hover:text-emerald-400 font-bold uppercase text-xs tracking-widest transition-colors">Privacy Policy</Link>
                        <Link href="/contact" className="text-slate-500 hover:text-emerald-400 font-bold uppercase text-xs tracking-widest transition-colors">Contact</Link>
                    </div>
            <div className="text-slate-700 text-[10px] font-mono uppercase tracking-[0.2em] mb-4">
                OpSecForge v1.7.0 • Built for the Global Dev Community • 2026
            </div>
            <div className="flex justify-center gap-4 text-slate-800 text-[8px] font-mono tracking-widest">
                <span>EST. 2026.03.10</span>
                <span>•</span>
                <span>100% CLIENT-SIDE</span>
                <span>•</span>
                <span>ZERO-LOG POLICY</span>
            </div>
        </footer>

      </div>
    </main>
  );
}
