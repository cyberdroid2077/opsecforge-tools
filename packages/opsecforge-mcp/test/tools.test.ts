import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { ToolError } from '../src/fsutil';
import { redactFile, redactText } from '../src/tools/redact';
import { parseStagedDiff, scanSecrets } from '../src/tools/scan';
import { verifyWebhook } from '../src/tools/webhook';
import { inspectJwt } from '../src/tools/jwt';
import { fileChecksum } from '../src/tools/checksum';
import { SYN, hmacHex, makeJwt, makeTempDir, pemBlock, writeFile } from './fixtures';

let dir: string;
beforeAll(() => {
  dir = makeTempDir();
});
afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const envNames: string[] = [];
const setEnv = (name: string, value: string) => {
  process.env[name] = value;
  envNames.push(name);
};
afterEach(() => {
  for (const name of envNames.splice(0)) delete process.env[name];
});

const rejects = async (promise: Promise<unknown> | (() => unknown), match: RegExp) => {
  let error: unknown;
  try {
    await (typeof promise === 'function' ? promise() : promise);
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(ToolError);
  expect((error as ToolError).message).toMatch(match);
};

describe('redact_file', () => {
  it('returns redacted content, a findings summary and a local-only notice, never the raw values', async () => {
    const file = writeFile(
      dir,
      '.env',
      [
        'APP_NAME=demo',
        `STRIPE_SECRET_KEY=${SYN.stripe}`,
        `AWS_ACCESS_KEY_ID=${SYN.aws}`,
        `DB_URL=postgres://app:${SYN.dbPassword}@db.internal/app`,
        `GITHUB_TOKEN=${SYN.github}`,
        `PASSWORD=${SYN.password}`,
        pemBlock('RSA PRIVATE KEY'),
        'LOG_LEVEL=info',
      ].join('\n'),
    );
    const out = await redactFile({ path: file });
    expect(out.split('\n')[0]).toMatch(/did not leave this machine/);
    expect(out).toContain('not part of this response');
    for (const raw of [SYN.stripe, SYN.aws, SYN.dbPassword, SYN.github, SYN.password, SYN.keyBody]) {
      expect(out).not.toContain(raw);
    }
    expect(out).toContain('APP_NAME=demo');
    expect(out).toContain('LOG_LEVEL=info');
    expect(out).toContain('[REDACTED]');
    expect(out).toMatch(/L2\s+Sensitive named field/);
    expect(out).toMatch(/L3\s/);
    expect(out).toMatch(/Private key block/);
    expect(out).not.toMatch(/sk_l…/); // redact_file never shows partial values
  });

  it('masks an unterminated private key through to the end of the file', async () => {
    const file = writeFile(dir, 'truncated.pem', `${pemBlock('EC PRIVATE KEY', SYN.keyBody, false)}\n${SYN.keyBody2}\n`);
    const out = await redactFile({ path: file });
    expect(out).not.toContain(SYN.keyBody);
    expect(out).not.toContain(SYN.keyBody2);
    expect(out).toMatch(/unterminated/);
  });

  it('says so when nothing matched', async () => {
    const file = writeFile(dir, 'plain.txt', 'just some notes\n');
    const out = await redactFile({ path: file });
    expect(out).toMatch(/none of the known patterns matched/);
    expect(out).toContain('just some notes');
  });

  it('handles an empty file', async () => {
    const file = writeFile(dir, 'empty.txt', '');
    await expect(redactFile({ path: file })).resolves.toMatch(/0 lines/);
  });

  it('refuses files over 1 MiB with an explicit message', async () => {
    const file = writeFile(dir, 'big.log', Buffer.alloc(1024 * 1024 + 1, 0x61));
    await rejects(redactFile({ path: file }), /too large.*limit 1\.0 MiB/);
  });

  it('accepts a file of exactly 1 MiB', async () => {
    const file = writeFile(dir, 'exact.log', Buffer.alloc(1024 * 1024, 0x61));
    await expect(redactFile({ path: file })).resolves.toContain('1.0 MiB');
  });

  it('refuses directories, missing files and binary files', async () => {
    await rejects(redactFile({ path: dir }), /Not a regular file/);
    await rejects(redactFile({ path: path.join(dir, 'nope.txt') }), /File not found/);
    const bin = writeFile(dir, 'blob.bin', Buffer.from([0x89, 0x50, 0x00, 0x01, 0x02]));
    await rejects(redactFile({ path: bin }), /binary file/);
    await rejects(redactFile({ path: '' }), /non-empty file path/);
  });

  it('refuses FIFOs instead of blocking on them', async () => {
    const fifo = path.join(dir, 'pipe');
    execFileSync('mkfifo', [fifo]);
    await rejects(redactFile({ path: fifo }), /Not a regular file/);
  });

  it('follows a symlink to a regular file and redacts it', async () => {
    const target = writeFile(dir, 'real.env', `TOKEN=${SYN.github}\n`);
    const link = path.join(dir, 'link.env');
    fs.symlinkSync(target, link);
    const out = await redactFile({ path: link });
    expect(out).not.toContain(SYN.github);
  });

  it('honours OPSECFORGE_MCP_ROOTS when set', async () => {
    const inside = writeFile(dir, 'rooted/ok.txt', 'hello');
    setEnv('OPSECFORGE_MCP_ROOTS', path.join(dir, 'rooted'));
    await expect(redactFile({ path: inside })).resolves.toContain('hello');
    const outside = writeFile(dir, 'outside.txt', 'hello');
    await rejects(redactFile({ path: outside }), /outside the directories allowed/);
  });

  it('reports invalid UTF-8 instead of failing', async () => {
    const file = writeFile(dir, 'latin1.txt', Buffer.from([0x68, 0x69, 0xff, 0xfe, 0x0a]));
    await expect(redactFile({ path: file })).resolves.toMatch(/not valid UTF-8/);
  });
});

describe('redact_text', () => {
  it('redacts, summarizes and states the context limitation', () => {
    const out = redactText({ text: `curl -H "Authorization: Bearer ${SYN.github}" https://x.test\nPASSWORD=${SYN.password}` });
    expect(out).toMatch(/already in the model context/);
    expect(out).not.toContain(SYN.github);
    expect(out).not.toContain(SYN.password);
    expect(out).toMatch(/Authorization credential/);
  });

  it('rejects non-strings and oversized text', () => {
    expect(() => redactText({ text: 5 as unknown as string })).toThrow(ToolError);
    expect(() => redactText({ text: 'a'.repeat(1024 * 1024 + 1) })).toThrow(/too large/);
  });
});

describe('scan_secrets', () => {
  it('lists file:line, type and a masked preview without raw values', async () => {
    writeFile(dir, 'scan/a.env', `A=1\nSTRIPE_SECRET_KEY=${SYN.stripe}\n`);
    writeFile(dir, 'scan/sub/b.txt', `nothing\nauth: Bearer ${SYN.github}\n`);
    writeFile(dir, 'scan/node_modules/skip.env', `X_TOKEN=${SYN.github}\n`);
    writeFile(dir, 'scan/blob.bin', Buffer.from([0, 1, 2, 3]));
    const out = await scanSecrets({ paths: [path.join(dir, 'scan')] });
    expect(out).toMatch(/a\.env:2\s+Sensitive named field\s+sk_l…/);
    expect(out).toMatch(/b\.txt:2\s/);
    expect(out).not.toContain('skip.env');
    expect(out).toMatch(/1 binary/);
    for (const raw of [SYN.stripe, SYN.github]) expect(out).not.toContain(raw);
  });

  it('reports a clean scan honestly and errors without inputs or on bad paths', async () => {
    const clean = writeFile(dir, 'clean.txt', 'nothing here\n');
    await expect(scanSecrets({ paths: [clean] })).resolves.toMatch(/no known secret patterns found/);
    await rejects(scanSecrets({}), /Provide "paths"/);
    await rejects(scanSecrets({ paths: [path.join(dir, 'missing')] }), /Path not found/);
  });

  it('scans only the staged additions, with new-file line numbers', async () => {
    const repo = makeTempDir('opsecforge-git-');
    const git = (...args: string[]) =>
      execFileSync('git', ['-c', 'user.email=t@example.test', '-c', 'user.name=t', ...args], { cwd: repo, stdio: 'pipe' });
    git('init', '-q');
    writeFile(repo, 'app.js', 'const a = 1;\nconst b = 2;\n');
    git('add', '.');
    git('commit', '-q', '-m', 'init');
    writeFile(repo, 'app.js', `const a = 1;\nconst key = "${SYN.stripe}";\nconst b = 2;\n`);
    writeFile(repo, 'notes.txt', `ok\nok\n${pemBlock('RSA PRIVATE KEY')}\n`);
    writeFile(repo, 'unstaged.env', `T_TOKEN=${SYN.github}\n`);
    git('add', 'app.js', 'notes.txt');
    const original = process.cwd();
    process.chdir(repo);
    try {
      const out = await scanSecrets({ staged: true });
      expect(out).toMatch(/app\.js:2\s/);
      expect(out).toMatch(/notes\.txt:3-5\s+Private key block/);
      expect(out).not.toContain('unstaged.env');
      expect(out).not.toContain(SYN.stripe);
      expect(out).not.toContain(SYN.keyBody);
      git('reset', '-q');
      await expect(scanSecrets({ staged: true })).resolves.toMatch(/Nothing was staged/);
    } finally {
      process.chdir(original);
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('gives a readable error outside a git repository', async () => {
    const original = process.cwd();
    const plain = makeTempDir('opsecforge-nogit-');
    process.chdir(plain);
    try {
      await rejects(scanSecrets({ staged: true }), /git diff --cached failed/);
    } finally {
      process.chdir(original);
      fs.rmSync(plain, { recursive: true, force: true });
    }
  });

  it('parses staged diffs with multiple hunks and deletions', () => {
    const diff = [
      'diff --git a/x.txt b/x.txt',
      '--- a/x.txt',
      '+++ b/x.txt',
      '@@ -1,2 +1,3 @@',
      ' keep',
      '+added one',
      '+added two',
      '@@ -10,0 +20,1 @@',
      '+far away',
      'diff --git a/gone.txt b/gone.txt',
      '--- a/gone.txt',
      '+++ /dev/null',
      '@@ -1 +0,0 @@',
      '-removed',
    ].join('\n');
    expect(parseStagedDiff(diff)).toEqual([
      { file: 'x.txt', startLine: 2, lines: ['added one', 'added two'] },
      { file: 'x.txt', startLine: 20, lines: ['far away'] },
    ]);
  });
});

describe('verify_webhook', () => {
  const body = '{"action":"opened","number":7}';

  it('verifies a GitHub signature using the secret from the named environment variable', async () => {
    setEnv('OPSECFORGE_TEST_GH', SYN.webhookSecret);
    const bodyPath = writeFile(dir, 'hook/gh.json', body);
    const out = await verifyWebhook({
      provider: 'github',
      body_path: bodyPath,
      secret_env: 'OPSECFORGE_TEST_GH',
      signature: `sha256=${hmacHex(SYN.webhookSecret, body)}`,
    });
    expect(out).toMatch(/Result: MATCH/);
    expect(out).not.toContain(SYN.webhookSecret);
    expect(out).not.toContain(hmacHex(SYN.webhookSecret, body));
  });

  it('reports NO MATCH for a wrong secret', async () => {
    setEnv('OPSECFORGE_TEST_GH', 'a-different-synthetic-secret');
    const bodyPath = writeFile(dir, 'hook/gh2.json', body);
    const out = await verifyWebhook({
      provider: 'github',
      body_path: bodyPath,
      secret_env: 'OPSECFORGE_TEST_GH',
      signature: `sha256=${hmacHex(SYN.webhookSecret, body)}`,
    });
    expect(out).toMatch(/Result: NO MATCH/);
  });

  it('diagnoses a body that was saved with a trailing newline', async () => {
    setEnv('OPSECFORGE_TEST_GH', SYN.webhookSecret);
    const bodyPath = writeFile(dir, 'hook/gh-nl.json', `${body}\n`);
    const out = await verifyWebhook({
      provider: 'github',
      body_path: bodyPath,
      secret_env: 'OPSECFORGE_TEST_GH',
      signature: `sha256=${hmacHex(SYN.webhookSecret, body)}`,
    });
    expect(out).toMatch(/Result: NO MATCH/);
    expect(out).toMatch(/DOES match if the body is without the trailing newline/);
  });

  it('diagnoses a pretty-printed (reformatted) JSON body', async () => {
    setEnv('OPSECFORGE_TEST_GH', SYN.webhookSecret);
    const pretty = JSON.stringify(JSON.parse(body), null, 2);
    const bodyPath = writeFile(dir, 'hook/gh-pretty.json', pretty);
    const out = await verifyWebhook({
      provider: 'github',
      body_path: bodyPath,
      secret_env: 'OPSECFORGE_TEST_GH',
      signature: `sha256=${hmacHex(SYN.webhookSecret, body)}`,
    });
    expect(out).toMatch(/minified JSON/);
    expect(out).toMatch(/indented JSON/);
  });

  it('flags whitespace around the secret and a malformed signature header', async () => {
    setEnv('OPSECFORGE_TEST_GH', `${SYN.webhookSecret}\n`);
    const bodyPath = writeFile(dir, 'hook/gh3.json', body);
    const out = await verifyWebhook({
      provider: 'github',
      body_path: bodyPath,
      secret_env: 'OPSECFORGE_TEST_GH',
      signature: `sha256=${hmacHex(SYN.webhookSecret, body)}`,
    });
    expect(out).toMatch(/leading or trailing whitespace.*matches once it is trimmed/);

    const bad = await verifyWebhook({
      provider: 'github',
      body_path: bodyPath,
      secret_env: 'OPSECFORGE_TEST_GH',
      signature: hmacHex(SYN.webhookSecret, body),
    });
    expect(bad).toMatch(/INVALID SIGNATURE HEADER FORMAT/);
    expect(bad).toMatch(/sha256= X-Hub-Signature-256/);
  });

  it('verifies Stripe signatures and reports the timestamp tolerance', async () => {
    setEnv('OPSECFORGE_TEST_STRIPE', SYN.webhookSecret);
    const bodyPath = writeFile(dir, 'hook/stripe.json', body);
    const now = 1_800_000_000;
    const timestamp = now - 60;
    const header = `t=${timestamp},v1=${hmacHex(SYN.webhookSecret, `${timestamp}.${body}`)}`;
    const fresh = await verifyWebhook({ provider: 'stripe', body_path: bodyPath, secret_env: 'OPSECFORGE_TEST_STRIPE', signature: header, nowSeconds: now });
    expect(fresh).toMatch(/Result: MATCH/);
    expect(fresh).toMatch(/within tolerance/);

    const stale = await verifyWebhook({ provider: 'stripe', body_path: bodyPath, secret_env: 'OPSECFORGE_TEST_STRIPE', signature: header, nowSeconds: now + 3600 });
    expect(stale).toMatch(/TIMESTAMP IS OUTSIDE THE TOLERANCE/);
    expect(stale).toMatch(/OUTSIDE tolerance/);

    const widened = await verifyWebhook({ provider: 'stripe', body_path: bodyPath, secret_env: 'OPSECFORGE_TEST_STRIPE', signature: header, nowSeconds: now + 3600, tolerance_seconds: 7200 });
    expect(widened).toMatch(/Result: MATCH/);

    setEnv('OPSECFORGE_TEST_STRIPE_KEY', ['sk', 'test', 'SYNTHETICAPIKEY0123456789'].join('_'));
    const wrongKey = await verifyWebhook({ provider: 'stripe', body_path: bodyPath, secret_env: 'OPSECFORGE_TEST_STRIPE_KEY', signature: header, nowSeconds: now });
    expect(wrongKey).toMatch(/looks like a Stripe API key/);

    const malformed = await verifyWebhook({ provider: 'stripe', body_path: bodyPath, secret_env: 'OPSECFORGE_TEST_STRIPE', signature: 'v1=abcd' });
    expect(malformed).toMatch(/INVALID SIGNATURE HEADER FORMAT/);
    expect(malformed).toMatch(/valid t= Unix timestamp/);
  });

  it('verifies generic HMACs in hex and base64, with a chosen algorithm', async () => {
    setEnv('OPSECFORGE_TEST_GENERIC', SYN.webhookSecret);
    const bodyPath = writeFile(dir, 'hook/generic.json', body);
    const hex = hmacHex(SYN.webhookSecret, body, 'sha512');
    const asHex = await verifyWebhook({ provider: 'generic', body_path: bodyPath, secret_env: 'OPSECFORGE_TEST_GENERIC', signature: hex, algorithm: 'sha512' });
    expect(asHex).toMatch(/Result: MATCH/);
    const b64 = Buffer.from(hmacHex(SYN.webhookSecret, body), 'hex').toString('base64');
    const asB64 = await verifyWebhook({ provider: 'generic', body_path: bodyPath, secret_env: 'OPSECFORGE_TEST_GENERIC', signature: b64 });
    expect(asB64).toMatch(/Result: MATCH/);
  });

  it('errors readably for bad inputs without echoing a secret passed in the wrong field', async () => {
    const bodyPath = writeFile(dir, 'hook/bad.json', body);
    const base = { provider: 'github' as const, body_path: bodyPath, signature: `sha256=${'0'.repeat(64)}` };
    await rejects(verifyWebhook({ ...base, secret_env: 'OPSECFORGE_TEST_UNSET' }), /not set/);
    let message = '';
    try {
      await verifyWebhook({ ...base, secret_env: SYN.webhookSecret });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/NAME of an environment variable/);
    expect(message).not.toContain(SYN.webhookSecret);
    setEnv('OPSECFORGE_TEST_GH', SYN.webhookSecret);
    await rejects(verifyWebhook({ ...base, secret_env: 'OPSECFORGE_TEST_GH', body_path: path.join(dir, 'hook/none.json') }), /File not found/);
    await rejects(verifyWebhook({ ...base, secret_env: 'OPSECFORGE_TEST_GH', algorithm: 'sha1' }), /only applies to provider "generic"/);
    await rejects(verifyWebhook({ ...base, secret_env: 'OPSECFORGE_TEST_GH', tolerance_seconds: 10 }), /only applies to provider "stripe"/);
    const binary = writeFile(dir, 'hook/binary.bin', Buffer.from([0xff, 0xfe, 0xfd]));
    await rejects(verifyWebhook({ ...base, secret_env: 'OPSECFORGE_TEST_GH', body_path: binary }), /not valid UTF-8/);
  });
});

describe('inspect_jwt', () => {
  const now = Date.UTC(2026, 9, 13) / 1000;

  it('decodes from an environment variable and warns that decoding is not verification', () => {
    const token = makeJwt({ sub: 'user-1', exp: now + 3600, iat: now - 10, client_secret: SYN.password });
    setEnv('OPSECFORGE_TEST_JWT', token);
    const out = inspectJwt({ token_env: 'OPSECFORGE_TEST_JWT', now: now * 1000 });
    expect(out).toMatch(/Decoding is not verification/);
    expect(out).toMatch(/read from an environment variable/);
    expect(out).toContain('"sub": "user-1"');
    expect(out).toMatch(/exp: .*not-expired|exp: 2026-10-13/);
    expect(out).toMatch(/HMAC algorithm detected/);
    expect(out).not.toContain(token);
    expect(out).not.toContain(SYN.password); // secret-named claim values are masked
    expect(out).toMatch(/masked because their field names look like secrets/);
  });

  it('flags alg none, an expired token and a missing exp', () => {
    const none = makeJwt({ sub: 'x' }, { alg: 'none', typ: 'JWT' }, '');
    const out = inspectJwt({ token: none, now: now * 1000 });
    expect(out).toMatch(/alg: none/);
    expect(out).toMatch(/no "exp"/);
    expect(out).toMatch(/passed as a parameter, so it is already in the model context/);

    const expired = makeJwt({ exp: now - 7200 });
    expect(inspectJwt({ token: expired, now: now * 1000 })).toMatch(/EXPIRED|expired/);
  });

  it('flags jku and accepts a Bearer prefix', () => {
    const token = makeJwt({ exp: now + 60 }, { alg: 'RS256', jku: 'https://attacker.example/keys' });
    const out = inspectJwt({ token: `Bearer ${token}`, now: now * 1000 });
    expect(out).toMatch(/"jku"/);
    expect(out).toMatch(/needs the issuer's public key/);
  });

  it('errors readably on malformed or missing input', () => {
    expect(() => inspectJwt({})).toThrow(/token_env/);
    expect(() => inspectJwt({ token: 'a', token_env: 'B' })).toThrow(/not both/);
    expect(() => inspectJwt({ token: 'not-a-jwt' })).toThrow(/3 parts/);
    expect(() => inspectJwt({ token_env: 'OPSECFORGE_TEST_MISSING' })).toThrow(/not set/);
    expect(() => inspectJwt({ token_env: SYN.password })).toThrow(/NAME of an environment variable/);
  });
});

describe('file_checksum', () => {
  it('computes SHA-256 and SHA-512 and compares against an expected value', async () => {
    const file = writeFile(dir, 'sum.txt', 'synthetic checksum payload\n');
    const bytes = fs.readFileSync(file);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const sha512 = createHash('sha512').update(bytes).digest('hex');

    const a = await fileChecksum({ path: file, algorithm: 'sha256', expected: sha256 });
    expect(a).toContain(sha256);
    expect(a).toMatch(/MATCH/);
    const b = await fileChecksum({ path: file, algorithm: 'sha512', expected: `${sha512}  sum.txt` });
    expect(b).toContain(sha512);
    expect(b).toMatch(/Comparison: MATCH/);
    const c = await fileChecksum({ path: file, algorithm: 'sha256', expected: `sha256:${sha256.toUpperCase()}` });
    expect(c).toMatch(/Comparison: MATCH/);

    const mismatch = await fileChecksum({ path: file, algorithm: 'sha256', expected: '0'.repeat(64) });
    expect(mismatch).toMatch(/MISMATCH/);
    const wrongAlgorithm = await fileChecksum({ path: file, algorithm: 'sha512', expected: sha256 });
    expect(wrongAlgorithm).toMatch(/INVALID expected value.*different length/);
    await expect(fileChecksum({ path: file, algorithm: 'sha256' })).resolves.not.toMatch(/Comparison/);
  });

  it('errors readably for missing files, directories and bad algorithms', async () => {
    await rejects(fileChecksum({ path: path.join(dir, 'missing'), algorithm: 'sha256' }), /File not found/);
    await rejects(fileChecksum({ path: dir, algorithm: 'sha256' }), /Not a regular file/);
    await rejects(fileChecksum({ path: path.join(dir, 'sum.txt'), algorithm: 'md5' as 'sha256' }), /sha256/);
  });

  it('refuses files over 32 MiB', async () => {
    const big = path.join(dir, 'huge.bin');
    const fd = fs.openSync(big, 'w');
    fs.ftruncateSync(fd, 33 * 1024 * 1024);
    fs.closeSync(fd);
    await rejects(fileChecksum({ path: big, algorithm: 'sha256' }), /too large/);
  });
});

describe('home directory expansion', () => {
  it('expands ~/ in paths', async () => {
    const name = `opsecforge-test-${process.pid}.txt`;
    const target = path.join(os.homedir(), name);
    fs.writeFileSync(target, 'hello home\n');
    try {
      await expect(redactFile({ path: `~/${name}` })).resolves.toContain('hello home');
    } finally {
      fs.rmSync(target, { force: true });
    }
  });
});
