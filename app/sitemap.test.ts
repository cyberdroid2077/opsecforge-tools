import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('is stable and does not fabricate last-modified dates', () => {
    const first = sitemap();
    const second = sitemap();

    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((entry) => !('lastModified' in entry))).toBe(true);
  });

  it('publishes only the canonical JSON formatter URL', () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain('https://www.opsecforge.com/tools/json-beautifier');
    expect(urls).not.toContain('https://www.opsecforge.com/tools/json-formatter');
  });
});
