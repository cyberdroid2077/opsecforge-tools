import React from 'react';
import type { Metadata } from 'next';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact OpsecForge',
  description: 'Contact OpsecForge for product feedback, support, or responsible security reports.',
  alternates: { canonical: '/contact' },
};

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
            Send product feedback, factual corrections, support questions, or responsible security reports to the address below. Do not include live credentials or sensitive tool input.
          </p>
          <div className="my-16">
            <div className="mx-auto max-w-xl p-8 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-6">
                <Mail size={32} />
              </div>
              <h3 className="text-slate-100 m-0">Email Support</h3>
              <p className="text-sm text-slate-400 mt-2 mb-6">OpsecForge product operations reviews this mailbox.</p>
              <a href="mailto:admin@opsecforge.com" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">admin@opsecforge.com</a>
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
