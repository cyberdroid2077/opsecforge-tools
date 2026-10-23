import type { ReactNode } from 'react';

/*
 * Small presentational pieces shared by the tool-page guides. Everything here
 * is built to stay inside a 375px viewport: code blocks and tables scroll
 * horizontally inside their own box instead of widening the page.
 */

export function Guide({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section
      id={id}
      className="mx-auto mt-4 min-w-0 max-w-4xl border-t border-slate-800 pb-28 pt-12 text-slate-400"
    >
      {children}
    </section>
  );
}

export function GuideHeading({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 mt-12 text-2xl font-bold tracking-tight text-slate-100 first:mt-0">{children}</h2>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mb-4 break-words text-base leading-7">{children}</p>;
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="break-words rounded bg-slate-800/70 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-300">
      {children}
    </code>
  );
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <figure className="my-5 min-w-0 max-w-full">
      {label ? (
        <figcaption className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">{label}</figcaption>
      ) : null}
      <pre
        tabIndex={0}
        aria-label={label ? `${label} (scrollable)` : 'Code sample (scrollable)'}
        className="max-w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-emerald-300"
      >
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function GuideTable({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="my-5 min-w-0 max-w-full overflow-x-auto rounded-2xl border border-slate-800" tabIndex={0} role="region" aria-label={caption ?? 'Table (scrollable)'}>
      <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-slate-900/70 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col" className="px-4 py-3 font-bold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 leading-6 text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Faq({ items }: { items: Array<{ q: string; a: ReactNode }> }) {
  return (
    <dl className="space-y-5">
      {items.map((item) => (
        <div key={item.q} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <dt className="mb-2 font-bold text-slate-100">{item.q}</dt>
          <dd className="break-words text-sm leading-6">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Sources({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <div className="mt-10 border-t border-slate-800 pt-6">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Primary sources</h3>
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href} className="break-words">
            <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
