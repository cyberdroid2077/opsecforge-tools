import { describe, expect, it } from 'vitest';
import { REDACTION_MARKER } from '../../../lib/safe-share-sanitizer';
import { locateRedactions, maskPreview } from '../src/locate';
import { SYN, pemBlock } from './fixtures';

describe('maskPreview', () => {
  it('shows 4 characters of long values and nothing of short ones', () => {
    expect(maskPreview(SYN.stripe)).toBe('sk_l…');
    expect(maskPreview('short-password')).toBe('…');
    expect(maskPreview('')).toBe('…');
  });
});

describe('locateRedactions', () => {
  it('reports line numbers and masked previews for single-line findings', () => {
    const input = ['# config', 'APP=demo', `STRIPE_KEY=${SYN.stripe}`, 'PORT=3000', `password: ${SYN.shortPassword}`].join('\n');
    const result = locateRedactions(input);
    expect(result.output).not.toContain(SYN.stripe);
    expect(result.output).not.toContain(SYN.shortPassword);
    expect(result.locations.map((l) => l.startLine)).toEqual([3, 5]);
    expect(result.locations[0].previews).toEqual(['sk_l…']);
    expect(result.locations[1].previews).toEqual(['…']); // password is shorter than 20 characters
    expect(JSON.stringify(result.locations)).not.toContain(SYN.shortPassword);
  });

  it('handles runs of adjacent changed lines one by one', () => {
    const input = Array.from({ length: 8 }, (_, i) => `API_KEY_${i}=${SYN.stripe}${i}`).join('\n');
    const result = locateRedactions(`header\n${input}\nfooter`);
    expect(result.locations.map((l) => l.startLine)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.output.split('\n')[0]).toBe('header');
    expect(result.output.endsWith('footer')).toBe(true);
  });

  it('reports a terminated private key block as one multi-line region without any preview', () => {
    const input = ['before', pemBlock('RSA PRIVATE KEY'), 'after'].join('\n');
    const result = locateRedactions(input);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]).toMatchObject({ startLine: 2, endLine: 4, previews: [], unterminated: false });
    expect(result.locations[0].kind).toContain('Private key block');
  });

  it('also locates a label-less key block whose BEGIN/END lines are unchanged', () => {
    const input = ['before', pemBlock('PRIVATE KEY'), 'after'].join('\n');
    const result = locateRedactions(input);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]).toMatchObject({ startLine: 2, endLine: 4 });
  });

  it('flags an unterminated private key block from BEGIN to the end', () => {
    const input = ['line one', pemBlock('OPENSSH PRIVATE KEY', SYN.keyBody, false), SYN.keyBody2].join('\n');
    const result = locateRedactions(input);
    expect(result.output).not.toContain(SYN.keyBody);
    expect(result.output).not.toContain(SYN.keyBody2);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]).toMatchObject({ startLine: 2, endLine: 4, unterminated: true });
    expect(result.findings[0]).toMatchObject({ unterminated: true });
  });

  it('keeps line numbers right with CRLF line endings', () => {
    const input = `a\r\nb\r\nTOKEN=${SYN.github}\r\nc\r\n`;
    const result = locateRedactions(input);
    expect(result.locations.map((l) => l.startLine)).toEqual([3]);
    expect(result.output).toContain(`TOKEN=${REDACTION_MARKER}\r\n`);
  });

  it('returns no locations when nothing matched', () => {
    const result = locateRedactions('hello\nworld\n');
    expect(result.locations).toEqual([]);
    expect(result.findings).toEqual([]);
  });

  it('locates a YAML block scalar as a multi-line region', () => {
    const input = ['name: demo', 'password: |', `  ${SYN.password}`, `  ${SYN.dbPassword}`, 'next: 1'].join('\n');
    const result = locateRedactions(input);
    expect(result.output).not.toContain(SYN.password);
    expect(result.output).not.toContain(SYN.dbPassword);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]).toMatchObject({ startLine: 3, endLine: 4 }); // the secret lines themselves
  });
});

describe('locateRedactions: merged regions', () => {
  it('keeps one-line redactions next to an unterminated key separate, with their own previews', () => {
    const input = [
      'APP=demo',
      `STRIPE=${SYN.stripe}`,
      `DB=postgres://u:${SYN.dbPassword}@h/db`,
      '-----BEGIN OPENSSH PRIVATE KEY-----',
      SYN.keyBody,
      SYN.keyBody2,
    ].join('\n');
    const result = locateRedactions(input);
    expect(result.locations.map((l) => [l.startLine, l.endLine, l.unterminated])).toEqual([
      [2, 2, false],
      [3, 3, false],
      [4, 6, true],
    ]);
    expect(result.locations[0].previews).toEqual(['sk_l…']);
    expect(result.output).not.toContain(SYN.keyBody2);
  });

  it('keeps a one-line redaction after a complete key block separate', () => {
    const input = [pemBlock('RSA PRIVATE KEY'), `TOKEN=${SYN.github}`, 'tail'].join('\n');
    const result = locateRedactions(input);
    expect(result.locations.map((l) => [l.startLine, l.endLine])).toEqual([
      [1, 3],
      [4, 4],
    ]);
  });
});

describe('locateRedactions: randomized coverage', () => {
  // Deterministic PRNG so failures reproduce.
  const rng = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  it('every line carrying a secret is inside a reported location, and no raw secret survives', () => {
    const random = rng(42);
    const plain = ['# comment', 'APP=demo', 'PORT=3000', '', 'name: service', '  nested: true', 'log line ok'];
    const secretLines: ((n: number) => string)[] = [
      (n) => `STRIPE_${n}=${SYN.stripe}${n}`,
      (n) => `GITHUB_TOKEN=${SYN.github}${n}`,
      (n) => `DB=postgres://u:${SYN.dbPassword}${n}@h/db`,
      (n) => `{"password": "${SYN.password}${n}"}`,
      (n) => `Authorization: Bearer ${SYN.github}${n}`,
    ];
    for (let round = 0; round < 200; round += 1) {
      const lines: string[] = [];
      const secretIndexes = new Set<number>();
      const secretValues: string[] = [];
      const count = 1 + Math.floor(random() * 25);
      for (let k = 0; k < count; k += 1) {
        const roll = random();
        if (roll < 0.35) {
          const make = secretLines[Math.floor(random() * secretLines.length)];
          secretIndexes.add(lines.length);
          lines.push(make(k));
        } else if (roll < 0.45) {
          // a complete key block, sometimes with label-less BEGIN/END
          const label = random() < 0.5 ? 'PRIVATE KEY' : 'EC PRIVATE KEY';
          const block = pemBlock(label, `${SYN.keyBody}${k}`).split('\n');
          block.forEach((_, offset) => secretIndexes.add(lines.length + offset));
          secretValues.push(`${SYN.keyBody}${k}`);
          lines.push(...block);
        } else {
          lines.push(plain[Math.floor(random() * plain.length)]);
        }
      }
      if (random() < 0.2) {
        const truncated = pemBlock('RSA PRIVATE KEY', `${SYN.keyBody2}x`, false).split('\n');
        truncated.forEach((_, offset) => secretIndexes.add(lines.length + offset));
        secretValues.push(`${SYN.keyBody2}x`);
        lines.push(...truncated);
      }
      const input = lines.join('\n');
      const result = locateRedactions(input);
      for (const raw of [SYN.stripe, SYN.github, SYN.dbPassword, SYN.password, ...secretValues]) {
        expect(result.output, `round ${round}`).not.toContain(raw);
      }
      for (const index of secretIndexes) {
        // BEGIN/END lines of a block are covered by the block's range
        const line = index + 1;
        const covered = result.locations.some((l) => l.startLine <= line && line <= l.endLine);
        const isBoundary = /-----(BEGIN|END)/.test(lines[index]);
        expect(covered || isBoundary, `round ${round}, line ${line}: ${lines[index].slice(0, 12)}`).toBe(true);
      }
    }
  });
});

describe('locateRedactions: large inputs', () => {
  it('handles a 1 MiB file that is one unterminated key (edit distance far above the cap)', () => {
    const body = Array.from({ length: 16000 }, (_, i) => `${SYN.keyBody}${i}`).join('\n');
    const input = `header\n-----BEGIN RSA PRIVATE KEY-----\n${body}`;
    const started = Date.now();
    const result = locateRedactions(input);
    expect(Date.now() - started).toBeLessThan(5000);
    expect(result.output).not.toContain(SYN.keyBody);
    expect(result.locations).toHaveLength(1);
    expect(result.locations[0]).toMatchObject({ startLine: 2, unterminated: true });
  });

  it('handles thousands of secret lines mixed with ordinary lines', () => {
    const lines: string[] = [];
    for (let i = 0; i < 6000; i += 1) lines.push(i % 3 === 0 ? `TOKEN_${i}=${SYN.github}${i}` : `line ${i}`);
    const started = Date.now();
    const result = locateRedactions(lines.join('\n'));
    expect(Date.now() - started).toBeLessThan(5000);
    expect(result.locations).toHaveLength(2000);
    expect(result.locations[0].startLine).toBe(1);
    expect(result.locations[1999].startLine).toBe(5998);
  });
});
