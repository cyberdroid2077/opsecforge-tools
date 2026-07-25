'use client';

import { BookOpen, ShieldCheck, Wrench } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const isBlogRoute = pathname === '/blog' || pathname.startsWith('/blog/');
  const isToolsRoute = pathname === '/tools' || pathname.startsWith('/tools/');

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 sm:gap-4">
        <Link
          href="/"
          aria-label="OpSecForge home"
          className="group mr-auto flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 transition-colors group-hover:border-emerald-500/40">
            <ShieldCheck className="text-emerald-500" size={20} />
          </span>
          <span className="font-bold tracking-tight text-slate-100">OpSecForge</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/tools"
            aria-current={isToolsRoute ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:px-3 ${
              isToolsRoute
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <Wrench aria-hidden="true" size={16} />
            Tools
          </Link>
          <Link
            href="/blog"
            aria-current={isBlogRoute ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:px-3 ${
              isBlogRoute
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <BookOpen aria-hidden="true" size={16} />
            Blog
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
