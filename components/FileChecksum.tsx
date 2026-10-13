'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { compareDigest, digestFile, type FileHashAlgorithm } from '../lib/file-checksum';
import { checksumExample, EXAMPLE_CHECKSUMS, mismatchingExample } from '../lib/file-checksum-example';

const field = 'w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';

export default function FileChecksum() {
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<FileHashAlgorithm>('SHA-256');
  const [expected, setExpected] = useState('');
  const [digest, setDigest] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [example, setExample] = useState(false);
  const generation = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  function invalidate() {
    generation.current++;
    setDigest('');
    setBusy(false);
    setError('');
    setCopied(false);
  }

  async function calculate() {
    const source = example ? checksumExample() : file;
    if (!source) return;
    const run = ++generation.current;
    setBusy(true);
    setDigest('');
    setError('');
    setCopied(false);
    try {
      const value = await digestFile(source, algorithm);
      if (run === generation.current) setDigest(value);
    } catch {
      if (run === generation.current) setError('Could not read or hash this file. Use a file up to 32 MiB in a browser with Web Crypto support.');
    } finally {
      if (run === generation.current) setBusy(false);
    }
  }

  const comparison = compareDigest(digest, expected, algorithm);
  const messages = {
    empty: 'Optional: paste the expected digest from a trusted publisher to compare.',
    invalid: `Enter only the ${algorithm === 'SHA-256' ? 64 : 128} hexadecimal characters of the ${algorithm} digest, without a filename or prefix.`,
    pending: 'Calculate the file checksum to compare.',
    match: 'Checksums match. This does not verify the publisher or prove the file is safe.',
    mismatch: 'Checksums do not match. Check the algorithm and release file before using the download.',
  };

  return (
    <section id="file-checksum" aria-labelledby="file-checksum-title" className="mb-10 scroll-mt-24 rounded-2xl border border-emerald-500/30 bg-slate-900 p-4 text-slate-200 sm:p-6">
      <h2 id="file-checksum-title" className="mb-2 text-xl font-bold">Check a file without uploading it</h2>
      <p className="mb-5 text-sm text-slate-400">Select a local file, calculate its SHA-256 or SHA-512 checksum, and compare it with a trusted digest. File bytes stay in this page. Up to 32 MiB per file.</p>
      <div className="mb-5 rounded-lg border border-slate-700 p-3 text-sm">
        {!example ? <>
          <button type="button" disabled={!!file || !!expected} onClick={() => {
            if (file || expected) return;
            invalidate(); setExample(true); setExpected(EXAMPLE_CHECKSUMS[algorithm]);
          }} className="rounded-lg border border-emerald-500/60 px-3 py-2 font-semibold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Try a synthetic example</button>
          <p className="mt-2 text-slate-400">No file needed. Try a match, then a mismatch. Clear your file and expected checksum first; the example will not replace them.</p>
        </> : <>
          <p className="font-semibold text-emerald-300">Synthetic example active — not your file</p>
          <p className="mt-2 text-slate-300">Exactly three ASCII bytes: <code>abc</code>, without a newline. Click Calculate file checksum to try a match. Then change the expected value below to see a mismatch. This is a public test vector, not a trusted download.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setExpected(EXAMPLE_CHECKSUMS[algorithm])} className="rounded-lg border border-slate-600 px-3 py-2 focus-visible:outline-2 focus-visible:outline-emerald-400">Use matching example checksum</button>
            <button type="button" onClick={() => setExpected(mismatchingExample(algorithm))} className="rounded-lg border border-slate-600 px-3 py-2 focus-visible:outline-2 focus-visible:outline-amber-300">Try a mismatching checksum</button>
          </div>
          <p className="mt-2 text-slate-400">Clear file and results to exit, or select your own file. Selecting a file removes the example checksum.</p>
        </>}
      </div>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_150px]">
        <div className="min-w-0">
          <label htmlFor="checksum-file" className="mb-2 block text-sm">Local file</label>
          <input ref={fileInput} id="checksum-file" type="file" className={field} onChange={(e) => { invalidate(); if (example) setExpected(''); setExample(false); setFile(e.target.files?.[0] ?? null); }} />
        </div>
        <div>
          <label htmlFor="checksum-algorithm" className="mb-2 block text-sm">Algorithm</label>
          <select id="checksum-algorithm" className={field} value={algorithm} onChange={(e) => { invalidate(); const next = e.target.value as FileHashAlgorithm; setAlgorithm(next); if (example) setExpected(EXAMPLE_CHECKSUMS[next]); }}>
            <option>SHA-256</option><option>SHA-512</option>
          </select>
        </div>
      </div>
      <div className="my-5 flex flex-wrap gap-3">
        <button type="button" onClick={calculate} disabled={(!file && !example) || busy} className="rounded-lg bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">{busy ? 'Calculating…' : 'Calculate file checksum'}</button>
        <button type="button" onClick={() => { invalidate(); setFile(null); setExample(false); setExpected(''); if (fileInput.current) fileInput.current.value = ''; }} className="rounded-lg border border-slate-600 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Clear file and results</button>
      </div>
      {error && <p role="alert" className="mb-4 text-amber-300">{error}</p>}
      <label htmlFor="checksum-result" className="mb-2 block text-sm">Calculated checksum</label>
      <textarea id="checksum-result" readOnly rows={3} value={digest} className={`${field} break-all font-mono text-sm`} placeholder="Your file checksum appears here" />
      <button type="button" disabled={!digest} className="my-3 rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:opacity-50" onClick={async () => { try { await navigator.clipboard.writeText(digest); setCopied(true); } catch { setError('Copy unavailable. Select the checksum and copy it manually.'); } }}>{copied ? 'Copied checksum' : 'Copy checksum'}</button>
      <label htmlFor="checksum-expected" className="mb-2 block text-sm">Expected checksum (optional)</label>
      <input id="checksum-expected" value={expected} onChange={(e) => setExpected(e.target.value)} autoComplete="off" spellCheck={false} className={`${field} font-mono text-sm`} placeholder="Paste the publisher’s hexadecimal digest" />
      <p role="status" className={`mt-3 text-sm ${comparison === 'match' ? 'text-emerald-300' : 'text-amber-200'}`}>{messages[comparison]}</p>
      <details className="mt-6 border-t border-slate-700 pt-4 text-sm">
        <summary className="cursor-pointer font-semibold">Larger files, troubleshooting, and trust</summary>
        <p className="mt-3">This tool reads the entire file into memory. For larger files, run a local command:</p>
        <ul className="mt-3 space-y-2 break-words">
          <li>macOS: <code>shasum -a 256 ./download.zip</code></li>
          <li>Linux: <code>sha256sum ./download.zip</code></li>
          <li>PowerShell: <code>Get-FileHash ./download.zip -Algorithm SHA256</code></li>
        </ul>
        <p className="mt-3">Different algorithms, different releases, changed line endings, or a truncated download produce different digests. A matching digest is not a malware scan or a digital-signature check. Obtain the expected value from an authenticated publisher source.</p>
        <p className="mt-3"><a className="text-emerald-300 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest">Browser digest API and memory limitations</a> · <Link className="text-emerald-300 underline" href="/blog/hash-collision-attacks-data-integrity">What hash collisions mean</Link></p>
      </details>
    </section>
  );
}
