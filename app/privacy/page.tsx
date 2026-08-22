import React from 'react';
import type { Metadata } from 'next';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'OpsecForge privacy policy and browser-local tool-input processing statement.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <h1 className="text-4xl font-bold text-slate-100 mb-12">Privacy Policy</h1>
        <div className="prose prose-invert prose-slate lg:prose-lg max-w-none">
          <p className="text-xl text-slate-400 mb-8">
            This policy describes how tool inputs, aggregate analytics, and site resources are handled.
          </p>
          <h2 className="text-slate-100">Tool-input processing</h2>
          <p>
            Core transformations for OpsecForge&apos;s sanitizers, formatters, encoders, decoders, and generators run in the loaded browser page unless a tool explicitly states otherwise.
          </p>
          <ul className="space-y-4 my-8">
            <li className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <span><strong>Local execution:</strong> Tool input is processed in browser memory and is not submitted to an OpsecForge processing API.</span>
            </li>
            <li className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <span><strong>No tool-input database:</strong> OpsecForge does not store user-pasted tool content in a backend database.</span>
            </li>
            <li className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <span><strong>No input-level analytics:</strong> Tool input and generated output are not included in analytics events.</span>
            </li>
          </ul>
          <h2 className="text-slate-100">Analytics and advertising</h2>
          <p>
            OpsecForge uses Vercel Analytics for aggregate page-view measurement. Those events do not include tool input or output. At the time of this update, OpsecForge does not serve advertisements or load the AdSense ad-serving script. The public ads.txt file and publisher meta tag are ownership-verification signals; they do not by themselves display ads. This policy will be reviewed before advertising is enabled.
          </p>
          <h2 className="text-slate-100">Contact</h2>
          <p>
            For questions about our privacy commitment, please contact us at <a href="mailto:admin@opsecforge.com" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">admin@opsecforge.com</a>.
          </p>
        </div>
        <div className="mt-24 pt-8 border-t border-slate-900 text-slate-600 text-sm">
          Last Updated: August 21, 2026.
        </div>
      </div>
    </main>
  );
}
