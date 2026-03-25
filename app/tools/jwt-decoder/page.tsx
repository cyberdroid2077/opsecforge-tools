'use client';

import React, { useState, useEffect } from 'react';
import { TerminalSquare, ShieldCheck, Lock, Copy, Check, Trash2, ArrowRight, ShieldAlert, Cpu, Network } from 'lucide-react';
import Link from 'next/link';
import SocialShare from '@/components/ui/SocialShare';

export default function JwtDecoder() {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<{header: any, payload: any} | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!input) {
      setDecoded(null);
      setError('');
      return;
    }

    try {
      const parts = input.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format: Must have 3 parts separated by dots');
      }

      const decodePart = (part: string) => {
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(atob(base64).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(json);
      };

      setDecoded({
        header: decodePart(parts[0]),
        payload: decodePart(parts[1])
      });
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to decode token');
      setDecoded(null);
    }
  }, [input]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      <div className="z-10 w-full max-w-6xl font-sans text-slate-300">
        
        {/* Breadcrumb */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">JWT Decoder</span>
        </div>

        {/* Tool Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Zero-Trust • 100% Client-Side</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            JWT Decoder <br/>
            <span className="text-slate-400 font-medium text-3xl">Securely Inspect JSON Web Tokens</span>
          </h1>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                <Cpu size={14} /> Browser-Only Execution
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                <Network size={14} /> 0 Network Activity
            </div>
          </div>

          <div className="mt-8">
            <SocialShare
              url="https://opsecforge.com/tools/jwt-decoder"
              title="Secure, client-side JWT Decoder for developers"
              tags={['jwt', 'devtools', 'security', 'opsec']}
            />
          </div>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
          {/* Input Side */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Encoded Token</label>
              <button 
                onClick={() => setInput('')}
                className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs font-bold uppercase"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your encoded JWT here..."
              className="w-full h-[500px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none placeholder:text-slate-700 text-emerald-500 break-all"
            />
          </div>

          {/* Output Side */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Decoded Content</label>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[500px] overflow-y-auto font-mono text-sm">
              {error ? (
                <div className="flex items-center gap-3 text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                  <ShieldAlert size={18} /> {error}
                </div>
              ) : decoded ? (
                <div className="space-y-8">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Header (Algorithm & Token Type)
                    </div>
                    <pre className="text-rose-400">{JSON.stringify(decoded.header, null, 2)}</pre>
                  </div>
                  <div className="pt-8 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Payload (Data & Claims)
                    </div>
                    <pre className="text-indigo-400">{JSON.stringify(decoded.payload, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div className="text-slate-700 italic">Decoded token data will appear here...</div>
              )}
            </div>
          </div>
        </div>

        {/* SEO & Educational Content Section */}
        <section className="max-w-4xl mx-auto border-t border-slate-900 pt-24 pb-48">
            <article className="prose prose-invert prose-slate lg:prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-slate-100">What is a JWT Decoder?</h2>
                <p>
                    A JWT (JSON Web Token) Decoder is a specialized tool that parses and displays the contents of JWT tokens without requiring server-side processing. JWTs are compact, URL-safe tokens used for authentication and information exchange in modern web applications.
                </p>
                <p>
                    They consist of three Base64Url-encoded parts separated by dots: the <strong>header</strong>, the <strong>payload</strong> (carrying claims and user data), and the <strong>signature</strong>. Developers frequently need to inspect these tokens during debugging or security audits to verify token structure and claims.
                </p>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">How it works locally (WASM/JS)</h2>
                <p>
                    Our JWT Decoder operates entirely within your browser using JavaScript, ensuring <strong>zero data transmission</strong> to external servers. When you paste a token, the browser parses the string and applies Base64Url decoding in-memory.
                </p>
                <p>
                    All processing occurs in a sandboxed environment. Your sensitive authentication tokens <strong>never leave your machine</strong>, making this tool suitable for examining production tokens containing proprietary claims or personally identifiable information (PII).
                </p>

                <div className="bg-rose-500/10 border-l-4 border-rose-500 p-8 my-16 rounded-r-2xl">
                    <h3 className="text-rose-400 mt-0 flex items-center gap-2">
                        <ShieldAlert size={24} /> Security Risks of Cloud-based Alternatives
                    </h3>
                    <p className="text-slate-300">
                        Most online JWT tools transmit your token to their servers. This means your potentially sensitive session data, user IDs, and role permissions are now sitting in someone else&apos;s log files. 
                    </p>
                    <p className="text-slate-300 mb-0">
                        オンラインのデコーダーは、中間者攻撃やサーバー側の侵害の影響を受けやすく、重大なコンプライアンス違反（GDPR/SOC2）につながる可能性があります。
                    </p>
                </div>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">FAQ</h2>
                <div className="space-y-8 mt-8">
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">Can this tool validate JWT signatures?</h4>
                        <p className="text-slate-400 mb-0">No. Signature verification requires access to your secret key. To maintain security, we never ask for your keys. This tool is for inspection only.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">Does it support encrypted JWTs (JWE)?</h4>
                        <p className="text-slate-400 mb-0">Currently, we support signed tokens (JWS). Encrypted tokens require decryption keys that should not be handled in a browser for security reasons.</p>
                    </div>
                </div>
            </article>
        </section>

      </div>
    </main>
  );
}
