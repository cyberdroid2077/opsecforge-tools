'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Database, 
  Code2, 
  Copy, 
  Trash2, 
  Shield, 
  Check, 
  AlertTriangle,
  FileCode,
  Minimize2,
  Settings,
  ChevronDown,
  Info,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

// ============================================
// SQL PARSER & FORMATTER - CLIENT-SIDE ONLY
// ============================================

type SQLDialect = 'standard' | 'mysql' | 'postgresql';

interface FormatOptions {
  indentSize: number;
  uppercaseKeywords: boolean;
  commaPosition: 'after' | 'before';
  maxLineLength: number;
}

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
  'ALTER', 'TABLE', 'INDEX', 'VIEW', 'TRIGGER', 'PROCEDURE', 'FUNCTION',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'ON', 'USING',
  'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'EXISTS', 'BETWEEN', 'LIKE',
  'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
  'DISTINCT', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'WHILE',
  'VALUES', 'SET', 'INTO', 'DEFAULT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'UNIQUE', 'CHECK', 'CONSTRAINT', 'AUTO_INCREMENT', 'SERIAL', 'BIGINT',
  'VARCHAR', 'CHAR', 'TEXT', 'INT', 'INTEGER', 'DECIMAL', 'NUMERIC',
  'FLOAT', 'DOUBLE', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'BOOLEAN',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION'
]);

const MYSQL_KEYWORDS = new Set([
  'ENGINE', 'CHARSET', 'COLLATE', 'AUTO_INCREMENT', 'UNSIGNED', 'ZEROFILL',
  'COMMENT', 'DELIMITER', 'LIMIT', 'OFFSET'
]);

const PG_KEYWORDS = new Set([
  'RETURNING', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'UUID', 'JSON',
  'JSONB', 'ARRAY', 'ILIKE', 'SIMILAR', 'TO', 'WINDOW', 'OVER',
  'PARTITION', 'RANGE', 'ROWS', 'PRECEDING', 'FOLLOWING', 'UNBOUNDED',
  'CURRENT', 'ROW'
]);

class SQLFormatter {
  private options: FormatOptions;
  private dialect: SQLDialect;

  constructor(options: FormatOptions, dialect: SQLDialect) {
    this.options = options;
    this.dialect = dialect;
  }

  private getAllKeywords(): Set<string> {
    const keywords = new Set(KEYWORDS);
    if (this.dialect === 'mysql') {
      MYSQL_KEYWORDS.forEach(k => keywords.add(k));
    } else if (this.dialect === 'postgresql') {
      PG_KEYWORDS.forEach(k => keywords.add(k));
    }
    return keywords;
  }

  private tokenize(sql: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let commentType = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1];

      if (!inString && !inComment) {
        if (char === '-' && nextChar === '-') {
          if (current) tokens.push(current);
          current = '';
          inComment = true;
          commentType = 'line';
          i++;
          continue;
        }
        if (char === '/' && nextChar === '*') {
          if (current) tokens.push(current);
          current = '';
          inComment = true;
          commentType = 'block';
          i++;
          continue;
        }
      }

      if (inComment) {
        if (commentType === 'line' && char === '\n') {
          tokens.push(current.trim());
          current = '';
          inComment = false;
        } else if (commentType === 'block' && char === '*' && nextChar === '/') {
          current += char;
          tokens.push(current.trim());
          current = '';
          inComment = false;
          i++;
        } else {
          current += char;
        }
        continue;
      }

      if (!inString && (char === "'" || char === '"' || char === '`')) {
        if (current) tokens.push(current);
        current = char;
        inString = true;
        stringChar = char;
        continue;
      }

      if (inString) {
        current += char;
        if (char === stringChar && sql[i - 1] !== '\\') {
          tokens.push(current);
          current = '';
          inString = false;
        }
        continue;
      }

      if (['(', ')', ',', ';', '+', '-', '*', '/', '=', '<', '>', '!'].includes(char)) {
        if (current) tokens.push(current);
        if ((char === '<' && nextChar === '=') || 
            (char === '>' && nextChar === '=') ||
            (char === '!' && nextChar === '=') ||
            (char === '<' && nextChar === '>')) {
          tokens.push(char + nextChar);
          i++;
        } else {
          tokens.push(char);
        }
        current = '';
        continue;
      }

      if (/\s/.test(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current) tokens.push(current);
    return tokens.filter(t => t.length > 0);
  }

  format(sql: string): string {
    if (!sql.trim()) return '';

    const tokens = this.tokenize(sql);
    const keywords = this.getAllKeywords();
    let result = '';
    let indentLevel = 0;
    let lineLength = 0;
    const indent = ' '.repeat(this.options.indentSize);

    const getIndent = () => indent.repeat(Math.max(0, indentLevel));

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const upperToken = token.toUpperCase();
      const nextToken = tokens[i + 1];

      if (token.startsWith('--') || token.startsWith('/*')) {
        if (result && !result.endsWith('\n')) {
          result += '\n';
        }
        result += getIndent() + token + '\n';
        lineLength = 0;
        continue;
      }

      if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) {
        result += token;
        lineLength += token.length;
        continue;
      }

      if (keywords.has(upperToken)) {
        const formattedKeyword = this.options.uppercaseKeywords ? upperToken : token;
        const clauseStarters = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'UNION', 'INSERT', 'UPDATE', 'DELETE', 'VALUES', 'SET', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS'];
        
        if (clauseStarters.includes(upperToken)) {
          if (['LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS'].includes(upperToken)) {
            if (nextToken && ['JOIN', 'OUTER'].includes(nextToken.toUpperCase())) {
              result += (result ? ' ' : '') + formattedKeyword;
              lineLength += formattedKeyword.length + 1;
              continue;
            }
          }

          if (result && !result.endsWith('\n') && !result.endsWith(' ')) {
            result += '\n';
          }
          if (result.endsWith('\n')) {
            result += getIndent();
          }
          result += formattedKeyword;
          lineLength = getIndent().length + formattedKeyword.length;
        } else {
          result += ' ' + formattedKeyword;
          lineLength += formattedKeyword.length + 1;
        }
        continue;
      }

      if (token === '(') {
        result += token;
        indentLevel++;
        lineLength++;
        continue;
      }

      if (token === ')') {
        indentLevel--;
        if (result.endsWith(' ')) {
          result = result.slice(0, -1);
        }
        result += token;
        lineLength++;
        continue;
      }

      if (token === ',') {
        if (this.options.commaPosition === 'after') {
          result += token;
          lineLength++;
          const prevTokens = tokens.slice(0, i).reverse();
          const recentKeyword = prevTokens.find(t => keywords.has(t.toUpperCase()));
          if (recentKeyword && recentKeyword.toUpperCase() === 'SELECT') {
            result += '\n' + getIndent();
            lineLength = getIndent().length;
          }
        } else {
          result = result.trimEnd() + '\n' + getIndent() + token + ' ';
          lineLength = getIndent().length + 2;
        }
        continue;
      }

      if (token === ';') {
        result += token + '\n';
        indentLevel = 0;
        lineLength = 0;
        continue;
      }

      if (result && !result.endsWith(' ') && !result.endsWith('\n') && !result.endsWith('(')) {
        result += ' ';
        lineLength++;
      }
      result += token;
      lineLength += token.length;

      if (this.options.maxLineLength > 0 && lineLength > this.options.maxLineLength) {
        if (!result.endsWith('\n')) {
          result += '\n' + getIndent();
          lineLength = getIndent().length;
        }
      }
    }

    return result.trim();
  }

  minify(sql: string): string {
    if (!sql.trim()) return '';
    const tokens = this.tokenize(sql);
    let result = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const nextToken = tokens[i + 1];
      if (token.startsWith('--') || token.startsWith('/*')) continue;
      if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) {
        result += token;
        continue;
      }
      result += token;
      if (nextToken && 
          !['(', ')', ',', ';'].includes(token) && 
          !['(', ')', ',', ';'].includes(nextToken) &&
          !token.match(/^[+\-*/=<>,;]$/) &&
          !nextToken.match(/^[+\-*/=<>,;]$/)) {
        result += ' ';
      }
    }
    return result.trim();
  }
}

const DEFAULT_SQL = `SELECT u.id, u.email, u.created_at, p.first_name, p.last_name, COUNT(o.id) as order_count, SUM(o.total) as lifetime_value
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' AND u.created_at >= '2024-01-01'
GROUP BY u.id, u.email, u.created_at, p.first_name, p.last_name
HAVING COUNT(o.id) > 0
ORDER BY lifetime_value DESC
LIMIT 100;`;

export default function SQLFormatterPage() {
  const [input, setInput] = useState(DEFAULT_SQL);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [dialect, setDialect] = useState<SQLDialect>('standard');
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState({ input: 0, output: 0 });
  
  const [options, setOptions] = useState<FormatOptions>({
    indentSize: 2,
    uppercaseKeywords: true,
    commaPosition: 'after',
    maxLineLength: 120
  });

  const formatter = new SQLFormatter(options, dialect);

  const processSQL = useCallback(() => {
    try {
      if (mode === 'format') {
        setOutput(formatter.format(input));
      } else {
        setOutput(formatter.minify(input));
      }
      setCharCount({
        input: input.length,
        output: mode === 'minify' ? formatter.minify(input).length : formatter.format(input).length
      });
    } catch (error) {
      setOutput(`-- Error processing SQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [input, mode, options, dialect]);

  useEffect(() => {
    processSQL();
  }, [processSQL]);

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
            <span className="text-xs font-bold tracking-wider uppercase">Secure Execution • 100% Local</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 mb-6 leading-tight">
            SQL Formatter & Minifier <br/>
            <span className="text-slate-400 font-medium text-3xl">Beautify Queries Without Data Exposure</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg mb-8 leading-relaxed">
            Format, minify, and validate your SQL queries entirely in your browser. Supports Standard, MySQL, and PostgreSQL dialects with customizable indentation.
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
                <h2 className="text-3xl font-bold text-slate-100">SQL OpSec: Why You Should Never Format Production Queries Online</h2>
                <p className="text-slate-400">
                    Production SQL queries are rarely just abstract logic—they frequently contain sensitive data. When you paste a query into an online formatter, you&apos;re exposing internal schema, customer emails, IP addresses, and business logic to unknown third parties.
                </p>

                <div className="grid gap-12 md:grid-cols-2 mt-12">
                    <div>
                        <h4 className="text-slate-100 font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-rose-500" size={18} /> The PII Leakage Risk
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Queries like <code>SELECT * FROM users WHERE email = &apos;...&apos;</code> expose customer PII. Online services log these inputs, creating permanent records of your sensitive data on unvetted servers.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-slate-100 font-bold mb-4 flex items-center gap-2">
                            <Database className="text-amber-500" size={18} /> Reconnaissance Risk
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            A formatted statement reveals your table structures and relationships, providing attackers with the exact intelligence needed to plan precision SQL injection or data exfiltration attacks.
                        </p>
                    </div>
                </div>

                <div className="mt-16 p-8 bg-emerald-500/5 border-l-4 border-emerald-500 rounded-r-2xl">
                    <h3 className="text-emerald-400 mt-0 flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" size={24} /> The Local Solution
                    </h3>
                    <p className="text-slate-300">
                        OpSecForge processes your SQL entirely in your browser. <strong>No network requests are made.</strong> Your data never leaves your machine, ensuring compliance with GDPR, SOC 2, and HIPAA data processing standards.
                    </p>
                </div>
            </article>
        </section>
      </div>
    </main>
  );
}

import { ShieldCheck } from 'lucide-react';