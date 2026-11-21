'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, Trash2 } from 'lucide-react';
import {
  type Base64Variant,
  BASE64_FILE_BYTE_LIMIT,
  BASE64_PREVIEW_CHAR_LIMIT,
  buildBase64DataUrl,
  encodeBase64Bytes,
} from '@/lib/base64-codec';
import { downloadFromPage } from '@/lib/browser-download';

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MiB` : `${bytes} byte${bytes === 1 ? '' : 's'}`;

const button =
  'inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50';

export default function Base64FilePanel({ variant }: { variant: Base64Variant }) {
  const [file, setFile] = useState<{ name: string; type: string; bytes: Uint8Array } | null>(null);
  const [asDataUrl, setAsDataUrl] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const generation = useRef(0);

  const encoded = useMemo(() => {
    if (!file) {
      return '';
    }

    return asDataUrl ? buildBase64DataUrl(file.type, file.bytes) : encodeBase64Bytes(file.bytes, variant);
  }, [file, asDataUrl, variant]);
  const truncated = encoded.length > BASE64_PREVIEW_CHAR_LIMIT;

  const selectFile = async (selected: File | null) => {
    const run = ++generation.current;
    setFile(null);
    setError('');
    setCopied(false);

    if (!selected) {
      return;
    }

    if (selected.size > BASE64_FILE_BYTE_LIMIT) {
      setError(
        `This file is ${formatBytes(selected.size)}. The limit here is ${formatBytes(BASE64_FILE_BYTE_LIMIT)}; use the base64 command for larger files.`,
      );
      return;
    }

    try {
      const bytes = new Uint8Array(await selected.arrayBuffer());
      if (run === generation.current) {
        setFile({ name: selected.name, type: selected.type, bytes });
      }
    } catch {
      if (run === generation.current) {
        setError('Could not read this file.');
      }
    }
  };

  const clear = () => {
    generation.current += 1;
    setFile(null);
    setError('');
    setCopied(false);
    if (fileInput.current) {
      fileInput.current.value = '';
    }
  };

  const copy = async () => {
    if (!encoded) {
      return;
    }

    await navigator.clipboard.writeText(encoded);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5" role="region" aria-label="Encode a file">
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Encode a file</div>
      <p className="mb-4 text-sm text-slate-400">
        Reads a local file of up to {formatBytes(BASE64_FILE_BYTE_LIMIT)} in this page and encodes its bytes with the
        variant selected above. The file is not uploaded.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <input
          ref={fileInput}
          type="file"
          aria-label="File to encode"
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          className="min-w-0 max-w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-slate-200"
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={asDataUrl}
            onChange={(event) => setAsDataUrl(event.target.checked)}
            className="h-4 w-4 accent-emerald-500"
          />
          Output a data: URL
        </label>
      </div>
      {asDataUrl ? (
        <p className="mt-3 text-xs text-slate-500">
          A data: URL uses the standard alphabet with padding, whichever variant is selected. The media type is the one
          the browser reports for the file, or application/octet-stream when it reports none.
        </p>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {file ? (
        <>
          <p className="mt-4 text-sm text-slate-400" data-testid="file-encode-summary">
            {file.name}: {formatBytes(file.bytes.length)} in, {encoded.length} characters out.
          </p>
          <textarea
            aria-label="Encoded file"
            readOnly
            value={truncated ? encoded.slice(0, BASE64_PREVIEW_CHAR_LIMIT) : encoded}
            className="mt-3 h-28 w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-emerald-300 outline-none"
            spellCheck={false}
          />
          {truncated ? (
            <p className="mt-2 text-xs text-amber-200">
              Showing the first {BASE64_PREVIEW_CHAR_LIMIT} of {encoded.length} characters. Copy and Save use the full
              string.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={copy} className={button}>
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy encoded file'}
            </button>
            <button onClick={() => downloadFromPage(encoded, `${file.name}.b64.txt`, 'text/plain')} className={button}>
              <Download size={16} />
              Save as .txt
            </button>
            <button onClick={clear} className={button}>
              <Trash2 size={16} />
              Clear file
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
