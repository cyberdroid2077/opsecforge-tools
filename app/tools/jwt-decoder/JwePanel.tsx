'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Info, KeyRound, ShieldAlert } from 'lucide-react';
import { analyzeTimeClaim, isTimeClaim, type JwtAlert } from '@/lib/jwt';
import { decryptJwe, inspectJwe, jweKeyKindForAlg, type JweDecryptResult, type JweInspection } from '@/lib/jwe';

/** Longest decrypted text rendered in the page; the byte count in the result is always the full size. */
const MAX_SHOWN_CHARS = 20_000;

const clip = (text: string) =>
  text.length > MAX_SHOWN_CHARS ? `${text.slice(0, MAX_SHOWN_CHARS)}\n… (${text.length - MAX_SHOWN_CHARS} more characters not shown)` : text;

const KEY_FIELD = {
  symmetric: {
    label: 'Shared key (oct JWK, hex or Base64URL)',
    hint: 'The same key the sender used. Paste it as an oct JWK, as hex, or as Base64URL; its length has to match the algorithm exactly.',
  },
  password: {
    label: 'Password',
    hint: 'The password is used as UTF-8 text exactly as typed, and stretched with the PBKDF2 salt and iteration count from the header.',
  },
  'rsa-private': {
    label: 'RSA private key (PKCS#8 PEM or JWK)',
    hint: 'The recipient\'s private key, as a PKCS#8 "BEGIN PRIVATE KEY" block or a JWK with its private members.',
  },
  'ec-private': {
    label: 'EC private key (PKCS#8 PEM or JWK)',
    hint: 'The recipient\'s private key on the same curve as the "epk" in the header (P-256, P-384 or P-521), as a PKCS#8 "BEGIN PRIVATE KEY" block or a JWK with "d".',
  },
} as const;

function Alerts({ alerts }: { alerts: JwtAlert[] }) {
  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 p-3 rounded-xl text-xs font-bold border ${
            alert.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : alert.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
        >
          {alert.type === 'error' ? (
            <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          ) : alert.type === 'warning' ? (
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          ) : (
            <Info size={14} className="mt-0.5 shrink-0" />
          )}
          <span className="leading-relaxed">{alert.message}</span>
        </div>
      ))}
    </div>
  );
}

function DecryptedContent({ result, onDecodeNested }: { result: JweDecryptResult; onDecodeNested: (token: string) => void }) {
  const plaintext = result.plaintext;
  if (!plaintext) return null;

  if (plaintext.kind === 'claims') {
    return (
      <div className="space-y-2 font-mono text-sm">
        {Object.entries(plaintext.claims).map(([key, value]) => {
          const time = isTimeClaim(key) ? analyzeTimeClaim(key, value) : null;
          return (
            <div key={key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <span className="text-indigo-300 font-bold shrink-0">&quot;{key}&quot;</span>
              <span className="text-slate-600 shrink-0">→</span>
              <span
                className={`break-all leading-relaxed ${
                  time ? (time.status === 'expired' ? 'text-rose-400' : time.badge ? 'text-amber-400' : 'text-emerald-400') : 'text-emerald-300'
                }`}
              >
                {time ? time.display : (JSON.stringify(value) ?? String(value))}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (plaintext.kind === 'jwt') {
    return (
      <div className="space-y-3">
        <p>The plaintext is another compact token (a nested JWT):</p>
        <pre className="whitespace-pre-wrap break-all font-mono text-xs text-emerald-300">{clip(plaintext.text)}</pre>
        <button
          type="button"
          onClick={() => onDecodeNested(plaintext.text)}
          className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/10"
        >
          Decode the nested token
        </button>
      </div>
    );
  }

  if (plaintext.kind === 'text') {
    return <pre className="whitespace-pre-wrap break-words font-mono text-xs text-emerald-300">{clip(plaintext.text)}</pre>;
  }

  return (
    <div className="space-y-2">
      <p>
        The plaintext is {plaintext.bytes} bytes and is not UTF-8 text. First {Math.min(plaintext.bytes, 256)} bytes as hex:
      </p>
      <pre className="whitespace-pre-wrap break-all font-mono text-xs text-emerald-300">{plaintext.hex}</pre>
    </div>
  );
}

/**
 * Output pane for a five-part compact JWE: the readable protected header, the size of each part, and an
 * optional local decryption with a key the user pastes. The key lives only in React state.
 */
export default function JwePanel({ token, onDecodeNested }: { token: string; onDecodeNested: (token: string) => void }) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [result, setResult] = useState<JweDecryptResult | null>(null);
  const [working, setWorking] = useState(false);
  // Incremented whenever the key changes so a slow, older run cannot overwrite the view.
  const run = useRef(0);

  const { info, error } = useMemo(() => {
    try {
      return { info: inspectJwe(token) as JweInspection | null, error: '' };
    } catch (err: unknown) {
      return { info: null, error: err instanceof Error ? err.message : 'Failed to read the token' };
    }
  }, [token]);

  if (!info) {
    return (
      <div className="flex items-center gap-3 text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
        <ShieldAlert size={18} /> {error}
      </div>
    );
  }

  const keyKind = jweKeyKindForAlg(info.alg);
  const field = keyKind ? KEY_FIELD[keyKind] : null;

  const changeKey = (value: string) => {
    run.current += 1;
    setKey(value);
    setResult(null);
    setWorking(false);
  };

  const runDecrypt = async () => {
    const current = run.current + 1;
    run.current = current;
    setWorking(true);
    const next = await decryptJwe(token, key);
    if (run.current !== current) return;
    setResult(next);
    setWorking(false);
  };

  const rows: [string, string][] = [
    ['Protected header', `${info.parts[0].length} characters, readable (shown above)`],
    ['Encrypted key', info.sizes.encryptedKey === 0 ? 'empty' : `${info.sizes.encryptedKey} bytes`],
    ['Initialization vector', `${info.sizes.iv} bytes (${info.sizes.iv * 8} bits)`],
    ['Ciphertext', `${info.sizes.ciphertext} bytes`],
    ['Authentication tag', `${info.sizes.tag} bytes (${info.sizes.tag * 8} bits)`],
  ];

  return (
    <div className="space-y-6">
      <Alerts alerts={info.notes} />

      <div>
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Protected Header (Readable Without The Key)
        </div>
        <pre className="text-rose-400 whitespace-pre-wrap break-all">{JSON.stringify(info.header, null, 2)}</pre>
        <dl className="mt-4 space-y-1 font-sans text-xs text-slate-400">
          {info.alg && (
            <div>
              <dt className="inline font-bold text-slate-300">alg {info.alg}: </dt>
              <dd className="inline">{info.algLabel ?? 'not a registered JWE key management algorithm this page knows'}</dd>
            </div>
          )}
          {info.enc && (
            <div>
              <dt className="inline font-bold text-slate-300">enc {info.enc}: </dt>
              <dd className="inline">{info.encLabel ?? 'not a content encryption algorithm this page knows'}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="pt-6 border-t border-slate-800">
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span> The Five Parts
        </div>
        <table className="w-full text-xs">
          <tbody>
            {rows.map(([name, value], i) => (
              <tr key={name} className="border-b border-slate-800/60 last:border-0">
                <th scope="row" className="py-1.5 pr-3 text-left font-bold text-indigo-300 whitespace-nowrap">
                  {i + 1}. {name}
                </th>
                <td className="py-1.5 text-slate-300">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-6 border-t border-slate-800">
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-tighter flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Claims (Encrypted)
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2">
          <Info size={12} className="shrink-0" />
          <span>The claims cannot be read without the key. You can optionally decrypt them below, locally, with a key you supply.</span>
        </div>

        <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-emerald-400">Decrypt locally (optional)</summary>

          <div className="mt-4 space-y-4 font-sans text-xs text-slate-400">
            {field ? (
              <div className="space-y-2">
                <label htmlFor="jwe-decrypt-key" className="block font-bold uppercase tracking-wider text-slate-400">
                  {field.label}
                </label>
                {keyKind === 'password' ? (
                  <div className="flex gap-2">
                    <input
                      id="jwe-decrypt-key"
                      type={showKey ? 'text' : 'password'}
                      value={key}
                      onChange={(e) => changeKey(e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-sm text-emerald-400 outline-none focus:border-emerald-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((shown) => !shown)}
                      aria-pressed={showKey}
                      aria-label={showKey ? 'Hide password' : 'Show password'}
                      className="flex items-center rounded-lg border border-slate-800 px-3 text-slate-400 hover:text-emerald-400"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                ) : (
                  <textarea
                    id="jwe-decrypt-key"
                    value={key}
                    onChange={(e) => changeKey(e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                    rows={keyKind === 'symmetric' ? 2 : 5}
                    className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500/50"
                  />
                )}
                <p className="leading-relaxed">{field.hint}</p>
                <p className="leading-relaxed text-amber-400/90">
                  Use test keys only. Decryption needs the secret half of the key, so do not paste a production key into any web page,
                  including this one. The key stays in this tab and is not stored or sent.
                </p>
              </div>
            ) : (
              <p className="leading-relaxed">
                {info.alg === 'RSA1_5'
                  ? 'RSA1_5 (RSAES-PKCS1-v1_5) cannot be decrypted here: the Web Crypto API in browsers does not offer that algorithm. The header and part sizes above are still accurate.'
                  : info.alg
                    ? `Key management algorithm "${info.alg}" is not supported for local decryption (dir, A128KW/A192KW/A256KW, A128GCMKW/A192GCMKW/A256GCMKW, RSA-OAEP, RSA-OAEP-256, ECDH-ES with or without key wrapping, and PBES2 are).`
                    : 'The header has no "alg" value, so there is no way to tell how the key was protected.'}
              </p>
            )}

            {field && (
              <button
                type="button"
                onClick={runDecrypt}
                disabled={working}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                <KeyRound size={14} /> {working ? 'Decrypting…' : 'Decrypt'}
              </button>
            )}

            {/* Fixed minimum height so the page does not jump when a result appears. */}
            <div role="status" aria-live="polite" className="min-h-[9rem]">
              {result && (
                <div
                  className={`space-y-3 rounded-xl border p-3 leading-relaxed ${
                    result.status === 'decrypted'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : result.status === 'failed'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  }`}
                >
                  <div className="font-bold uppercase tracking-wider">
                    {result.status === 'decrypted' ? 'Decrypted' : result.status === 'failed' ? 'Decryption failed' : 'Could not decrypt'}
                  </div>
                  <p>{result.message}</p>
                  {result.warnings.map((warning, i) => (
                    <p key={i} className="flex items-start gap-2 text-amber-300">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" /> <span>{warning}</span>
                    </p>
                  ))}
                  <DecryptedContent result={result} onDecodeNested={onDecodeNested} />
                </div>
              )}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
