'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Code2, Copy, Eye, Lock, Trash2 } from 'lucide-react';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inlineMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function markdownToHtml(markdown: string) {
  const escaped = escapeHtml(markdown).replace(/\r\n/g, '\n');
  const blocks = escaped.split(/\n\n+/).filter(Boolean);

  return blocks.map((block) => {
    const lines = block.split('\n');

    if (lines.every((line) => /^-\s+/.test(line))) {
      const items = lines.map((line) => `<li>${inlineMarkdown(line.replace(/^-\s+/, ''))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }

    if (lines[0]?.startsWith('### ')) return `<h3>${inlineMarkdown(lines[0].slice(4))}</h3>`;
    if (lines[0]?.startsWith('## ')) return `<h2>${inlineMarkdown(lines[0].slice(3))}</h2>`;
    if (lines[0]?.startsWith('# ')) return `<h1>${inlineMarkdown(lines[0].slice(2))}</h1>`;
    if (lines[0]?.startsWith('> ')) return `<blockquote>${inlineMarkdown(lines.map((line) => line.replace(/^>\s?/, '')).join('<br/>'))}</blockquote>`;

    return `<p>${inlineMarkdown(lines.join('<br/>'))}</p>`;
  }).join('');
}

export default function MarkdownToHtmlTool() {
  const [markdown, setMarkdown] = useState('# OpSecForge\n\n- Local preview\n- Copy-ready HTML\n\n**Bold** text, *italic* text, and [links](https://opsecforge.com).');
  const [tab, setTab] = useState<'preview' | 'html'>('preview');
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  const copyHtml = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">Markdown HTML</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Local Markdown Rendering</span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            Markdown to HTML Previewer
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Edit Markdown on the left and inspect rendered or raw HTML on the right
            </span>
          </h1>
        </section>

        <section className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-800 pb-6">
            <button onClick={copyHtml} className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 inline-flex items-center gap-2">{copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy HTML'}</button>
            <button onClick={() => setMarkdown('')} className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-sm font-bold text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/15 inline-flex items-center gap-2"><Trash2 size={16} />Clear</button>
            <div className="ml-auto flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/60 p-1.5">
              <button onClick={() => setTab('preview')} className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${tab === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}><Eye size={14} className="inline mr-2" />Preview</button>
              <button onClick={() => setTab('html')} className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${tab === 'html' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}><Code2 size={14} className="inline mr-2" />Raw HTML</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <label className="px-1 text-sm font-bold uppercase tracking-widest text-slate-400">Markdown Input</label>
              <textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} className="h-[480px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950/70 p-6 font-mono text-sm leading-7 text-cyan-300 outline-none transition-all placeholder:text-slate-700 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20" spellCheck={false} />
            </div>
            <div className="flex flex-col gap-3">
              <label className="px-1 text-sm font-bold uppercase tracking-widest text-slate-400">{tab === 'preview' ? 'Live Preview' : 'Raw HTML'}</label>
              {tab === 'preview' ? (
                <div className="h-[480px] overflow-auto rounded-3xl border border-slate-800 bg-slate-950 p-6 prose prose-invert prose-slate max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              ) : (
                <textarea readOnly value={html} className="h-[480px] w-full resize-none rounded-3xl border border-slate-800 bg-slate-950 p-6 font-mono text-sm leading-7 text-emerald-300 outline-none" spellCheck={false} />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
