import {
  ArrowRight,
  Fingerprint,
  ShieldCheck,
  UploadCloud,
  Webhook,
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { primaryToolHrefs, primaryTools, toolGroups } from '../lib/tool-catalog';
import styles from './home.module.css';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const [sanitizerTool, webhookTool, hashTool, base64Tool] = primaryTools;
const primaryHrefSet = new Set<string>(primaryToolHrefs);

const featuredTools = [
  {
    tool: webhookTool,
    label: 'Debugging & validation',
    action: 'Open verifier',
    Icon: Webhook,
    variant: styles.workflowWide,
  },
  {
    tool: hashTool,
    label: 'Credentials & security',
    action: 'Compare a file checksum',
    Icon: Fingerprint,
    variant: styles.workflowDark,
  },
  {
    tool: base64Tool,
    label: 'Encoding & formatting',
    action: 'Open converter',
    Icon: UploadCloud,
    variant: styles.workflowBright,
  },
];

const featuredArticles = [
  {
    label: 'Credential hygiene',
    title: 'How to Sanitize .env Files Before Sharing',
    description: 'Learn where heuristic redaction helps, where it can miss, and why human review still matters.',
    href: '/blog/how-to-sanitize-env-files-before-sharing',
  },
  {
    label: 'Webhook security',
    title: 'What Is a Webhook Signature and Why Must You Validate It?',
    description: 'Understand signature matching, timestamp checks, and replay defenses for production receivers.',
    href: '/blog/what-is-a-webhook-signature-and-why-must-you-validate-it',
  },
  {
    label: 'Cryptography',
    title: 'How to Generate Cryptographic Hashes Offline',
    description: 'Choose an appropriate digest and keep sensitive source text out of remote utilities.',
    href: '/blog/how-to-generate-cryptographic-hashes-offline',
  },
  {
    label: 'Encoding',
    title: 'Base64 vs Base64URL',
    description: 'See how the alphabets, padding, and URL-safe variants differ before converting data.',
    href: '/blog/base64-vs-base64url',
  },
];

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'OpsecForge',
      url: 'https://www.opsecforge.com/',
      description: 'Browser-local developer utilities for formatting, inspection, and verification.',
    },
    {
      '@type': 'ItemList',
      name: 'Primary OpsecForge tools',
      itemListElement: primaryTools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tool.name,
        url: `https://www.opsecforge.com${tool.href}`,
      })),
    },
  ],
};

export default function Home() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      <div aria-hidden="true" className={styles.gridBackdrop} />
      <div className={styles.pageShell}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.liveDot} aria-hidden="true" />
              Browser-local developer tools
            </p>
            <h1 id="home-title">Developer tools. No uploads.</h1>
            <p className={styles.heroSubtitle}>
              Format, inspect, and verify sensitive data directly in your browser.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href={sanitizerTool.href}>
                Open Safe-to-Share Sanitizer <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link className={styles.secondaryButton} href="/tools">
                Browse all tools
              </Link>
            </div>
            <ul className={styles.trustRow} aria-label="Tool privacy boundaries">
              <li><span aria-hidden="true">✓</span> Runs in your browser</li>
              <li><span aria-hidden="true">✓</span> No tool-input processing backend</li>
              <li><span aria-hidden="true">◇</span> Review every result</li>
            </ul>
          </div>

          <section className={styles.sanitizerCard} aria-labelledby="sanitizer-title">
            <div aria-hidden="true" className={styles.scanLine} />
            <div className={styles.sanitizerHeader}>
              <div>
                <p className={styles.cardKicker}>Start here · Credential hygiene</p>
                <h2 id="sanitizer-title">{sanitizerTool.name}</h2>
              </div>
              <ShieldCheck aria-hidden="true" className={styles.sanitizerIcon} size={27} />
            </div>
            <p className={styles.sanitizerDescription}>{sanitizerTool.description}</p>
            <div className={styles.terminalPreview} aria-label="Synthetic sanitizer result preview">
              <div className={styles.terminalBar} aria-hidden="true">
                <span /><span /><span /><code>config.env</code>
              </div>
              <div className={styles.terminalLines} aria-hidden="true">
                <p><b>API_URL</b><i>=</i>https://api.example.dev</p>
                <p><b>API_KEY</b><i>=</i><mark>••••••••••••••••</mark></p>
                <p><b>PUBLIC_KEY_ID</b><i>=</i>pk_synthetic</p>
              </div>
              <div className={styles.terminalStatus}>
                <span>2 likely secrets masked</span><span>Review required</span>
              </div>
            </div>
          </section>
        </section>

        <section className={styles.workflowSection} aria-labelledby="focused-workflows">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>{'// 01 — Focused workflows'}</p>
              <h2 id="focused-workflows">One clear task at a time.</h2>
            </div>
            <p>Use a purpose-built local workflow, then move on. No account or upload step.</p>
          </div>

          <div className={styles.workflowGrid}>
            {featuredTools.map(({ tool, label, action, Icon, variant }, index) => (
              <Link className={`${styles.workflowCard} ${variant}`} href={tool.href} key={tool.href}>
                <Icon aria-hidden="true" className={styles.workflowIcon} size={index === 0 ? 43 : 35} />
                <div className={styles.workflowCopy}>
                  <p className={styles.cardKicker}>{label}</p>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                </div>
                <span className={styles.cardLink}>{action} <ArrowRight aria-hidden="true" size={15} /></span>
                {index === 0 && (
                  <div className={styles.signatureArt} aria-hidden="true">
                    <span>sha256=</span><b>9c2e••••a71f</b><i>match</i>
                  </div>
                )}
                {index > 0 && <span className={styles.workflowNumber} aria-hidden="true">{index === 1 ? '#' : '64'}</span>}
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.toolsSection} aria-labelledby="more-tools">
          <div className={`${styles.sectionHeading} ${styles.compactHeading}`}>
            <div>
              <p className={styles.sectionIndex}>{'// 02 — Full toolkit'}</p>
              <h2 id="more-tools">More tools by purpose.</h2>
            </div>
            <Link className={styles.textLink} href="/tools">
              View complete tools center <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>

          <div className={styles.toolDirectory}>
            {toolGroups.map((group, index) => {
              const remainingTools = group.tools.filter((tool) => !primaryHrefSet.has(tool.href));

              return (
                <section className={styles.directoryColumn} key={group.id} aria-labelledby={`home-${group.id}`}>
                  <div className={styles.directoryHeading}>
                    <span aria-hidden="true">0{index + 1}</span>
                    <div>
                      <h3 id={`home-${group.id}`}>{group.name}</h3>
                      <p>{group.description}</p>
                    </div>
                  </div>
                  <ul>
                    {remainingTools.map((tool) => (
                      <li key={tool.href}>
                        <Link href={tool.href}>{tool.name}<ArrowRight aria-hidden="true" size={14} /></Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>

        <section className={styles.guidesSection} aria-labelledby="security-guides">
          <div className={`${styles.sectionHeading} ${styles.compactHeading}`}>
            <div>
              <p className={styles.sectionIndex}>{'// 03 — Practical guides'}</p>
              <h2 id="security-guides">Security decisions, explained.</h2>
            </div>
            <Link className={styles.textLink} href="/blog">
              View all articles <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
          <div className={styles.guidesGrid}>
            {featuredArticles.map((article, index) => (
              <Link className={styles.guideCard} href={article.href} key={article.href}>
                <div className={styles.guideMeta}><span>0{index + 1}</span><span>{article.label}</span></div>
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <ArrowRight aria-hidden="true" className={styles.guideArrow} size={17} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
