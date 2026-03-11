import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
            Your privacy is not just a policy here; it&apos;s our entire architecture.
          </p>
          <h2 className="text-slate-100">Zero Data Retention</h2>
          <p>
            OpSecForge is a suite of static, client-side tools. When you use any of our sanitizers, formatters, or decoders:
          </p>
          <ul className="space-y-4 my-8">
            <li className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <span><strong>Local Execution:</strong> Your data never leaves your browser. All processing is done locally in your machine&apos;s memory using client-side JavaScript.</span>
            </li>
            <li className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <span><strong>No Database:</strong> We do not have a backend database that stores user-pasted content.</span>
            </li>
            <li className="flex gap-4">
              <Shield className="text-emerald-500 shrink-0 mt-1" />
              <span><strong>No Logs:</strong> Our web servers do not log the content of your input or the results of the tool processing.</span>
            </li>
          </ul>
          <h2 className="text-slate-100">Analytics & Tracking</h2>
          <p>
            We may use minimal, privacy-respecting analytics (like Vercel Analytics) to track page visits and tool popularity, but we never track the specific data you input into our tools. We do not use third-party advertising cookies or cross-site tracking.
          </p>
          <h2 className="text-slate-100">Contact</h2>
          <p>
            For questions about our privacy commitment, please contact us at <a href="mailto:support@opsecforge.com" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">support@opsecforge.com</a>.
          </p>
        </div>
        <footer className="mt-24 pt-8 border-t border-slate-900 text-slate-600 text-sm">
          Last Updated: March 11, 2026.
        </footer>
      </div>
    </main>
  );
}
