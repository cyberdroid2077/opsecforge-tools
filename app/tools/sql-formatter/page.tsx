'use client';

import React, { useMemo, useState } from 'react';
import { 
  Database, 
  Copy, 
  Shield, 
  Check, 
  AlertTriangle,
  Settings,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import {
  DEFAULT_SQL,
  SQLFormatter,
  type FormatOptions,
  type SQLDialect,
} from '@/lib/sql-formatter';
import { SQL_GUIDE_EXAMPLE } from '@/lib/tool-guide-examples';

export default function SQLFormatterPage() {
  const [input, setInput] = useState(DEFAULT_SQL);
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [dialect, setDialect] = useState<SQLDialect>('standard');
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [options, setOptions] = useState<FormatOptions>({
    indentSize: 2,
    uppercaseKeywords: true,
    commaPosition: 'after',
    maxLineLength: 120
  });

  const formatter = useMemo(() => new SQLFormatter(options, dialect), [options, dialect]);
  const output = useMemo(() => {
    try {
      return mode === 'format' ? formatter.format(input) : formatter.minify(input);
    } catch (error) {
      return `-- Error processing SQL: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }, [formatter, input, mode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 font-sans selection:bg-emerald-500/30">
      <div className="z-10 w-full max-w-6xl font-sans text-slate-300">
        
        {/* Breadcrumb */}
        <div className="mb-12 text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-400 transition-colors">OpSecForge Hub</Link>
          <span>/</span>
          <span className="text-slate-300">SQL Formatter</span>
        </div>

        {/* Tool Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 shadow-sm">
            <Shield size={14} />
            <span className="text-xs font-bold tracking-wider uppercase">Local Processing • No Tool-Input Upload</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            PostgreSQL & MySQL Formatter <br/>
            <span className="text-slate-400 font-medium text-3xl">Beautify Queries Without Data Exposure</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg mb-8 leading-relaxed">
            Lay out or compact SQL queries entirely in your browser: one column per line, joins and clauses on their own lines, adjustable indentation and keyword casing. It is a text formatter, not a SQL parser.
          </p>
        </div>

        {/* Workspace */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 mb-24 backdrop-blur-sm">
            {/* Controls */}
            <div className="mb-8 flex flex-wrap items-center gap-6">
                <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
                    <button onClick={() => setMode('format')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'format' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Format</button>
                    <button onClick={() => setMode('minify')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'minify' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Minify</button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dialect:</span>
                    <select value={dialect} onChange={(e) => setDialect(e.target.value as SQLDialect)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-200 outline-none focus:border-emerald-500/50">
                        <option value="standard">Standard</option>
                        <option value="mysql">MySQL</option>
                        <option value="postgresql">PostgreSQL</option>
                    </select>
                </div>

                <button onClick={() => setShowOptions(!showOptions)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${showOptions ? 'bg-slate-700 border-slate-600 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
                    <Settings size={16} /> Options <ChevronDown className={`transition-transform ${showOptions ? 'rotate-180' : ''}`} size={16} />
                </button>

                <div className="ml-auto">
                    <button onClick={handleCopy} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-500/10">
                        {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Results</>}
                    </button>
                </div>
            </div>

            <p className="mb-8 text-sm leading-relaxed text-amber-300/90">
              This tool preserves quoted strings, comments, PostgreSQL dollar-quoted bodies, and common dialect operators, but it does not parse, validate, or execute SQL. It lays out SELECT, INSERT, UPDATE and DELETE statements; other statements (for example CREATE TABLE) are mostly left on one line. Review vendor-specific syntax before running the result.
            </p>

            {showOptions && mode === 'format' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-slate-950/30 border border-slate-800 rounded-2xl mb-8 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Indent Size</label>
                        <input type="range" min="1" max="8" value={options.indentSize} onChange={(e) => setOptions({...options, indentSize: parseInt(e.target.value)})} className="w-full accent-emerald-500" />
                        <div className="text-xs font-bold text-emerald-500">{options.indentSize} spaces</div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Keywords</label>
                        <select value={options.uppercaseKeywords ? 'upper' : 'lower'} onChange={(e) => setOptions({...options, uppercaseKeywords: e.target.value === 'upper'})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm">
                            <option value="upper">UPPERCASE</option>
                            <option value="lower">lowercase</option>
                        </select>
                    </div>
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Comma Position</label>
                        <select value={options.commaPosition} onChange={(e) => setOptions({...options, commaPosition: e.target.value as 'after' | 'before'})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm">
                            <option value="after">After (Standard)</option>
                            <option value="before">Before (Leading)</option>
                        </select>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Raw Input</label>
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full h-[500px] bg-slate-950/50 border border-slate-800 rounded-2xl p-6 font-mono text-sm focus:border-emerald-500/50 outline-none resize-none" placeholder="Paste SQL query here..." />
                </div>
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Result</label>
                    <textarea readOnly value={output} className="w-full h-[500px] bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono text-sm text-emerald-400/80 outline-none resize-none" />
                </div>
            </div>
        </div>

        {/* SEO Section */}
        <section className="max-w-4xl mx-auto border-t border-slate-900 pt-24 pb-48">
            <article className="prose prose-invert prose-slate lg:prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-slate-100">Why Local SQL Formatting Reduces Data Exposure</h2>
                <p className="text-slate-400">
                    Production SQL can contain internal schema names, identifiers, customer data, and business logic. A server-backed formatter may receive that query under its own retention and logging practices, so review those practices before sharing sensitive SQL.
                </p>

                <div className="grid gap-12 md:grid-cols-2 mt-12">
                    <div>
                        <h4 className="text-slate-100 font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-rose-500" size={18} /> The PII Leakage Risk
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Queries like <code>SELECT * FROM users WHERE email = &apos;...&apos;</code> can contain personal data. Sending them to a third-party formatter creates an additional data-transfer and handling path.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-slate-100 font-bold mb-4 flex items-center gap-2">
                            <Database className="text-amber-500" size={18} /> Reconnaissance Risk
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Table names, joins, and filters can reveal application structure. Treat production queries as sensitive operational context even when they contain no row data.
                        </p>
                    </div>
                </div>

                <div className="mt-16 p-8 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-2xl">
                    <h3 className="text-emerald-400 mt-0 flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" size={24} /> The Local Solution
                    </h3>
                    <p className="text-slate-300">
                        OpsecForge formats the SQL in the loaded browser page and does not send the query to a formatting backend. This reduces one data-transfer path but does not by itself establish GDPR, SOC 2, HIPAA, or other compliance.
                    </p>
                </div>

                <h2 className="mt-16 text-3xl font-bold text-slate-100">A worked example</h2>
                <p className="text-slate-400">
                    Paste the single line below into the input box with Standard dialect and default options. Multi-word keywords such as{' '}
                    <code>LEFT JOIN</code>, <code>GROUP BY</code>, <code>ORDER BY</code> and <code>UNION ALL</code> stay together on
                    one line, and a SELECT list with more than one column puts each column on its own line.
                </p>
                <div className="not-prose grid min-w-0 gap-4 md:grid-cols-2">
                    <figure className="min-w-0">
                        <figcaption className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Input</figcaption>
                        <pre tabIndex={0} aria-label="Example input (scrollable)" className="max-w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-cyan-300">{SQL_GUIDE_EXAMPLE.input}</pre>
                    </figure>
                    <figure className="min-w-0">
                        <figcaption className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Output</figcaption>
                        <pre tabIndex={0} aria-label="Example output (scrollable)" className="max-w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-emerald-300">{SQL_GUIDE_EXAMPLE.output}</pre>
                    </figure>
                </div>

                <h2 className="mt-16 text-3xl font-bold text-slate-100">What the dialect setting changes</h2>
                <p className="text-slate-400">
                    The three settings share one layout engine. The dialect changes only two things: which extra words are treated as
                    keywords (for example <code>ILIKE</code>, <code>JSONB</code> and <code>RETURNING</code> in PostgreSQL;{' '}
                    <code>ENGINE</code>, <code>UNSIGNED</code> and <code>CHARSET</code> in MySQL) and whether PostgreSQL
                    dollar-quoted strings such as <code>$$ ... $$</code> are kept as one token. Backtick-quoted identifiers and operators
                    like <code>-&gt;&gt;</code> and <code>::</code> are recognised in every mode. No dialect-specific syntax is checked:
                    the formatter will lay out invalid SQL without complaint.
                </p>
                <p className="text-slate-400">
                    Concretely, <code>{SQL_GUIDE_EXAMPLE.returningInput}</code> puts <code>RETURNING id</code> on its own line in
                    PostgreSQL mode. In Standard and MySQL modes <code>returning</code> is not a keyword, so it is left as typed on the{' '}
                    <code>VALUES</code> line.
                </p>
            </article>
        </section>
      </div>
    </main>
  );
}

import { ShieldCheck } from 'lucide-react';
