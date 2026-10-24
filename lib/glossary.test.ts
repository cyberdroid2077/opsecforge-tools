import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { glossary } from './glossary';

const root = path.resolve(__dirname, '..');
const retired = JSON.parse(readFileSync(path.join(root, 'config/retired-urls.json'), 'utf8')) as {
  redirects: { source: string }[];
  gone: string[];
};
const retiredPaths = new Set([...retired.redirects.map((r) => r.source), ...retired.gone]);

function internalPageExists(href: string) {
  if (href.startsWith('/blog/')) {
    return existsSync(path.join(root, 'content/blog', `${href.slice('/blog/'.length)}.md`));
  }
  if (href.startsWith('/tools/')) {
    return existsSync(path.join(root, 'app', href.slice(1)));
  }
  return false;
}

describe('glossary data', () => {
  it('has unique ids and no risk ratings', () => {
    expect(new Set(glossary.map((g) => g.id)).size).toBe(glossary.length);
    for (const entry of glossary) {
      expect(entry).not.toHaveProperty('risk');
      expect(JSON.stringify(entry)).not.toMatch(/Risk:/);
    }
  });

  it('links every entry to live internal pages and an https primary source', () => {
    for (const entry of glossary) {
      expect(entry.internal.length).toBeGreaterThan(0);
      for (const link of entry.internal) {
        expect(retiredPaths.has(link.href), `${entry.id}: ${link.href} is retired`).toBe(false);
        expect(internalPageExists(link.href), `${entry.id}: ${link.href} does not exist`).toBe(true);
      }
      expect(entry.source.href).toMatch(/^https:\/\//);
    }
  });

  it('does not describe JWT as a way to transmit information securely', () => {
    const jwt = glossary.find((g) => g.id === 'jwt');
    expect(jwt?.def).not.toMatch(/securely transmitting/i);
    expect(jwt?.def).toMatch(/not make the contents secret/);
  });
});
