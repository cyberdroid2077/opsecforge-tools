import { describe, expect, it } from 'vitest';
import { REDACTION_MARKER, sanitizeForSharing } from './safe-share-sanitizer';

describe('sanitizeForSharing', () => {
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
