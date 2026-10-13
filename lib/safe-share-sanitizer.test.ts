import { describe, expect, it } from 'vitest';
import { REDACTION_MARKER, sanitizeForSharing } from './safe-share-sanitizer';

describe('sanitizeForSharing', () => {
  it('matches the published synthetic sharing walkthrough and exposes review limits', () => {
    const input = [
      'API_KEY=example-not-a-real-key',
      'DATABASE_URL=postgresql://demo:example-password@db.example.test/app',
      'PUBLIC_KEY=public-demo-value',
      'SUPPORT_REFERENCE=customer-demo-reference',
    ].join('\n');

    expect(sanitizeForSharing(input).output).toBe([
      `API_KEY=${REDACTION_MARKER}`,
      `DATABASE_URL=postgresql://demo:${REDACTION_MARKER}@db.example.test/app`,
      'PUBLIC_KEY=public-demo-value',
      'SUPPORT_REFERENCE=customer-demo-reference',
    ].join('\n'));
  });

  it('redacts provider credentials without corrupting surrounding text', () => {
    const syntheticAwsId = ['AKIA', 'ABCDEFGHIJKLMNOP'].join('');
    const syntheticStripeKey = ['sk_test_', 'aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa'].join('');
    const syntheticGitHubToken = ['ghp_', 'bbbbbbbbbbbb', 'bbbbbbbbbbbb', 'bbbbbbbbbbbb'].join('');
    const input = [
      `AWS_ACCESS_KEY_ID=${syntheticAwsId}`,
      `STRIPE_KEY=${syntheticStripeKey}`,
      `GITHUB_TOKEN=${syntheticGitHubToken}`,
    ].join('\n');

    const result = sanitizeForSharing(input);

    expect(result.output).toBe(
      [
        `AWS_ACCESS_KEY_ID=${REDACTION_MARKER}`,
        `STRIPE_KEY=${REDACTION_MARKER}`,
        `GITHUB_TOKEN=${REDACTION_MARKER}`,
      ].join('\n'),
    );
    expect(result.findings.reduce((total, finding) => total + finding.count, 0)).toBe(3);
  });

  it('only treats an AWS secret-shaped value as sensitive when its field is sensitive', () => {
    const fortyCharacters = ['abcdefghij', 'klmnopqrst', 'uvwxyz1234', '567890ABCD'].join('');
    const result = sanitizeForSharing(
      [`AWS_SECRET_ACCESS_KEY=${fortyCharacters}`, `CHECKSUM=${fortyCharacters}`].join('\n'),
    );

    expect(result.output).toContain(`AWS_SECRET_ACCESS_KEY=${REDACTION_MARKER}`);
    expect(result.output).toContain(`CHECKSUM=${fortyCharacters}`);
  });

  it('preserves JSON structure and non-sensitive fields', () => {
    const result = sanitizeForSharing(
      '{"username":"alice","password":"correct horse battery staple","token":"abc123","public_key":"visible"}',
    );

    expect(JSON.parse(result.output)).toEqual({
      username: 'alice',
      password: REDACTION_MARKER,
      token: REDACTION_MARKER,
      public_key: 'visible',
    });
  });

  it('preserves YAML indentation, quotes, comments, and safe near misses', () => {
    const input = [
      'database:',
      '  password: "hunter2" # production',
      '  public_key: "ssh-rsa synthetic"',
      '  token_endpoint: https://id.example.test/token',
      '  monkey: banana',
    ].join('\n');

    const result = sanitizeForSharing(input);

    expect(result.output).toBe(
      [
        'database:',
        `  password: "${REDACTION_MARKER}" # production`,
        '  public_key: "ssh-rsa synthetic"',
        '  token_endpoint: https://id.example.test/token',
        '  monkey: banana',
      ].join('\n'),
    );
  });

  it('redacts log headers, query secrets, URL credentials, and JWT-like values', () => {
    const jwt = 'eyJaaaaaaaaaa.eyJbbbbbbbbbb.cccccccccc';
    const input = [
      'Authorization: Bearer synthetic-bearer-token',
      'Cookie: session=synthetic-session; theme=dark',
      'GET https://user:synthetic-password@example.test/path?access_token=query-secret&debug=true',
      `token_seen=${jwt}`,
    ].join('\n');

    const result = sanitizeForSharing(input);

    expect(result.output).toContain(`Authorization: Bearer ${REDACTION_MARKER}`);
    expect(result.output).toContain(`Cookie: ${REDACTION_MARKER}`);
    expect(result.output).toContain(`https://user:${REDACTION_MARKER}@example.test`);
    expect(result.output).toContain(`access_token=${REDACTION_MARKER}&debug=true`);
    expect(result.output).not.toContain(jwt);
  });

  it('redacts cURL headers, basic auth, JSON bodies, and user credentials', () => {
    const input =
      "curl -u 'alice:synthetic-password' -H 'Authorization: Bearer synthetic-token' " +
      "-H 'X-Api-Key: synthetic-api-key' --data '{\"password\":\"synthetic-password\",\"ok\":true}' " +
      'https://api.example.test';

    const result = sanitizeForSharing(input);

    expect(result.output).toContain(`alice:${REDACTION_MARKER}'`);
    expect(result.output).toContain(`Authorization: Bearer ${REDACTION_MARKER}'`);
    expect(result.output).toContain(`X-Api-Key: ${REDACTION_MARKER}'`);
    expect(result.output).toContain(`"password":"${REDACTION_MARKER}"`);
    expect(result.output).toContain('"ok":true');
  });

  it('replaces private key blocks without retaining private material', () => {
    const result = sanitizeForSharing(
      'before\n-----BEGIN PRIVATE KEY-----\nsynthetic-private-material\n-----END PRIVATE KEY-----\nafter',
    );

    expect(result.output).toBe(
      `before\n-----BEGIN PRIVATE KEY-----\n${REDACTION_MARKER}\n-----END PRIVATE KEY-----\nafter`,
    );
    expect(result.output).not.toContain('synthetic-private-material');
  });

  it('does not alter common non-secret values or already-redacted content', () => {
    const input = [
      'PUBLIC_KEY=ssh-rsa-synthetic',
      'KEY_ID=release-key-2026',
      'API_KEY_HINT=starts-with-demo',
      'TOKEN_ENDPOINT=https://id.example.test/token',
      `PASSWORD=${REDACTION_MARKER}`,
      'MONKEY=banana',
    ].join('\n');

    const result = sanitizeForSharing(input);

    expect(result.output).toBe(input);
    expect(result.findings).toEqual([]);
  });
});

const total = (findings: { count: number }[]) => findings.reduce((sum, f) => sum + f.count, 0);

describe('placeholder handling (partial masks must not be trusted)', () => {
  it.each([
    ['PASSWORD=pa****word', 'pa****word'],
    ['API_KEY=real-secret-value-****', 'real-secret-value'],
    ['TOKEN=<redacted>real-secret-value', 'real-secret-value'],
    ['SECRET=[MASKED]real-secret-value', 'real-secret-value'],
    ['PASSWORD=xx[REDACTED]real-secret-value', 'real-secret-value'],
    ['PASSWORD=[REDACTED]real-secret-value', 'real-secret-value'],
    ['PASSWORD=real-secret-value[REDACTED]', 'real-secret-value'],
    ['PASSWORD="pa****word"', 'pa****word'],
    ['password: pa****word', 'pa****word'],
  ])('redacts %j', (input, leaked) => {
    const result = sanitizeForSharing(input);
    expect(result.output).not.toContain(leaked);
    expect(result.output).toContain(REDACTION_MARKER);
    expect(total(result.findings)).toBe(1);
  });

  it('redacts a JSON field and header values that only look partly masked', () => {
    const result = sanitizeForSharing(
      [
        '{"password":"pa****word","other":"x"}',
        'Authorization: Bearer abc****real-tail',
        'Cookie: sid=****real-session',
        'GET /cb?token=ab****real-tail&ok=1',
        'postgres://demo:pa****word@db.example.test/app',
      ].join('\n'),
    );

    expect(result.output).toBe(
      [
        `{"password":"${REDACTION_MARKER}","other":"x"}`,
        `Authorization: Bearer ${REDACTION_MARKER}`,
        `Cookie: ${REDACTION_MARKER}`,
        `GET /cb?token=${REDACTION_MARKER}&ok=1`,
        `postgres://demo:${REDACTION_MARKER}@db.example.test/app`,
      ].join('\n'),
    );
    expect(total(result.findings)).toBe(5);
  });

  it('does not let a private key body smuggle a mask-looking string past the block matcher', () => {
    const result = sanitizeForSharing(
      '-----BEGIN PRIVATE KEY-----\nsynthetic-material-****-more-material\n-----END PRIVATE KEY-----',
    );
    expect(result.output).not.toContain('synthetic-material');
    expect(result.findings).toEqual([{ kind: 'Private key block', count: 1 }]);
  });

  it('skips only the canonical placeholder, and re-running on its own output is a no-op', () => {
    const input = [
      `PASSWORD=${REDACTION_MARKER}`,
      `SECRET="${REDACTION_MARKER}"`,
      `{"token":"${REDACTION_MARKER}"}`,
      `Authorization: Bearer ${REDACTION_MARKER}`,
      `postgres://demo:${REDACTION_MARKER}@db.example.test/app`,
      `-----BEGIN PRIVATE KEY-----\n${REDACTION_MARKER}\n-----END PRIVATE KEY-----`,
      'api_key: |\n  [REDACTED]',
    ].join('\n');

    const result = sanitizeForSharing(input);
    expect(result.output).toBe(input);
    expect(result.findings).toEqual([]);

    const first = sanitizeForSharing(
      'PASSWORD=hunter2\nsecret: |\n  line-one\n  line-two\nnote: "ok"\nSG_TOKEN="a\nb"',
    );
    const second = sanitizeForSharing(first.output);
    expect(second.output).toBe(first.output);
    expect(second.findings).toEqual([]);
  });
});

describe('multi-line and line-ending handling', () => {
  it('redacts a whole YAML literal block scalar, not just its first line', () => {
    const input = [
      'service:',
      '  password: |',
      '    first-secret-line',
      '    second-secret-line',
      '',
      '      third-indented-secret-line',
      '  name: demo',
      'other: value',
    ].join('\n');

    const result = sanitizeForSharing(input);

    expect(result.output).toBe(
      ['service:', '  password: |', `    ${REDACTION_MARKER}`, '  name: demo', 'other: value'].join('\n'),
    );
    expect(result.output).not.toMatch(/secret-line/);
    expect(result.findings).toEqual([{ kind: 'Sensitive named field', count: 1 }]);
  });

  it.each(['>', '|-', '>+', '|2', '>-  # note'])(
    'handles the block scalar header %j',
    (header) => {
      const result = sanitizeForSharing(
        `client_secret: ${header}\n  folded-secret-one\n  folded-secret-two\nnext: 1`,
      );
      expect(result.output).toBe(
        `client_secret: ${header}\n  ${REDACTION_MARKER}\nnext: 1`,
      );
    },
  );

  it('handles block scalars in a YAML list, at the end of input, and with CRLF endings', () => {
    expect(
      sanitizeForSharing('items:\n  - token: |\n      list-secret-1\n      list-secret-2\n  - name: x').output,
    ).toBe(`items:\n  - token: |\n      ${REDACTION_MARKER}\n  - name: x`);

    expect(sanitizeForSharing('password: >\n  tail-secret').output).toBe(
      `password: >\n  ${REDACTION_MARKER}`,
    );

    expect(
      sanitizeForSharing('secret: |\r\n  crlf-secret-1\r\n  crlf-secret-2\r\nkeep: me\r\n').output,
    ).toBe(`secret: |\r\n  ${REDACTION_MARKER}\r\nkeep: me\r\n`);
  });

  it('leaves a block scalar under a non-sensitive key alone', () => {
    const input = 'description: |\n  just a note\n  over two lines';
    expect(sanitizeForSharing(input)).toEqual({ output: input, findings: [] });
  });

  it('redacts quoted values that continue on later lines', () => {
    const result = sanitizeForSharing(
      ['APP_SECRET="line-one-secret', 'line-two-secret', 'line-three-secret" # trailing', 'NAME=demo'].join('\n'),
    );
    expect(result.output).toBe(
      [`APP_SECRET="${REDACTION_MARKER}" # trailing`, 'NAME=demo'].join('\n'),
    );
  });

  it('redacts an unterminated quoted value on its own line without swallowing the file', () => {
    const result = sanitizeForSharing('PASSWORD="never-closed\nNAME=demo');
    expect(result.output).toBe(`PASSWORD=${REDACTION_MARKER}\nNAME=demo`);
  });

  it('redacts CRLF .env files and preserves their line endings', () => {
    const result = sanitizeForSharing(
      'PASSWORD=crlf-secret\r\nNAME=demo\r\nexport API_KEY="crlf-key" # c\r\n',
    );
    expect(result.output).toBe(
      `PASSWORD=${REDACTION_MARKER}\r\nNAME=demo\r\nexport API_KEY="${REDACTION_MARKER}" # c\r\n`,
    );
  });

  it('only treats # and // as comments when they follow whitespace', () => {
    const result = sanitizeForSharing(
      ['PASSWORD=abc#def', 'TOKEN=abc//def', 'SECRET=abc # note', 'API_KEY=abc, // note', 'PWD=abc;'].join('\n'),
    );
    expect(result.output).toBe(
      [
        `PASSWORD=${REDACTION_MARKER}`,
        `TOKEN=${REDACTION_MARKER}`,
        `SECRET=${REDACTION_MARKER} # note`,
        `API_KEY=${REDACTION_MARKER}, // note`,
        `PWD=${REDACTION_MARKER};`,
      ].join('\n'),
    );
  });

  it('redacts YAML list items with sensitive keys', () => {
    expect(sanitizeForSharing('- password: hunter2\n- name: ok').output).toBe(
      `- password: ${REDACTION_MARKER}\n- name: ok`,
    );
  });
});

describe('camelCase field names', () => {
  it.each([
    'accessToken',
    'refreshToken',
    'apiKey',
    'APIKey',
    'clientSecret',
    'secretAccessKey',
    'privateKey',
    'encryptionKey',
    'dbPassword',
    'authToken',
  ])('redacts %s in .env, YAML and JSON forms', (name) => {
    expect(sanitizeForSharing(`${name}=synthetic-value`).output).toBe(`${name}=${REDACTION_MARKER}`);
    expect(sanitizeForSharing(`  ${name}: synthetic-value`).output).toBe(`  ${name}: ${REDACTION_MARKER}`);
    expect(sanitizeForSharing(`{"${name}":"synthetic-value"}`).output).toBe(
      `{"${name}":"${REDACTION_MARKER}"}`,
    );
  });

  it.each([
    'publicKey',
    'keyId',
    'keyName',
    'tokenEndpoint',
    'tokenType',
    'tokenUrl',
    'tokenCount',
    'tokenLimit',
    'apiKeyHint',
    'monkey',
    'keyboardLayout',
    'tokenizer',
    'secretary',
  ])('leaves %s untouched', (name) => {
    const input = `${name}=synthetic-value`;
    expect(sanitizeForSharing(input)).toEqual({ output: input, findings: [] });
  });
});

describe('vendor token detection', () => {
  const pad = (seed: string, length: number) => seed.repeat(Math.ceil(length / seed.length)).slice(0, length);

  const cases: {
    kind: string;
    positives: string[];
    negatives: string[];
  }[] = [
    {
      kind: 'OpenAI API key',
      positives: [
        `sk-proj-${pad('abcDEF123_-', 60)}`,
        `sk-svcacct-${pad('qrsTUV456_-', 40)}`,
        `sk-${pad('a1B2c3', 48)}`,
      ],
      negatives: ['sk-proj-short', 'sk-short1234', 'sk-learn-is-a-scikit-package-name', `risk-${pad('a1B2c3', 48)}`],
    },
    {
      kind: 'Anthropic API key',
      positives: [`sk-ant-api03-${pad('xyzXYZ789_-', 90)}AA`, `sk-ant-admin01-${pad('mnoMNO012_-', 40)}`],
      negatives: ['sk-ant-short', 'sk-ant', 'sk-antique-furniture'],
    },
    {
      kind: 'Google API key',
      positives: [`AIza${pad('Sy1a2B3c4D5e6F7', 35)}`],
      negatives: [`AIza${pad('Sy1a2B3c4D5e6F7', 20)}`, 'AIzaSyShort'],
    },
    {
      kind: 'Slack token',
      positives: [
        `xoxb-123456789012-123456789012-${pad('abcdefGHIJKL', 24)}`,
        `xoxp-123456789012-${pad('abcdefGHIJKL', 24)}`,
        `xoxa-2-${pad('abcdefGHIJKL', 24)}`,
        `xoxs-${pad('abcdefGHIJKL', 24)}`,
        `xoxo-${pad('abcdefGHIJKL', 24)}`,
      ],
      negatives: ['xoxb-short', 'xoxz-123456789012-abcdefghijkl', 'xoxb', 'xox-123456789012'],
    },
    {
      kind: 'GitLab token',
      positives: [`glpat-${pad('aB3dE5gH7j', 20)}`, `glpat-${pad('aB3dE5gH7j', 26)}`],
      negatives: ['glpat-short', 'glpat-', 'glpatterns-are-not-tokens-at-all-really'],
    },
    {
      kind: 'GitHub fine-grained token',
      positives: [`github_pat_${pad('A1b2C3d4E5f', 11)}_${pad('x9Y8z7', 59)}`],
      negatives: ['github_pat_short', 'github_patches_are_not_tokens', 'github_pat'],
    },
    {
      kind: 'SendGrid API key',
      positives: [`SG.${pad('aB3dE5gH', 22)}.${pad('cD4fG6hJ', 43)}`],
      negatives: ['SG.short.value', `SG.${pad('aB3dE5gH', 22)}`, 'SG.1234', `SG.${pad('aB3dE5gH', 22)}.${pad('cD4fG6hJ', 20)}`],
    },
  ];

  for (const { kind, positives, negatives } of cases) {
    it.each(positives)(`redacts ${kind}: %s`, (token) => {
      const result = sanitizeForSharing(`value seen in logs: ${token} (end)`);
      expect(result.output).toBe(`value seen in logs: ${REDACTION_MARKER} (end)`);
      expect(result.findings).toEqual([{ kind, count: 1 }]);
    });

    it.each(negatives)(`does not redact lookalike for ${kind}: %s`, (text) => {
      const input = `note: ${text} (end)`;
      expect(sanitizeForSharing(input)).toEqual({ output: input, findings: [] });
    });
  }

  it('catches vendor tokens under non-sensitive field names too', () => {
    const openai = `sk-proj-${pad('abcDEF123_-', 60)}`;
    const result = sanitizeForSharing(`description=${openai}`);
    expect(result.output).toBe(`description=${REDACTION_MARKER}`);
  });

  it('does not report the same token twice when a sensitive field name already covers it', () => {
    const result = sanitizeForSharing(`OPENAI_API_KEY=sk-proj-${pad('abcDEF123_-', 60)}`);
    expect(result.output).toBe(`OPENAI_API_KEY=${REDACTION_MARKER}`);
    expect(total(result.findings)).toBe(1);
  });

  it.each([
    ['RSA PRIVATE KEY', 'RSA PRIVATE KEY'],
    ['EC PRIVATE KEY', 'EC PRIVATE KEY'],
    ['ENCRYPTED PRIVATE KEY', 'ENCRYPTED PRIVATE KEY'],
    ['OPENSSH PRIVATE KEY', 'OPENSSH PRIVATE KEY'],
    ['PGP PRIVATE KEY BLOCK', 'PGP PRIVATE KEY BLOCK'],
  ])('replaces a %s block', (begin, end) => {
    const input = `before\n-----BEGIN ${begin}-----\nVersion: synthetic\n\nc3ludGhldGljLW1hdGVyaWFs\n=abcd\n-----END ${end}-----\nafter`;
    const result = sanitizeForSharing(input);
    expect(result.output).toBe(
      `before\n-----BEGIN PRIVATE KEY-----\n${REDACTION_MARKER}\n-----END PRIVATE KEY-----\nafter`,
    );
    expect(result.findings).toEqual([{ kind: 'Private key block', count: 1 }]);
  });

  it.each([
    '-----BEGIN PUBLIC KEY-----\nc3ludGhldGlj\n-----END PUBLIC KEY-----',
    '-----BEGIN CERTIFICATE-----\nc3ludGhldGlj\n-----END CERTIFICATE-----',
    '-----BEGIN PGP PUBLIC KEY BLOCK-----\nc3ludGhldGlj\n-----END PGP PUBLIC KEY BLOCK-----',
    '-----BEGIN SSH2 PUBLIC KEY-----\nc3ludGhldGlj\n-----END SSH2 PUBLIC KEY-----',
  ])('leaves public material alone: %s', (block) => {
    expect(sanitizeForSharing(block)).toEqual({ output: block, findings: [] });
  });

  it('does not pair mismatched BEGIN/END private key types', () => {
    const input =
      '-----BEGIN RSA PRIVATE KEY-----\nmaterial-one\n-----END EC PRIVATE KEY-----\nplain text';
    expect(sanitizeForSharing(input).output).toContain('material-one');
  });
});
