import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('brand icons', () => {
  it('ships every icon referenced by the web app manifest', () => {
    const manifest = JSON.parse(readFileSync(path.join(root, 'public/manifest.json'), 'utf8'));
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons as { src: string }[]) {
      expect(existsSync(path.join(root, 'public', icon.src)), icon.src).toBe(true);
    }
  });

  it('provides the file-convention icons', () => {
    for (const file of ['icon.svg', 'apple-icon.png', 'favicon.ico']) {
      expect(existsSync(path.join(root, 'app', file)), file).toBe(true);
    }
  });
});
