'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  basename,
  ChecksumError,
  compareParsed,
  digestFile,
  isAbortError,
  parseExpectedChecksum,
  type FileHashAlgorithm,
} from '../lib/file-checksum';
import { checksumExample, EXAMPLE_CHECKSUMS, mismatchingExample } from '../lib/file-checksum-example';

const field = 'w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-400';

function formatSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MiB`;
}

export default function FileChecksum() {
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<FileHashAlgorithm>('SHA-256');
  const [expected, setExpected] = useState('');
  const [digest, setDigest] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [example, setExample] = useState(false);
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function invalidate() {
    generation.current++;
    controller.current?.abort();
    controller.current = null;
    setDigest('');
    setBusy(false);
    setProgress(null);
    setError('');
    setCopied(false);
  }

  function changeAlgorithm(next: FileHashAlgorithm) {
    invalidate();
    setAlgorithm(next);
    if (example) setExpected(EXAMPLE_CHECKSUMS[next]);
  }

  async function calculate() {
    const source = example ? checksumExample() : file;
    if (!source) return;
    const run = ++generation.current;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setProgress(null);
    setDigest('');
    setError('');
    setCopied(false);
    try {
      const value = await digestFile(source, algorithm, {
        signal: abort.signal,
        onProgress: (done, total) => { if (run === generation.current) setProgress({ done, total }); },
      });
      if (run === generation.current) setDigest(value);
    } catch (e) {
      if (run === generation.current) {
        if (isAbortError(e)) setError('Calculation cancelled. No checksum was produced.');
        else if (e instanceof ChecksumError) setError(e.message);
        else setError('Could not read or hash this file. Try again, or use a command-line tool for very large files.');
      }
    } finally {
      if (run === generation.current) {
        setBusy(false);
        setProgress(null);
        controller.current = null;
      }
    }
  }

  const selectedName = example || !file ? undefined : file.name || undefined;
  const parsed = parseExpectedChecksum(expected, selectedName);
  const comparison = compareParsed(digest, parsed, algorithm);
  const detected = parsed.status === 'ok' ? parsed.entry : null;
  const wrongAlgorithm = comparison === 'algorithm-mismatch' && detected ? detected.algorithm : null;
  const pastedName = detected?.fileName;
  const nameDiffers = !!(parsed.status === 'ok' && !parsed.matchedByName && pastedName && selectedName && pastedName !== basename(selectedName));
  const entryCount = parsed.status === 'multiple-entries' || parsed.status === 'no-match-for-file' || parsed.status === 'ambiguous' ? parsed.entries : 0;
  const messages: Record<typeof comparison, string> = {
    empty: 'Optional: paste the expected digest from a trusted publisher to compare.',
    invalid: 'Could not find a SHA-256 (64 hex characters) or SHA-512 (128 hex characters) digest. Paste the bare digest, a line such as “<digest>  filename” or “SHA256 (filename) = <digest>”, or the whole SHA256SUMS file.',
    'multiple-entries': `Found ${entryCount} entries. Select a file so the line with its name can be picked.`,
    'no-match-for-file': `Found ${entryCount} entries, but none is for “${selectedName ?? ''}”. Check the file name, or paste only the line you want to compare.`,
    ambiguous: `Found several lines for “${selectedName ?? ''}” with different digests. Paste only the line you want to compare.`,
    'algorithm-mismatch': wrongAlgorithm ? `The pasted digest is ${wrongAlgorithm}, but ${algorithm} is selected.` : '',
    pending: 'Calculate the file checksum to compare.',
    match: 'Checksums match. This does not verify the publisher or prove the file is safe.',
    mismatch: 'Checksums do not match. Check the algorithm and release file before using the download.',
  };
  const percent = progress && progress.total > 0 ? Math.min(100, Math.floor((progress.done / progress.total) * 100)) : 0;

  return (
    <section id="file-checksum" aria-labelledby="file-checksum-title" className="mb-10 scroll-mt-24 rounded-2xl border border-emerald-500/30 bg-slate-900 p-4 text-slate-200 sm:p-6">
      <h2 id="file-checksum-title" className="mb-2 text-xl font-bold">Check a file without uploading it</h2>
      <p className="mb-5 text-sm text-slate-400">Select a local file, calculate its SHA-256 or SHA-512 checksum, and compare it with a trusted digest. File bytes stay in this page and are not uploaded. Files up to 32 MiB are hashed in one step; larger files, up to 8 GiB, are read and hashed in 4 MiB pieces here, which can take a few minutes.</p>
      <div className="mb-5 rounded-lg border border-slate-700 p-3 text-sm">
        {!example ? <>
          <button type="button" disabled={!!file || !!expected} onClick={() => {
            if (file || expected) return;
            invalidate(); setExample(true); setExpected(EXAMPLE_CHECKSUMS[algorithm]);
          }} className="rounded-lg border border-emerald-500/60 px-3 py-2 font-semibold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Try a synthetic example</button>
          <p className="mt-2 text-slate-400">Try a match and a mismatch without a file. Clear existing inputs first; they will not be replaced.</p>
        </> : <>
          <p className="font-semibold text-emerald-300">Synthetic example active — not your file</p>
          <p className="mt-2 text-slate-300">Public test vector: <code>abc</code> (3 ASCII bytes, no newline). Calculate, then try a mismatch. Not a real download.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setExpected(EXAMPLE_CHECKSUMS[algorithm])} className="rounded-lg border border-slate-600 px-3 py-2 focus-visible:outline-2 focus-visible:outline-emerald-400">Use matching example checksum</button>
            <button type="button" onClick={() => setExpected(mismatchingExample(algorithm))} className="rounded-lg border border-slate-600 px-3 py-2 focus-visible:outline-2 focus-visible:outline-amber-300">Try a mismatching checksum</button>
          </div>
          <p className="mt-2 text-slate-400">Clear to exit. Selecting a file clears the example checksum.</p>
        </>}
      </div>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_150px]">
        <div className="min-w-0">
          <label htmlFor="checksum-file" className="mb-2 block text-sm">Local file</label>
          <input ref={fileInput} id="checksum-file" type="file" className={field} onChange={(e) => { invalidate(); if (example) setExpected(''); setExample(false); setFile(e.target.files?.[0] ?? null); }} />
        </div>
        <div>
          <label htmlFor="checksum-algorithm" className="mb-2 block text-sm">Algorithm</label>
          <select id="checksum-algorithm" className={field} value={algorithm} onChange={(e) => changeAlgorithm(e.target.value as FileHashAlgorithm)}>
            <option>SHA-256</option><option>SHA-512</option>
          </select>
        </div>
      </div>
      <div className="my-5 flex flex-wrap gap-3">
        <button type="button" onClick={calculate} disabled={(!file && !example) || busy} className="rounded-lg bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">{busy ? 'Calculating…' : 'Calculate file checksum'}</button>
        <button type="button" onClick={() => { invalidate(); setFile(null); setExample(false); setExpected(''); if (fileInput.current) fileInput.current.value = ''; }} className="rounded-lg border border-slate-600 px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Clear file and results</button>
      </div>
      <div className="mb-4 flex h-12 items-center gap-3 text-sm" data-testid="checksum-progress-area">
        {busy && progress && <>
          <div className="min-w-0 flex-1">
            <div role="progressbar" aria-label="Checksum progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2 w-full overflow-hidden rounded bg-slate-700">
              <div className="h-full bg-emerald-400" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 truncate text-slate-300">{percent}% · {formatSize(progress.done)} of {formatSize(progress.total)}</p>
          </div>
          <button type="button" onClick={() => controller.current?.abort()} className="rounded-lg border border-amber-300/60 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">Cancel</button>
        </>}
      </div>
      {error && <p role="alert" className="mb-4 text-amber-300">{error}</p>}
      <label htmlFor="checksum-result" className="mb-2 block text-sm">Calculated checksum</label>
      <textarea id="checksum-result" readOnly rows={3} value={digest} className={`${field} break-all font-mono text-sm`} placeholder="Your file checksum appears here" />
      <button type="button" disabled={!digest} className="my-3 rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:opacity-50" onClick={async () => { try { await navigator.clipboard.writeText(digest); setCopied(true); } catch { setError('Copy unavailable. Select the checksum and copy it manually.'); } }}>{copied ? 'Copied checksum' : 'Copy checksum'}</button>
      <label htmlFor="checksum-expected" className="mb-2 block text-sm">Expected checksum (optional)</label>
      <textarea id="checksum-expected" rows={2} value={expected} onChange={(e) => setExpected(e.target.value)} autoComplete="off" spellCheck={false} className={`${field} break-all font-mono text-sm`} placeholder="Paste the digest, a line from SHA256SUMS, or the whole file" />
      <p role="status" className={`mt-3 text-sm ${comparison === 'match' ? 'text-emerald-300' : 'text-amber-200'}`}>{messages[comparison]}</p>
      {wrongAlgorithm && (
        <div className="mt-2">
          <button type="button" onClick={() => changeAlgorithm(wrongAlgorithm)} className="rounded-lg border border-emerald-500/60 px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Switch to {wrongAlgorithm}</button>
        </div>
      )}
      {nameDiffers && <p className="mt-2 text-sm text-amber-200">The pasted line is for {pastedName}, but you selected {file?.name}. The digest is still compared.</p>}
      {parsed.status === 'ok' && parsed.matchedByName && <p className="mt-2 text-sm text-slate-400">Using the line for {pastedName} (1 of {parsed.entries} entries).</p>}
      <details className="mt-6 border-t border-slate-700 pt-4 text-sm">
        <summary className="cursor-pointer font-semibold">Larger files, troubleshooting, and trust</summary>
        <p className="mt-3">Files up to 32 MiB are hashed in one step with the browser’s Web Crypto API. Larger files, up to 8 GiB, are read in 4 MiB pieces and hashed by code on this page, so memory use stays low, but it is slower than a native command. For bigger files, or if the tab becomes sluggish, run a local command:</p>
        <ul className="mt-3 space-y-2 break-words">
          <li>macOS: <code>shasum -a 256 ./download.zip</code></li>
          <li>Linux: <code>sha256sum ./download.zip</code></li>
          <li>PowerShell: <code>Get-FileHash ./download.zip -Algorithm SHA256</code></li>
        </ul>
        <p className="mt-3">Different algorithms, different releases, changed line endings, or a truncated download produce different digests. A matching digest is not a malware scan or a digital-signature check. Obtain the expected value from an authenticated publisher source.</p>
        <p className="mt-3"><a className="text-emerald-300 underline" href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest">Browser digest API (SubtleCrypto.digest)</a> · <Link className="text-emerald-300 underline" href="/blog/hash-collision-attacks-data-integrity">What hash collisions mean</Link></p>
      </details>
    </section>
  );
}
