// Bundles src/ plus the website's pure libraries (../../lib) and every dependency into ONE file,
// so `npx opsecforge-mcp` starts without installing a dependency tree.
import { build } from 'esbuild';
import { chmodSync, readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.cjs',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  legalComments: 'none',
  banner: { js: '#!/usr/bin/env node' },
  define: { __PKG_VERSION__: JSON.stringify(pkg.version) },
  logLevel: 'info',
});
chmodSync('dist/index.cjs', 0o755);
