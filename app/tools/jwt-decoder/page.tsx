"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Copy, RefreshCw, TerminalSquare, Clock, Activity, Lock } from 'lucide-react';

export default function Home() {
  const [inputToken, setInputToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  // Update current time every minute for relative time comparisons
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 60000);
    return () => clearInterval(timer);
  }, []);

  // Pure local decoding logic - ZERO server dependency
  const decodedData = useMemo(() => {
    if (!inputToken.trim()) return null;
    
    try {
      const parts = inputToken.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format (must have 3 parts separated by dots)');
      
      const decodeBase64Url = (str: string) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        return JSON.parse(decodeURIComponent(escape(atob(base64))));
      };

      const header = decodeBase64Url(parts[0]);
      const payload = decodeBase64Url(parts[1]);
      
      // Time claim analysis
      const claims: any[] = [];
      if (payload.exp) {
        const isExpired = currentTime > payload.exp;
        claims.push({
          name: 'Expiration (exp)',
          value: new Date(payload.exp * 1000).toLocaleString(),
          status: isExpired ? 'Expired' : 'Valid',
          color: isExpired ? 'text-rose-400 border-rose-400/30 bg-rose-400/10' : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
        });
      }
      if (payload.iat) {
        claims.push({
          name: 'Issued At (iat)',
          value: new Date(payload.iat * 1000).toLocaleString(),
          status: 'Info',
          color: 'text-blue-400 border-blue-400/30 bg-blue-400/10'
        });
      }

      return {
        header,
        payload,
        signature: parts[2],
        claims,
        valid: true
      };
    } catch (err: any) {
      return {
        error: err.message || 'Failed to decode token. Ensure it is a valid Base64Url encoded JWT.',
        valid: false
      };
    }
  }, [inputToken, currentTime]);

  const handleCopy = () => {
    if (decodedData?.payload) {
      navigator.clipboard.writeText(JSON.stringify(decodedData.payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      
      {/* Hidden SEO Metadata for Crawlers */}
      <h1 className="sr-only">Offline JWT Decoder & Client-Side Parser - 100% Private, No Internet Required</h1>
      
      <div className="z-10 w-full max-w-6xl items-center justify-between font-mono text-sm">
        
        {/* Header Section */}
        <div className="mb-12 text-center lg:text-left flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Lock size={14} />
                <span className="text-xs font-bold tracking-wider">100% LOCAL PROCESSING</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400">
                <Activity size={14} className="text-blue-400 animate-pulse" />
                <span className="text-xs font-bold tracking-wider">NETWORK CALLS: 0</span>
              </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-4 flex items-center gap-3 justify-center lg:justify-start">
              <TerminalSquare className="text-emerald-500" size={40} />
              OpSecForge JWT Decoder
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl font-sans">
              The ultimate <strong>private JWT decoder without internet</strong>. Your payload never leaves this browser tab. Zero uploads. Zero tracking.
            </p>
          </div>
        </div>
        
        {/* Decoder Workspace */}
        <div className="flex flex-col xl:flex-row gap-6 w-full">
          {/* Input Area */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                Encoded JWT
              </label>
              <button 
                onClick={() => setInputToken('')}
                className="text-xs text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-900/50 px-3 py-1 rounded-md border border-slate-800"
              >
                <RefreshCw size={12} /> Clear
              </button>
            </div>
            <textarea 
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="w-full h-[500px] p-5 bg-[#0f172a]/90 border border-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-emerald-300/90 font-mono text-sm resize-none shadow-inner break-all placeholder:text-slate-700 leading-relaxed custom-scrollbar"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              spellCheck="false"
            />
          </div>

          {/* Output Area */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                Decoded Payload
              </label>
              <button 
                onClick={handleCopy}
                disabled={!decodedData?.valid}
                className={`text-xs flex items-center gap-1 transition-colors px-3 py-1 rounded-md border ${decodedData?.valid ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-emerald-400 hover:border-emerald-500/30' : 'bg-slate-900 text-slate-700 border-slate-800 cursor-not-allowed'}`}
              >
                <Copy size={12} /> {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
            
            <div className="w-full h-[500px] bg-[#0f172a]/90 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col">
              {!inputToken.trim() ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center gap-4">
                  <ShieldCheck size={48} className="opacity-20 mb-2" />
                  <p className="font-sans text-lg text-slate-400">Secure Client-Side Parsing</p>
                  <p className="text-sm max-w-[250px]">Paste a token on the left. It will be decoded instantly offline.</p>
                </div>
              ) : decodedData?.valid ? (
                <div className="flex-1 overflow-auto p-5 text-sm custom-scrollbar">
                  
                  {/* Smart Claims Analysis */}
                  {decodedData.claims && decodedData.claims.length > 0 && (
                    <div className="mb-6 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-3 flex items-center gap-2">
                        <Clock size={14} /> Smart Time Claims
                      </span>
                      <div className="space-y-2">
                        {decodedData.claims.map((claim: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">{claim.name}</span>
                            <span className={`px-2 py-1 rounded border ${claim.color}`}>
                              {claim.value} ({claim.status})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Header</span>
                    <pre className="text-rose-300 bg-slate-950 p-4 rounded-lg border border-slate-800/80 shadow-inner">
                      {JSON.stringify(decodedData.header, null, 2)}
                    </pre>
                  </div>
                  <div className="mb-4">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Payload (Data)</span>
                    <pre className="text-indigo-300 bg-slate-950 p-4 rounded-lg border border-slate-800/80 shadow-inner">
                      {JSON.stringify(decodedData.payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Signature</span>
                    <div className="text-slate-500 bg-slate-950 p-4 rounded-lg border border-slate-800/80 break-all font-mono text-xs opacity-70 shadow-inner">
                      {decodedData.signature}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-rose-500 p-8 text-center gap-4">
                  <ShieldAlert size={48} className="opacity-50 mb-2" />
                  <p className="font-mono text-sm max-w-[300px] break-words">{decodedData?.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- AD SPACE: High RPM --- */}
        <div className="mt-16 mb-16 w-full h-32 border border-slate-800 bg-slate-900/30 rounded-xl flex flex-col items-center justify-center text-slate-600 relative overflow-hidden group">
           <div className="absolute top-2 right-3 text-[10px] uppercase tracking-widest text-slate-700 font-sans">Advertisement</div>
           <p className="font-mono text-sm group-hover:text-emerald-500/50 transition-colors">[ Google AdSense: AWS / Enterprise Security Ads Render Here ]</p>
        </div>

        {/* --- SEO KEYWORD TRAP (Below the fold) --- */}
        <article className="mt-12 w-full prose prose-invert prose-emerald max-w-4xl mx-auto border-t border-slate-800/50 pt-16 pb-24 font-sans">
          <h2 className="text-2xl font-bold text-slate-200 mb-6">The Best Offline JWT Decoder for Privacy-Conscious Developers</h2>
          
          <p className="text-slate-400 leading-relaxed mb-6">
            If you are pasting your authentication tokens into random websites you found on Google, you are likely violating your company's security policy. Many popular JSON Web Token parsers send your payload to a backend server for processing. This means your sensitive API keys, user data, and session IDs are being logged in server access logs across the globe.
          </p>
          
          <h3 className="text-xl font-bold text-slate-200 mt-8 mb-4">Why You Need a Client-Side JWT Parser</h3>
          <p className="text-slate-400 leading-relaxed mb-6">
            At <strong>OpSecForge</strong>, we do things differently. As a true <strong>private JWT decoder with no internet required</strong>, our tool runs <strong>100% locally in your browser</strong> using pure JavaScript. We do not have a backend server for this tool. You can literally load this page, turn off your Wi-Fi, and use it as a completely <strong>offline JWT decoder</strong> to debug your tokens safely.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800">
              <h4 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <Lock size={18} /> JWT Debugger Without Upload
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Zero network requests are made when you paste your token. The parsing, JSON formatting, and timestamp calculations happen in your browser's memory and are destroyed when you close the tab.
              </p>
            </div>
            <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800">
              <h4 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <Clock size={18} /> Inspect JWT Claims Locally
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automatically convert confusing Unix timestamps (like <code>exp</code> and <code>iat</code>) into human-readable local times. Instantly see if a token is expired without doing manual math.
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-200 mt-8 mb-4">Developer Best Practices for Session Management</h3>
          <ul className="list-disc pl-6 text-slate-400 space-y-2 mb-8">
            <li>Never store unencrypted passwords or credit card numbers in a JWT payload. Use JWE for sensitive data.</li>
            <li>Always validate the JWT signature offline or on your backend using a strong, rotating secret key (HS256 or RS256).</li>
            <li>Keep expiration times (`exp`) as short as practically possible to minimize replay attack windows.</li>
            <li>Use a <strong>secure JWT token viewer</strong> like OpSecForge to debug authentication issues locally.</li>
          </ul>
        </article>
      </div>
      
      {/* Global styles for custom scrollbar to make it look sleek */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </main>
  );
}