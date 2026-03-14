'use client';

import React from 'react';
import { ShieldCheck, TerminalSquare, Code, FileCode, Webhook, Home, Hash, UploadCloud, Database, Clock3, KeyRound, Pilcrow, Link2, CaseSensitive, Sigma, QrCode, Fingerprint, Palette, FileText, GitCompareArrows } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tools = [
  { name: 'JWT', icon: <TerminalSquare size={16} />, href: '/tools/jwt-decoder' },
  { name: 'JSON', icon: <Code size={16} />, href: '/tools/json-beautifier' },
  { name: '.env', icon: <FileCode size={16} />, href: '/tools/env-sanitizer' },
  { name: 'UUID', icon: <Hash size={16} />, href: '/tools/uuid-generator' },
  { name: 'Base64', icon: <UploadCloud size={16} />, href: '/tools/base64-converter' },
  { name: 'Password', icon: <KeyRound size={16} />, href: '/tools/password-generator' },
  { name: 'Lorem', icon: <Pilcrow size={16} />, href: '/tools/lorem-ipsum' },
  { name: 'URL', icon: <Link2 size={16} />, href: '/tools/url-encoder' },
  { name: 'Text Case', icon: <CaseSensitive size={16} />, href: '/tools/text-case' },
  { name: 'Counter', icon: <Sigma size={16} />, href: '/tools/word-counter' },
  { name: 'QR', icon: <QrCode size={16} />, href: '/tools/qr-generator' },
  { name: 'SHA', icon: <Fingerprint size={16} />, href: '/tools/sha256-hash' },
  { name: 'Color', icon: <Palette size={16} />, href: '/tools/hex-rgb-converter' },
  { name: 'Markdown', icon: <FileText size={16} />, href: '/tools/markdown-to-html' },
  { name: 'Diff', icon: <GitCompareArrows size={16} />, href: '/tools/text-diff' },
  { name: 'SQL', icon: <Database size={16} />, href: '/tools/sql-formatter' },
  { name: 'Unix', icon: <Clock3 size={16} />, href: '/tools/unix-timestamp' },
  { name: 'Webhook', icon: <Webhook size={16} />, href: '/tools/webhook-debugger' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all"><ShieldCheck className="text-emerald-500" size={20} /></div>
            <span className="font-bold text-slate-100 tracking-tight">OpSecForge</span>
          </Link>
          <div className="hidden md:flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href} className={`flex shrink-0 items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${pathname === tool.href ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}>
                {tool.icon}
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/blog" className="text-xs font-bold text-slate-400 hover:text-slate-100 uppercase tracking-widest px-3 py-2 transition-colors">Blog</Link>
          <Link href="/" className="md:hidden p-2 text-slate-400 hover:text-slate-100 transition-colors"><Home size={20} /></Link>
        </div>
      </div>
    </nav>
  );
}
