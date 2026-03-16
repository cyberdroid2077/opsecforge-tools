import React from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="z-10 w-full max-w-5xl">
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Blog</span>
        </div>

        <header className="mb-16">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6">
            Security Briefings
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg mb-8 leading-relaxed">
            Markdown-backed articles for security tooling, privacy-first workflows, and practical engineering guides.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
              <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-slate-600 transition-all hover:bg-slate-900/60 relative overflow-hidden">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                    <CalendarDays size={14} />
                    <span>{post.date}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-4">
                    {post.title}
                  </h2>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    {post.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-emerald-500 font-bold text-sm">
                    Read Article <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <footer className="mt-32 pt-12 border-t border-slate-900 text-center text-slate-600 text-xs tracking-widest uppercase">
          &copy; 2026 OpSecForge Engineering • Distributed Globally
        </footer>
      </div>
    </main>
  );
}
