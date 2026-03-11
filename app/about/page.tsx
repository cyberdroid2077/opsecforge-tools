import React from 'react';
import { Shield, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <h1 className="text-4xl font-bold text-slate-100 mb-8">About OpSecForge</h1>
        <div className="prose prose-invert prose-slate lg:prose-lg max-w-none">
          <p className="text-xl text-slate-400">
            OpSecForge is a collection of privacy-first, developer-centric security tools built to run 100% locally in your browser.
          </p>
          <h2 className="text-slate-100">Our Mission</h2>
          <p>
            In an era where "online formatters" are often front-ends for data harvesting, we believe developers deserve tools they can trust. OpSecForge tools never send your data to a server. What you paste here, stays here.
          </p>
          <h2 className="text-slate-100">Transparency</h2>
          <p>
            We use modern web technologies (Next.js, Tailwind, WebAssembly) to provide high-performance tools without the security overhead of traditional server-side processing. You can verify our local-only commitment by simply disconnecting from the internet—every core tool will continue to work.
          </p>
          <div className="mt-12 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center gap-6">
            <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500">
              <Shield size={32} />
            </div>
            <div>
              <h3 className="text-slate-100 m-0">Zero Knowledge Architecture</h3>
              <p className="text-sm text-slate-400 mt-2 m-0">No databases. No logging. No cloud storage. Pure client-side execution.</p>
            </div>
          </div>
        </div>
        <footer className="mt-24 pt-8 border-t border-slate-900 text-slate-600 text-sm">
          &copy; 2026 OpSecForge. Created for the global developer community.
        </footer>
      </div>
    </main>
  );
}
