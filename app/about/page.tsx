import React from 'react';
import type { Metadata } from 'next';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About OpsecForge',
  description: 'Who runs OpsecForge, how AI is involved, and how the site builds browser-local developer utilities and describes their privacy boundaries.',
  alternates: { canonical: '/about' },
};

const linkClass = 'text-emerald-400 underline underline-offset-4 hover:text-emerald-300';

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <h1 className="text-4xl font-bold text-slate-100 mb-8">About OpsecForge</h1>
        <div className="prose prose-invert prose-slate lg:prose-lg max-w-none">
          <h2 className="text-slate-100">What this site is</h2>
          <p className="text-xl text-slate-400">
            OpsecForge offers free developer utilities whose core input processing runs in the browser, plus guides that cite primary sources.
          </p>
          <p>
            Tool inputs are not sent to OpsecForge&apos;s backend or analytics. The site does use aggregate page-view analytics and may load advertising resources; those services are separate from tool-input processing.
          </p>
          <p>
            Each tool states its purpose and limitations. Generated, decoded, formatted, or redacted output still requires review before it is used in a security-sensitive workflow.
          </p>

          <h2 className="text-slate-100">Who runs it, and how AI is involved</h2>
          <p>
            OpsecForge is maintained by an independent operator who does not publish a personal identity. There is no team behind the site. Drafting, coding and publishing are carried out by AI systems under the operator&apos;s authorization and a written charter, and articles are checked against primary sources and automated rules before and after publication. The <Link className={linkClass} href="/editorial-policy">editorial policy</Link> describes this process, its limits, and what it does and does not guarantee. Errors and removed content are recorded on the <Link className={linkClass} href="/corrections">corrections page</Link>.
          </p>

          <h2 className="text-slate-100">Things you can check</h2>
          <ul>
            <li>Source code, MIT license: <a className={linkClass} href="https://github.com/cyberdroid2077/opsecforge-tools" rel="noopener noreferrer">GitHub repository</a>. Inspectable code is only one part of a security review.</li>
            <li>npm package <a className={linkClass} href="https://www.npmjs.com/package/opsecforge-mcp" rel="noopener noreferrer"><code>opsecforge-mcp</code></a>, a local MCP server for coding agents.</li>
            <li>The server&apos;s entry in the <a className={linkClass} href="https://registry.modelcontextprotocol.io/v0/servers/io.github.cyberdroid2077%2Fopsecforge/versions/latest" rel="noopener noreferrer">official MCP Registry</a>.</li>
            <li>What those tools do, with install steps and limits: <Link className={linkClass} href="/agents">/agents</Link>.</li>
          </ul>

          <h2 className="text-slate-100">Transparency</h2>
          <p>
            The site is built with Next.js and browser APIs. After a page has loaded, its core transformation can be inspected in developer tools and tested without sending the pasted value to OpsecForge.
          </p>
          <p>
            Security articles in the public index carry a &quot;Sources reviewed&quot; date and, where applicable, a primary source. Older material that did not meet that standard has been removed or merged; see <Link className={linkClass} href="/corrections">corrections</Link>.
          </p>

          <h2 className="text-slate-100">Contact</h2>
          <p>
            Product questions, corrections and security reports go to <a className={linkClass} href="mailto:admin@opsecforge.com">admin@opsecforge.com</a>. The <Link className={linkClass} href="/contact">contact page</Link> explains what to send and what not to send, and how to report a vulnerability.
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
