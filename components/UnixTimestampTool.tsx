'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Clock3, Copy, Lock, TimerReset } from 'lucide-react';

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function UnixTimestampTool() {
  const [now, setNow] = useState(() => Date.now());
  const [epochInput, setEpochInput] = useState('');
  const [dateInput, setDateInput] = useState(() => formatDateTimeLocal(new Date()));
  const [secondsInput, setSecondsInput] = useState('0');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const currentEpochSeconds = Math.floor(now / 1000).toString();

  const epochConversion = useMemo(() => {
    if (!epochInput.trim()) {
      return { local: '', utc: '', error: '' };
    }

    const numeric = Number(epochInput.trim());

    if (!Number.isFinite(numeric)) {
      return { local: '', utc: '', error: 'Enter a valid Unix timestamp in seconds or milliseconds.' };
    }

    const milliseconds = epochInput.trim().length > 10 ? numeric : numeric * 1000;
    const parsed = new Date(milliseconds);

    if (Number.isNaN(parsed.getTime())) {
      return { local: '', utc: '', error: 'The timestamp could not be converted into a valid date.' };
    }

    return {
      local: parsed.toLocaleString(),
      utc: parsed.toUTCString(),
      error: '',
    };
  }, [epochInput]);

  const dateConversion = useMemo(() => {
    if (!dateInput) {
      return { seconds: '', milliseconds: '', error: '' };
    }

    const seconds = Number(secondsInput || '0');

    if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
      return { seconds: '', milliseconds: '', error: 'Seconds must be an integer between 0 and 59.' };
    }

    const parsed = new Date(`${dateInput}:00`);

    if (Number.isNaN(parsed.getTime())) {
      return { seconds: '', milliseconds: '', error: 'Pick a valid local date and time.' };
    }

    parsed.setSeconds(seconds);

    return {
      seconds: Math.floor(parsed.getTime() / 1000).toString(),
      milliseconds: parsed.getTime().toString(),
      error: '',
    };
  }, [dateInput, secondsInput]);

  const copyValue = async (key: string, value: string) => {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-24">
        <div className="mb-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <Link href="/" className="transition-colors hover:text-emerald-400">
            OpSecForge Hub
          </Link>
          <span>/</span>
          <span className="text-slate-300">Unix Timestamp</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Offline Date Math
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
            Unix Timestamp Converter
            <span className="mt-3 block text-3xl font-medium text-slate-400">
              Convert epochs to readable dates and back in real time
            </span>
          </h1>
        </section>

        <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                <Clock3 size={14} className="text-emerald-400" />
                Live Unix Epoch
              </div>
              <div className="font-mono text-4xl font-bold tracking-tight text-emerald-400">
                {currentEpochSeconds}
              </div>
            </div>

            <button
              onClick={() => copyValue('live', currentEpochSeconds)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300"
            >
              {copiedKey === 'live' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copiedKey === 'live' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </section>

        <section className="mb-24 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                <TimerReset size={14} className="text-cyan-400" />
                Epoch To Date
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Paste seconds or milliseconds to see both local and UTC renderings.
              </p>
            </div>

            <input
              type="text"
              value={epochInput}
              onChange={(event) => setEpochInput(event.target.value)}
              placeholder="1710352200 or 1710352200000"
              className="mb-6 w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-lg text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
            />

            {epochConversion.error ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                {epochConversion.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Local Time</span>
                    <button
                      onClick={() => copyValue('local', epochConversion.local)}
                      disabled={!epochConversion.local}
                      className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 disabled:opacity-40"
                    >
                      {copiedKey === 'local' ? <Check size={14} /> : <Copy size={14} />}
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-sm text-emerald-300">
                    {epochConversion.local || 'Waiting for input...'}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">UTC Time</span>
                    <button
                      onClick={() => copyValue('utc', epochConversion.utc)}
                      disabled={!epochConversion.utc}
                      className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 disabled:opacity-40"
                    >
                      {copiedKey === 'utc' ? <Check size={14} /> : <Copy size={14} />}
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-sm text-emerald-300">
                    {epochConversion.utc || 'Waiting for input...'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                <Clock3 size={14} className="text-amber-400" />
                Date To Epoch
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Pick a local date/time, set the seconds field, and copy either seconds or milliseconds.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <input
                type="datetime-local"
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-base text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
              />
              <input
                type="number"
                min={0}
                max={59}
                value={secondsInput}
                onChange={(event) => setSecondsInput(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-base text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Second override (0-59)
            </div>

            {dateConversion.error ? (
              <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                {dateConversion.error}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Epoch Seconds</span>
                    <button
                      onClick={() => copyValue('epoch-seconds', dateConversion.seconds)}
                      disabled={!dateConversion.seconds}
                      className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 disabled:opacity-40"
                    >
                      {copiedKey === 'epoch-seconds' ? <Check size={14} /> : <Copy size={14} />}
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-sm text-emerald-300">
                    {dateConversion.seconds || 'Waiting for input...'}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Epoch Milliseconds</span>
                    <button
                      onClick={() => copyValue('epoch-milliseconds', dateConversion.milliseconds)}
                      disabled={!dateConversion.milliseconds}
                      className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 disabled:opacity-40"
                    >
                      {copiedKey === 'epoch-milliseconds' ? <Check size={14} /> : <Copy size={14} />}
                      Copy
                    </button>
                  </div>
                  <div className="font-mono text-sm text-emerald-300">
                    {dateConversion.milliseconds || 'Waiting for input...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
