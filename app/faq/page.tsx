import React from 'react';
import { HelpCircle, ShieldCheck, Lock, Globe, Zap, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      section: "Data Privacy & Local Processing",
      items: [
        {
          q: "How does OpSecForge handle my sensitive data?",
          a: "OpSecForge operates on a Zero-Data-Retention (ZDR) architecture. Unlike traditional SaaS platforms that process data on remote servers, OpSecForge executes all logic locally within your browser. Your data never leaves your machine."
        },
        {
          q: "What is the role of WebAssembly (WASM) in your security model?",
          a: "We utilize WebAssembly (WASM) to run high-performance, sandboxed binaries directly in your browser. This allows us to provide complex cryptographic tools with near-native speed while ensuring the execution environment is strictly isolated from our servers."
        },
        {
          q: "Can I use OpSecForge offline?",
          a: "Yes. OpSecForge is designed with 100% offline capability. Once the initial application shell is loaded, you can disconnect from the internet entirely. All processing occurs locally using client-side resources."
        }
      ]
    },
    {
      section: "GDPR & Compliance",
      items: [
        {
          q: "Is OpSecForge GDPR compliant?",
          a: "OpSecForge is inherently compliant with GDPR by design. Since we do not collect, store, or process personal data (PII) on our infrastructure, the risks associated with data controllership are eliminated. This makes us the ideal choice for DPOs and compliance officers."
        },
        {
          q: "Does the platform meet Enterprise Security Standards?",
          a: "Yes. Our tools are built to align with ISO/IEC 27001 and SOC 2 Type II control frameworks regarding data minimization. By removing the 'Cloud' from the processing equation, we significantly reduce your organization's attack surface."
        }
      ]
    },
    {
      section: "Tool Usage & Security",
      items: [
        {
          q: "How safe is it to paste JWTs into your debugger?",
          a: "It is completely safe. Our JWT Debugger performs all decoding and signature verification locally. Your tokens, which often contain sensitive claims, are never transmitted over the wire."
        },
        {
          q: "Can I safely format .env files using OpSecForge?",
          a: "Yes. Our .env and secret management utilities are built to handle sensitive key-value pairs without risk. We recommend using our tools in an 'Air-Gapped' browser tab for maximum assurance."
        }
      ]
    }
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <HelpCircle size={32} />
            </div>
            <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Security & Compliance FAQ</h1>
          </div>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
            Everything you need to know about our local-first security model, privacy commitments, and enterprise compliance.
          </p>
        </header>

        <div className="space-y-16">
          {faqs.map((section, sIdx) => (
            <section key={sIdx}>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-500 mb-8 flex items-center gap-2">
                <span className="w-8 h-px bg-emerald-500/30"></span> {section.section}
              </h2>
              <div className="grid gap-6">
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all">
                    <h3 className="text-lg font-bold text-slate-100 mb-4 flex gap-3">
                      <ChevronRight className="text-emerald-500 shrink-0 mt-1" size={18} />
                      {item.q}
                    </h3>
                    <p className="text-slate-400 leading-relaxed pl-7">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-24 p-12 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl text-center">
          <h3 className="text-xl font-bold text-slate-100 mb-4">Still have questions?</h3>
          <p className="text-slate-400 mb-8">Our engineering team is ready to provide deep-dives into our technical safeguards.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold transition-all">
            Contact Support
          </Link>
        </div>

        <footer className="mt-24 pt-8 border-t border-slate-900 text-slate-600 text-sm text-center">
          &copy; 2026 OpSecForge. Security you can verify locally.
        </footer>
      </div>
    </main>
  );
}
