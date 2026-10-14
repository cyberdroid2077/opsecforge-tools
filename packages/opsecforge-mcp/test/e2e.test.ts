import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport, getDefaultEnvironment } from '@modelcontextprotocol/sdk/client/stdio.js';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SYN, hmacHex, makeJwt, makeTempDir, pemBlock, writeFile } from './fixtures';

const SERVER = path.resolve(__dirname, '../dist/index.cjs');
const E2E_JWT = makeJwt({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 600 });
let dir: string;
let repo: string;
let client: Client;

type CallResult = { isError?: boolean; content: { type: string; text: string }[] };
const call = async (name: string, args: Record<string, unknown>) =>
  (await client.callTool({ name, arguments: args })) as CallResult;
const textOf = (result: CallResult) => result.content.map((c) => c.text).join('\n');

beforeAll(async () => {
  if (!fs.existsSync(SERVER)) throw new Error('dist/index.cjs is missing: run `npm run build` first.');
  dir = makeTempDir('opsecforge-e2e-');
  repo = makeTempDir('opsecforge-e2e-git-');
  const git = (...args: string[]) =>
    execFileSync('git', ['-c', 'user.email=t@example.test', '-c', 'user.name=t', ...args], { cwd: repo, stdio: 'pipe' });
  git('init', '-q');
  writeFile(repo, 'a.txt', 'one\n');
  git('add', '.');
  git('commit', '-q', '-m', 'init');
  writeFile(repo, 'config.js', `module.exports = { key: "${SYN.stripe}" };\n`);
  git('add', 'config.js');

  client = new Client({ name: 'opsecforge-e2e', version: '0.0.0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [SERVER],
      cwd: repo,
      env: {
        ...getDefaultEnvironment(),
        E2E_WEBHOOK_SECRET: SYN.webhookSecret,
        E2E_JWT,
      },
      stderr: 'pipe',
    }),
  );
});

afterAll(async () => {
  await client?.close();
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(repo, { recursive: true, force: true });
});

describe('opsecforge-mcp over stdio (bundled dist/index.cjs)', () => {
  it('lists all six tools with descriptions and strict input schemas', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      ['file_checksum', 'inspect_jwt', 'redact_file', 'redact_text', 'scan_secrets', 'verify_webhook'],
    );
    for (const tool of tools) {
      expect(tool.description && tool.description.length).toBeGreaterThan(80);
      expect(tool.inputSchema.type).toBe('object');
      expect((tool.inputSchema as Record<string, unknown>).additionalProperties).toBe(false);
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.openWorldHint).toBe(false);
    }
    const verify = tools.find((t) => t.name === 'verify_webhook')!;
    const props = Object.keys(verify.inputSchema.properties as object);
    expect(props).toContain('secret_env');
    expect(props).not.toContain('secret');
    expect(verify.inputSchema.required).toEqual(
      expect.arrayContaining(['provider', 'body_path', 'secret_env', 'signature']),
    );
    const redactText = tools.find((t) => t.name === 'redact_text')!;
    expect(redactText.description).toMatch(/already in the model context/);
    expect(tools.find((t) => t.name === 'inspect_jwt')!.description).toMatch(/not verification/i);
  });

  it('redact_file: never returns the raw synthetic secrets', async () => {
    const file = writeFile(
      dir,
      '.env',
      [`API=${SYN.stripe}`, `AWS=${SYN.aws}`, `PASSWORD=${SYN.password}`, `X_TOKEN=${SYN.github}`, pemBlock('RSA PRIVATE KEY'), 'SAFE=1'].join('\n'),
    );
    const result = await call('redact_file', { path: file });
    expect(result.isError).toBeFalsy();
    const serialized = JSON.stringify(result);
    for (const raw of [SYN.stripe, SYN.aws, SYN.password, SYN.github, SYN.keyBody]) {
      expect(serialized).not.toContain(raw);
    }
    const text = textOf(result);
    expect(text.split('\n')[0]).toMatch(/did not leave this machine/);
    expect(text).toContain('SAFE=1');
    expect(text).toContain('[REDACTED]');
  });

  it('redact_file: explicit errors, and the server survives them', async () => {
    const missing = await call('redact_file', { path: path.join(dir, 'does-not-exist') });
    expect(missing.isError).toBe(true);
    expect(textOf(missing)).toMatch(/File not found/);
    const directory = await call('redact_file', { path: dir });
    expect(directory.isError).toBe(true);
    const big = writeFile(dir, 'big.txt', Buffer.alloc(1024 * 1024 + 1, 0x61));
    const tooBig = await call('redact_file', { path: big });
    expect(tooBig.isError).toBe(true);
    expect(textOf(tooBig)).toMatch(/too large/);
    const stillWorks = await call('redact_text', { text: `TOKEN=${SYN.github}` });
    expect(stillWorks.isError).toBeFalsy();
  });

  it('scan_secrets: staged scan lists file:line and a masked preview only', async () => {
    const result = await call('scan_secrets', { staged: true });
    expect(result.isError).toBeFalsy();
    const text = textOf(result);
    expect(text).toMatch(/config\.js:1\s/);
    expect(text).toContain('sk_l…');
    expect(text).not.toContain(SYN.stripe);
    const none = await call('scan_secrets', {});
    expect(none.isError).toBe(true);
  });

  it('redact_text: redacts and states the context limitation', async () => {
    const result = await call('redact_text', { text: `Authorization: Bearer ${SYN.github}` });
    const text = textOf(result);
    expect(text).not.toContain(SYN.github);
    expect(text).toMatch(/already in the model context/);
  });

  it('verify_webhook: matches with the secret from an env var and returns no secret', async () => {
    const body = '{"zen":"synthetic"}';
    const bodyPath = writeFile(dir, 'wh.json', body);
    const result = await call('verify_webhook', {
      provider: 'github',
      body_path: bodyPath,
      secret_env: 'E2E_WEBHOOK_SECRET',
      signature: `sha256=${hmacHex(SYN.webhookSecret, body)}`,
    });
    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/Result: MATCH/);
    expect(JSON.stringify(result)).not.toContain(SYN.webhookSecret);

    const wrong = await call('verify_webhook', {
      provider: 'github',
      body_path: bodyPath,
      secret_env: 'E2E_WEBHOOK_SECRET',
      signature: `sha256=${'0'.repeat(64)}`,
    });
    expect(textOf(wrong)).toMatch(/NO MATCH/);
  });

  it('verify_webhook: rejects every plaintext secret parameter without echoing its value', async () => {
    const bodyPath = writeFile(dir, 'wh2.json', '{}');
    for (const field of ['secret', 'webhook_secret', 'secret_value', 'key', 'token']) {
      const result = await call('verify_webhook', {
        provider: 'github',
        body_path: bodyPath,
        secret_env: 'E2E_WEBHOOK_SECRET',
        signature: `sha256=${'0'.repeat(64)}`,
        [field]: SYN.webhookSecret,
      });
      expect(result.isError, field).toBe(true);
      expect(textOf(result)).toMatch(/never accept secrets/);
      expect(textOf(result)).toMatch(/secret_env/);
      expect(JSON.stringify(result)).not.toContain(SYN.webhookSecret);
    }
    const missingEnvName = await call('verify_webhook', {
      provider: 'github',
      body_path: bodyPath,
      signature: `sha256=${'0'.repeat(64)}`,
    });
    expect(missingEnvName.isError).toBe(true);
    expect(textOf(missingEnvName)).toMatch(/secret_env/);
  });

  it('inspect_jwt: decodes from token_env and says decoding is not verification', async () => {
    const result = await call('inspect_jwt', { token_env: 'E2E_JWT' });
    expect(result.isError).toBeFalsy();
    const text = textOf(result);
    expect(text).toMatch(/Decoding is not verification/);
    expect(text).toContain('"sub": "u1"');
    expect(text).not.toContain(E2E_JWT);
    const bad = await call('inspect_jwt', { token: 'nope' });
    expect(bad.isError).toBe(true);
  });

  it('file_checksum: hashes and compares', async () => {
    const file = writeFile(dir, 'payload.bin.txt', 'payload\n');
    const sha = execFileSync('sha256sum', [file], { encoding: 'utf8' }).split(' ')[0];
    const result = await call('file_checksum', { path: file, algorithm: 'sha256', expected: sha });
    expect(textOf(result)).toContain(sha);
    expect(textOf(result)).toMatch(/Comparison: MATCH/);
  });

  it('answers unknown tools and unknown arguments with readable errors, not crashes', async () => {
    const unknownTool = await call('does_not_exist', {});
    expect(unknownTool.isError).toBe(true);
    expect(textOf(unknownTool)).toMatch(/Unknown tool/);
    const extra = await call('file_checksum', { path: '/x', algorithm: 'sha256', bogus: 1 });
    expect(extra.isError).toBe(true);
    expect(textOf(extra)).toMatch(/Unknown parameter/);
    const wrongType = await call('file_checksum', { path: 5, algorithm: 'md5' });
    expect(wrongType.isError).toBe(true);
    expect((await client.listTools()).tools).toHaveLength(6);
  });
});
