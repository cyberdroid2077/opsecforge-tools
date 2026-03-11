"use client";

import React from 'react';
import { ShieldCheck, TerminalSquare, Code, Hash, Lock } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const tools = [
    {
      id: 'jwt-decoder',
      name: 'JWT Decoder',
      description: 'Decode and inspect JSON Web Tokens 100% locally. Zero server uploads. Smart timestamp conversion.',
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
      id: 'hash-generator',
      name: 'Secure Hash Generator',
      description: 'Generate Bcrypt, SHA-256, and MD5 hashes locally without logging your plaintext passwords.',
      icon: <Hash className="text-purple-500" size={32} />,
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
              A suite of zero-trust, 100% client-side tools for developers handling sensitive data. <br/>
              <strong>Your payloads never touch our servers. Period.</strong>
            </p>
          </div>
        </div>
        
        {/* Tool Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {tools.map((tool) => (
            <Link href={tool.status === 'Live' ? `/tools/${tool.id}` : '#'} key={tool.id} className={\`block group \${tool.status !== 'Live' && 'cursor-not-allowed opacity-60'}\`}>
              <div className="h-full flex flex-col p-6 bg-slate-900/80 border border-slate-800 rounded-2xl hover:bg-slate-800/80 hover:border-slate-600 transition-all shadow-lg hover:shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                    {tool.icon}
                  </div>
                  <span className={\`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full \${tool.status === 'Live' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}\`}>
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

      </div>
    </main>
  );
}