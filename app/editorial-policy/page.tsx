import React from 'react';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Editorial policy',
  description:
    'Who runs OpsecForge, how its articles and tools are made and checked, how AI is involved, and how corrections are handled.',
  alternates: { canonical: '/editorial-policy' },
};

const linkClass = 'text-emerald-400 underline underline-offset-4 hover:text-emerald-300';

export default function EditorialPolicyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 lg:p-24 bg-slate-950 text-slate-300">
      <div className="w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-400 mb-12 transition-colors">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <h1 className="text-4xl font-bold text-slate-100 mb-4">Editorial policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: 2026-10-23</p>
        <div className="prose prose-invert prose-slate lg:prose-lg max-w-none">
          <p className="text-xl text-slate-400">
            This page explains who is behind OpsecForge, how its articles and tools are produced and checked, and what you can verify for yourself.
          </p>

          <h2 className="text-slate-100">Who runs this site</h2>
          <p>
            OpsecForge is maintained by an independent operator who does not publish a personal identity. There is no staff page, because there is no staff: the site has no editorial team, no security team, and no named authors, and nothing here should be read as implying otherwise.
          </p>
          <p>
            Day-to-day work (drafting articles, writing and testing code, publishing) is carried out by AI systems under the operator&apos;s authorization, following a written charter in the{' '}
            <a className={linkClass} href="https://github.com/cyberdroid2077/opsecforge-tools/blob/main/docs/PRODUCT_CHARTER.md" rel="noopener noreferrer">public repository</a>.
            The byline <strong>OpsecForge Editorial</strong> on articles refers to that process and its rules, not to a group of people. Publication is governed by those written rules and the automated checks below, not by a staff of reviewers.
          </p>

          <h2 className="text-slate-100">How content is made</h2>
          <p>
            Articles are drafted with AI assistance. AI-drafted text can contain mistakes and invented details, so the rules below exist to catch them. They reduce risk; they do not remove it.
          </p>
          <ul>
            <li>
              <strong>Primary sources.</strong> Claims about standards, vulnerabilities, vendor behavior and incidents are tied to primary or authoritative sources such as specifications, vendor advisories, NVD entries and CISA material. Articles carry a &quot;Sources reviewed&quot; date showing when those sources were last checked against the text.
            </li>
            <li>
              <strong>CVE and incident articles.</strong> Each CVE and incident claim is traced back to the original advisory or record rather than to secondary summaries. A repository script (<a className={linkClass} href="https://github.com/cyberdroid2077/opsecforge-tools/blob/main/scripts/validate-content-sources.mjs" rel="noopener noreferrer"><code>validate-content-sources.mjs</code></a>) blocks CVE articles that lack a review date, an official advisory or NVD source, and a direct NVD link per CVE. It checks that the sources are present, not that the article reads them correctly.
            </li>
            <li>
              <strong>No unverifiable material.</strong> The site does not publish statistics, case studies, quotes, users, or incident narratives that cannot be traced to a source. Examples are synthetic: invented tokens, keys and payloads, never real secrets.
            </li>
            <li>
              <strong>Tool logic is tested.</strong> The code behind the tools is covered by automated tests in the repository. Where an article shows what an OpsecForge tool does, it describes the tool&apos;s tested behavior and its limits; the tools are heuristics or simple transformations, not guarantees.
            </li>
            <li>
              <strong>Limits stated.</strong> Articles and tool pages say what a technique or tool does not prove. Nothing on the site is a compliance, legal or security assurance.
            </li>
          </ul>

          <h2 className="text-slate-100">Why the site exists</h2>
          <p>
            The aim is to give developers and security practitioners direct, source-backed answers and small browser-local tools for handling sensitive technical data such as tokens, environment files, hashes and encodings. The site is not a remote scanner, a credential vault or a substitute for production security controls.
          </p>

          <h2 className="text-slate-100">Corrections</h2>
          <p>
            If an article or tool is wrong, send the details through the <Link className={linkClass} href="/contact">contact page</Link>. Confirmed errors are fixed on the page and recorded on the <Link className={linkClass} href="/corrections">corrections page</Link>, including the removal of earlier content that did not meet these standards.
          </p>

          <h2 className="text-slate-100">Advertising and referral links</h2>
          <p>
            If advertising or affiliate links are added, they will be disclosed where they appear and in the <Link className={linkClass} href="/privacy">privacy policy</Link>, and this policy will be updated at the same time. Advertising does not decide what articles conclude or which tools or products are mentioned.
          </p>

          <h2 className="text-slate-100">Tool inputs and privacy</h2>
          <p>
            Core tool processing runs in the browser page; what you paste into a tool is not sent to an OpsecForge backend or included in analytics events. That is not the same as the whole site being offline: pages still load site resources and aggregate page-view analytics. Details are in the <Link className={linkClass} href="/privacy">privacy policy</Link> and the <Link className={linkClass} href="/faq">FAQ</Link>. Please do not paste live credentials into any web page, including this one, if you can avoid it.
          </p>

          <h2 className="text-slate-100">What you can verify</h2>
          <ul>
            <li>Source code (MIT license): <a className={linkClass} href="https://github.com/cyberdroid2077/opsecforge-tools" rel="noopener noreferrer">github.com/cyberdroid2077/opsecforge-tools</a></li>
            <li>npm package: <a className={linkClass} href="https://www.npmjs.com/package/opsecforge-mcp" rel="noopener noreferrer"><code>opsecforge-mcp</code></a></li>
            <li>Official MCP Registry entry: <a className={linkClass} href="https://registry.modelcontextprotocol.io/v0/servers/io.github.cyberdroid2077%2Fopsecforge/versions/latest" rel="noopener noreferrer"><code>io.github.cyberdroid2077/opsecforge</code></a></li>
            <li>What the MCP server does and does not do: <Link className={linkClass} href="/agents">/agents</Link></li>
            <li>Revision history of the site&apos;s content: <Link className={linkClass} href="/corrections">/corrections</Link></li>
          </ul>

          <h2 className="text-slate-100">Background</h2>
          <p>
            This page follows the &quot;Who, How and Why&quot; framing in Google&apos;s guidance on{' '}
            <a className={linkClass} href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" rel="noopener noreferrer">creating helpful content</a>{' '}and{' '}
            <a className={linkClass} href="https://developers.google.com/search/docs/fundamentals/using-gen-ai-content" rel="noopener noreferrer">using generative AI content</a>. See also <Link className={linkClass} href="/about">About</Link> and <Link className={linkClass} href="/contact">Contact</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
