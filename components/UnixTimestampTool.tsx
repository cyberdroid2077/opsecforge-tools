'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check, Clock3, Copy, ListOrdered, Lock, TimerReset } from 'lucide-react';
import {
  convertTimestampBatch,
  countIntegerDigits,
  dateInputToEpoch,
  describeInstant,
  suggestUnit,
  unixTimestampToDate,
  type DateInputZone,
  type UnixTimestampUnit,
} from '../lib/unix-timestamp';

const UNIT_LABELS: Record<UnixTimestampUnit, string> = {
  seconds: 'seconds',
  milliseconds: 'milliseconds',
  microseconds: 'microseconds',
  nanoseconds: 'nanoseconds',
};

const UNIT_PLACEHOLDERS: Record<UnixTimestampUnit, string> = {
  seconds: '1710352200',
  milliseconds: '1710352200000',
  microseconds: '1710352200000000',
  nanoseconds: '1710352200000000000',
};

function formatLocalDisplay(date: Date) {
  return date.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    fractionalSecondDigits: 3, timeZoneName: 'short',
  });
}

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function UnixTimestampTool({ children }: { children?: ReactNode }) {
  // null until mounted: SSR must not bake a build-time timestamp into the HTML.
  const [now, setNow] = useState<number | null>(null);
  const [epochInput, setEpochInput] = useState('');
  const [epochUnit, setEpochUnit] = useState<UnixTimestampUnit>('seconds');
  const [dateInput, setDateInput] = useState("");
  const [secondsInput, setSecondsInput] = useState('0');
  const [dateZone, setDateZone] = useState<DateInputZone>('local');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [batchInput, setBatchInput] = useState('');
  const [batchUnit, setBatchUnit] = useState<UnixTimestampUnit>('seconds');

  useEffect(() => {
    setNow(Date.now());
    setDateInput((current) => current || formatDateTimeLocal(new Date()));
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Placeholder has the same width as a 10-digit epoch to avoid layout shift.
  const currentEpochSeconds = now === null ? "" : Math.floor(now / 1000).toString();

  const epochConversion = useMemo(() => {
    if (!epochInput.trim()) {
      return { local: '', utc: '', error: '', date: null };
    }

    const result = unixTimestampToDate(epochInput, epochUnit);

    if (!result.date) {
      return { local: '', utc: '', error: result.error, date: null };
    }

    return {
      date: result.date,
      local: result.date.toLocaleString(undefined, {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        fractionalSecondDigits: 3, timeZoneName: 'short',
      }),
      utc: result.date.toISOString(),
      error: '',
    };
  }, [epochInput, epochUnit]);

  // `now` is null on the server and on the first client render, so the relative
  // text stays empty until after mount and hydration matches.
  const details = useMemo(
    () => (epochConversion.date ? describeInstant(epochConversion.date, now) : null),
    [epochConversion.date, now],
  );

  const dateConversion = useMemo(() => {
    if (!dateInput) {
      return { seconds: '', milliseconds: '', error: '' };
    }

    const result = dateInputToEpoch(dateInput, Number(secondsInput || '0'), dateZone);

    if (result.milliseconds === null) {
      return { seconds: '', milliseconds: '', error: result.error };
    }

    return {
      seconds: Math.floor(result.milliseconds / 1000).toString(),
      milliseconds: result.milliseconds.toString(),
      error: '',
    };
  }, [dateInput, secondsInput, dateZone]);

  const batch = useMemo(() => {
    const result = convertTimestampBatch(batchInput, batchUnit);
    const rows = result.rows.map((row) => ({
      ...row,
      local: row.date ? formatLocalDisplay(row.date) : '',
    }));
    const tsv = rows
      .map((row) => [row.line, row.input.replace(/\t/g, ' '), row.utc, row.local].join('\t'))
      .join('\n');
    return { rows, tsv, notice: result.notice, okCount: rows.filter((row) => row.date).length };
  }, [batchInput, batchUnit]);

  const suggestedUnit = suggestUnit(epochInput);
  const showUnitHint = suggestedUnit !== null && suggestedUnit !== epochUnit;

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
            OpsecForge Hub
          </Link>
          <span>/</span>
          <span className="text-slate-300">Unix Timestamp</span>
        </div>

        <section className="mb-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-400 shadow-sm">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Local Date Math
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
                {currentEpochSeconds || <span aria-hidden="true">{"—".repeat(10)}</span>}
              </div>
            </div>

            <button
              aria-label="Copy current epoch seconds"
              onClick={() => copyValue('live', currentEpochSeconds)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300"
            >
              {copiedKey === 'live' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copiedKey === 'live' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                <TimerReset size={14} className="text-cyan-400" />
                Epoch To Date
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Choose the unit explicitly; the tool never guesses it. Microseconds and nanoseconds are floored to whole milliseconds. UTC output uses ISO 8601 with milliseconds; local output uses your browser&apos;s timezone.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
              <label>
                <span className="sr-only">Unix timestamp</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={epochInput}
                  onChange={(event) => setEpochInput(event.target.value)}
                  placeholder={UNIT_PLACEHOLDERS[epochUnit]}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-lg text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                />
              </label>
              <label>
                <span className="sr-only">Timestamp unit</span>
                <select
                  value={epochUnit}
                  onChange={(event) => setEpochUnit(event.target.value as UnixTimestampUnit)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm font-bold text-slate-200 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                >
                  <option value="seconds">Seconds</option>
                  <option value="milliseconds">Milliseconds</option>
                  <option value="microseconds">Microseconds</option>
                  <option value="nanoseconds">Nanoseconds</option>
                </select>
              </label>
            </div>

            {/* Fixed-height row so showing or hiding the hint does not move the results. */}
            <div className="mb-4 mt-2 flex min-h-[3.25rem] flex-wrap content-start items-center gap-x-3 gap-y-1 text-xs text-slate-400 sm:min-h-[1.75rem]" aria-live="polite">
              {showUnitHint && suggestedUnit ? (
                <>
                  <span>
                    This looks like {UNIT_LABELS[suggestedUnit]} ({countIntegerDigits(epochInput)} digits).
                  </span>
                  <button
                    type="button"
                    onClick={() => setEpochUnit(suggestedUnit)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-emerald-400 transition-all hover:border-emerald-500/30 hover:text-emerald-300"
                  >
                    Use {UNIT_LABELS[suggestedUnit]}
                  </button>
                </>
              ) : null}
            </div>

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
                      aria-label="Copy local time"
                      onClick={() => copyValue('local', epochConversion.local)}
                      disabled={!epochConversion.local}
                      className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 disabled:opacity-40"
                    >
                      {copiedKey === 'local' ? <Check size={14} /> : <Copy size={14} />}
                      Copy
                    </button>
                  </div>
                  <div className="break-words font-mono text-sm text-emerald-300">
                    {epochConversion.local || 'Waiting for input...'}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">UTC Time</span>
                    <button
                      aria-label="Copy UTC time"
                      onClick={() => copyValue('utc', epochConversion.utc)}
                      disabled={!epochConversion.utc}
                      className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 disabled:opacity-40"
                    >
                      {copiedKey === 'utc' ? <Check size={14} /> : <Copy size={14} />}
                      Copy
                    </button>
                  </div>
                  <div className="break-all font-mono text-sm text-emerald-300">
                    {epochConversion.utc || 'Waiting for input...'}
                  </div>
                </div>

                {/* Fixed minimum height so the relative text and the 32-bit notice do not shift the layout. */}
                <div className="min-h-[15rem] rounded-2xl border border-slate-800 bg-slate-950/70 p-5 sm:min-h-[13rem]" role="group" aria-label="Details">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Details</h3>
                  {details ? (
                    <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1.5 font-mono text-sm text-emerald-300">
                      <dt className="text-slate-500">Weekday (UTC)</dt>
                      <dd>{details.weekday}</dd>
                      <dt className="text-slate-500">Day of year</dt>
                      <dd>{details.dayOfYear}</dd>
                      <dt className="text-slate-500">ISO week</dt>
                      <dd>{details.isoWeek}</dd>
                      <dt className="text-slate-500">HTTP date</dt>
                      <dd className="break-words">{details.httpDate}</dd>
                      <dt className="text-slate-500">Relative</dt>
                      <dd aria-live="polite">{details.relative || ' '}</dd>
                    </dl>
                  ) : (
                    <div className="font-mono text-sm text-emerald-300">Waiting for input...</div>
                  )}
                  <p className="mt-3 min-h-[2.5rem] text-xs leading-relaxed text-amber-400">
                    {details?.int32Notice}
                  </p>
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
                Pick a date/time, choose whether it is local time or UTC, set the seconds field, and copy either seconds or milliseconds.
              </p>
            </div>

            <div role="group" aria-label="Interpret the date and time as" className="mb-4 inline-flex rounded-xl border border-slate-800 bg-slate-950/70 p-1">
              {(['local', 'utc'] as const).map((zone) => (
                <button
                  key={zone}
                  type="button"
                  aria-pressed={dateZone === zone}
                  onClick={() => setDateZone(zone)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                    dateZone === zone
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {zone === 'local' ? 'Local time' : 'UTC'}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <input
                aria-label={dateZone === 'utc' ? 'UTC date and time' : 'Local date and time'}
                type="datetime-local"
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-base text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
              />
              <input
                aria-label="Seconds (0–59)"
                type="number"
                min={0}
                max={59}
                value={secondsInput}
                onChange={(event) => setSecondsInput(event.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-base text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Seconds (0–59)
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              {dateZone === 'utc' ? (
                <>
                  The date and time are read as UTC, so the result does not depend on your browser&apos;s timezone and there are no daylight-saving gaps or repeats.
                </>
              ) : (
                <>
                  The date and time are read in your browser&apos;s timezone, not UTC. At daylight-saving transitions, JavaScript chooses the earlier repeated time or moves a skipped time forward.{' '}
                  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_components_and_time_zones" className="text-emerald-400 underline">Date/time behavior</a>.
                </>
              )}
            </p>

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
                      aria-label="Copy epoch seconds"
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
                      aria-label="Copy epoch milliseconds"
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

        <section
          aria-labelledby="batch-epoch-heading"
          className="mb-24 rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm lg:p-8"
        >
          <div className="mb-6">
            <h2 id="batch-epoch-heading" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
              <ListOrdered size={14} className="text-emerald-400" />
              Batch Epoch To Date
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Paste one timestamp per line, up to 1000 lines. A line that is only a number is converted in the batch unit you choose below. Any other line is searched for its first standalone number with at least 9 digits, which is marked &quot;from line&quot;. Everything is processed in this browser tab and nothing is uploaded.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <label>
              <span className="sr-only">Timestamps, one per line</span>
              <textarea
                value={batchInput}
                onChange={(event) => setBatchInput(event.target.value)}
                placeholder={'1710352200\n2026-01-01 INFO req=abc ts=1710352200 ok'}
                spellCheck={false}
                className="h-56 w-full resize-none overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 font-mono text-sm text-cyan-300 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
              />
            </label>
            <div className="flex flex-col gap-2">
              <label>
                <span className="sr-only">Batch timestamp unit</span>
                <select
                  value={batchUnit}
                  onChange={(event) => setBatchUnit(event.target.value as UnixTimestampUnit)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm font-bold text-slate-200 outline-none transition-all focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                >
                  <option value="seconds">Seconds</option>
                  <option value="milliseconds">Milliseconds</option>
                  <option value="microseconds">Microseconds</option>
                  <option value="nanoseconds">Nanoseconds</option>
                </select>
              </label>
              <p className="text-xs leading-relaxed text-slate-400">
                Unit for every line in this batch. It is separate from the single-value unit above and is never guessed.
              </p>
            </div>
          </div>

          {/* Fixed-height status row so notices do not move the table. */}
          <div className="mt-3 flex min-h-[3rem] flex-wrap content-start items-center justify-between gap-x-4 gap-y-2 text-xs text-slate-400 sm:min-h-[2rem]" aria-live="polite">
            <span className={batch.notice ? 'text-amber-400' : ''}>
              {batch.notice ||
                (batch.rows.length > 0
                  ? `${batch.okCount} of ${batch.rows.length} lines converted.`
                  : '')}
            </span>
            <button
              type="button"
              onClick={() => copyValue('batch', batch.tsv)}
              disabled={batch.rows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 transition-all hover:border-emerald-500/30 hover:text-emerald-300 disabled:opacity-40"
            >
              {copiedKey === 'batch' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedKey === 'batch' ? 'Copied' : 'Copy as TSV'}
            </button>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Batch results (scrollable)"
            className="h-80 overflow-auto rounded-2xl border border-slate-800 bg-slate-950/70"
          >
            {batch.rows.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Results appear here.</p>
            ) : (
              <table className="w-full min-w-[44rem] border-collapse text-left font-mono text-xs">
                <caption className="sr-only">Batch epoch conversion results</caption>
                <thead className="sticky top-0 bg-slate-900 text-[11px] uppercase tracking-widest text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-bold">Line</th>
                    <th scope="col" className="px-4 py-2 font-bold">Input</th>
                    <th scope="col" className="px-4 py-2 font-bold">UTC (ISO 8601)</th>
                    <th scope="col" className="px-4 py-2 font-bold">Local time</th>
                    <th scope="col" className="px-4 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.rows.map((row) => (
                    <tr key={row.line} className="border-t border-slate-800 align-top">
                      <td className="px-4 py-2 text-slate-500">{row.line}</td>
                      <td className="max-w-[16rem] break-all px-4 py-2 text-cyan-300">{row.input}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-emerald-300">{row.utc}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-emerald-300">{row.local}</td>
                      <td className={`px-4 py-2 ${row.error ? 'text-rose-300' : 'text-slate-400'}`}>
                        {row.error || (row.extracted ? `from line: ${row.token}` : 'OK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
