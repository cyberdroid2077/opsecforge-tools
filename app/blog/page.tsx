import React from 'react';
import { BookOpen, Terminal, ShieldCheck, ArrowRight, Clock, Brain, Globe2 } from 'lucide-react';
import Link from 'next/link';

const posts = [
  {
    id: 'global-privacy-compliance-guide-2026',
    title: 'The 2026 Global Privacy Compliance Guide: Navigating Data Sovereignty',
    excerpt: 'Regulatory landscapes have reached a tipping point. Learn why local-only developer tools are now a mandate for global compliance.',
    category: 'Compliance',
    date: 'March 11, 2026',
    readTime: '12 min',
    icon: <Globe2 className="text-blue-400" size={24} />
  },
  {
    id: 'ai-opsec-checklist-how-to-use-llms-safely',
    title: "The AI OpSec Checklist: How to Use LLMs Without Leaking Your Company's Secret Sauce",
    excerpt: "The clipboard is the new security perimeter. Learn how to harness AI's power without sacrificing your proprietary code or infrastructure secrets.",
    category: 'AI Safety',
    date: 'March 11, 2026',
    readTime: '15 min',
    icon: <Brain className="text-blue-500" size={24} />
  },
  {
    id: 'how-to-safely-share-env-files',
    title: 'How to Safely Share .env Files: A Guide to Local Secret Masking',
    excerpt: 'AWS keys, database passwords, and API tokens are the keys to your kingdom. Learn why sharing plain-text environment files is a catastrophe waiting to happen.',
    category: 'Security',
    date: 'March 11, 2026',
    readTime: '10 min',
    icon: <ShieldCheck className="text-amber-500" size={24} />
  },
  {
    id: 'stop-pasting-sensitive-json-online',
    title: 'Stop Pasting Sensitive JSON Online: How to Format API Logs Locally',
    excerpt: "We've all been there. Debugging a production API issue at 2 AM. Don't let convenience compromise your security with online formatters.",
    category: 'Privacy',
    date: 'March 10, 2026',
    readTime: '8 min',
    icon: <Terminal className="text-emerald-500" size={24} />
  }
];

export default function BlogIndex() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="z-10 w-full max-w-5xl">
        
        {/* Header */}
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
            Deep dives into modern opsec, privacy-first developer workflows, and technical guides for the security-conscious engineer.
          </p>
        </header>

        {/* Blog Feed */}
        <div className="grid grid-cols-1 gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`} className="group">
              <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-slate-600 transition-all hover:bg-slate-900/60 relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-emerald-500/30 transition-colors">
                    {post.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={12} /> {post.readTime}
                      </div>
                      <span className="text-xs text-slate-600">{post.date}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-4">
                      {post.title}
                    </h2>
                    <p className="text-slate-400 leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                    <div className="inline-flex items-center gap-2 text-emerald-500 font-bold text-sm">
                      Read Article <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-32 pt-12 border-t border-slate-900 text-center text-slate-600 text-xs tracking-widest uppercase">
          &copy; 2026 OpSecForge Engineering • Distributed Globally
        </footer>
      </div>
    </main>
  );
}
