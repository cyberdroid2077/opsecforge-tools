import { describe, expect, it } from 'vitest';
import sitemap from '../app/sitemap';
import { allTools } from './tool-catalog';
import { buildToolStructuredData, getToolSlug, toolDiscovery } from './tool-discovery';

const sitemapPaths = new Set(
  sitemap().map((entry) => entry.url.replace('https://www.opsecforge.com', '')),
);

describe('tool discovery data', () => {
  it('covers exactly the tools that are in the sitemap', () => {
    const sitemapTools = [...sitemapPaths]
      .filter((path) => /^\/tools\/[a-z0-9-]+$/.test(path))
      .map((path) => path.replace('/tools/', ''))
      .sort();

    expect(Object.keys(toolDiscovery).sort()).toEqual(sitemapTools);
    expect(allTools.map((tool) => tool.href.replace('/tools/', '')).sort()).toEqual(sitemapTools);
  });

  it('links only to indexable guides and tools, at most three guides and two tools per page', () => {
    for (const [slug, related] of Object.entries(toolDiscovery)) {
      expect(related.guides.length, slug).toBeLessThanOrEqual(3);
      expect(related.tools.length, slug).toBeLessThanOrEqual(2);

      for (const target of [...related.guides, ...related.tools]) {
        expect(sitemapPaths.has(target.href), `${slug} -> ${target.href}`).toBe(true);
        expect(target.href, slug).not.toBe(`/tools/${slug}`);
      }
    }
  });

  it('links every tool page except the colour converter to at least one guide', () => {
    for (const [slug, related] of Object.entries(toolDiscovery)) {
      if (slug !== 'hex-rgb-converter') {
        expect(related.guides.length, slug).toBeGreaterThan(0);
      }
    }
  });

  it('ties the webhook verifier to both webhook articles', () => {
    const hrefs = toolDiscovery['webhook-debugger'].guides.map((guide) => guide.href);

    expect(hrefs).toContain('/blog/webhook-signature-validation-hmac-sha256-best-practices-2026');
    expect(hrefs).toContain('/blog/cve-2026-33143-webhook-signature-verification-bypass-2026');
  });

  it('only resolves slugs for indexable tool routes', () => {
    expect(getToolSlug('/tools/hash-generator')).toBe('hash-generator');
    expect(getToolSlug('/tools/hash-generator/')).toBe('hash-generator');
    expect(getToolSlug('/tools')).toBeNull();
    expect(getToolSlug('/tools/lorem-ipsum')).toBeNull();
    expect(getToolSlug('/blog/base64-vs-base64url')).toBeNull();
    expect(getToolSlug(null)).toBeNull();
  });
});

describe('tool structured data', () => {
  it('emits WebApplication and BreadcrumbList without ratings or usage counts', () => {
    for (const tool of allTools) {
      const slug = tool.href.replace('/tools/', '');
      const data = buildToolStructuredData(slug);

      expect(data, slug).not.toBeNull();

      const [app, breadcrumb] = data as Record<string, unknown>[];

      expect(app).toMatchObject({
        '@type': 'WebApplication',
        name: tool.name,
        url: `https://www.opsecforge.com${tool.href}`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0' },
      });
      expect(breadcrumb).toMatchObject({ '@type': 'BreadcrumbList' });
      expect((breadcrumb.itemListElement as unknown[]).length).toBe(3);

      const serialized = JSON.stringify(data);
      expect(serialized).not.toMatch(/aggregateRating|ratingValue|reviewCount|userCount/);
    }
  });

  it('returns nothing for unknown tools', () => {
    expect(buildToolStructuredData('lorem-ipsum')).toBeNull();
  });
});
