import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

describe('npm pack contents', () => {
  const output = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const files: string[] = JSON.parse(output)[0].files.map((f: { path: string }) => f.path).sort();

  it('ships only dist, README, LICENSE (and package.json)', () => {
    expect(files).toEqual(['LICENSE', 'README.md', 'dist/index.cjs', 'package.json']);
  });

  it('contains no synthetic test secrets or test fixtures', () => {
    const bundle = fs.readFileSync(path.join(ROOT, 'dist/index.cjs'), 'utf8');
    for (const needle of ['SYNTHETIC', 'Synth3tic', 'hunter2-Synth', 'U1lOVEhFVElD']) {
      expect(bundle).not.toContain(needle);
      expect(fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8')).not.toContain(needle);
    }
    expect(bundle).not.toMatch(/\/home\/dingw|\/Users\/dingwang/);
  });

  it('has the metadata the registries need', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.name).toBe('opsecforge-mcp');
    expect(pkg.version).toBe('0.1.0');
    expect(pkg.license).toBe('MIT');
    expect(pkg.mcpName).toBe('io.github.cyberdroid2077/opsecforge');
    expect(pkg.bin['opsecforge-mcp']).toBe('dist/index.cjs');
    expect(pkg.engines.node).toBe('>=20');
    const server = JSON.parse(fs.readFileSync(path.join(ROOT, 'server.json'), 'utf8'));
    expect(server.name).toBe(pkg.mcpName);
    expect(server.version).toBe(pkg.version);
    expect(server.packages[0].identifier).toBe(pkg.name);
    expect(server.packages[0].version).toBe(pkg.version);
    expect(server.description.length).toBeLessThanOrEqual(100);
  });
});
