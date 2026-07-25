import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, UserRound } from 'lucide-react';

const title = 'What Is a Webhook Signature and Why Must You Validate It?';
const description =
  'A practical guide to webhook signature verification, raw request bodies, constant-time comparison, replay protection, and secret rotation.';
const slug = 'what-is-a-webhook-signature-and-why-must-you-validate-it';
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
              Test a signature locally
            </p>
            <h2 className="mb-3 text-2xl font-bold text-slate-100">
              Compare webhook signatures in your browser
            </h2>
            <p className="mb-5 leading-7 text-slate-300">
              The Webhook Debugger supports local HMAC verification for common providers. Use
              test payloads and secrets; production verification belongs in your server endpoint.
            </p>
            <Link
              href="/tools/webhook-debugger"
              className="inline-flex rounded-full bg-emerald-500 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-400"
            >
              Open the Webhook Debugger →
            </Link>
          </aside>

          <div className="space-y-8 leading-8">
            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-100">
                What is a webhook signature?
              </h2>
              <p>
                A webhook signature is a cryptographic value created from the request payload and
                a secret shared by the sender and receiver. Your endpoint recomputes the expected
                value and rejects the request when the values do not match.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-100">
                Why signature validation is required
              </h2>
              <ul className="space-y-2 pl-6">
                <li className="list-disc">Reject forged requests from unknown senders.</li>
                <li className="list-disc">Detect payload changes before processing an event.</li>
                <li className="list-disc">
                  Combine timestamps or delivery identifiers with signature checks to reduce
                  replay risk.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-100">
                A safe verification sequence
              </h2>
              <ol className="space-y-2 pl-6">
                <li className="list-decimal">Read the exact raw request body.</li>
                <li className="list-decimal">
                  Parse the provider signature header according to that provider&apos;s format.
                </li>
                <li className="list-decimal">
                  Compute the expected HMAC with the configured webhook secret.
                </li>
                <li className="list-decimal">
                  Compare signatures with a constant-time comparison function.
                </li>
                <li className="list-decimal">
                  Validate the timestamp or delivery identifier when the provider supplies one.
                </li>
                <li className="list-decimal">
                  Reject invalid requests before parsing or acting on the event.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-100">Implementation pitfalls</h2>
              <ul className="space-y-2 pl-6">
                <li className="list-disc">
                  JSON middleware can change whitespace or byte representation before verification.
                </li>
                <li className="list-disc">
                  Header names, algorithms, encodings, and timestamp rules differ by provider.
                </li>
                <li className="list-disc">
                  A leaked webhook secret must be rotated; signature verification cannot protect a
                  secret that an attacker already has.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-bold text-slate-100">Primary references</h2>
              <ul className="space-y-3">
                <li>
                  <a
                    className="text-emerald-400 underline"
                    href="https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries"
                  >
                    GitHub: Validating webhook deliveries
                  </a>
                </li>
                <li>
                  <a className="text-emerald-400 underline" href="https://docs.stripe.com/webhooks">
                    Stripe: Receive events in your webhook endpoint
                  </a>
                </li>
              </ul>
            </section>

            <section className="border-t border-slate-800 pt-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-100">Related tools and guides</h2>
              <ul className="space-y-3">
                <li>
                  <Link className="text-emerald-400 underline" href="/tools/sha256-hash">
                    Generate SHA digests locally
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-emerald-400 underline"
                    href="/blog/how-to-generate-cryptographic-hashes-offline"
                  >
                    Understand cryptographic hash use cases
                  </Link>
                </li>
                <li>
                  <Link className="text-emerald-400 underline" href="/tools#debugging-validation">
                    Browse Debugging &amp; Validation tools
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
