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

describe('SQLFormatter syntax preservation', () => {
  it('preserves doubled quotes and comment markers inside string literals', () => {
    const formatter = new SQLFormatter(options, 'standard');
    const output = formatter.format("select 'it''s -- data /* not a comment */' as value;");

    expect(output).toContain("SELECT 'it''s -- data /* not a comment */'");
  });

  it('preserves PostgreSQL dollar-quoted function bodies as one token', () => {
    const formatter = new SQLFormatter(options, 'postgresql');
    const body = "$body$ select 'x;--still data'; $body$";
    const output = formatter.format(`create function demo() returns text language sql as ${body};`);

    expect(output).toContain(body);
  });

  it('preserves PostgreSQL casts, JSON operators, containment, and array syntax', () => {
    const formatter = new SQLFormatter(options, 'postgresql');
    const output = formatter.format(
      "select payload->>'user_id' as user_id, amount::numeric(10,2) from events where tags @> array['vip'];",
    );

    expect(output).toContain("payload ->> 'user_id'");
    expect(output).toContain('amount :: NUMERIC(10, 2)');
    expect(output).toContain("tags @> ARRAY['vip']");
  });

  it('preserves MySQL quoted identifiers and JSON extraction operators', () => {
    const formatter = new SQLFormatter(options, 'mysql');
    const output = formatter.format("select `order`, payload->>'$.name' from `events`;");

    expect(output).toContain('`order`');
    expect(output).toContain("payload ->> '$.name'");
    expect(output).toContain('FROM `events`');
  });

  it('keeps adjacent minus operators separated when compacting', () => {
    const formatter = new SQLFormatter(options, 'standard');
    const output = formatter.minify('select 1 - -2; -- remove this comment');

    expect(output).toContain('1 - - 2');
    expect(output).not.toContain('--');
  });

  it('preserves PostgreSQL dollar-quoted bodies when compacting', () => {
    const formatter = new SQLFormatter(options, 'postgresql');
    const body = '$$ begin return 1; end; $$';

    expect(formatter.minify(`create function demo() returns int as ${body} language plpgsql;`)).toContain(body);
  });
});
