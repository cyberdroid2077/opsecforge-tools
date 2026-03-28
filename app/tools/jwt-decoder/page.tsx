'use client';

import React, { useState, useEffect } from 'react';
import { TerminalSquare, ShieldCheck, Lock, Copy, Check, Trash2, ArrowRight, ShieldAlert, Cpu, Network, AlertTriangle, Clock, Info } from 'lucide-react';
import Link from 'next/link';

interface SecurityAlert {
  type: 'error' | 'warning' | 'info';
  message: string;
}

export default function JwtDecoder() {
  const [input, setInput] = useState('');
  const [decoded, setDecoded] = useState<{header: any, payload: any, signature: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  const formatTimestamp = (ts: number) => {
    if (ts > 1e12) ts = ts / 1000; // milliseconds → seconds
    const date = new Date(ts * 1000);
    const utc = date.toISOString().replace('T', ' ').replace('Z', ' UTC');
    const local = date.toLocaleString();
    const relative = (() => {
      const now = Date.now();
      const diff = ts * 1000 - now;
      const abs = Math.abs(diff);
      if (abs < 60000) return 'less than a minute ago';
      if (abs < 3600000) return `${Math.floor(abs / 60000)} minutes ago`;
      if (abs < 86400000) return `${Math.floor(abs / 3600000)} hours ago`;
      if (abs < 2592000000) return `${Math.floor(abs / 86400000)} days ago`;
      return `${Math.floor(abs / 2592000000)} months ago`;
    })();
    return { utc, local, relative, isExpired: ts * 1000 < Date.now() };
  };

  const checkSecurity = (header: any, payload: any) => {
    const issues: SecurityAlert[] = [];

    // alg: none
    if (header.alg && header.alg.toLowerCase() === 'none') {
      issues.push({ type: 'error', message: 'Dangerous: "alg: none" detected. Token is not cryptographically signed and can be forged.' });
    }

    // Weak algorithms
    const weakAlgs = ['HS256', 'HS384', 'HS512'];
    if (header.alg && weakAlgs.includes(header.alg)) {
      issues.push({ type: 'info', message: 'HMAC algorithm detected. Signature cannot be verified without your secret key.' });
    }

    // Expired
    if (payload.exp) {
      const expInfo = formatTimestamp(payload.exp);
      if (expInfo.isExpired) {
        issues.push({ type: 'warning', message: `Token expired on ${expInfo.utc} (${expInfo.relative})` });
      }
    }

    // Missing standard claims
    if (!payload.exp) issues.push({ type: 'info', message: 'Token has no "exp" (expiration) claim. It never expires.' });
    if (!payload.iat) issues.push({ type: 'info', message: 'Token has no "iat" (issued at) claim.' });

    return issues;
  };

  const formatClaim = (key: string, value: any): string => {
    if (['exp', 'iat', 'nbf', 'auth_time'].includes(key)) {
      const info = formatTimestamp(value);
      return `${info.utc} (${info.relative})${info.isExpired ? ' ⛔ EXPIRED' : ''}`;
    }
    return JSON.stringify(value);
  };

  useEffect(() => {
    setAlerts([]);
    if (!input) {
      setDecoded(null);
      setError('');
      return;
    }

    try {
      const parts = input.trim().split('.');
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

      const header = decodePart(parts[0]);
      const payload = decodePart(parts[1]);
      const signature = parts[2];

      setDecoded({ header, payload, signature });
      setError('');
      setAlerts(checkSecurity(header, payload));
    } catch (err: any) {
      setError(err.message || 'Failed to decode token');
      setDecoded(null);
      setAlerts([]);
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
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                <Clock size={14} /> Timestamp Parsing
            </div>
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
              className="w-full h-[480px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none placeholder:text-slate-700 text-emerald-500 break-all"
            />
          </div>

          {/* Output Side */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Decoded Content</label>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[480px] overflow-y-auto font-mono text-sm">
              {error ? (
                <div className="flex items-center gap-3 text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                  <ShieldAlert size={18} /> {error}
                </div>
              ) : decoded ? (
                <div className="space-y-6">
                  {/* Security Alerts */}
                  {alerts.length > 0 && (
                    <div className="space-y-2 mb-6">
                      {alerts.map((alert, i) => (
                        <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-xs font-bold border ${
                          alert.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                          alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                          'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>
                          {alert.type === 'error' ? <ShieldAlert size={14} className="mt-0.5 shrink-0" /> :
                           alert.type === 'warning' ? <AlertTriangle size={14} className="mt-0.5 shrink-0" /> :
                           <Info size={14} className="mt-0.5 shrink-0" />}
                          <span className="leading-relaxed">{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Header */}
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Header (Algorithm & Token Type)
                    </div>
                    <pre className="text-rose-400">{JSON.stringify(decoded.header, null, 2)}</pre>
                  </div>

                  {/* Payload */}
                  <div className="pt-6 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Payload (Data & Claims)
                    </div>
                    <div className="space-y-2">
                      {Object.entries(decoded.payload).map(([key, value]) => (
                        <div key={key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                          <span className="text-indigo-300 font-bold shrink-0">"{key}"</span>
                          <span className="text-slate-600 shrink-0">→</span>
                          <div className="text-slate-300 break-all leading-relaxed">
                            {['exp', 'iat', 'nbf', 'auth_time'].includes(key) ? (
                              <div>
                                <div className="text-emerald-400 font-mono">{formatClaim(key, value)}</div>
                                <div className="text-slate-500 text-xs mt-0.5">Local: {formatTimestamp(value as number).local}</div>
                              </div>
                            ) : (
                              <span className="text-emerald-300">{formatClaim(key, value)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="pt-6 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Signature (Cannot Be Verified)
                    </div>
                    <pre className="text-amber-500/70 text-xs break-all whitespace-pre-wrap">{decoded.signature}</pre>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
                      <Info size={12} />
                      <span>Signature verification requires your secret key — we never ask for it.</span>
                    </div>
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

                <h2 className="text-3xl font-bold text-slate-100 mt-16">Smart Timestamp Parsing</h2>
                <p>
                    Common JWT claims like <code>exp</code>, <code>iat</code>, and <code>nbf</code> are Unix timestamps — raw numbers that are hard to read at a glance. Our decoder automatically converts them to human-readable dates in both UTC and your local timezone, plus a relative description like "3 hours ago" or "expired 2 days ago".
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

                <h2 className="text-3xl font-bold text-slate-100 mt-16">Security Analysis</h2>
                <p>
                    This decoder automatically flags common JWT security issues: <code>alg: none</code> tokens (which are trivially forgeable), expired tokens, and missing expiration claims. It doesn&apos;t replace a full audit tool, but it gives you immediate visibility into token health during debugging.
                </p>

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
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">What timestamps are automatically converted?</h4>
                        <p className="text-slate-400 mb-0">The decoder recognizes <code>exp</code> (expiration), <code>iat</code> (issued at), <code>nbf</code> (not before), and <code>auth_time</code> (authentication time) claims and displays them as human-readable dates.</p>
                    </div>
                </div>
            </article>
        </section>

      </div>
    </main>
  );
}
