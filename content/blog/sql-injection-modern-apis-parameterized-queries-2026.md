---
title: "SQL Injection in API Code: What Parameterized Queries Cover and Where They Stop"
date: "2026-03-25"
updated: "2026-10-23"
description: "Parameterized queries stop value injection, but not dynamic identifiers, ORM raw-query misuse, second-order injection, or LIKE wildcards. Tested SQLite, Django, SQLAlchemy and Sequelize examples."
author: "OpsecForge Security Team"
category: "API Security"
tags: ["SQL Injection", "API Security", "Database Security", "Parameterized Queries", "DevSecOps"]
source_reviewed: "2026-10-23"
primary_source: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html"
---

# SQL Injection in API Code: What Parameterized Queries Cover and Where They Stop

**Short answer.** Pass user-supplied values as bind parameters, never by building the SQL string. The [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) says this lets the database tell code from data for those values. It does not cover every part of a query. Table names, column names and sort direction cannot be bound; ORM "raw" escape hatches accept whatever string you give them; a value stored safely today can be concatenated into SQL tomorrow; and `LIKE` patterns still carry wildcards. The rest of this article shows each case, run against SQLite.

## The basic case, and three places it stops

The script below uses only Python's `sqlite3` module and synthetic data. Run it to check each claim yourself.

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, role TEXT);
INSERT INTO users (email, role) VALUES
  ('ana@example.test', 'user'), ('bo@example.test', 'user'), ('root@example.test', 'admin');
""")
rows = lambda sql, *args: [r[0] for r in db.execute(sql, *args)]

evil = "x' OR '1'='1"
print("1. concatenated :", rows(f"SELECT email FROM users WHERE email = '{evil}'"))
print("   parameterized:", rows("SELECT email FROM users WHERE email = ?", (evil,)))

print("2. ORDER BY ? sorts by a constant string, not by the column:",
      rows("SELECT email FROM users ORDER BY ? DESC", ("email",)))
SORTABLE = {"email": "email", "role": "role"}            # allowlist: user value -> SQL fragment
col = SORTABLE.get("role; DROP TABLE users", "email")      # unknown value falls back to a default
print("   allowlist map  :", rows(f"SELECT email FROM users ORDER BY {col} DESC"), "(column =", col + ")")
print("   LIMIT ? works  :", rows("SELECT email FROM users LIMIT ?", (2,)))

print("3. LIKE with user text '%':", rows("SELECT email FROM users WHERE email LIKE ?", ("%",)))
esc = lambda s: s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
print("   escaped + ESCAPE   :", rows("SELECT email FROM users WHERE email LIKE ? ESCAPE '\\'", (esc("%") + "%",)))

print("4. second-order injection")
db.execute("CREATE TABLE profiles (name TEXT)")
db.execute("INSERT INTO profiles VALUES (?)", (evil,))   # stored safely...
name = db.execute("SELECT name FROM profiles").fetchone()[0]
print("   reused in concatenated query:", rows(f"SELECT email FROM users WHERE email = '{name}'"))
print("   reused as a parameter       :", rows("SELECT email FROM users WHERE email = ?", (name,)))
```

Output (Python 3.12, SQLite in memory):

```text
1. concatenated : ['ana@example.test', 'bo@example.test', 'root@example.test']
   parameterized: []
2. ORDER BY ? sorts by a constant string, not by the column: ['ana@example.test', 'bo@example.test', 'root@example.test']
   allowlist map  : ['root@example.test', 'bo@example.test', 'ana@example.test'] (column = email)
   LIMIT ? works  : ['ana@example.test', 'bo@example.test']
3. LIKE with user text '%': ['ana@example.test', 'bo@example.test', 'root@example.test']
   escaped + ESCAPE   : []
4. second-order injection
   reused in concatenated query: ['ana@example.test', 'bo@example.test', 'root@example.test']
   reused as a parameter       : []
```

1. **Values.** The concatenated query returned all three rows; the bound one returned none, because `x' OR '1'='1` is treated as an email address that does not exist.
2. **Identifiers.** `ORDER BY ?` accepted a bound string without error and sorted by that constant, so the order did not change. OWASP's answer for table names, column names and sort order is allowlist validation or redesign: map the user's choice to a fixed SQL fragment and fall back to a default. Sequelize's documentation says the same limit applies to its bind parameters: they cannot be SQL keywords, table names or column names. `LIMIT ?` worked in SQLite; check your database and driver, and otherwise convert to an integer and clamp it, which OWASP says is safe to append.
3. **Wildcards.** Binding `%` for a `LIKE` search is not SQL injection, but it matches every row. Escape `%`, `_` and the escape character, then add an `ESCAPE` clause; [SQLite's documentation](https://www.sqlite.org/lang_expr.html) describes it, and other databases have their own syntax.
4. **Second order.** The hostile string was inserted with a parameter, which is correct, and read back later. Concatenating it into a new query reproduced the injection. [Microsoft's SQL Server documentation](https://learn.microsoft.com/en-us/sql/relational-databases/security/sql-injection) describes this pattern: stored strings later concatenated into dynamic SQL. Data from your own database is still untrusted input.

## ORM raw queries

Each ORM below returned 3 rows for the unsafe form and 0 for the safe form when given the same hostile string (Django 5.2.18, SQLAlchemy 2.0.55, Sequelize 6.37.8, SQLite).

```python
# Django: raw() and extra()  (docs: topics/db/sql, ref/models/querysets)
User.objects.raw(f"SELECT * FROM users WHERE email = '{email}'")          # unsafe
User.objects.raw("SELECT * FROM users WHERE email = %s", [email])         # safe
User.objects.extra(where=[f"email = '{email}'"])                          # unsafe
User.objects.extra(where=["email = %s"], params=[email])                  # safe

# SQLAlchemy: text()
text(f"SELECT email FROM users WHERE email = '{email}'")                  # unsafe
conn.execute(text("SELECT email FROM users WHERE email = :email"), {"email": email})  # safe
```

```javascript
// Sequelize: sequelize.query()
await sequelize.query(`SELECT email FROM users WHERE email = '${email}'`);                       // unsafe
await sequelize.query('SELECT email FROM users WHERE email = $email', { bind: { email } });     // safe
```

The [Django documentation](https://docs.djangoproject.com/en/5.2/topics/db/sql/) warns against string formatting in `raw()` and against quoting the `%s` placeholder, and calls [`extra()`](https://docs.djangoproject.com/en/5.2/ref/models/querysets/#extra) a last resort that is no longer being improved. [SQLAlchemy's tutorial](https://docs.sqlalchemy.org/en/20/tutorial/dbapi_transactions.html) says a Python value should never be stringified into textual SQL and that a parameter should always be used. [Sequelize](https://sequelize.org/docs/v6/core-concepts/raw-queries/) offers two forms: replacements are escaped and inserted by Sequelize before the query is sent, while bind parameters travel to the database separately. Prefer bind where your dialect supports it, because OWASP rates escaping as fragile.

## Stored procedures and dynamic SQL

OWASP treats a stored procedure as equivalent to a prepared statement only when it contains no unsafe dynamic SQL, and tells auditors to look for `sp_execute`, `execute` and `exec` in SQL Server procedures. If dynamic SQL is unavoidable, keep values as parameters. On SQL Server, [`sp_executesql`](https://learn.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-executesql-transact-sql) accepts them, and its documentation advises parameterizing. Identifiers still need the allowlist. We did not run SQL Server for this article.

## Defenses around the code

- **Least privilege.** OWASP recommends read-only accounts where possible, a separate account per application, and views that expose only needed columns. It also says never to give application accounts DBA-level access.
- **WAF.** A web application firewall filters requests; it does not change how your code builds queries. Treat it as a stopgap while you fix the code (our assessment, not a vendor claim).
- **Logs.** Log the statement text (with placeholders) and a request ID rather than raw values. Database syntax errors from a code path that should only send fixed statements suggest string building or probing, so alert on those instead of on keywords such as `UNION`, which also appear in legitimate queries.

## Reading a logged query

When a query misbehaves, the SQL your driver logged is easier to review once formatted. The [SQL Formatter](/tools/sql-formatter) formats or minifies Standard SQL, MySQL and PostgreSQL in the browser. For the concatenated query above (`select id,email,role from users where email = 'x' OR '1'='1' order by role;`) it produced:

```sql
SELECT id,
email,
role
FROM users
WHERE email = 'x' OR '1' = '1'
ORDER BY role;
```

It makes the always-true condition easy to see. It only changes whitespace and keyword case: it does not parse for vulnerabilities, detect injection, or tell you whether a query is safe.

## Checklist

- Bind every value; use allowlist maps for identifiers and sort direction.
- In ORMs, search the codebase for `raw`, `extra`, `text(` and `query(` and read each call.
- Treat stored data as untrusted when it re-enters a query.
- Escape `LIKE` wildcards when the user means literal text.
- Review dynamic SQL in stored procedures.
- Give the application account only the privileges it needs.

Sources: [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), the Django, SQLAlchemy, Sequelize, SQLite and Microsoft pages linked above.
