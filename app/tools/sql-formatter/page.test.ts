import { describe, expect, it } from 'vitest';

import { SQLFormatter, type FormatOptions } from './page';

const options: FormatOptions = {
  indentSize: 2,
  uppercaseKeywords: true,
  commaPosition: 'after',
  maxLineLength: 120,
};

describe('SQLFormatter comments', () => {
  it('preserves line-comment markers when formatting', () => {
    const formatter = new SQLFormatter(options, 'postgresql');
    const output = formatter.format('select id -- keep this note\nfrom users;');

    expect(output).toContain('-- keep this note');
    expect(output).toContain('FROM users;');
  });

  it('preserves block-comment delimiters when formatting', () => {
    const formatter = new SQLFormatter(options, 'mysql');
    const output = formatter.format('select /* optimizer note */ id from users;');

    expect(output).toContain('/* optimizer note */');
    expect(output).toContain('FROM users;');
  });

  it('removes comments in minify mode without removing quoted markers', () => {
    const formatter = new SQLFormatter(options, 'standard');
    const output = formatter.minify("select '--not a comment' as value /* remove */ from items;");

    expect(output).toContain("'--not a comment'");
    expect(output).not.toContain('remove');
    expect(output).toContain('from items;');
  });
});
