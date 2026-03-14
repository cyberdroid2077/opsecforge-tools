'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Lock, RefreshCw, ShieldCheck } from 'lucide-react';

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*',
};

function randomIndex(max: number) {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
}

function generatePassword(length: number, pools: string[]) {
  const merged = pools.join('');

  if (!merged) {
    return '';
  }

  const required = pools.map((pool) => pool[randomIndex(pool.length)]);
  const generated = [...required];

  while (generated.length < length) {
    generated.push(merged[randomIndex(merged.length)]);
  }

  for (let index = generated.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [generated[index], generated[swapIndex]] = [generated[swapIndex], generated[index]];
  }

  return generated.join('').slice(0, length);
}

export default function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const activePools = useMemo(
    () => Object.entries(options).filter(([, enabled]) => enabled).map(([key]) => CHARSETS[key as keyof typeof CHARSETS]),
    [options]
  );

  const strength = useMemo(() => {
    const variety = activePools.length;

    if (length >= 24 && variety === 4) {
      return { label: 'Hacker-Proof', tone: 'text-emerald-400', bar: 'bg-emerald-500' };
    }
    if (length >= 16 && variety >= 3) {
      return { label: 'Strong', tone: 'text-cyan-400', bar: 'bg-cyan-500' };
    }
    if (length >= 12 && variety >= 2) {
      return { label: 'Medium', tone: 'text-amber-400', bar: 'bg-amber-500' };
    }
    return { label: 'Weak', tone: 'text-rose-400', bar: 'bg-rose-500' };
  }, [activePools.length, length]);

  const buildPassword = () => {
    setPassword(generatePassword(length, activePools));
    setCopied(false);
  };

  const copyPassword = async () => {
    if (!password) {
      return;
    }

    await navigator.clipboard.writeText(password);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Password Generator</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Crypto-Secure Generation</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            Secure Password Generator
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Generate hardened credentials locally with Web Crypto randomness
            </span>
          </h1>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-950 p-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Generated Password</span>
              <button
                onClick={copyPassword}
                disabled={!password}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-50"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="break-all font-mono text-2xl leading-10 text-emerald-300 min-h-10">
              {password || 'Press generate to mint a fresh password.'}
            </div>
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Length</label>
                <span className="font-mono text-lg text-emerald-400">{length}</span>
              </div>
              <input
                type="range"
                min={8}
                max={128}
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="mt-2 flex justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                <span>8</span>
                <span>128</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Password Strength</div>
              <div className={`mb-3 text-2xl font-bold ${strength.tone}`}>{strength.label}</div>
              <div className="h-3 rounded-full bg-slate-800">
                <div
                  className={`h-3 rounded-full ${strength.bar}`}
                  style={{ width: `${strength.label === 'Weak' ? 25 : strength.label === 'Medium' ? 50 : strength.label === 'Strong' ? 75 : 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(options).map(([key, enabled]) => (
              <label key={key} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30"
                />
                {key === 'uppercase' && 'Uppercase Letters'}
                {key === 'lowercase' && 'Lowercase Letters'}
                {key === 'numbers' && 'Numbers'}
                {key === 'symbols' && 'Symbols'}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={buildPassword}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]"
            >
              <RefreshCw size={16} />
              Generate Password
            </button>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Browser-only entropy via `crypto.getRandomValues`
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
