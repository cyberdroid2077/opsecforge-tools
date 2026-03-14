'use client';

import React, { useMemo, useRef } from 'react';
import Link from 'next/link';
import { Download, Lock, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react/lib/esm';

export default function QrGeneratorTool() {
  const [text, setText] = React.useState('https://opsecforge.com');
  const [foreground, setForeground] = React.useState('#00ff9c');
  const [background, setBackground] = React.useState('#020617');
  const [size, setSize] = React.useState(256);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fileName = useMemo(() => {
    const base = text.trim() || 'qr-code';
    return `${base.slice(0, 24).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'qr-code'}.png`;
  }, [text]);

  const downloadPng = async () => {
    const svg = wrapperRef.current?.querySelector('svg');
    if (!svg) {
      return;
    }

    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }

      context.fillStyle = background;
      context.fillRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);
      const png = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = png;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">QR Generator</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Offline QR Rendering</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            QR Code Generator
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Render links and payloads into downloadable QR codes locally
            </span>
          </h1>
        </section>

        <section className="mb-24 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
            <label className="mb-3 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Text Or URL</label>
            <textarea value={text} onChange={(event) => setText(event.target.value)} className="mb-6 h-44 w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-6 font-mono text-sm leading-6 text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20" spellCheck={false} />

            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                <span className="mb-3 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Foreground</span>
                <div className="flex items-center gap-3">
                  <input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="h-11 w-16 rounded border-0 bg-transparent" />
                  <code className="font-mono text-emerald-300">{foreground}</code>
                </div>
              </label>
              <label className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                <span className="mb-3 block text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Background</span>
                <div className="flex items-center gap-3">
                  <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-11 w-16 rounded border-0 bg-transparent" />
                  <code className="font-mono text-emerald-300">{background}</code>
                </div>
              </label>
            </div>

            <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
              <div className="mb-3 flex items-center justify-between gap-4">
                <label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Size</label>
                <span className="font-mono text-lg text-emerald-400">{size}px</span>
              </div>
              <input type="range" min={128} max={512} step={16} value={size} onChange={(event) => setSize(Number(event.target.value))} className="w-full accent-emerald-500" />
            </div>

            <button onClick={downloadPng} disabled={!text.trim()} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] disabled:opacity-50">
              <Download size={16} />
              Download PNG
            </button>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8 flex items-center justify-center">
            <div ref={wrapperRef} className="rounded-[2rem] border border-slate-800 p-8" style={{ backgroundColor: background }}>
              {text.trim() ? (
                <QRCodeSVG value={text} size={size} fgColor={foreground} bgColor={background} includeMargin level="M" />
              ) : (
                <div className="h-64 w-64 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <QrCode size={40} />
                  <span className="text-xs font-bold uppercase tracking-[0.22em]">Waiting for input</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
