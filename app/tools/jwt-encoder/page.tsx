'use client';

import React, { useState, useEffect } from 'react';
import SocialShare from '@/components/ui/SocialShare';
import { Lock, Key, Play, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';

type Algorithm = 'HS256' | 'HS512';

export default function JwtEncoder() {
  const [headerJson, setHeaderJson] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadJson, setPayloadJson] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('HS256');
  const [encodedJwt, setEncodedJwt] = useState('');
  const [copied, setCopied] = useState(false);
  const [segmentCopied, setSegmentCopied] = useState({ header: false, payload: false, signature: false });
  const [error, setError] = useState('');
  const [headerError, setHeaderError] = useState('');
  const [payloadError, setPayloadError] = useState('');

  useEffect(() => {
    try {
      JSON.parse(headerJson);
      setHeaderError('');
    } catch (e) {
      setHeaderError('Invalid JSON format');
    }
  }, [headerJson]);

  useEffect(() => {
    try {
      JSON.parse(payloadJson);
      setPayloadError('');
    } catch (e) {
      setPayloadError('Invalid JSON format');
    }
  }, [payloadJson]);

  const base64UrlEncode = (str: string): string => {
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const encodeSegment = (obj: object): string => {
    return base64UrlEncode(JSON.stringify(obj));
  };

  const sign = (data: string, secret: string, alg: Algorithm): Promise<string> => {
    return new Promise((resolve, reject) => {
      const key = utf8Encode(secret);
      
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        crypto.subtle.importKey(
          'raw',
          key,
          { name: 'HMAC', hash: { name: alg === 'HS256' ? 'SHA-256' : 'SHA-512' } },
          false,
          ['sign']
        ).then(cryptoKey => {
          crypto.subtle.sign('HMAC', cryptoKey, utf8Encode(data)).then(signature => {
            const sigArray = new Uint8Array(signature);
            const sigBase64 = btoa(String.fromCharCode(...sigArray));
            resolve(sigBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''));
          }).catch(reject);
        }).catch(reject);
      } else {
        reject(new Error('Web Crypto API not available'));
      }
    });
  };

  const utf8Encode = (str: string): Uint8Array => {
    return new TextEncoder().encode(str);
  };

  const encodeJwt = async () => {
    setError('');
    setEncodedJwt('');

    if (headerError || payloadError) {
      setError('Please fix the JSON errors before encoding.');
      return;
    }

    if (!secret.trim()) {
      setError('Secret key is required');
      return;
    }

    try {
      const header = JSON.parse(headerJson);
      header.alg = algorithm;
      const headerStr = JSON.stringify(header);
      
      const payload = JSON.parse(payloadJson);
      const payloadStr = JSON.stringify(payload);

      const headerEncoded = encodeSegment(header);
      const payloadEncoded = encodeSegment(payload);
      const data = `${headerEncoded}.${payloadEncoded}`;
      
      const signature = await sign(data, secret, algorithm);
      const jwt = `${data}.${signature}`;
      
      setEncodedJwt(jwt);
    } catch (err: any) {
      setError(err.message || 'Failed to encode JWT');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySegment = (segment: 'header' | 'payload' | 'signature') => {
    const parts = encodedJwt.split('.');
    const map = { header: 0, payload: 1, signature: 2 };
    navigator.clipboard.writeText(parts[map[segment]]);
    setSegmentCopied((prev) => ({ ...prev, [segment]: true }));
    setTimeout(() => setSegmentCopied((prev) => ({ ...prev, [segment]: false })), 1800);
  };

  const resetForm = () => {
    setHeaderJson('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    setPayloadJson('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
    setSecret('');
    setEncodedJwt('');
    setError('');
  };

  const presetPayloads = [
    { name: 'Standard Claims', content: '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}' },
    { name: 'Admin User', content: '{\n  "sub": "admin-001",\n  "role": "admin",\n  "permissions": ["read", "write", "delete"],\n  "iat": 1516239022,\n  "exp": 1735689600\n}' },
    { name: 'API Key', content: '{\n  "api_key": "sk_live_xxxxx",\n  "scope": "read:users write:repos",\n  "iat": 1516239022,\n  "exp": 1735689600\n}' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">JWT Encoder</h1>
            <p className="text-slate-400">Encode and sign JSON Web Tokens client-side</p>
          </div>
        </div>

        {/* Algorithm Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Algorithm</label>
          <div className="flex gap-3">
            <button
              onClick={() => setAlgorithm('HS256')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                algorithm === 'HS256'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              HS256 (HMAC + SHA-256)
            </button>
            <button
              onClick={() => setAlgorithm('HS512')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                algorithm === 'HS512'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              HS512 (HMAC + SHA-512)
            </button>
          </div>
        </div>

        {/* Input Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Header Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Header (JSON)
            </label>
            <textarea
              value={headerJson}
              onChange={(e) => setHeaderJson(e.target.value)}
              className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-3 font-mono text-sm text-emerald-300 focus:border-emerald-400 focus:outline-none resize-none"
              spellCheck={false}
            />
            {headerError && <p className="text-red-400 text-xs mt-1">{headerError}</p>}
          </div>

          {/* Payload Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Payload (JSON)
            </label>
            <textarea
              value={payloadJson}
              onChange={(e) => setPayloadJson(e.target.value)}
              className="w-full h-40 bg-slate-800 border border-slate-600 rounded-lg p-3 font-mono text-sm text-blue-300 focus:border-emerald-400 focus:outline-none resize-none"
              spellCheck={false}
            />
            {payloadError && <p className="text-red-400 text-xs mt-1">{payloadError}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {presetPayloads.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setPayloadJson(preset.content)}
                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Secret Key Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Key className="w-4 h-4 inline mr-1" />
            Secret Key
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter your secret key..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg font-mono text-sm focus:border-emerald-400 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">This key is never sent to any server</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={encodeJwt}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
          >
            <Play className="w-5 h-5" />
            Encode & Sign JWT
          </button>
          <button
            onClick={resetForm}
            className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={() => setSecret(crypto.randomUUID())}
            className="flex items-center gap-2 px-4 py-3 bg-blue-500/80 hover:bg-blue-600 rounded-lg font-medium transition-colors"
          >
            <Key className="w-4 h-4" />
            Generate Secret
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Output */}
        {encodedJwt && (
          <div className="p-6 bg-slate-800/50 border border-slate-600 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-emerald-400">JWT Created Successfully</h3>
            </div>
            <div className="relative">
              <pre className="p-4 bg-slate-900 rounded-lg font-mono text-sm break-all whitespace-pre-wrap text-slate-300">
                {encodedJwt}
              </pre>
              <button
                onClick={() => copyToClipboard(encodedJwt)}
                className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-800 rounded-lg relative">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-xs text-slate-500">Header</div>
                  <button onClick={() => copySegment('header')} className="p-1 hover:bg-slate-700 rounded transition-colors ml-1">
                    {segmentCopied.header ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <div className="font-mono text-sm text-emerald-300 truncate">
                  {encodedJwt.split('.')[0]?.substring(0, 20)}...
                </div>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg relative">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-xs text-slate-500">Payload</div>
                  <button onClick={() => copySegment('payload')} className="p-1 hover:bg-slate-700 rounded transition-colors ml-1">
                    {segmentCopied.payload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <div className="font-mono text-sm text-blue-300 truncate">
                  {encodedJwt.split('.')[1]?.substring(0, 20)}...
                </div>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg relative">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-xs text-slate-500">Signature</div>
                  <button onClick={() => copySegment('signature')} className="p-1 hover:bg-slate-700 rounded transition-colors ml-1">
                    {segmentCopied.signature ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <div className="font-mono text-sm text-purple-300 truncate">
                  {encodedJwt.split('.')[2]?.substring(0, 20)}...
                </div>
              </div>
            </div>

            {/* Decoded Preview */}
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Header</span>
                  <button onClick={() => copySegment('header')} className="p-1 hover:bg-slate-700 rounded transition-colors">
                    {segmentCopied.header ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap break-all">
                  {JSON.stringify(JSON.parse(atob(encodedJwt.split('.')[0])), null, 2)}
                </pre>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Payload</span>
                  <button onClick={() => copySegment('payload')} className="p-1 hover:bg-slate-700 rounded transition-colors">
                    {segmentCopied.payload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
                </div>
                <pre className="font-mono text-xs text-blue-300 whitespace-pre-wrap break-all">
                  {JSON.stringify(JSON.parse(atob(encodedJwt.split('.')[1])), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="font-semibold text-blue-400 mb-2">How it works</h4>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• JWT consists of Header, Payload, and Signature separated by dots</li>
            <li>• Header and Payload are Base64URL encoded JSON</li>
            <li>• Signature is HMAC using the algorithm you selected</li>
            <li>• All encoding happens in your browser — no data is sent to any server</li>
          </ul>
        </div>

        <div className="mt-12">
          <SocialShare url="https://opsecforge.com/tools/jwt-encoder" title="JWT Encoder - OpsecForge" />
        </div>

        {/* Link to Decoder */}
        <div className="mt-4 text-center">
          <a href="/tools/jwt-decoder" className="text-emerald-400 hover:text-emerald-300 text-sm">
            ← Decode an existing JWT
          </a>
        </div>
      </div>
    </div>
  );
}
