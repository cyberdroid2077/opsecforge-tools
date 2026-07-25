import type { Metadata } from 'next';
import { ArrowLeft, ChevronRight, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'OpsecForge FAQ',
  description: 'Answers about browser-local tool inputs, analytics boundaries, offline behavior, and tool limitations.',
  alternates: { canonical: '/faq' },
};

const faqs = [
  {
    section: 'Data privacy and local processing',
    items: [
      {
        q: 'Does OpsecForge receive the text I paste into a tool?',
        a: 'Core tool inputs are processed in the loaded page and are not sent to OpsecForge analytics or a tool-processing backend. The site does use aggregate page-view analytics and may load advertising resources.',
      },
      {
        q: 'Can I inspect the implementation?',
        a: 'Yes. The public repository and browser developer tools let you inspect the implementation and network activity. Review the exact tool you plan to use; public source is evidence, not a substitute for your own security assessment.',
      },
      {
        q: 'Can I use a loaded tool while disconnected?',
        a: 'Core transformations are designed to run in the browser after the required page assets have loaded. Advertising, analytics, navigation, fonts, or a fresh page load may still require network access, so OpsecForge does not claim complete offline availability for the whole site.',
      },
    ],
  },
  {
    section: 'Assurance and compliance',
    items: [
      {
        q: 'Does browser-local processing make a workflow compliant?',
        a: 'No. It reduces one data-transfer path, but compliance depends on your organization, data, jurisdiction, controls, retention, vendors, and documented procedures. OpsecForge does not claim GDPR, ISO 27001, or SOC 2 certification.',
      },
      {
        q: 'What should I review before using a tool for sensitive work?',
        a: 'Check the tool limitations, inspect network activity, use synthetic data first, and follow your organization’s approved software and data-handling policies. Do not paste a production secret merely to test whether a redactor detects it.',
      },
    ],
  },
  {
    section: 'Tool limitations',
    items: [
      {
        q: 'Does decoding a JWT prove that it is valid?',
        a: 'No. Decoding only reveals the token structure. Validity depends on cryptographic verification, the expected issuer and audience, relevant time claims, key selection, and application policy.',
      },
      {
        q: 'Does Env Sanitizer make a file safe to share?',
        a: 'No automated redactor can prove that. Env Sanitizer heuristically masks common patterns and may miss unusual secrets or flag benign text. Review every line of the result and prefer synthetic placeholders.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-slate-950 p-6 text-slate-300 lg:p-24">
      <div className="w-full max-w-4xl">
        <Link href="/" className="mb-12 inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-emerald-400">
          <ArrowLeft size={16} /> Back to Hub
        </Link>

        <header className="mb-16">
          <div className="mb-4 flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-500">
              <HelpCircle size={32} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-100">OpsecForge FAQ</h1>
          </div>
          <p className="max-w-2xl text-xl leading-relaxed text-slate-400">
            Verifiable boundaries for local processing, analytics, assurance, and tool output.
          </p>
        </header>

        <div className="space-y-16">
          {faqs.map((section) => (
            <section key={section.section}>
              <h2 className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-500">
                <span className="h-px w-8 bg-emerald-500/30" /> {section.section}
              </h2>
              <div className="grid gap-6">
                {section.items.map((item) => (
                  <div key={item.q} className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
                    <h3 className="mb-4 flex gap-3 text-lg font-bold text-slate-100">
                      <ChevronRight className="mt-1 shrink-0 text-emerald-500" size={18} />
                      {item.q}
                    </h3>
                    <p className="pl-7 leading-relaxed text-slate-400">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-24 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-12 text-center">
          <h2 className="mb-4 text-xl font-bold text-slate-100">Still have questions?</h2>
          <p className="mb-8 text-slate-400">Send the exact tool and boundary you want clarified.</p>
          <Link href="/contact" className="inline-flex rounded-full bg-emerald-600 px-8 py-3 font-bold text-white transition-colors hover:bg-emerald-500">
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}
