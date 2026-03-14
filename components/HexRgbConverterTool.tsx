'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Droplets, Lock } from 'lucide-react';

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function componentToHex(value: number) {
  return clamp(value).toString(16).padStart(2, '0');
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  const full = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return null;
  }
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const diff = max - min;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    switch (max) {
      case red:
        h = (green - blue) / diff + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / diff + 2;
        break;
      default:
        h = (red - green) / diff + 4;
        break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export default function HexRgbConverterTool() {
  const [hexInput, setHexInput] = useState('#00ff9c');
  const [rgb, setRgb] = useState({ r: 0, g: 255, b: 156 });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const syncFromHex = (value: string) => {
    setHexInput(value);
    const parsed = hexToRgb(value);
    if (parsed) {
      setRgb(parsed);
    }
  };

  const syncFromRgb = (channel: 'r' | 'g' | 'b', value: string) => {
    const numeric = clamp(Number(value || 0));
    const next = { ...rgb, [channel]: numeric };
    setRgb(next);
    setHexInput(`#${componentToHex(next.r)}${componentToHex(next.g)}${componentToHex(next.b)}`);
  };

  const formats = useMemo(() => {
    const hex = `#${componentToHex(rgb.r)}${componentToHex(rgb.g)}${componentToHex(rgb.b)}`;
    const cssRgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return { hex, cssRgb, hsl };
  }, [rgb]);

  const copyValue = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Hex RGB</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Two-Way Color Sync</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            Hex to RGB Color Converter
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Convert color values live and copy CSS-ready outputs
            </span>
          </h1>
        </section>

        <section className="mb-24 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
            <div className="mb-6">
              <label className="mb-3 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Hex Input</label>
              <input type="text" value={hexInput} onChange={(event) => syncFromHex(event.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-lg text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {(['r', 'g', 'b'] as const).map((channel) => (
                <label key={channel} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="mb-3 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{channel.toUpperCase()}</span>
                  <input type="number" min={0} max={255} value={rgb[channel]} onChange={(event) => syncFromRgb(channel, event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 font-mono text-lg text-cyan-300 outline-none" />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
            <div className="mb-6 rounded-3xl border border-slate-800 p-6" style={{ background: formats.hex }}>
              <div className="h-32 rounded-2xl border border-white/20 bg-transparent" />
            </div>
            {[{ key: 'rgb', label: 'rgb()', value: formats.cssRgb }, { key: 'hex', label: 'Hex', value: formats.hex }, { key: 'hsl', label: 'hsl()', value: formats.hsl }].map((row) => (
              <div key={row.key} className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{row.label}</span>
                  <button onClick={() => copyValue(row.key, row.value)} className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                    {copiedKey === row.key ? <Check size={14} /> : <Copy size={14} />} Copy
                  </button>
                </div>
                <div className="font-mono text-sm text-emerald-300">{row.value}</div>
              </div>
            ))}
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 inline-flex items-center gap-2">
              <Droplets size={14} className="text-emerald-500" /> Live preview and two-way binding
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
