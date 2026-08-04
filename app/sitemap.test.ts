import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('is stable and only publishes source-backed blog dates', () => {
    const first = sitemap();
    const second = sitemap();
    const dated = first.filter((entry) => 'lastModified' in entry);

    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
    expect(dated.length).toBeGreaterThan(0);
    expect(dated.every((entry) => entry.url.startsWith('https://www.opsecforge.com/blog/'))).toBe(true);
    expect(first.find((entry) => entry.url.endsWith('/blog/secure-coding-practices-development-security'))?.lastModified).toBe('2026-07-28');
    expect(first.find((entry) => entry.url.endsWith('/blog/how-to-generate-uuids-in-browser'))?.lastModified).toBe('2026-08-03');
    expect(first.find((entry) => entry.url === 'https://www.opsecforge.com')?.lastModified).toBeUndefined();
    expect(first.find((entry) => entry.url.endsWith('/tools/sql-formatter'))?.lastModified).toBeUndefined();
  });

  it('publishes only the canonical JSON formatter URL', () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain('https://www.opsecforge.com/tools/json-beautifier');
    expect(urls).not.toContain('https://www.opsecforge.com/tools/json-formatter');
  });
});
