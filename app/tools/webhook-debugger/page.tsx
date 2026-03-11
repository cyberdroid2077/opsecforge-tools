'use client';

import React, { useState } from 'react';
import { Webhook, Lock, ArrowRight, Check, Copy, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function WebhookDebugger() {
  const [payload, setPayload] = useState('{\n  "id": "evt_123",\n  "object": "event",\n  "type": "checkout.session.completed",\n  "created": 1710165432\n}');
  const [secret, setSecret] = useState('');
  const [signature, setSignature] = useState('');
  const [algorithm, setAlgorithm] = useState('sha256');
  const [verified, setVerified] = useState<boolean | null>(null);

  const algorithms = [
    { id: 'sha256', name: 'HMAC-SHA256 (Stripe, GitHub)', color: 'emerald' },
    { id: 'sha1', name: 'HMAC-SHA1 (Legacy Systems)', color: 'amber' },
    { id: 'sha512', name: 'HMAC-SHA512 (High Security)', color: 'blue' }
  ];

  const verifySignature = async () => {
    if (!secret || !signature || !payload) return;
    
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const msgData = encoder.encode(payload);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: algorithm.toUpperCase() },
        false,
        ['sign', 'verify']
      );
      
      const sigBuffer = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const isValid = await crypto.subtle.verify('HMAC', key, sigBuffer, msgData);
      
      setVerified(isValid);
    } catch (e) {
      console.error(e);
      setVerified(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      <div className="z-10 w-full max-w-6xl font-sans text-slate-300">
        
        {/* Breadcrumb */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Webhook Debugger</span>
        </div>

        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-6 shadow-sm">
            <Webhook size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Beta • Client-Side Verification</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            Webhook Signature Debugger <br/>
            <span className="text-slate-400 font-medium text-3xl">Verify Payloads Locally</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg mb-8 leading-relaxed">
            Test and verify HMAC signatures for Stripe, GitHub, and custom webhooks. 
            <strong> Processing happens entirely in your browser—your signing secrets never touch our servers.</strong>
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Payload input */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Raw JSON Payload</label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full h-[400px] bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 outline-none resize-none transition-all"
              placeholder="Paste raw request body here..."
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-8">
            <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl flex flex-col gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Algorithm</label>
                <div className="flex flex-col gap-2">
                  {algorithms.map((alg) => (
                    <button
                      key={alg.id}
                      onClick={() => setAlgorithm(alg.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
                        algorithm === alg.id 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {alg.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Signing Secret</label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono focus:border-emerald-500/50 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Received Signature (Hex)</label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="e.g. 5257a... (Hex only)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono focus:border-emerald-500/50 outline-none transition-all"
                />
              </div>

              <button
                onClick={verifySignature}
                disabled={!secret || !signature}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                <RefreshCw size={18} /> Verify Signature
              </button>
            </div>

            {/* Result display */}
            {verified !== null && (
              <div className={`p-8 rounded-3xl border animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                verified 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  {verified ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                  <h3 className="text-xl font-bold tracking-tight">
                    {verified ? 'Signature Valid' : 'Invalid Signature'}
                  </h3>
                </div>
                <p className="text-sm opacity-80 leading-relaxed">
                  {verified 
                    ? 'The signature matches the payload and secret provided. This webhook is authentic.' 
                    : 'The signature does not match. Please check your payload (including whitespace) and signing secret.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Footer */}
        <div className="p-8 lg:p-12 bg-slate-900/30 border border-slate-800 rounded-3xl mb-24 flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Lock className="text-emerald-500" size={20} /> Webhook Best Practices
                </h3>
                <ul className="space-y-3 text-sm text-slate-400">
                    <li className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span><strong>Always verify signatures</strong> in production to prevent replay attacks and spoofing.</span>
                    </li>
                    <li className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span><strong>Rotate secrets</strong> immediately if you suspect they have been leaked.</span>
                    </li>
                    <li className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span><strong>Use TLS</strong> for all webhook endpoints to encrypt data in transit.</span>
                    </li>
                </ul>
            </div>
            <div className="text-center">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors font-bold text-sm uppercase tracking-widest">
                    Back to Hub <ArrowRight size={16} />
                </Link>
            </div>
        </div>
      </div>
    </main>
  );
}
