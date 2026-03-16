'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, TerminalSquare, Code, FileCode, Webhook, Home, Hash, UploadCloud, Database, Clock3, KeyRound, Pilcrow, Link2, CaseSensitive, Sigma, QrCode, Fingerprint, Palette, FileText, GitCompareArrows, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftScroll(scrollLeft > 8);
      setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 8);
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [pathname]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;

    if (container) {
      const scrollAmount = Math.max(container.clientWidth * 0.75, 160);
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 py-3 md:h-16 md:py-0 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <Link href="/" className="flex items-center gap-2 group shrink-0 pr-4">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all"><ShieldCheck className="text-emerald-500" size={20} /></div>
          <span className="font-bold text-slate-100 tracking-tight">OpSecForge</span>
        </Link>

        <div className="flex items-center w-full md:flex-1 min-w-0 relative">
          {showLeftScroll && (
            <button
              type="button"
              aria-label="Scroll navigation left"
              onClick={() => scroll('left')}
              className="absolute left-0 z-10 flex h-full items-center justify-center bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent pl-0 pr-6 text-slate-400 transition-colors hover:text-emerald-400"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex w-full items-center gap-1 overflow-x-auto px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href} className={`flex shrink-0 items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${pathname === tool.href ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}>
                {tool.icon}
                {tool.name}
              </Link>
            ))}
          </div>

          {showRightScroll && (
            <button
              type="button"
              aria-label="Scroll navigation right"
              onClick={() => scroll('right')}
              className="absolute right-0 z-10 flex h-full items-center justify-center bg-gradient-to-l from-slate-950 via-slate-950/90 to-transparent pl-6 pr-0 text-slate-400 transition-colors hover:text-emerald-400"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0 pl-0 md:pl-4 md:border-l border-slate-800/50 md:ml-2 self-end md:self-auto">
          <Link href="/blog" className="text-xs font-bold text-slate-400 hover:text-emerald-400 uppercase tracking-widest px-3 py-2 transition-colors">Blog</Link>
          <Link href="/" className="md:hidden p-2 text-slate-400 hover:text-slate-100 transition-colors"><Home size={20} /></Link>
        </div>
      </div>
    </nav>
  );
}
