import { describe, expect, it } from 'vitest';

import { DEFAULT_SQL, SQLFormatter, type FormatOptions } from './sql-formatter';

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

describe('SQLFormatter multi-word keywords stay on one line', () => {
  const format = (sql: string, dialect: 'standard' | 'mysql' | 'postgresql' = 'standard') =>
    new SQLFormatter(options, dialect).format(sql).split('\n');

  it.each([
    ['LEFT JOIN', 'select a from t1 left join t2 on t1.id = t2.id'],
    ['RIGHT JOIN', 'select a from t1 right join t2 on t1.id = t2.id'],
    ['INNER JOIN', 'select a from t1 inner join t2 on t1.id = t2.id'],
    ['FULL OUTER JOIN', 'select a from t1 full outer join t2 on t1.id = t2.id'],
    ['LEFT OUTER JOIN', 'select a from t1 left outer join t2 on t1.id = t2.id'],
    ['CROSS JOIN', 'select a from t1 cross join t2'],
    ['NATURAL JOIN', 'select a from t1 natural join t2'],
    ['JOIN', 'select a from t1 join t2 on t1.id = t2.id'],
  ])('keeps %s together at the start of its own line', (phrase, sql) => {
    const lines = format(sql);

    expect(lines.some(line => line.startsWith(`${phrase} t2`))).toBe(true);
    expect(lines.every(line => line.trim() !== phrase.split(' ')[0])).toBe(true);
  });

  it('keeps GROUP BY and ORDER BY together', () => {
    const lines = format('select a, count(*) from t group by a order by a desc');

    expect(lines).toContain('GROUP BY a');
    expect(lines).toContain('ORDER BY a DESC');
  });

  it('keeps UNION, UNION ALL, INTERSECT and EXCEPT together', () => {
    const lines = format('select a from t1 union all select a from t2 union select a from t3 intersect select a from t4 except select a from t5');

    expect(lines).toContain('UNION ALL');
    expect(lines).toContain('UNION');
    expect(lines).toContain('INTERSECT');
    expect(lines).toContain('EXCEPT');
  });

  it('does not break ORDER BY or PARTITION BY inside a window specification', () => {
    const output = new SQLFormatter(options, 'postgresql').format(
      'select row_number() over (partition by a order by b desc) as rn from t',
    );

    expect(output).toContain('OVER (PARTITION BY a ORDER BY b DESC) AS rn');
  });

  it('does not treat IS DISTINCT FROM as a new clause', () => {
    expect(format('select a from t where x is distinct from y')).toContain('WHERE x IS DISTINCT FROM y');
  });
});

describe('SQLFormatter select lists', () => {
  it('puts every column of a multi-column SELECT on its own line, including after AS aliases', () => {
    const lines = new SQLFormatter(options, 'standard').format(
      'select a, count(b) as n, sum(c) as total, coalesce(d, 0) from t',
    ).split('\n');

    expect(lines).toEqual([
      'SELECT',
      '  a,',
      '  count(b) AS n,',
      '  sum(c) AS total,',
      '  coalesce(d, 0)',
      'FROM t',
    ]);
  });

  it('keeps commas inside function calls and IN lists on the same line', () => {
    const output = new SQLFormatter(options, 'standard').format('select a from t where id in (1, 2, 3) and f(x, y) > 1');

    expect(output).toContain('IN (1, 2, 3)');
    expect(output).toContain('f(x, y)');
  });

  it('keeps a single-column SELECT on the SELECT line', () => {
    expect(new SQLFormatter(options, 'standard').format('select count(*) from t')).toBe('SELECT count(*)\nFROM t');
  });

  it('supports leading commas', () => {
    const output = new SQLFormatter({ ...options, commaPosition: 'before' }, 'standard').format('select a, b from t');

    expect(output).toBe('SELECT\n  a\n  , b\nFROM t');
  });

  it('indents subqueries one level and closes the parenthesis on its own line', () => {
    const output = new SQLFormatter(options, 'standard').format('select a from t where id in (select id from u where x = 1)');

    expect(output).toBe(
      ['SELECT a', 'FROM t', 'WHERE id IN (', '  SELECT id', '  FROM u', '  WHERE x = 1', ')'].join('\n'),
    );
  });
});

describe('SQLFormatter default example', () => {
  it('formats the page default as one column per line with joins on single lines', () => {
    const output = new SQLFormatter(options, 'standard').format(DEFAULT_SQL);

    expect(output).toBe(
      [
        'SELECT',
        '  u.id,',
        '  u.email,',
        '  u.created_at,',
        '  p.first_name,',
        '  p.last_name,',
        '  COUNT(o.id) AS order_count,',
        '  SUM(o.total) AS lifetime_value',
        'FROM users u',
        'LEFT JOIN profiles p ON u.id = p.user_id',
        'LEFT JOIN orders o ON u.id = o.user_id',
        "WHERE u.status = 'active' AND u.created_at >= '2024-01-01'",
        'GROUP BY u.id, u.email, u.created_at, p.first_name, p.last_name',
        'HAVING COUNT(o.id) > 0',
        'ORDER BY lifetime_value DESC',
        'LIMIT 100;',
      ].join('\n'),
    );
  });

  it('gives the same layout in every dialect for this ANSI query', () => {
    const standard = new SQLFormatter(options, 'standard').format(DEFAULT_SQL);

    expect(new SQLFormatter(options, 'mysql').format(DEFAULT_SQL)).toBe(standard);
    expect(new SQLFormatter(options, 'postgresql').format(DEFAULT_SQL)).toBe(standard);
  });

  it('separates statements with a blank line', () => {
    expect(new SQLFormatter(options, 'standard').format('select 1; select 2;')).toBe('SELECT 1;\n\nSELECT 2;');
  });
});

describe('SQLFormatter dialect setting', () => {
  const insert = 'insert into users (id) values (1) returning id';

  it('treats RETURNING as a clause only in PostgreSQL mode', () => {
    expect(new SQLFormatter(options, 'postgresql').format(insert).split('\n')).toContain('RETURNING id');
    expect(new SQLFormatter(options, 'standard').format(insert).split('\n')).not.toContain('RETURNING id');
  });

  it('keeps dollar-quoted bodies intact only in PostgreSQL mode', () => {
    const sql = 'select $$a;b$$';

    expect(new SQLFormatter(options, 'postgresql').format(sql)).toBe('SELECT $$a;b$$');
    expect(new SQLFormatter(options, 'standard').format(sql)).not.toBe('SELECT $$a;b$$');
  });
});
