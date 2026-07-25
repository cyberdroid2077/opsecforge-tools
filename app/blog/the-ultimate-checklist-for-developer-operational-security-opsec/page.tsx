import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, UserRound } from 'lucide-react';

const title = 'The Ultimate Checklist for Developer Operational Security (OpSec)';
const description =
  'A practical developer OpSec checklist covering secrets, local devices, repositories, authentication, and application security.';
const slug = 'the-ultimate-checklist-for-developer-operational-security-opsec';
const published = '2026-03-14';
const author = 'OpsecForge Security Team';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `/blog/${slug}` },
  openGraph: {
    type: 'article',
    title,
    description,
    url: `/blog/${slug}`,
    publishedTime: published,
    authors: [author],
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  datePublished: published,
  mainEntityOfPage: `https://www.opsecforge.com/blog/${slug}`,
  author: { '@type': 'Organization', name: author },
  publisher: {
    '@type': 'Organization',
    name: 'OpsecForge',
    url: 'https://www.opsecforge.com',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.opsecforge.com/' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.opsecforge.com/blog' },
    {
      '@type': 'ListItem',
      position: 3,
      name: title,
      item: `https://www.opsecforge.com/blog/${slug}`,
    },
  ],
};

const sections = [
  {
    heading: '1. Secrets management',
    items: [
      'Never commit secrets. Keep .env and private-key files out of version control.',
      'Use an approved secret manager instead of sharing credentials through chat or email.',
      'Revoke and replace compromised keys immediately.',
      'Use separate credentials and permissions for development, staging, and production.',
    ],
  },
  {
    heading: '2. Local environment security',
    items: [
      'Enable full-disk encryption and automatic screen locking.',
      'Use browser-local tools for sensitive JWTs, JSON, SQL, and environment files.',
      'Audit globally installed packages and remove software you no longer trust or need.',
      'Install operating-system and browser security updates promptly.',
    ],
  },
  {
    heading: '3. Code and repository security',
    items: [
      'Sign commits when your organization uses verified commit policies.',
      'Run secret scanning before code is committed or pushed.',
      'Commit lockfiles and review unexpected dependency changes.',
      'Enable supported dependency and vulnerability alerts.',
    ],
  },
  {
    heading: '4. Authentication and access',
    items: [
      'Use phishing-resistant MFA where available.',
      'Grant the minimum permissions required for the current task.',
      'Protect SSH private keys with passphrases and rotate keys that may be exposed.',
      'Remove stale accounts, tokens, and deployment credentials.',
    ],
  },
  {
    heading: '5. API and application security',
    items: [
      'Validate webhook signatures before processing payloads.',
      'Apply context-appropriate validation and output encoding to untrusted input.',
      'Add rate limits and abuse controls to exposed endpoints.',
      'Keep secrets out of URLs, analytics events, logs, and error messages.',
    ],
  },
];

export default function BlogPost() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-300 lg:px-24">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-emerald-400"
          >
            <ArrowLeft size={16} /> Back to Blog
          </Link>

          <header className="mb-8 border-b border-slate-800 pb-8">
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-100 lg:text-5xl">
              {title}
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Calendar size={16} />
                <time dateTime={published}>March 14, 2026</time>
              </span>
              <span className="flex items-center gap-2">
                <UserRound size={16} /> {author}
              </span>
            </div>
          </header>

          <aside className="mb-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
              Protect configuration before sharing
            </p>
            <h2 className="mb-3 text-2xl font-bold text-slate-100">
              Redact likely secrets from an .env file locally
            </h2>
            <p className="mb-5 leading-7 text-slate-300">
              The Env Sanitizer runs in your browser and helps mask credentials before a
              configuration sample reaches a ticket, chat, or document.
            </p>
            <Link
              href="/tools/env-sanitizer"
              className="inline-flex rounded-full bg-emerald-500 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-400"
            >
              Open the Env Sanitizer →
            </Link>
          </aside>

          <div className="space-y-8 leading-8">
            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-100">What is developer OpSec?</h2>
              <p>
                Developer operational security is the set of daily practices that prevents
                credentials, code, devices, and deployment access from becoming an attack path.
                It is continuous work: reduce exposure, restrict access, and respond quickly when
                a secret or account may be compromised.
              </p>
            </section>

            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-3 text-2xl font-bold text-slate-100">{section.heading}</h2>
                <ul className="space-y-2 pl-6">
                  {section.items.map((item) => (
                    <li key={item} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-100">Keep the checklist active</h2>
              <p>
                Review these controls during onboarding, before major releases, and after any
                credential exposure. A checklist only reduces risk when the team can verify each
                control in the real environment.
              </p>
            </section>

            <section className="border-t border-slate-800 pt-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-100">Related tools and guides</h2>
              <ul className="space-y-3">
                <li>
                  <Link className="text-emerald-400 underline" href="/tools/password-generator">
                    Generate a strong password locally
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-emerald-400 underline"
                    href="/blog/api-key-leaks-credential-security"
                  >
                    Prevent and respond to API-key leaks
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-emerald-400 underline"
                    href="/blog/what-is-a-webhook-signature-and-why-must-you-validate-it"
                  >
                    Validate webhook signatures
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
