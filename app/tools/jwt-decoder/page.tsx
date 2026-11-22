'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Lock, Trash2, ShieldAlert, Cpu, Network, AlertTriangle, Clock, Info, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import {
  analyzeJwt,
  decodeJwt,
  isTimeClaim,
  type DecodedJwt,
  type JwtAlert,
  type JwtAnalysis,
} from '@/lib/jwt';
import { jwtKeyKindForAlg, verifyJwtSignature, type JwtVerifyResult } from '@/lib/jwt-verify';
import { isJweCompact } from '@/lib/jwe';
import { JWE_EXAMPLE } from '@/lib/jwe-example';
import JwePanel from './JwePanel';

const formatClaim = (key: string, value: unknown, claims: JwtAnalysis['timeClaims']): string => {
    if (isTimeClaim(key) && claims[key]) {
      return claims[key]!.display;
    }
    return JSON.stringify(value) ?? String(value);
};

export default function JwtDecoder() {
  const [input, setInputState] = useState('');
  // Verification state lives only in React state: never written to storage, the URL or the network.
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [verifyResult, setVerifyResult] = useState<JwtVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  // Incremented whenever the token or key changes so a slow, older check cannot overwrite the view.
  const verifyRun = useRef(0);

  const resetVerification = () => {
    verifyRun.current += 1;
    setVerifyResult(null);
    setVerifying(false);
  };

  const setInput = (value: string) => {
    setInputState(value);
    resetVerification();
  };

  // Five dot-separated parts is an encrypted JWT (JWE), which has its own view.
  const isJwe = isJweCompact(input);

  const { decoded, error, alerts, timeClaims } = useMemo(() => {
    const empty = {
      decoded: null as DecodedJwt | null,
      error: '',
      alerts: [] as JwtAlert[],
      timeClaims: {} as JwtAnalysis['timeClaims'],
    };
    if (!input || isJwe) return empty;

    try {
      const result = decodeJwt(input);
      const analysis = analyzeJwt(result);
      return { ...empty, decoded: result, alerts: analysis.alerts, timeClaims: analysis.timeClaims };
    } catch (err: unknown) {
      return { ...empty, error: err instanceof Error ? err.message : 'Failed to decode token' };
    }
  }, [input, isJwe]);

  const headerAlg = decoded && typeof decoded.header.alg === 'string' ? decoded.header.alg : null;
  const keyKind = jwtKeyKindForAlg(headerAlg);

  const runVerify = async () => {
    const run = verifyRun.current + 1;
    verifyRun.current = run;
    setVerifying(true);
    const result = await verifyJwtSignature(input, keyKind === 'secret' ? secret : publicKey);
    if (verifyRun.current !== run) return;
    setVerifyResult(result);
    setVerifying(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      <div className="z-10 w-full max-w-6xl font-sans text-slate-300">
        
        {/* Breadcrumb */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpsecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">JWT Decoder</span>
        </div>

        {/* Tool Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Local Inspection • No Tool-Input Upload</span>
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
                <Network size={14} /> No Tool-Input Backend
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
                onClick={() => {
                  setInput('');
                  setSecret('');
                  setPublicKey('');
                }}
                className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs font-bold uppercase"
              >
                <Trash2 size={12} /> Clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your encoded JWT or JWE here..."
              className="w-full h-[480px] bg-slate-900/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none placeholder:text-slate-700 text-emerald-500 break-all"
            />
          </div>

          {/* Output Side */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Decoded Content</label>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-[480px] overflow-y-auto font-mono text-sm">
              {isJwe ? (
                // Keyed by the token so the pasted key and any result are dropped when the token changes.
                <JwePanel key={input} token={input} onDecodeNested={setInput} />
              ) : error ? (
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
                          <span className="text-indigo-300 font-bold shrink-0">&quot;{key}&quot;</span>
                          <span className="text-slate-600 shrink-0">→</span>
                          <div className="text-slate-300 break-all leading-relaxed">
                            {isTimeClaim(key) && timeClaims[key] ? (
                              <div>
                                <div className={`font-mono ${
                                  timeClaims[key]!.status === 'expired' ? 'text-rose-400' :
                                  timeClaims[key]!.badge ? 'text-amber-400' : 'text-emerald-400'
                                }`}>{formatClaim(key, value, timeClaims)}</div>
                                <div className="text-slate-500 text-xs mt-0.5">
                                  {timeClaims[key]!.local
                                    ? `Local: ${timeClaims[key]!.local}`
                                    : 'Local: not available for this value'}
                                  {timeClaims[key]!.interpretedAsMilliseconds && ' · read as milliseconds'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-emerald-300">{formatClaim(key, value, timeClaims)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signature */}
                  <div className="pt-6 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Signature (Not Checked Until You Verify)
                    </div>
                    <pre className="text-amber-500/70 text-xs break-all whitespace-pre-wrap">{decoded.signature}</pre>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
                      <Info size={12} className="shrink-0" />
                      <span>Decoding alone does not check the signature. You can optionally check it below, locally, with a key you supply.</span>
                    </div>

                    {/* Optional local verification */}
                    <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Verify signature locally (optional)
                      </summary>

                      <div className="mt-4 space-y-4 font-sans text-xs text-slate-400">
                        {keyKind === 'secret' ? (
                          <div className="space-y-2">
                            <label htmlFor="jwt-verify-secret" className="block font-bold uppercase tracking-wider text-slate-400">
                              Shared secret
                            </label>
                            <div className="flex gap-2">
                              <input
                                id="jwt-verify-secret"
                                type={showSecret ? 'text' : 'password'}
                                value={secret}
                                onChange={(e) => {
                                  setSecret(e.target.value);
                                  resetVerification();
                                }}
                                autoComplete="off"
                                spellCheck={false}
                                className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-sm text-emerald-400 outline-none focus:border-emerald-500/50"
                              />
                              <button
                                type="button"
                                onClick={() => setShowSecret((shown) => !shown)}
                                aria-pressed={showSecret}
                                aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                                className="flex items-center rounded-lg border border-slate-800 px-3 text-slate-400 hover:text-emerald-400"
                              >
                                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                            <p className="leading-relaxed text-amber-400/90">
                              Use test secrets only. Do not paste a production HMAC key into any web page, including this one.
                              The secret is UTF-8 text; it stays in this tab and is not stored or sent.
                            </p>
                          </div>
                        ) : keyKind === 'public-key' ? (
                          <div className="space-y-2">
                            <label htmlFor="jwt-verify-public-key" className="block font-bold uppercase tracking-wider text-slate-400">
                              Public key (PEM, JWK or JWKS)
                            </label>
                            <textarea
                              id="jwt-verify-public-key"
                              value={publicKey}
                              onChange={(e) => {
                                setPublicKey(e.target.value);
                                resetVerification();
                              }}
                              spellCheck={false}
                              rows={5}
                              placeholder={'-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'}
                              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-emerald-400 outline-none placeholder:text-slate-700 focus:border-emerald-500/50"
                            />
                            <p className="leading-relaxed">
                              A public key is not a secret, but never paste a private key. A JWKS is chosen by the token&apos;s
                              <code> kid</code>. This page never downloads a JWKS from a URL (that would be a network request);
                              copy the JSON from the issuer and paste it here.
                            </p>
                          </div>
                        ) : (
                          <p className="leading-relaxed">
                            {headerAlg && headerAlg.toLowerCase() === 'none'
                              ? 'This token declares alg "none": it is unsigned, so there is no signature to verify.'
                              : headerAlg
                                ? `Algorithm "${headerAlg}" is not supported for local verification (HS256/384/512, RS256/384/512, PS256/384/512, ES256/384/512 and EdDSA with Ed25519 are).`
                                : 'The header has no "alg" value, so there is no algorithm to verify against.'}
                          </p>
                        )}

                        {keyKind && (
                          <button
                            type="button"
                            onClick={runVerify}
                            disabled={verifying}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                          >
                            <ShieldCheck size={14} /> {verifying ? 'Verifying…' : 'Verify signature'}
                          </button>
                        )}

                        {/* Fixed minimum height so the page does not jump when a result appears. */}
                        <div role="status" aria-live="polite" className="min-h-[9rem]">
                          {verifyResult && (
                            <div
                              className={`space-y-2 rounded-xl border p-3 leading-relaxed ${
                                verifyResult.status === 'valid'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                  : verifyResult.status === 'invalid'
                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                              }`}
                            >
                              <div className="font-bold uppercase tracking-wider">
                                {verifyResult.status === 'valid'
                                  ? 'Signature matches'
                                  : verifyResult.status === 'invalid'
                                    ? 'Signature does not match'
                                    : 'Could not verify'}
                                {verifyResult.alg ? ` · ${verifyResult.alg}` : ''}
                                {verifyResult.keyIdUsed ? ` · kid ${verifyResult.keyIdUsed}` : ''}
                              </div>
                              <p>{verifyResult.message}</p>
                              {verifyResult.warnings.map((warning, i) => (
                                <p key={i} className="flex items-start gap-2 text-amber-300">
                                  <AlertTriangle size={12} className="mt-0.5 shrink-0" /> <span>{warning}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
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
                    A signed JWT (a JWS) consists of three Base64Url-encoded parts separated by dots: the <strong>header</strong>, the <strong>payload</strong> (carrying claims and user data), and the <strong>signature</strong>. Developers frequently need to inspect these tokens during debugging or security audits to verify token structure and claims.
                </p>
                <p>
                    An encrypted JWT (a JWE) has five parts instead, and only its header can be read without the key. Paste one and this page shows that header and the size of each part, and can decrypt the claims locally with a key you supply; see <a href="#jwe">encrypted JWTs</a> below.
                </p>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">How local decoding works</h2>
                <p>
                    When you paste a compact JWT, JavaScript in this browser tab parses the three
                    segments and applies Base64URL decoding in memory. OpsecForge does not send the
                    pasted token to a tool-processing backend or include its contents in analytics
                    events.
                </p>
                <p>
                    The site still loads normal page resources and aggregate analytics, and browser
                    extensions or a compromised device remain outside this tool&apos;s control. Follow
                    your organization&apos;s token-handling policy and prefer synthetic or revoked tokens
                    when inspection does not require a live bearer credential.
                </p>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">Smart Timestamp Parsing</h2>
                <p>
                    Common JWT claims like <code>exp</code>, <code>iat</code>, and <code>nbf</code> are Unix timestamps — raw numbers that are hard to read at a glance. Our decoder automatically converts them to human-readable dates in both UTC and your local timezone, plus a relative description such as &quot;3 hours ago&quot; or &quot;in 2 days&quot;. Each claim is read by its own meaning: only an <code>exp</code> in the past is shown as expired, an <code>nbf</code> in the future is shown as not yet valid, and <code>iat</code> and <code>auth_time</code> are displayed as times only (a time in the future is flagged as possible clock skew). Values outside the range a JavaScript date can represent are shown as-is and marked out of range.
                </p>

                <div className="bg-amber-500/5 border-l-4 border-amber-500 p-8 my-16 rounded-r-2xl">
                    <h3 className="text-amber-400 mt-0 flex items-center gap-2">
                        <ShieldAlert size={24} /> Decoding does not validate a JWT
                    </h3>
                    <p className="text-slate-300">
                        Anyone holding a JWT can usually decode its header and payload. Treat those
                        values as untrusted until a server verifies the expected signature, issuer,
                        audience, time constraints, and token type. Authorization remains a separate
                        decision after validation. The optional local signature check on this page
                        covers only the signature step.
                    </p>
                </div>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">Security Analysis</h2>
                <p>
                    This decoder flags unsigned <code>alg: none</code> headers, HMAC tokens, expired{' '}
                    <code>exp</code> values, <code>nbf</code> values that are still in the future, and
                    missing timestamp claims as review signals. The signature is checked only if you
                    choose to run the optional local verification with a key you supply. Neither
                    step establishes that a claim is trustworthy, tests server configuration, or
                    proves that a token is safe to accept.
                </p>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">How signature verification works here</h2>
                <p>
                    A JWS signature covers the ASCII string <code>base64url(header).base64url(payload)</code>{' '}
                    exactly as it appears in the token, not the decoded JSON. For HS256 the signature is{' '}
                    <code>base64url(HMAC-SHA256(secret, signingInput))</code>. This synthetic token was signed with the
                    test secret <code>test-secret-not-for-production-0123456789</code>:
                </p>
                <pre className="whitespace-pre-wrap break-all text-xs">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2lzc3Vlci5leGFtcGxlLnRlc3QiLCJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiYXVkIjoidGVzdC1hdWRpZW5jZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo0MTAyNDQ0ODAwfQ.zcPxWi1Jf8zxdX2k8ZrQ6jGt5luyf-YJQ5fs3xZudJw</pre>
                <p>
                    Paste it above, open &quot;Verify signature locally&quot;, enter that secret, and the check should report a match.
                    Change one character of the secret or the payload and it should report a mismatch. The same check in Node.js:
                </p>
                <pre className="text-xs">{`import { createHmac, timingSafeEqual } from 'node:crypto';
const [header, payload, signature] = token.split('.');
const expected = createHmac('sha256', secret)
  .update(header + '.' + payload)
  .digest();
const given = Buffer.from(signature, 'base64url');
// Constant-time comparison; the length check comes first because timingSafeEqual throws on a mismatch.
console.log(given.length === expected.length && timingSafeEqual(given, expected));`}</pre>
                <p>
                    For RS*, PS*, ES* and EdDSA tokens you paste the issuer&apos;s public key as a PEM
                    (<code>BEGIN PUBLIC KEY</code>), a single JWK, or a JWKS; with a JWKS the token&apos;s <code>kid</code>{' '}
                    selects the key. ES* signatures are the raw <code>r||s</code> form (RFC 7518 section 3.4), and RSA keys under
                    2048 bits are checked but flagged (RFC 7518 sections 3.3 and 3.5). EdDSA means Ed25519 here: an{' '}
                    <code>OKP</code> JWK with <code>crv</code> <code>Ed25519</code> or an SPKI PEM, and a 64-byte signature
                    (<a href="https://www.rfc-editor.org/rfc/rfc8037" rel="noopener noreferrer">RFC 8037</a>). Ed448 is not
                    supported, and a browser whose Web Crypto lacks Ed25519 will say so instead of giving a result. HMAC secrets shorter than the hash
                    output are flagged too (section 3.2). The page does not fetch a JWKS from a URL, and it does not store or send
                    the key.
                </p>
                <p>
                    This page reads the algorithm from the token header only because it is a debugging aid and has no server
                    configuration to consult, and it refuses to use a public key as an HMAC secret. A real verifier must not
                    trust the token&apos;s own <code>alg</code>: RFC 8725 section 3.1 requires the library caller to fix the
                    accepted algorithms and to check that each key is used with exactly one algorithm. See the{' '}
                    <Link href="/blog/jwt-token-vulnerabilities-authentication-security">JWT vulnerabilities and validation guide</Link>{' '}
                    for how <code>alg: none</code> and RS256-to-HS256 confusion happen, and the{' '}
                    <Link href="/tools/jwt-encoder">JWT Encoder</Link> to create HMAC-signed test tokens. A matching signature does not
                    make a token trustworthy: you still need to check <code>iss</code>, <code>aud</code>, <code>exp</code>, the token
                    type, and where the key came from.
                </p>

                <h2 id="jwe" className="text-3xl font-bold text-slate-100 mt-16">Encrypted JWTs (JWE): what you can read without the key</h2>
                <p>
                    A token with five dot-separated parts is a JWE in compact serialization (
                    <a href="https://www.rfc-editor.org/rfc/rfc7516#section-3.1" rel="noopener noreferrer">RFC 7516 section 3.1</a>).
                    Pasting it into a decoder that expects three parts gives an error, and Base64URL-decoding the long middle
                    part gives random-looking bytes, because the claims are encrypted. The parts are:
                </p>
                <div className="not-prose overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead>
                            <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                                <th scope="col" className="py-2 pr-4">Part</th>
                                <th scope="col" className="py-2 pr-4">Readable without the key?</th>
                                <th scope="col" className="py-2">What it holds</th>
                            </tr>
                        </thead>
                        <tbody className="align-top">
                            <tr className="border-b border-slate-800">
                                <th scope="row" className="py-2 pr-4 font-bold text-slate-100">1. Protected header</th>
                                <td className="py-2 pr-4">Yes: Base64URL-encoded JSON</td>
                                <td className="py-2"><code>alg</code> (how the content key is protected), <code>enc</code> (how the content is encrypted), often <code>kid</code>, and <code>cty: &quot;JWT&quot;</code> when the content is another JWT</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <th scope="row" className="py-2 pr-4 font-bold text-slate-100">2. Encrypted key</th>
                                <td className="py-2 pr-4">No</td>
                                <td className="py-2">The content encryption key, encrypted for the recipient. Empty for <code>dir</code> and plain <code>ECDH-ES</code>. With RSA its length equals the recipient&apos;s key size (256 bytes for a 2048-bit key)</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <th scope="row" className="py-2 pr-4 font-bold text-slate-100">3. Initialization vector</th>
                                <td className="py-2 pr-4">Yes, but it is not secret</td>
                                <td className="py-2">96 bits for the AES-GCM algorithms, 128 bits for the AES-CBC with HMAC ones</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <th scope="row" className="py-2 pr-4 font-bold text-slate-100">4. Ciphertext</th>
                                <td className="py-2 pr-4">No</td>
                                <td className="py-2">The encrypted claims (or the encrypted inner JWT). With AES-GCM it is exactly as long as the plaintext, so its length is visible to anyone</td>
                            </tr>
                            <tr>
                                <th scope="row" className="py-2 pr-4 font-bold text-slate-100">5. Authentication tag</th>
                                <td className="py-2 pr-4">No</td>
                                <td className="py-2">Integrity check over the header, IV and ciphertext: 128 bits for AES-GCM and <code>A128CBC-HS256</code>, 192 and 256 bits for the two larger CBC variants</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p>
                    So without the key you can still learn which algorithms and key ID were used, how large the recipient&apos;s RSA key is,
                    and roughly how long the claims are. This page reports those and warns when a size does not fit the declared algorithm
                    (sizes from <a href="https://www.rfc-editor.org/rfc/rfc7518#section-5" rel="noopener noreferrer">RFC 7518 section 5</a>),
                    when the header uses <code>zip</code> (
                    <a href="https://www.rfc-editor.org/rfc/rfc8725#section-3.6" rel="noopener noreferrer">RFC 8725 section 3.6</a>{' '}
                    advises against compressing before encrypting), or <code>RSA1_5</code> (section 3.2 of the same RFC recommends RSAES-OAEP instead).
                </p>
                <h3 className="text-slate-100">Decrypting a JWE locally</h3>
                <p>
                    This synthetic token uses <code>dir</code> with <code>A256GCM</code>: the shared 256-bit key encrypts the claims directly,
                    so part 2 is empty and you can see two dots in a row.
                </p>
                <pre className="whitespace-pre-wrap break-all text-xs">{JWE_EXAMPLE.token}</pre>
                <p>
                    Paste it above, open &quot;Decrypt locally&quot;, and enter the test key{' '}
                    <code className="break-all">{JWE_EXAMPLE.keyHex}</code>. The claims appear, with <code>iat</code> and{' '}
                    <code>exp</code> shown as dates. Change one character of the key, or of any part of the token, and decryption fails
                    as a whole: AES-GCM does not return partial plaintext. The same steps in Node.js:
                </p>
                <pre className="text-xs">{`import { createDecipheriv } from 'node:crypto';
const [header, encryptedKey, iv, ciphertext, tag] = token.split('.');
const decipher = createDecipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), Buffer.from(iv, 'base64url'));
// The additional authenticated data is the header segment exactly as it appears in the token.
decipher.setAAD(Buffer.from(header, 'ascii'));
decipher.setAuthTag(Buffer.from(tag, 'base64url'));
const claims = Buffer.concat([
  decipher.update(Buffer.from(ciphertext, 'base64url')),
  decipher.final(), // throws if the key, header, IV, ciphertext or tag is wrong
]).toString('utf8');`}</pre>
                <p>
                    What you paste depends on <code>alg</code>: the shared key for <code>dir</code>, <code>A128KW</code>/<code>A192KW</code>/<code>A256KW</code>{' '}
                    and <code>A128GCMKW</code>/<code>A192GCMKW</code>/<code>A256GCMKW</code> (as an <code>oct</code> JWK, hex or Base64URL); the
                    recipient&apos;s private key for <code>RSA-OAEP</code>, <code>RSA-OAEP-256</code> and the <code>ECDH-ES</code> family on
                    P-256, P-384 or P-521 (as a PKCS#8 PEM or a JWK); or the password for the <code>PBES2</code> algorithms. All six{' '}
                    <code>enc</code> values from RFC 7518 are handled, and a <code>zip: &quot;DEF&quot;</code> plaintext is inflated up to 1 MiB.
                    The implementation is tested against the worked examples in{' '}
                    <a href="https://www.rfc-editor.org/rfc/rfc7520#section-5" rel="noopener noreferrer">RFC 7520 section 5</a>.{' '}
                    <code>RSA1_5</code> tokens can be inspected but not decrypted, because browsers&apos; Web Crypto does not provide
                    RSAES-PKCS1-v1_5 decryption; X25519 keys and the JSON serialization of JWE are not supported either.
                </p>
                <p>
                    Decrypting needs a secret: the shared key or a private key. Use test keys here, as with HMAC secrets. If the plaintext
                    turns out to be another token (a nested JWT, normally signed and then encrypted), the page offers to decode that
                    inner token so you can check its signature as usual. A JWE that decrypts correctly says nothing about who created it:
                    with <code>RSA-OAEP</code> or <code>ECDH-ES</code> anyone who has the recipient&apos;s public key can encrypt any claims they like,
                    which is why the inner signature matters. The{' '}
                    <Link href="/blog/cve-2026-29000-pac4j-jwt-authentication-bypass-2026">pac4j-jwt CVE-2026-29000 write-up</Link>{' '}
                    describes a library that accepted an unsigned token inside a JWE.
                </p>

                <div className="not-prose my-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                    <h3 className="mb-2 text-lg font-bold text-slate-100">Understand HS256 and JWT validation failures</h3>
                    <p className="mb-4 text-sm leading-relaxed text-slate-400">HS256 is not inherently vulnerable. Learn how weak secrets, algorithm confusion, untrusted key selection, and missing claim checks create real failures.</p>
                    <Link href="/blog/jwt-token-vulnerabilities-authentication-security" className="text-sm font-bold text-emerald-400 hover:text-emerald-300">
                      Read the JWT vulnerabilities and validation guide →
                    </Link>
                </div>

                <h2 className="text-3xl font-bold text-slate-100 mt-16">FAQ</h2>
                <div className="space-y-8 mt-8">
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">Can this tool validate JWT signatures?</h4>
                        <p className="text-slate-400 mb-0">Optionally, for HS256/384/512, RS256/384/512, PS256/384/512, ES256/384/512 and EdDSA (Ed25519 only, in browsers whose Web Crypto supports it). Click Verify signature locally and supply the shared secret or the public key (PEM, JWK or JWKS); the check runs in this browser tab with Web Crypto and the key is not stored or sent. It checks the signature only, not <code>iss</code>, <code>aud</code>, <code>exp</code> or whether you should trust the key, and a real verifier must fix the accepted algorithm itself instead of reading it from the token.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">Does it support encrypted JWTs (JWE)?</h4>
                        <p className="text-slate-400 mb-0">Yes, in compact form (five parts). Without a key it shows the protected header (<code>alg</code>, <code>enc</code>, <code>kid</code>) and the size of the encrypted key, IV, ciphertext and tag. With a test key you paste it decrypts locally for <code>dir</code>, AES Key Wrap, AES-GCM key wrap, <code>RSA-OAEP</code>, <code>RSA-OAEP-256</code>, <code>ECDH-ES</code> on the NIST curves and <code>PBES2</code>. <code>RSA1_5</code> can be inspected but not decrypted, and the JSON serialization is not supported. A JWE that decrypts is not thereby authentic.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <h4 className="text-slate-100 mt-0">What timestamps are automatically converted?</h4>
                        <p className="text-slate-400 mb-0">The decoder recognizes <code>exp</code> (expiration), <code>iat</code> (issued at), <code>nbf</code> (not before), and <code>auth_time</code> (authentication time) claims and displays them as human-readable dates. Only <code>exp</code> can mark a token as expired; the others are shown as times, with a note when <code>nbf</code> has not been reached or <code>iat</code> lies in the future.</p>
                    </div>
                </div>
            </article>
        </section>

      </div>
    </main>
  );
}
