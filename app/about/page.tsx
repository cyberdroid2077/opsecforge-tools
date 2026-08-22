import React from 'react';
import type { Metadata } from 'next';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About OpsecForge',
  description: 'How OpsecForge builds browser-local developer utilities and describes their privacy boundaries.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <h1 className="text-4xl font-bold text-slate-100 mb-8">About OpSecForge</h1>
        <div className="prose prose-invert prose-slate lg:prose-lg max-w-none">
          <h2 className="text-slate-100">Our Mission</h2>
          <p className="text-xl text-slate-400">
            OpsecForge builds practical developer utilities whose core input processing runs in the browser.
          </p>
          <p>
            Tool inputs are not sent to OpsecForge&apos;s backend or analytics. The site does use aggregate page-view analytics and may load advertising resources; those services are separate from tool-input processing.
          </p>
          <p>
            The public repository makes the implementation inspectable. OpsecForge does not claim a license that the repository has not granted, and inspectable code is only one part of a security review.
          </p>
          <p>
            Each tool states its purpose and limitations. Generated, decoded, formatted, or redacted output still requires review before it is used in a security-sensitive workflow.
          </p>
          <h2 className="text-slate-100">Transparency</h2>
          <p>
            The site is built with Next.js and browser APIs. After a page has loaded, its core transformation can be inspected in developer tools and tested without sending the pasted value to OpsecForge.
          </p>
          <p>
            Security articles that remain in the public index include an explicit review date and, where applicable, a primary authoritative source. Older material that has not completed that review is excluded from the blog index and sitemap until it is corrected or retired.
          </p>
          <p>
            Product questions, corrections, and responsible security reports can be sent to <a href="mailto:admin@opsecforge.com">admin@opsecforge.com</a>. OpsecForge does not present anonymous marketing claims as user counts, customer results, or incident facts.
          </p>
          <div className="mt-12 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center gap-6">
            <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500">
              <Shield size={32} />
            </div>
            <div>
              <h3 className="text-slate-100 m-0">Browser-local input processing</h3>
              <p className="text-sm text-slate-400 mt-2 m-0">Tool inputs stay in the loaded page. Aggregate page analytics do not include those inputs.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
