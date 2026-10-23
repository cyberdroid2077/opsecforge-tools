// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import retired from '../config/retired-urls.json';
import sitemap from '../app/sitemap';
import { GET, HEAD } from '../app/api/gone/route';

const root = path.resolve(__dirname, '..');
const SITE = 'https://www.opsecforge.com';

// The 40 legacy URLs (33 old articles + 7 small tools) that were noindex but still answered 200.
const LEGACY_40 = [
  '/blog/20260321-938dbbbc',
  '/blog/ai-agent-api-security-bedrock-attack-vectors-2026',
  '/blog/ai-agent-security-threats-agentic-enterprise-2026',
  '/blog/ai-anomaly-detection-api-security-2026',
  '/blog/ai-driven-dynamic-rate-limiting-strategies-for-enterprise-apis',
  '/blog/ai-enhanced-xss-detection-and-prevention-techniques-2026',
  '/blog/api-credential-leakage-2026-trends',
  '/blog/api-credential-sprawl-container-images-2026',
  '/blog/api-error-responses-information-disclosure-reconnaissance-2026',
  '/blog/api-gateway-security-supply-chain-2026',
  '/blog/api-scraping-attacks-mass-surveillance-2026',
  '/blog/building-production-rag-systems-enterprise-lessons-2026',
  '/blog/ci-cd-credential-leaks-2026',
  '/blog/ci-cd-supply-chain-attack-teampcp-2026',
  '/blog/cors-misconfiguration-security-risks-and-fixes-for-modern-web-apis',
  '/blog/cve-2026-10520-ivanti-sentry-rce-auth-bypass-2026',
  '/blog/cve-2026-33504-pagination-token-sql-injection-2026',
  '/blog/cve-2026-40490-asynchttpclient-redirect-credential-leak',
  '/blog/dynamic-ephemeral-secret-management-for-cloud-native-ci-cd-pipelines',
  '/blog/dynamic-oauth-token-revocation',
  '/blog/graphql-introspection-schema-exposure-security-2026',
  '/blog/hardware-ai-security-edge-computing-2026',
  '/blog/how-to-decode-jwt-tokens-client-side',
  '/blog/how-to-generate-secure-passwords-offline',
  '/blog/jwt-none-algorithm-dangers',
  '/blog/mongobleed-cve-2025-14847-memory-leak-api-security',
  '/blog/oauth-token-theft-why-sso-mfa-fail-2026',
  '/blog/owasp-api-security-top-10-vulnerabilities-and-remediation-strategies-2026',
  '/blog/react2shell-nextjs-credential-harvesting-cve-2025-55182-2026',
  '/blog/secrets-sprawl-2026-ai-accelerating-disaster',
  '/blog/serverless-api-security-2026',
  '/blog/source-map-leaks-frontend-security',
  '/blog/zero-trust-api-security-architecture-for-2026',
  '/tools/lorem-ipsum',
  '/tools/markdown-to-html',
  '/tools/qr-generator',
  '/tools/text-case',
  '/tools/text-diff',
  '/tools/url-encoder',
  '/tools/word-counter',
];

// Second batch (AdSense readiness item 2): thin or duplicate articles merged into a retained article
// (301, one hop), plus pages with no same-topic replacement (410).
const MERGED_301: Record<string, string> = {
  '/blog/env-files-destroy-companies': '/blog/environment-variable-leaks-security-risks',
  '/blog/jwt-token-leak-apr-2026-analysis': '/blog/jwt-token-vulnerabilities-authentication-security',
  '/blog/secrets-sprawl-credential-leak-epidemic-2026': '/blog/api-key-leaks-credential-security',
  '/blog/ai-native-api-gateway-security-for-enterprise-2026': '/blog/shadow-apis-the-invisible-threat-2026',
  '/blog/when-security-scanners-become-weapons-devsecops-supply-chain-march-2026': '/blog/oauth-token-leakage-ci-cd-2026',
  '/blog/ai-bubble-burst-api-security-post-hype-era': '/blog/ai-api-provider-exit-planning',
};

const GONE_2 = [
  '/blog/ai-sycophancy-security-chatbot-bias-2026',
  '/blog/global-privacy-compliance-guide-2026',
  '/blog/why-client-side-execution-is-the-future-of-developer-utilities',
  '/blog/why-soc2-compliance-means-you-should-stop-using-cloud-formatters',
  '/tools/hex-rgb-converter',
  '/case-studies',
];

// Every URL retired by either mechanism: none may be a redirect target or an internal link.
const RETIRED_ALL = [...LEGACY_40, ...Object.keys(MERGED_301), ...GONE_2];

const redirectSources = retired.redirects.map((entry) => entry.source);
const goneSet = new Set<string>(retired.gone);
const sitemapPaths = new Set(sitemap().map((entry) => entry.url.replace(SITE, '') || '/'));

type ServedRedirect = { source: string; destination: string; permanent?: boolean; statusCode?: number };
type NextConfigShape = {
  redirects: () => Promise<ServedRedirect[]>;
  rewrites: () => Promise<{ beforeFiles: { source: string; destination: string }[] }>;
  headers?: () => Promise<unknown[]>;
};

// next.config.js is CommonJS and wrapped by next-pwa; load it the way Next does.
const nextConfig = createRequire(import.meta.url)('../next.config.js') as NextConfigShape;

function routeExists(destination: string) {
  if (destination.startsWith('/blog/')) {
    return fs.existsSync(path.join(root, 'content/blog', `${destination.slice('/blog/'.length)}.md`));
  }

  if (destination.startsWith('/tools/')) {
    return fs.existsSync(path.join(root, 'app/tools', destination.slice('/tools/'.length), 'page.tsx'));
  }

  return fs.existsSync(path.join(root, 'app', destination, 'page.tsx'));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('retired legacy URLs: tables', () => {
  it('handles each of the 40 legacy URLs exactly once, as either a 301 or a 410', () => {
    expect(new Set(LEGACY_40).size).toBe(40);
    expect(LEGACY_40.filter((url) => url.startsWith('/blog/'))).toHaveLength(33);
    expect(LEGACY_40.filter((url) => url.startsWith('/tools/'))).toHaveLength(7);

    for (const url of LEGACY_40) {
      const hits = redirectSources.filter((source) => source === url).length + (goneSet.has(url) ? 1 : 0);

      expect(hits, url).toBe(1);
    }
  });

  it('contains nothing beyond the 40, the three older JWT redirects, and the second batch', () => {
    const extras = redirectSources.filter((source) => !LEGACY_40.includes(source));

    expect([...extras].sort()).toEqual(
      [
        '/blog/jwt-algorithm-bypass',
        '/blog/jwt-none-algorithm-security-risk',
        '/blog/jwt-none-algorithm-security-risks',
        ...Object.keys(MERGED_301),
      ].sort(),
    );
    expect(retired.gone.every((url) => LEGACY_40.includes(url) || GONE_2.includes(url))).toBe(true);
    expect(new Set(retired.gone).size).toBe(retired.gone.length);
    expect(new Set(redirectSources).size).toBe(redirectSources.length);
    expect(retired.gone).toHaveLength(34 + GONE_2.length);
    expect([...retired.gone].sort()).toEqual(expect.arrayContaining([...GONE_2].sort()));
  });

  it('sends each merged article to its single retained target in one hop', () => {
    for (const [source, destination] of Object.entries(MERGED_301)) {
      const entry = retired.redirects.find((candidate) => candidate.source === source);

      expect(entry?.destination, source).toBe(destination);
      expect(routeExists(destination), destination).toBe(true);
    }
  });

  it('retargets the two older redirects whose destination was merged away', () => {
    const byOrigin = Object.fromEntries(retired.redirects.map((entry) => [entry.source, entry.destination]));

    expect(byOrigin['/blog/secrets-sprawl-2026-ai-accelerating-disaster']).toBe('/blog/api-key-leaks-credential-security');
    expect(byOrigin['/blog/api-gateway-security-supply-chain-2026']).toBe('/blog/shadow-apis-the-invisible-threat-2026');
  });

  it('sends every redirect to a retained, sitemap-listed page (never a 410, never a chain)', () => {
    for (const { source, destination } of retired.redirects) {
      expect(goneSet.has(destination), `${source} -> 410 ${destination}`).toBe(false);
      expect(redirectSources.includes(destination), `${source} -> chain via ${destination}`).toBe(false);
      expect(RETIRED_ALL.includes(destination), `${source} -> retired ${destination}`).toBe(false);
      expect(sitemapPaths.has(destination), `${source} -> ${destination} is not in the sitemap`).toBe(true);
      expect(routeExists(destination), `${source} -> ${destination} does not exist`).toBe(true);
    }
  });

  it('only uses a tool as a redirect target when the old article was a how-to for that exact tool', () => {
    const toolTargets = retired.redirects.filter((entry) => entry.destination.startsWith('/tools/'));

    expect(toolTargets.map((entry) => [entry.source, entry.destination])).toEqual([
      ['/blog/how-to-decode-jwt-tokens-client-side', '/tools/jwt-decoder'],
      ['/blog/how-to-generate-secure-passwords-offline', '/tools/password-generator'],
    ]);
  });
});

describe('retired legacy URLs: next.config.js as served', () => {
  it('serves the retired redirect table as 301 and has no chains or 410 targets across all redirects', async () => {
    const all = await nextConfig.redirects();
    const sources = new Set(all.map((entry) => entry.source));

    expect(sources.size).toBe(all.length);

    for (const { source, destination } of retired.redirects) {
      const served = all.find((entry) => entry.source === source);

      expect(served?.destination, source).toBe(destination);
      expect(served?.statusCode, source).toBe(301);
    }

    for (const entry of all) {
      expect(sources.has(entry.destination), `chain: ${entry.source} -> ${entry.destination}`).toBe(false);
      expect(goneSet.has(entry.destination), `410 target: ${entry.source} -> ${entry.destination}`).toBe(false);
      expect(RETIRED_ALL.includes(entry.destination), `retired target: ${entry.source}`).toBe(false);
      expect(routeExists(entry.destination), `${entry.source} -> ${entry.destination} missing`).toBe(true);
    }
  });

  it('rewrites exactly the 410 paths, ahead of the filesystem routes, to the 410 handler', async () => {
    const { beforeFiles } = await nextConfig.rewrites();

    expect(beforeFiles.map((rule) => rule.source).sort()).toEqual([...retired.gone].sort());
    expect(beforeFiles.every((rule) => rule.destination === '/api/gone')).toBe(true);
  });

  it('no longer sets X-Robots-Tag rules for the removed tools', async () => {
    const headers = nextConfig.headers ? await nextConfig.headers() : [];

    expect(JSON.stringify(headers)).not.toMatch(/lorem-ipsum|markdown-to-html|qr-generator|text-case|text-diff|url-encoder|word-counter/);
  });

  it('answers GET and HEAD with 410 and noindex', async () => {
    for (const handler of [GET, HEAD]) {
      const response = handler();

      expect(response.status).toBe(410);
      expect(response.headers.get('x-robots-tag')).toBe('noindex');
      expect(response.headers.get('content-type')).toContain('text/html');
    }

    expect(await GET().text()).toContain('410 Gone');
  });
});

describe('retired legacy URLs: content is gone, retained pages are untouched', () => {
  it('has no source file, tool directory or page left for any retired URL', () => {
    for (const url of [...GONE_2, ...Object.keys(MERGED_301)]) {
      if (url.startsWith('/blog/')) {
        expect(fs.existsSync(path.join(root, 'content/blog', `${url.slice('/blog/'.length)}.md`)), url).toBe(false);
      } else {
        expect(fs.existsSync(path.join(root, 'app', url.slice(1))), url).toBe(false);
      }
    }

    for (const url of LEGACY_40) {
      if (url.startsWith('/blog/')) {
        expect(fs.existsSync(path.join(root, 'content/blog', `${url.slice('/blog/'.length)}.md`)), url).toBe(false);
      } else {
        expect(fs.existsSync(path.join(root, 'app/tools', url.slice('/tools/'.length))), url).toBe(false);
      }
    }

    for (const component of [
      'LoremIpsumTool',
      'MarkdownToHtmlTool',
      'QrGeneratorTool',
      'Tool-CaseConverter',
      'TextCaseConverterTool',
      'TextDiffTool',
      'Tool-URLEncoder',
      'UrlEncoderTool',
      'WordCounterTool',
    ]) {
      expect(fs.existsSync(path.join(root, 'components', `${component}.tsx`)), component).toBe(false);
    }
  });

  it('leaves no dead page file behind any redirected /blog/ URL (the redirect is the only thing that answers)', async () => {
    const served = (await nextConfig.redirects()).map((entry) => entry.source);
    const redirectedBlogSources = served.filter((source) => source.startsWith('/blog/'));
    const leftovers = redirectedBlogSources.filter((source) => fs.existsSync(path.join(root, 'app', source)));

    expect(leftovers).toEqual([]);
  });

  it('keeps every remaining article and indexable tool in the sitemap and out of the retired tables', () => {
    const articles = fs.readdirSync(path.join(root, 'content/blog')).filter((name) => name.endsWith('.md'));
    const tools = fs
      .readdirSync(path.join(root, 'app/tools'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, 'app/tools', entry.name, 'page.tsx')))
      .map((entry) => entry.name)
      .filter((name) => !['json-formatter', 'sha256-hash'].includes(name));

    expect(articles).toHaveLength(31);
    expect(tools).toHaveLength(11);

    const retainedRoutes = [
      ...articles.map((name) => `/blog/${name.replace(/\.md$/, '')}`),
      ...tools.map((name) => `/tools/${name}`),
    ];

    for (const route of retainedRoutes) {
      expect(sitemapPaths.has(route), route).toBe(true);
    }

    for (const route of sitemapPaths) {
      expect(goneSet.has(route) || redirectSources.includes(route), route).toBe(false);
    }
  });

  it('has no internal link, navigation entry or llms.txt line pointing at a retired URL', () => {
    const skipDirectories = new Set(['node_modules', '.next', '.git', 'ai-seo', 'bizdev-pipeline', 'config', 'docs', 'coverage', 'tts']);
    const pattern = new RegExp(`(${RETIRED_ALL.map(escapeRegExp).join('|')})(?![a-z0-9-])`);
    const offenders: string[] = [];

    function walk(directory: string) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);
        const relative = path.relative(root, full);

        if (entry.isDirectory()) {
          if (!skipDirectories.has(entry.name) && !entry.name.startsWith('.')) walk(full);
          continue;
        }

        const scanned = /\.(tsx?|mjs|js|json|md|txt|xml)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name);
        const exempt =
          relative === 'next.config.js' ||
          relative === 'package-lock.json' ||
          entry.name.startsWith('.');

        if (scanned && !exempt) {
          const match = pattern.exec(fs.readFileSync(full, 'utf8'));

          if (match) offenders.push(`${relative}: ${match[1]}`);
        }
      }
    }

    walk(root);

    expect(offenders).toEqual([]);
  });
});
