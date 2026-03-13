import React from 'react';
import { Mail, Globe, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <h1 className="text-4xl font-bold text-slate-100 mb-8 tracking-tight">Contact Us</h1>
        <div className="prose prose-invert prose-slate lg:prose-lg max-w-none">
          <p className="text-xl text-slate-400 mb-12">
            Have a question, feedback, or need a specific security tool? We&apos;d love to hear from you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-16">
            <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-6">
                <Mail size={32} />
              </div>
              <h3 className="text-slate-100 m-0">Email Support</h3>
              <p className="text-sm text-slate-400 mt-2 mb-6">Reach out to our engineering team directly.</p>
              <a href="mailto:admin@opsecforge.com" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">admin@opsecforge.com</a>
            </div>
            <div className="p-8 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col items-center text-center opacity-60">
              <div className="p-4 bg-slate-800/50 rounded-full text-slate-500 mb-6">
                <Globe size={32} />
              </div>
              <h3 className="text-slate-500 m-0">Global HQ</h3>
              <p className="text-sm text-slate-600 mt-2 mb-6 tracking-tight">Virtual-first architecture for the global dev community.</p>
              <span className="text-slate-700 font-bold text-xs uppercase tracking-widest">Distributed Globally</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-12 text-center">
            For security vulnerability reports, please include &quot;Vulnerability Disclosure&quot; in the email subject for prioritized handling.
          </p>
        </div>
      </div>
    </main>
  );
}
