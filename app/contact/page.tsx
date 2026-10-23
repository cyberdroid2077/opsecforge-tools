import React from 'react';
import type { Metadata } from 'next';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact OpsecForge',
  description: 'Contact OpsecForge for product feedback, corrections, support, or responsible security reports, and what to include or leave out.',
  alternates: { canonical: '/contact' },
};

const linkClass = 'text-emerald-400 underline underline-offset-4 hover:text-emerald-300';

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
            One mailbox handles product feedback, factual corrections, support questions and security reports.
          </p>
          <div className="my-12">
            <div className="mx-auto max-w-xl p-8 bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
              <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-500 mb-6">
                <Mail size={32} />
              </div>
              <h3 className="text-slate-100 m-0">Email</h3>
              <p className="text-sm text-slate-400 mt-2 mb-6">Read by the independent operator of OpsecForge, with AI assistance.</p>
              <a href="mailto:admin@opsecforge.com" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">admin@opsecforge.com</a>
            </div>
          </div>

          <h2 className="text-slate-100">What to send</h2>
          <ul>
            <li>A factual error in an article or a tool&apos;s behavior. Include the page URL and, if you can, the primary source that shows the correct answer. Confirmed errors are recorded on the <Link className={linkClass} href="/corrections">corrections page</Link>.</li>
            <li>A bug report: the tool, your browser, and the steps to reproduce it with <strong>synthetic</strong> input.</li>
            <li>Questions about the tools, the <Link className={linkClass} href="/agents">MCP server</Link> or the <Link className={linkClass} href="/editorial-policy">editorial policy</Link>.</li>
          </ul>

          <h2 className="text-slate-100">What not to send</h2>
          <ul>
            <li><strong>Real secrets.</strong> Do not include live passwords, API keys, tokens, private keys, signing secrets, or real customer or personal data in an email, even if the problem involves them. Replace them with invented values that have the same shape.</li>
            <li>Attachments you have not scrubbed, or logs with credentials in them.</li>
            <li>Requests for security audits, penetration tests, or advice about a specific production incident. OpsecForge cannot provide those.</li>
          </ul>

          <h2 className="text-slate-100">What to expect</h2>
          <p>
            There is no support staff and no guaranteed response time. Messages are read and answered as the operator&apos;s time allows; security reports are looked at before general feedback. Not every message will receive a reply.
          </p>

          <h2 id="vulnerability-disclosure" className="text-slate-100">Reporting a vulnerability</h2>
          <p>
            This applies to the OpsecForge website and to the code in the{' '}
            <a className={linkClass} href="https://github.com/cyberdroid2077/opsecforge-tools" rel="noopener noreferrer">public repository</a>, including the <code>opsecforge-mcp</code> package.
          </p>
          <ol>
            <li>Email <a className={linkClass} href="mailto:admin@opsecforge.com?subject=Vulnerability%20Disclosure">admin@opsecforge.com</a> with the subject <code>Vulnerability Disclosure</code>. Please do not open a public issue for something that could be exploited.</li>
            <li>Describe the affected URL or package version, the steps to reproduce, and the impact you believe it has. Use synthetic data in any proof of concept.</li>
            <li>Test only against your own browser or local copy of the code. Do not access other people&apos;s data, degrade the service, or run automated scanning that generates heavy traffic.</li>
            <li>Allow reasonable time to investigate and fix before you disclose publicly. Fixes to published content or tools are listed on the <Link className={linkClass} href="/corrections">corrections page</Link>.</li>
          </ol>
          <p>
            OpsecForge does not offer a paid bounty. A machine-readable version of this policy is at{' '}
            <a className={linkClass} href="/.well-known/security.txt">/.well-known/security.txt</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
