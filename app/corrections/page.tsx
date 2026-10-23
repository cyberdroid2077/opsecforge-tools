import React from 'react';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Corrections and revision history',
  description:
    'A dated record of corrections, removals and fixes to OpsecForge content and tools, including what was wrong and what changed.',
  alternates: { canonical: '/corrections' },
};

const linkClass = 'text-emerald-400 underline underline-offset-4 hover:text-emerald-300';

type Entry = {
  date: string;
  title: string;
  body: React.ReactNode;
};

const entries: Entry[] = [
  {
    date: '2026-10',
    title: 'Overlapping and thin articles merged',
    body: (
      <p>
        Several short articles that overlapped on the same topic were merged into fewer, longer pages or removed. A retired URL redirects to the page that now covers its topic, or returns 410 Gone when no suitable replacement exists.
      </p>
    ),
  },
  {
    date: '2026-10-22',
    title: '40 legacy URLs retired',
    body: (
      <>
        <p>
          Forty old URLs (33 articles and 7 small tools) had been hidden from search results and the sitemap but were still reachable. They were taken down: 34 now return 410 Gone and 6 redirect to a retained page on the same topic. Some of the removed articles contained incident narratives that could not be traced to a primary source, which this site does not publish. The complete list is in{' '}
          <a className={linkClass} href="https://github.com/cyberdroid2077/opsecforge-tools/blob/main/config/retired-urls.json" rel="noopener noreferrer"><code>config/retired-urls.json</code></a> in the repository.
        </p>
      </>
    ),
  },
  {
    date: '2026-10-13',
    title: 'JWT Decoder: time claims were misjudged',
    body: (
      <>
        <p>
          The JWT Decoder treated <code>iat</code> and <code>nbf</code> like <code>exp</code>, so a normal token whose <code>iat</code> or <code>nbf</code> lay in the past could be reported as expired. Now only an <code>exp</code> in the past marks a token as expired; an <code>nbf</code> in the future is shown as not yet valid; <code>iat</code> and <code>auth_time</code> are shown as times only, with a possible-clock-skew note if they lie in the future. Out-of-range timestamp values no longer cause an error and are shown as-is. The decoder still does not verify signatures.
        </p>
        <p>
          The same change fixed several gaps in the Safe-to-Share Sanitizer: partially masked values were treated as already redacted, multi-line YAML block values and quoted values were only partly redacted, and some key formats (including OpenAI, Anthropic, Slack and GitLab tokens and private key blocks) were not recognized. The sanitizer remains a heuristic that can miss data.
        </p>
      </>
    ),
  },
  {
    date: '2026-07 to 2026-08',
    title: 'Unsupported and invented claims replaced',
    body: (
      <>
        <p>
          A review of existing articles found claims without sources. The affected articles were rewritten around primary sources:
        </p>
        <ul>
          <li>2026-07-15: an article on OAuth token revocation contained invented security claims; replaced.</li>
          <li>2026-08-08: unsupported claims in an article on broken object-level authorization; replaced.</li>
          <li>2026-08-10: invented CI/CD token incidents in an article on token leakage; replaced.</li>
          <li>Between 2026-07-13 and 2026-08-20: further articles on CVEs, request smuggling, mass assignment, OAuth redirects, GraphQL and API rate limiting were corrected.</li>
        </ul>
        <p>
          On 2026-07-24 a repository check was added that blocks CVE articles without review metadata and an official source (see the <Link className={linkClass} href="/editorial-policy">editorial policy</Link>).
        </p>
      </>
    ),
  },
  {
    date: '2026-07 to 2026-09',
    title: 'Tool fixes',
    body: (
      <p>
        Fixes to tool behavior, as recorded in the repository history: webhook signature verification semantics and sanitizer hardening (2026-07-24), Unix timestamp unit handling (2026-08-02), browser-side UUID generation (2026-08-03), and SQL formatter dialect syntax (2026-09-07).
      </p>
    ),
  },
  {
    date: '2026-03',
    title: 'Launch and early cleanup',
    body: (
      <p>
        The site launched on 2026-03-11 and published a large number of articles in a short time. Within two weeks, on 2026-03-21 and 2026-03-22, duplicate articles were consolidated with redirects and 14 placeholder or very short articles were removed. Later entries on this page cover the content that still fell short of the standards in the editorial policy.
      </p>
    ),
  },
];

export default function CorrectionsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <h1 className="text-4xl font-bold text-slate-100 mb-4">Corrections and revision history</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: 2026-10-23</p>
        <div className="prose prose-invert prose-slate lg:prose-lg max-w-none">
          <p className="text-xl text-slate-400">
            This is a dated record of material errors found in OpsecForge content and tools and what was done about them. Entries are taken from the site&apos;s public{' '}
            <a className={linkClass} href="https://github.com/cyberdroid2077/opsecforge-tools/commits/main" rel="noopener noreferrer">commit history</a>. The newest entry is first.
          </p>
          <p>
            To report an error, use the <Link className={linkClass} href="/contact">contact page</Link>. How content is produced and checked is described in the <Link className={linkClass} href="/editorial-policy">editorial policy</Link>.
          </p>
          {entries.map((entry) => (
            <section key={`${entry.date}-${entry.title}`} className="mt-10">
              <h2 className="text-slate-100 mb-1">{entry.title}</h2>
              <p className="text-sm text-slate-500 mt-0">{entry.date}</p>
              {entry.body}
            </section>
          ))}
          <p className="mt-12 text-sm text-slate-500">
            See <Link className={linkClass} href="/about">About</Link> for how the site is run.
          </p>
        </div>
      </div>
    </main>
  );
}
