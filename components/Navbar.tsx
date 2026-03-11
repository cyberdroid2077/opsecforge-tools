'use client';

import React from 'react';
import { ShieldCheck, ChevronDown, TerminalSquare, Code, FileCode, Webhook, Home, Hash, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tools = [
  { id: 'jwt-decoder', name: 'JWT Decoder', icon: <TerminalSquare size={16} />, href: '/tools/jwt-decoder' },
  { id: 'json-formatter', name: 'JSON Formatter', icon: <Code size={16} />, href: '/tools/json-formatter' },
  { id: 'env-sanitizer', name: '.env Sanitizer', icon: <FileCode size={16} />, href: '/tools/env-sanitizer' },
  { id: 'uuid-generator', name: 'ID Gen', icon: <Hash size={16} />, href: '/tools/uuid-generator' },
  { id: 'base64-converter', name: 'Base64', icon: <UploadCloud size={16} />, href: '/tools/base64-converter' },
  { id: 'webhook-debugger', name: 'Webhook', icon: <Webhook size={16} />, href: '/tools/webhook-debugger' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
              <ShieldCheck className="text-emerald-500" size={20} />
            </div>
            <span className="font-bold text-slate-100 tracking-tight">OpSecForge</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {tools.map((tool) => (
              <Link 
                key={tool.id} 
                href={tool.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  pathname === tool.href 
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                {tool.icon}
                {tool.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/blog" 
            className="text-xs font-bold text-slate-400 hover:text-slate-100 uppercase tracking-widest px-3 py-2 transition-colors"
          >
            Blog
          </Link>
          <Link 
            href="/" 
            className="md:hidden p-2 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <Home size={20} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
