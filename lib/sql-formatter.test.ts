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
    expect(output).toContain('amount::NUMERIC(10, 2)');
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

describe('SQLFormatter PostgreSQL layout', () => {
  const pgOptions: FormatOptions = { ...options, maxLineLength: 80 };
  const pg = (sql: string) => new SQLFormatter(pgOptions, 'postgresql').format(sql);

  it('puts ON CONFLICT ... DO UPDATE on its own lines and keeps now() tight', () => {
    expect(
      pg('insert into users (id, email) values ($1, $2) on conflict (email) do update set email = excluded.email, updated_at = now() returning id;'),
    ).toBe(
      [
        'INSERT INTO users (id, email)',
        'VALUES ($1, $2)',
        'ON CONFLICT (email) DO UPDATE',
        'SET',
        '  email = excluded.email,',
        '  updated_at = now()',
        'RETURNING id;',
      ].join('\n'),
    );
  });

  it('handles ON CONFLICT DO NOTHING and ON CONFLICT ON CONSTRAINT', () => {
    expect(pg('insert into users (id) values (1) on conflict do nothing;')).toBe(
      ['INSERT INTO users (id)', 'VALUES (1)', 'ON CONFLICT DO NOTHING;'].join('\n'),
    );
    expect(pg('insert into users (id) values (1) on conflict on constraint users_pk do nothing;')).toBe(
      ['INSERT INTO users (id)', 'VALUES (1)', 'ON CONFLICT ON CONSTRAINT users_pk DO NOTHING;'].join('\n'),
    );
  });

  it('does not treat a JOIN ... ON condition as ON CONFLICT', () => {
    expect(pg('select a from t join u on u.id = t.id join v on v.id = u.id')).toBe(
      ['SELECT a', 'FROM t', 'JOIN u ON u.id = t.id', 'JOIN v ON v.id = u.id'].join('\n'),
    );
  });

  it('only spaces the column-list parenthesis after INSERT INTO, not later function calls', () => {
    expect(pg('insert into t (a) values (coalesce(1, 2)) returning lower(a)')).toBe(
      ['INSERT INTO t (a)', 'VALUES (coalesce(1, 2))', 'RETURNING lower(a)'].join('\n'),
    );
    expect(pg('insert into t (a) select now() from u')).toBe(['INSERT INTO t (a)', 'SELECT now()', 'FROM u'].join('\n'));
  });

  it('keeps :: casts tight on both sides', () => {
    expect(pg("select created_at::date, $1 :: int[], array['a'] :: text[], '7 days'::interval, (a + b)::numeric(10,2) from t")).toBe(
      [
        'SELECT',
        '  created_at::DATE,',
        '  $1::INT[],',
        "  ARRAY['a']::TEXT[],",
        "  '7 days'::INTERVAL,",
        '  (a + b)::NUMERIC(10, 2)',
        'FROM t',
      ].join('\n'),
    );
  });

  it('keeps :: tight in every dialect and leaves minify unchanged', () => {
    expect(new SQLFormatter(pgOptions, 'standard').format('select a :: int from t')).toBe('SELECT a::INT\nFROM t');
    expect(new SQLFormatter(pgOptions, 'mysql').format('select a :: int from t')).toBe('SELECT a::INT\nFROM t');
    expect(new SQLFormatter(pgOptions, 'postgresql').minify('select a::int from t')).toBe('select a :: int from t');
  });

  it('writes FILTER (WHERE ...) with a space after FILTER', () => {
    expect(pg("select count(*) filter (where status = 'paid') as paid from orders")).toBe(
      ["SELECT count(*) FILTER (WHERE status = 'paid') AS paid", 'FROM orders'].join('\n'),
    );
  });

  it('uppercases NULLS FIRST/LAST, INTERVAL and TIMESTAMPTZ without adding line breaks', () => {
    expect(pg("select a from t where created_at > now() - interval '7 days' order by t.t desc nulls last, u nulls first")).toBe(
      ['SELECT a', 'FROM t', "WHERE created_at > now() - INTERVAL '7 days'", 'ORDER BY t.t DESC NULLS LAST, u NULLS FIRST'].join('\n'),
    );
    expect(pg('select cast(x as timestamptz) from t')).toBe('SELECT cast(x AS TIMESTAMPTZ)\nFROM t');
  });

  it('does not break DO $$ ... $$ anonymous blocks', () => {
    expect(pg('do $$ begin perform 1; end $$;')).toBe('DO $$ begin perform 1; end $$;');
  });
});

describe('SQLFormatter CREATE TABLE layout', () => {
  const create =
    'create table if not exists items (id bigserial primary key, sku text not null unique, price numeric(10,2) check (price >= 0), created_at timestamptz not null default now());';

  it('puts each column on its own line in PostgreSQL mode', () => {
    expect(new SQLFormatter({ ...options, maxLineLength: 80 }, 'postgresql').format(create)).toBe(
      [
        'CREATE TABLE IF NOT EXISTS items (',
        '  id BIGSERIAL PRIMARY KEY,',
        '  sku TEXT NOT NULL UNIQUE,',
        '  price NUMERIC(10, 2) CHECK (price >= 0),',
        '  created_at TIMESTAMPTZ NOT NULL DEFAULT now()',
        ');',
      ].join('\n'),
    );
  });

  it('uses the same layout in Standard mode (only the PostgreSQL-only type words differ)', () => {
    expect(new SQLFormatter(options, 'standard').format(create)).toBe(
      [
        'CREATE TABLE IF NOT EXISTS items (',
        '  id bigserial PRIMARY KEY,',
        '  sku TEXT NOT NULL UNIQUE,',
        '  price NUMERIC(10, 2) CHECK (price >= 0),',
        '  created_at timestamptz NOT NULL DEFAULT now()',
        ');',
      ].join('\n'),
    );
  });

  it('splits only the outer list; table constraints and REFERENCES stay inline', () => {
    expect(
      new SQLFormatter(options, 'postgresql').format(
        'create table o (id int, user_id int references users(id) on delete set null on update cascade, primary key (id, user_id), foreign key (user_id) references users(id));',
      ),
    ).toBe(
      [
        'CREATE TABLE o (',
        '  id INT,',
        '  user_id INT REFERENCES users (id) ON DELETE SET NULL ON UPDATE cascade,',
        '  PRIMARY KEY (id, user_id),',
        '  FOREIGN KEY (user_id) REFERENCES users (id)',
        ');',
      ].join('\n'),
    );
  });

  it('supports leading commas and keeps a single column inline', () => {
    expect(new SQLFormatter({ ...options, commaPosition: 'before' }, 'standard').format('create table t (a int, b text)')).toBe(
      ['CREATE TABLE t (', '  a INT', '  , b TEXT', ')'].join('\n'),
    );
    expect(new SQLFormatter(options, 'standard').format('create table t (a int)')).toBe('CREATE TABLE t (a INT)');
  });

  it('spaces the column list after a quoted table name', () => {
    expect(new SQLFormatter(options, 'mysql').format('create table `t` (id int, name varchar(20))')).toBe(
      ['CREATE TABLE `t` (', '  id INT,', '  name VARCHAR(20)', ')'].join('\n'),
    );
    expect(new SQLFormatter(options, 'postgresql').format('insert into "users" (id) values (1)')).toBe(
      ['INSERT INTO "users" (id)', 'VALUES (1)'].join('\n'),
    );
  });

  it('does not change CREATE TABLE ... AS SELECT', () => {
    expect(new SQLFormatter(options, 'standard').format('create table t2 as select a from t')).toBe(
      ['CREATE TABLE t2 AS', 'SELECT a', 'FROM t'].join('\n'),
    );
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
