import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function BlogPost() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans">
      <div className="z-10 w-full max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors mb-12 text-sm font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Back to Blog
        </Link>
        
        <article>
          <header className="mb-12 pb-8 border-b border-slate-800">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-100 mb-6 tracking-tight">How to Sanitize .env Files Before Sharing: A Developer's Guide</h1>
            <div className="flex items-center gap-6 text-slate-500 text-sm">
              <span className="flex items-center gap-2"><Calendar size={16} /> March 27, 2026</span>
              <span className="flex items-center gap-2"><Clock size={16} /> 6 min read</span>
            </div>
          </header>
          
          <div className="prose prose-invert prose-emerald max-w-none" dangerouslySetInnerHTML={{ __html: `<p class="mb-6 text-slate-400 leading-relaxed">.env files are the standard way to manage environment-specific configuration in modern applications. They store database credentials, API keys, payment gateway secrets, and other sensitive infrastructure details. Sharing these files — whether in a GitHub issue, a Stack Overflow question, a Slack message to a colleague, or a screenshot in a design handoff — is incredibly common. And incredibly dangerous.</p>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">The Hidden Danger of .env Sharing</h2>
<p class="mb-6 text-slate-400 leading-relaxed">When a developer pastes their .env file into a chat message asking for help, or shares a screenshot of their configuration in a bug report, they often don't realize the magnitude of what they've exposed. A typical .env file might contain:</p>
<ul class="mb-6 text-slate-400 leading-relaxed list-disc list-inside space-y-1">
<li>Database credentials (username, password, host, port)</li>
<li>Payment processor API keys (Stripe, PayPal)</li>
<li>Cloud provider credentials (AWS, Google Cloud, Azure)</li>
<li>Third-party service tokens (SendGrid, Twilio, Mapbox)</li>
<li>Session secrets and JWT signing keys</li>
<li>Encryption keys for at-rest data</li>
</ul>
<p class="mb-6 text-slate-400 leading-relaxed">If any of these credentials are production credentials, a malicious actor who sees them could immediately access your infrastructure, drain your payment processor balance, or pivot from your cloud account to your internal network. The 2024 Twilio breach and numerous similar incidents started with exposed credentials — often inadvertently shared by developers.</p>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">What Is .env Sanitization?</h2>
<p class="mb-6 text-slate-400 leading-relaxed">Env sanitization is the process of automatically detecting and redacting sensitive values in a .env file before sharing. Instead of manually finding and replacing each secret (and risking missing one), a sanitizer scans the file against known patterns for common credential formats and replaces the actual secret values with placeholder characters while preserving the variable names and structure.</p>
<p class="mb-6 text-slate-400 leading-relaxed">For example, a .env file containing <code>STRIPE_SECRET_KEY=sk_live_abc123xyz789</code> would become <code>STRIPE_SECRET_KEY=****************</code> after sanitization — safe to share, while still showing the variable name for context.</p>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">What Patterns Does the Env Sanitizer Detect?</h2>
<p class="mb-6 text-slate-400 leading-relaxed">The OpsecForge Env Sanitizer detects a wide range of commonly used credential patterns:</p>
<ul class="mb-6 text-slate-400 leading-relaxed list-disc list-inside space-y-2">
<li><strong>Stripe API Keys:</strong> Detects both <code>sk_live_</code> and <code>sk_test_</code> Stripe secret keys</li>
<li><strong>AWS Access Keys:</strong> Identifies AWS access key IDs starting with <code>AKIA</code></li>
<li><strong>AWS Secret Keys:</strong> Detects the 40-character Base64 AWS secret access keys</li>
<li><strong>GitHub Tokens:</strong> Recognizes <code>ghp_</code>, <code>gho_</code>, <code>ghu_</code>, and <code>ghs_</code> prefixed tokens</li>
<li><strong>Database URLs:</strong> Catches connection strings containing embedded credentials (<code>postgresql://user:password@host</code>)</li>
<li><strong>Generic Secrets:</strong> Flags any variable ending in <code>_PASSWORD</code>, <code>_SECRET</code>, or <code>_KEY</code></li>
</ul>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">How to Use the OpsecForge Env Sanitizer</h2>
<ol class="mb-6 text-slate-400 leading-relaxed list-decimal list-inside space-y-2">
<li>Paste your raw .env file content into the input field on the Env Sanitizer page</li>
<li>The sanitizer instantly scans for known credential patterns</li>
<li>Detected secrets are shown as redacted badges above the output field</li>
<li>The sanitized output appears in the right panel, with all secrets replaced by asterisks</li>
<li>Copy the sanitized version and share it safely in your bug report, question, or message</li>
</ol>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">Use Cases: When to Sanitize</h2>
<p class="mb-6 text-slate-400 leading-relaxed"><strong>Bug reports:</strong> When asking for help with a configuration issue, always share a sanitized .env (never the real credentials). Show the variable names and structure without exposing the actual values.</p>
<p class="mb-6 text-slate-400 leading-relaxed"><strong>Code reviews:</strong> If you're sharing a code snippet that references environment variables, include the variable names in your sanitized .env for context.</p>
<p class="mb-6 text-slate-400 leading-relaxed"><strong>Onboarding documentation:</strong> When creating a setup guide for new developers, use a sanitized template .env file showing all required variables with placeholder values.</p>
<p class="mb-6 text-slate-400 leading-relaxed"><strong>Design handoffs:</strong> If a designer or non-technical stakeholder needs to see your configuration structure, give them the sanitized version.</p>

<h2 class="text-2xl font-bold mt-8 mb-4 text-slate-100">Best Practices for .env Security</h2>
<ul class="mb-6 text-slate-400 leading-relaxed list-disc list-inside space-y-2">
<li>Never commit .env files to version control — add them to .gitignore</li>
<li>Use different credentials for development, staging, and production</li>
<li>Rotate API keys and secrets periodically (quarterly for high-value credentials)</li>
<li>Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler) for production applications</li>
<li>Never share production credentials, even in private channels, without a clear security context</li>
<li>Use the Env Sanitizer before any .env file sharing — make it a habit</li>
</ul>

<p class="mb-6 text-slate-400 leading-relaxed">The OpsecForge Env Sanitizer runs 100% in your browser. Your .env file never touches any server. Detect Stripe keys, AWS credentials, GitHub tokens, and more — then share safely.</p>` }} />
        </article>
      </div>
    </main>
  );
}
