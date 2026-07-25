'use client';

import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Lock, RefreshCw, Webhook } from 'lucide-react';
import Link from 'next/link';
import {
  verifyGenericWebhook,
  verifyGitHubWebhook,
  verifyStripeWebhook,
} from '@/lib/webhook-verifier';
import type { HmacAlgorithm } from '@/lib/webhook-verifier';

type Provider = 'generic' | 'github' | 'stripe';

type DisplayResult = {
  status: 'pass' | 'fail' | 'warning' | 'error';
  title: string;
  message: string;
  detail?: string;
};

const providers: Array<{ id: Provider; label: string; description: string }> = [
  { id: 'generic', label: 'Generic HMAC', description: 'Raw hex digest with an explicit algorithm' },
  { id: 'github', label: 'GitHub', description: 'X-Hub-Signature-256 over the exact raw body' },
  { id: 'stripe', label: 'Stripe', description: 'Stripe-Signature v1 plus timestamp tolerance' },
];

const algorithms: Array<{ id: HmacAlgorithm; label: string }> = [
  { id: 'sha256', label: 'HMAC-SHA256' },
  { id: 'sha512', label: 'HMAC-SHA512' },
  { id: 'sha1', label: 'HMAC-SHA1 (legacy)' },
];

export default function WebhookDebugger() {
  const [payload, setPayload] = useState('{\n  "id": "evt_synthetic",\n  "type": "example.created"\n}');
  const [secret, setSecret] = useState('');
  const [signature, setSignature] = useState('');
  const [provider, setProvider] = useState<Provider>('generic');
  const [algorithm, setAlgorithm] = useState<HmacAlgorithm>('sha256');
  const [tolerance, setTolerance] = useState(300);
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const resetResult = () => setResult(null);

  const selectProvider = (nextProvider: Provider) => {
    setProvider(nextProvider);
    setSignature('');
    setResult(null);
  };

  const verifySignature = async () => {
    if (!payload || !secret || !signature) return;
    setVerifying(true);
    setResult(null);

    try {
      if (provider === 'github') {
        const matched = await verifyGitHubWebhook({
          payload,
          secret,
          signatureHeader: signature,
        });
        setResult(
          matched
            ? {
                status: 'pass',
                title: 'Supplied GitHub values match',
                message: 'The pasted X-Hub-Signature-256 value matches this exact body and secret.',
                detail: 'A live receiver must also protect the configured secret and handle duplicate delivery IDs. This browser check does not observe the real request source.',
              }
            : {
                status: 'fail',
                title: 'Signature mismatch',
                message: 'The pasted GitHub signature does not match this exact body and secret.',
                detail: 'Confirm the unmodified UTF-8 request body, webhook secret, and complete sha256= header value.',
              },
        );
      } else if (provider === 'stripe') {
        const stripeResult = await verifyStripeWebhook({
          payload,
          secret,
          signatureHeader: signature,
          toleranceSeconds: tolerance,
        });

        if (!stripeResult.signatureMatched) {
          setResult({
            status: 'fail',
            title: 'Stripe signature mismatch',
            message: 'No valid v1 signature matches timestamp.rawBody with the supplied endpoint secret.',
            detail: 'Use the exact unmodified request body and the endpoint-specific signing secret.',
          });
        } else if (!stripeResult.withinTolerance) {
          setResult({
            status: 'warning',
            title: 'Signature matches, timestamp outside tolerance',
            message: `The v1 signature matches, but the timestamp differs from this device clock by ${Math.abs(stripeResult.ageSeconds)} seconds.`,
            detail: 'Do not accept this result as current. Production verification should use a synchronized server clock and Stripe’s official library.',
          });
        } else {
          setResult({
            status: 'pass',
            title: 'Supplied Stripe values match',
            message: `A v1 signature matches and the timestamp is within the ${tolerance}-second tolerance of this device clock.`,
            detail: 'This local check does not process the event, prevent duplicate event IDs, or prove how the pasted values were obtained. Use Stripe’s official library in production.',
          });
        }
      } else {
        const matched = await verifyGenericWebhook({ payload, secret, signature, algorithm });
        setResult(
          matched
            ? {
                status: 'pass',
                title: 'Supplied HMAC values match',
                message: `The digest matches this exact body and secret using ${algorithm.toUpperCase()}.`,
                detail: 'Generic HMAC matching has no provider timestamp or replay semantics. It does not establish the request source.',
              }
            : {
                status: 'fail',
                title: 'Signature mismatch',
                message: `The digest does not match this exact body and secret using ${algorithm.toUpperCase()}.`,
              },
        );
      }
    } catch (error) {
      setResult({
        status: 'error',
        title: 'Could not verify',
        message: error instanceof Error ? error.message : 'The supplied values could not be parsed.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const signatureLabel = provider === 'github'
    ? 'X-Hub-Signature-256'
    : provider === 'stripe'
      ? 'Stripe-Signature'
      : 'Expected HMAC digest';

  const signaturePlaceholder = provider === 'github'
    ? 'sha256=...'
    : provider === 'stripe'
      ? 't=...,v1=...'
      : 'Hex digest, with optional sha256= prefix';

  const resultStyles = {
    pass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    fail: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    error: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-slate-950 p-6 font-sans selection:bg-emerald-500/30 lg:p-24">
      <div className="z-10 w-full max-w-6xl font-sans text-slate-300">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Webhook Verifier</span>
        </div>

        <header className="mb-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-rose-400 shadow-sm">
            <Webhook size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Paste-only • Client-side verification</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-100 lg:text-5xl">
            Webhook Signature Verifier <br />
            <span className="text-3xl font-medium text-slate-400">Compare exact bytes without uploading secrets</span>
          </h1>
          <p className="mb-4 max-w-3xl text-lg leading-relaxed text-slate-400">
            Verify Generic HMAC, GitHub <code>X-Hub-Signature-256</code>, or Stripe
            <code> Stripe-Signature</code> values using the exact raw request body.
          </p>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
            Payloads, signatures, and secrets stay in this browser tab. They are not fetched,
            uploaded, stored, logged, or included in analytics events.
          </p>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          {providers.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectProvider(item.id)}
              className={`rounded-2xl border p-5 text-left transition-all ${
                provider === item.id
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <span className="block font-bold text-slate-100">{item.label}</span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">{item.description}</span>
            </button>
          ))}
        </section>

        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <label className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Exact raw request body
            </label>
            <textarea
              value={payload}
              onChange={(event) => {
                setPayload(event.target.value);
                resetResult();
              }}
              className="h-[420px] w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 p-6 font-mono text-sm outline-none transition-all focus:border-emerald-500/50"
              placeholder="Paste the unmodified raw request body here..."
              spellCheck={false}
            />
            <p className="text-xs leading-5 text-slate-500">
              Whitespace, line endings, encoding, and key order change the signed bytes. Do not
              reformat JSON before verification.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
              {provider === 'generic' && (
                <div>
                  <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Algorithm
                  </label>
                  <div className="flex flex-col gap-2">
                    {algorithms.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setAlgorithm(item.id);
                          resetResult();
                        }}
                        className={`rounded-xl border px-4 py-2 text-left text-xs font-bold transition-all ${
                          algorithm === item.id
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Signing secret
                </label>
                <input
                  type="password"
                  value={secret}
                  onChange={(event) => {
                    setSecret(event.target.value);
                    resetResult();
                  }}
                  placeholder="Paste locally; never use a secret from chat or logs"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm outline-none transition-all focus:border-emerald-500/50"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {signatureLabel}
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(event) => {
                    setSignature(event.target.value);
                    resetResult();
                  }}
                  placeholder={signaturePlaceholder}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm outline-none transition-all focus:border-emerald-500/50"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>

              {provider === 'stripe' && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Timestamp tolerance (seconds)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={86400}
                    value={tolerance}
                    onChange={(event) => {
                      setTolerance(Number(event.target.value));
                      resetResult();
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm outline-none transition-all focus:border-emerald-500/50"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Default: 300 seconds. This check uses your device clock and must not be disabled.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={verifySignature}
                disabled={!payload || !secret || !signature || verifying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={18} /> {verifying ? 'Verifying…' : 'Verify supplied values'}
              </button>
            </div>

            {result && (
              <div className={`rounded-3xl border p-7 ${resultStyles[result.status]}`}>
                <div className="mb-3 flex items-center gap-3">
                  {result.status === 'pass'
                    ? <CheckCircle2 size={24} />
                    : <AlertTriangle size={24} />}
                  <h2 className="text-lg font-bold tracking-tight">{result.title}</h2>
                </div>
                <p className="text-sm leading-6 opacity-90">{result.message}</p>
                {result.detail && (
                  <p className="mt-3 border-t border-current/20 pt-3 text-xs leading-5 opacity-75">
                    {result.detail}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="mb-24 rounded-3xl border border-slate-800 bg-slate-900/30 p-8 lg:p-12">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-100">
            <Lock className="text-emerald-500" size={20} /> Boundaries that still matter in production
          </h2>
          <ul className="grid gap-5 text-sm leading-6 text-slate-400 md:grid-cols-2">
            <li><strong>Verify before parsing.</strong> Capture the exact raw bytes before middleware changes the body.</li>
            <li><strong>Use official provider libraries.</strong> This page is a debugging aid, not receiver middleware.</li>
            <li><strong>Handle replay separately.</strong> Enforce timestamp tolerance where defined and deduplicate provider delivery or event IDs.</li>
            <li><strong>Protect the secret.</strong> A match is meaningful only if the configured signing secret is controlled by the expected parties.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-5 text-sm font-bold">
            <a
              href="https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              GitHub validation documentation ↗
            </a>
            <a
              href="https://docs.stripe.com/webhooks"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Stripe webhook documentation ↗
            </a>
          </div>
          <Link href="/" className="mt-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-emerald-400">
            Back to Hub <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}
