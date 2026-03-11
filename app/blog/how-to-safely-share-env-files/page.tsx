import React from 'react';
import { ShieldCheck, Lock, ArrowRight, Key, Database, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function BlogPost() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      <div className="z-10 w-full max-w-4xl font-sans text-slate-300">
        
        {/* Breadcrumb */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-slate-300">Security Best Practices</span>
        </div>

        {/* Article Header */}
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold tracking-wider">GUIDE & BEST PRACTICES</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            How to Safely Share .env Files: <br/>
            <span className="text-slate-400 font-medium text-3xl">A Guide to Local Secret Masking</span>
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500 border-b border-slate-800 pb-8">
            <span className="font-mono">By OpSecForge Engineering</span>
            <span>•</span>
            <span>March 11, 2026</span>
            <span>•</span>
            <span>10 min read</span>
          </div>
        </header>

        {/* Article Body */}
        <article className="prose prose-invert prose-slate lg:prose-lg max-w-none prose-headings:text-slate-100 prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-strong:text-slate-200">
          
          <p className="lead text-xl text-slate-400 mb-8">
            Every developer has been there. You&apos;re troubleshooting a deployment issue, onboarding a new team member, or posting a question on Stack Overflow. Someone asks to see your environment configuration, and without thinking, you paste your <code>.env</code> file into a chat, email, or forum post.
          </p>
          
          <div className="bg-rose-500/10 border-l-4 border-rose-500 p-6 my-8 rounded-r-xl">
            <strong className="text-rose-400 text-lg block mb-2">Stop.</strong>
            That single action just exposed every secret your application depends on. AWS keys, database passwords, and API tokens are now public.
          </div>

          <h2 className="text-3xl mt-12 mb-6">The Hidden Dangers Lurking in Your .env File</h2>
          <p>
            Your <code>.env</code> file is a treasure trove of sensitive information. Take a typical configuration:
          </p>
          
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 my-6 font-mono text-sm overflow-x-auto text-emerald-300/80">
            <pre className="m-0">
{`AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
DATABASE_URL=postgresql://admin:password@localhost:5432/db
STRIPE_SECRET_KEY=STRIPE_SK_LIVE_PLACEHOLDER_FOR_SECURITY`}
            </pre>
          </div>

          <h3 className="text-2xl mt-10 mb-4 text-slate-200">The "Env Beautifier" Trap</h3>
          <p>
            When developers need to share environment configurations, they often turn to online &quot;env beautifier&quot; or &quot;env formatter&quot; tools. This is a <strong>catastrophic mistake</strong>. 
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <Key className="text-amber-400 mb-4" />
              <h4 className="m-0 text-slate-200">Server Logs</h4>
              <p className="text-sm text-slate-400 mt-2">Web servers typically log all requests. Your AWS keys may live in server logs for months.</p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <Database className="text-blue-400 mb-4" />
              <h4 className="m-0 text-slate-200">No Guarantees</h4>
              <p className="text-sm text-slate-400 mt-2">Most online tools are side projects with no security audits or data protection policies.</p>
            </div>
          </div>

          <h2 className="text-3xl mt-16 mb-6">The Safe Alternative: Local-Only Secret Masking</h2>
          <p>
            You need to share environment configurations without exposing sensitive values. The solution is <strong>local-only processing</strong>—tools that run entirely in your browser.
          </p>

          <h3 className="text-2xl mt-10 mb-4 text-slate-200">Introducing OpSecForge&apos;s .env Sanitizer</h3>
          <p>
            OpSecForge&apos;s <strong>.env Sanitizer</strong> is a purpose-built tool designed for one critical mission: safely preparing environment files for sharing without exposing a single secret.
          </p>

          <ul className="space-y-4 my-8">
            <li className="flex gap-3">
              <ShieldCheck className="text-emerald-500 shrink-0" />
              <div>
                <strong>100% Client-Side:</strong> Your <code>.env</code> content never leaves your machine. No servers receive your data.
              </div>
            </li>
            <li className="flex gap-3">
              <Terminal className="text-emerald-500 shrink-0" />
              <div>
                <strong>Intelligent Regex:</strong> Built-in patterns recognize and mask Stripe, AWS, GitHub, and Database credentials automatically.
              </div>
            </li>
          </ul>

          <div className="mt-16 p-10 bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl text-center shadow-[0_0_30px_rgba(16,185,129,0.05)]">
            <h3 className="text-2xl font-bold text-slate-100 mb-4 mt-0">Ready to Share Safely?</h3>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto font-sans">
              Stop gambling with your infrastructure keys. Use the tool that respects your privacy.
            </p>
            <Link 
              href="/tools/env-sanitizer" 
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-full font-bold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] no-underline"
            >
              Sanitize Your .env File Now <ArrowRight size={20} />
            </Link>
          </div>

        </article>
      </div>
    </main>
  );
}