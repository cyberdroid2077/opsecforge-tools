import React from 'react';
import { ShieldAlert, Terminal, Lock, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const cases = [
  {
    title: "Samsung ChatGPT Source Code Leak",
    date: "2023",
    description: "Semiconductor division employees inputted sensitive wafer measurement source code and meeting notes into ChatGPT for optimization, inadvertently feeding proprietary secrets into the AI training pool.",
    tech: "Unsafe use of online tools. Lack of egress filtering allowed sensitive data to be transmitted as prompts to a third-party AI platform.",
    lesson: "Strictly prohibit the input of internal code or confidential data into unvetted online AI tools.",
    recommend: "/tools/env-sanitizer",
    toolName: ".env Sanitizer"
  },
  {
    title: "Capital One SSRF Breach",
    date: "2019",
    description: "An attacker exploited an SSRF vulnerability to access the AWS metadata service, stealing data from 106 million customers and resulting in an $80 million fine.",
    tech: "SSRF (Server-Side Request Forgery) + IAM Misconfiguration. The attacker leveraged a WAF vulnerability to obtain temporary credentials for an IAM role with excessive S3 permissions.",
    lesson: "Follow the Principle of Least Privilege, restrict cloud instance role permissions, and enforce IMDSv2 usage.",
    recommend: "/faq",
    toolName: "Security FAQ"
  },
  {
    title: "Log4j (Log4Shell) Critical Vulnerability",
    date: "2021",
    description: "A remote code execution (RCE) vulnerability that affected hundreds of millions of devices globally, characterized by its ease of exploitation and devastating impact.",
    tech: "JNDI Injection. Log4j incorrectly supported dynamic lookup syntax, allowing attackers to induce the server into loading and executing malicious code from a remote source.",
    lesson: "Never trust user input, even in logging utilities. Establish rapid dependency update mechanisms.",
    recommend: "/glossary",
    toolName: "Security Glossary"
  },
  {
    title: "Toyota T-Connect GitHub Credential Leak",
    date: "2022",
    description: "Toyota T-Connect source code remained public on a GitHub repository for 5 years, exposing nearly 300,000 customer records.",
    tech: "Hardcoded Secrets. External contractors accidentally pushed source code containing database access keys to a public repository.",
    lesson: "Prohibit hardcoding API keys or database passwords in source code. Enforce mandatory secret scanning and code audit processes.",
    recommend: "/tools/env-sanitizer",
    toolName: ".env Sanitizer"
  },
  {
    title: "Uber MFA Fatigue Attack",
    date: "2022",
    description: "An 18-year-old hacker used an MFA fatigue attack—bombarding an employee with push notifications—to eventually gain internal administrative access.",
    tech: "Social Engineering + Improper Privileged Credential Management. Once inside the network, the attacker found hardcoded PAM admin credentials in a script.",
    lesson: "MFA is not a silver bullet; be wary of notification fatigue. Administrative credentials must never be stored in plain text scripts.",
    recommend: "/faq",
    toolName: "Security FAQ"
  }
];

export default function CaseStudiesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        
        <header className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Case Studies</h1>
          </div>
          <p className="text-xl text-slate-400 leading-relaxed max-w-3xl">
            A curated history of high-impact security breaches. Learn from the mistakes of the past to build a more secure future.
          </p>
        </header>

        <div className="space-y-12">
          {cases.map((c, idx) => (
            <div key={idx} className="p-10 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-slate-700 transition-all">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
                <div>
                  <div className="text-rose-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Security Incident {c.date}
                  </div>
                  <h2 className="text-3xl font-bold text-slate-100 tracking-tight">{c.title}</h2>
                </div>
                <Link 
                  href={c.recommend}
                  className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={14} /> Try {c.toolName}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">The Incident</h3>
                  <p className="text-slate-300 leading-relaxed">{c.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Technical Breakdown</h3>
                  <p className="text-slate-400 leading-relaxed">{c.tech}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-800/50">
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 mt-1">
                    <Terminal size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">Lesson Learned</h4>
                    <p className="text-slate-300 italic">"{c.lesson}"</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 p-12 bg-slate-900/60 border border-slate-800 rounded-3xl text-center">
          <p className="text-slate-500 mb-0 italic">More case studies being added daily by our security research team.</p>
        </div>

        <footer className="mt-32 pt-12 border-t border-slate-900 text-center text-slate-600 text-xs tracking-widest uppercase pb-12">
          &copy; 2026 OpSecForge Intelligence • Security Through Transparency
        </footer>
      </div>
    </main>
  );
}
