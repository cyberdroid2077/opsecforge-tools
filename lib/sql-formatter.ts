// Client-side SQL formatter. It is a lexical formatter: it tokenizes the text, keeps
// strings/comments/dollar-quoted bodies intact and lays out common clauses. It does not
// parse, validate or execute SQL.

export type SQLDialect = 'standard' | 'mysql' | 'postgresql';

export interface FormatOptions {
  indentSize: number;
  uppercaseKeywords: boolean;
  commaPosition: 'after' | 'before';
  maxLineLength: number;
}

interface SqlToken {
  text: string;
  clause: boolean;
}

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
  'ALTER', 'TABLE', 'INDEX', 'VIEW', 'TRIGGER', 'PROCEDURE', 'FUNCTION',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'ON', 'USING',
  'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'EXISTS', 'BETWEEN', 'LIKE',
  'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
  'DISTINCT', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'WHILE',
  'VALUES', 'SET', 'INTO', 'DEFAULT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'UNIQUE', 'CHECK', 'CONSTRAINT', 'AUTO_INCREMENT', 'SERIAL', 'BIGINT',
  'VARCHAR', 'CHAR', 'TEXT', 'INT', 'INTEGER', 'DECIMAL', 'NUMERIC',
  'FLOAT', 'DOUBLE', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'BOOLEAN',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'INTERSECT', 'EXCEPT', 'NATURAL',
  'WITH', 'RECURSIVE', 'LATERAL', 'ASC', 'DESC', 'OVER', 'PARTITION',
  'INTERVAL', 'NULLS', 'FIRST', 'LAST'
]);

const MYSQL_KEYWORDS = new Set([
  'ENGINE', 'CHARSET', 'COLLATE', 'AUTO_INCREMENT', 'UNSIGNED', 'ZEROFILL',
  'COMMENT', 'DELIMITER', 'LIMIT', 'OFFSET',
  // Reserved words in MySQL, so they cannot be unquoted column names.
  'ADD', 'CASCADE', 'CHANGE', 'CHARACTER', 'COLUMN', 'CURRENT_TIMESTAMP', 'DESCRIBE',
  'DIV', 'EXPLAIN', 'FOR', 'FORCE', 'FULLTEXT', 'IGNORE', 'LOCK', 'REGEXP', 'RENAME',
  'REPLACE', 'RESTRICT', 'RLIKE', 'SEPARATOR', 'SHOW', 'STRAIGHT_JOIN', 'USE', 'XOR',
  'TINYINT', 'SMALLINT', 'MEDIUMINT', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT', 'BLOB',
  'BINARY', 'VARBINARY',
  // Not reserved, but rarely anything else where they appear.
  'ENUM', 'MODIFY', 'TRUNCATE', 'ROLLUP'
]);

// Keywords that are written like a function call or a sized type: no space before "(".
const TYPE_OR_FUNCTION_LIKE = new Set([
  'VARCHAR', 'CHAR', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'TIMESTAMP', 'TIME',
  'DATETIME', 'INT', 'INTEGER', 'BIGINT', 'TEXT', 'IF', 'LEFT', 'RIGHT', 'DATE',
  'UUID', 'JSON', 'JSONB', 'ARRAY', 'BOOLEAN', 'REPLACE', 'TIMESTAMPTZ',
  'INTERVAL', 'FIRST', 'LAST', 'VALUES', 'ENUM', 'TINYINT', 'SMALLINT', 'MEDIUMINT',
  'BINARY', 'VARBINARY', 'CURRENT_TIMESTAMP',
]);

// MySQL INSERT modifiers that can sit between INSERT and INTO.
const INSERT_MODIFIERS = ['IGNORE', 'LOW_PRIORITY', 'HIGH_PRIORITY', 'DELAYED'];

const isCommentToken = (token: string, dialect: SQLDialect) =>
  token.startsWith('--') || token.startsWith('/*') || (dialect === 'mysql' && token.startsWith('#'));

const PG_KEYWORDS = new Set([
  'RETURNING', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'UUID', 'JSON',
  'JSONB', 'ARRAY', 'ILIKE', 'SIMILAR', 'TO', 'WINDOW', 'OVER',
  'PARTITION', 'RANGE', 'ROWS', 'PRECEDING', 'FOLLOWING', 'UNBOUNDED',
  'CURRENT', 'ROW', 'TIMESTAMPTZ', 'CONFLICT', 'NOTHING', 'FILTER', 'DO',
  'ADD', 'COLUMN', 'CASCADE', 'RENAME'
]);

export class SQLFormatter {
  private options: FormatOptions;
  private dialect: SQLDialect;

  constructor(options: FormatOptions, dialect: SQLDialect) {
    this.options = options;
    this.dialect = dialect;
  }

  private getAllKeywords(): Set<string> {
    const keywords = new Set(KEYWORDS);
    if (this.dialect === 'mysql') {
      MYSQL_KEYWORDS.forEach(k => keywords.add(k));
    } else if (this.dialect === 'postgresql') {
      PG_KEYWORDS.forEach(k => keywords.add(k));
    }
    return keywords;
  }

  private tokenize(sql: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let backslashEscapes = false;
    let inComment = false;
    let commentType = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1];

      if (!inString && !inComment) {
        if (char === '-' && nextChar === '-') {
          if (current) tokens.push(current);
          current = '--';
          inComment = true;
          commentType = 'line';
          i++;
          continue;
        }
        if (char === '/' && nextChar === '*') {
          if (current) tokens.push(current);
          current = '/*';
          inComment = true;
          commentType = 'block';
          i++;
          continue;
        }
        // MySQL also starts a line comment with "#". In PostgreSQL "#" is an operator character.
        if (char === '#' && this.dialect === 'mysql') {
          if (current) tokens.push(current);
          current = '#';
          inComment = true;
          commentType = 'line';
          continue;
        }
      }

      if (inComment) {
        if (commentType === 'line' && char === '\n') {
          tokens.push(current.trimEnd());
          current = '';
          inComment = false;
        } else if (commentType === 'block' && char === '*' && nextChar === '/') {
          current += '*/';
          tokens.push(current.trim());
          current = '';
          inComment = false;
          i++;
        } else {
          current += char;
        }
        continue;
      }

      if (!inString && this.dialect === 'postgresql' && char === '$') {
        const delimiter = sql.slice(i).match(/^(\$\$|\$[A-Za-z_][A-Za-z0-9_]*\$)/)?.[0];
        if (delimiter) {
          if (current) tokens.push(current);
          const end = sql.indexOf(delimiter, i + delimiter.length);
          if (end === -1) {
            tokens.push(sql.slice(i));
            current = '';
            break;
          }
          tokens.push(sql.slice(i, end + delimiter.length));
          current = '';
          i = end + delimiter.length - 1;
          continue;
        }
      }

      if (!inString && (char === "'" || char === '"' || char === '`')) {
        // Backslash escapes a quote in MySQL strings and in PostgreSQL E'...' strings. A plain
        // PostgreSQL string such as 'C:\dir\' ends at its quote, and so does any quoted identifier.
        backslashEscapes = char !== '`' &&
          (this.dialect !== 'postgresql' || (char === "'" && /^e$/i.test(current)));
        if (current) tokens.push(current);
        current = char;
        inString = true;
        stringChar = char;
        continue;
      }

      if (inString) {
        current += char;
        if (char !== stringChar) continue;

        // A backslash-escaped quote (\" or \') does not end the string. Check this before the
        // doubled-quote rule, otherwise "say \"hi\"" is read as an unterminated string.
        let precedingBackslashes = 0;
        for (let j = i - 1; j >= 0 && sql[j] === '\\'; j--) precedingBackslashes++;
        if (backslashEscapes && precedingBackslashes % 2 === 1) continue;

        if (nextChar === stringChar) {
          current += nextChar;
          i++;
          continue;
        }

        tokens.push(current);
        current = '';
        inString = false;
        continue;
      }

      // "<=>" is MySQL's NULL-safe equality (and a pgvector distance operator, like "<->" and "<#>").
      const operator = [
        '<=>', '<->', '<#>', '->>', '#>>', '!~~*', '~~*', '!~*', '::', '->', '#>', '||', '&&',
        '<=', '>=', '!=', '<>', ':=', '=>', '<<', '>>', '@>', '<@', '?&',
        '?|', '@@', '@?', '^@', '!~~', '~~', '!~', '~*'
      ].find(candidate => sql.startsWith(candidate, i));
      if (operator) {
        if (current) tokens.push(current);
        tokens.push(operator);
        current = '';
        i += operator.length - 1;
        continue;
      }

      if (['(', ')', '[', ']', ',', ';', '+', '-', '*', '/', '%', '=', '<', '>', '!', '|', '&', '^', '~', '?'].includes(char)) {
        if (current) tokens.push(current);
        tokens.push(char);
        current = '';
        continue;
      }

      if (/\s/.test(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current) tokens.push(current);
    return tokens.filter(t => t.length > 0);
  }

  private isProtectedToken(token: string): boolean {
    return isCommentToken(token, this.dialect) ||
      token.startsWith("'") ||
      token.startsWith('"') ||
      token.startsWith('`') ||
      (this.dialect === 'postgresql' && /^(\$\$|\$[A-Za-z_][A-Za-z0-9_]*\$)/.test(token));
  }

  /**
   * Group multi-word keywords into single clause tokens so that "LEFT JOIN",
   * "GROUP BY", "UNION ALL" and friends are never split across lines.
   */
  private groupTokens(tokens: string[], keywords: Set<string>): SqlToken[] {
    const result: SqlToken[] = [];
    const up = (index: number) => (index < tokens.length && !this.isProtectedToken(tokens[index]) ? tokens[index].toUpperCase() : '');
    const previousUpper = () => {
      const previous = result[result.length - 1];
      return previous ? previous.text.toUpperCase() : '';
    };

    // True between ON DUPLICATE KEY UPDATE and the end of the statement, where VALUES(col) is a
    // function call and not the start of a row list.
    let inOnDuplicate = false;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const upper = up(i);

      if (!upper) {
        result.push({ text: token, clause: false });
        continue;
      }

      if (upper === ';') inOnDuplicate = false;

      // [NATURAL] [LEFT|RIGHT|FULL|INNER|CROSS] [OUTER] JOIN
      let j = i;
      if (up(j) === 'NATURAL') j++;
      if (['LEFT', 'RIGHT', 'FULL', 'INNER', 'CROSS'].includes(up(j))) {
        j++;
        if (up(j) === 'OUTER') j++;
      }
      if (up(j) === 'JOIN') {
        result.push({ text: tokens.slice(i, j + 1).join(' '), clause: true });
        i = j;
        continue;
      }

      if ((upper === 'GROUP' || upper === 'ORDER') && up(i + 1) === 'BY') {
        result.push({ text: `${token} ${tokens[i + 1]}`, clause: true });
        i++;
        continue;
      }

      if (upper === 'UNION' || upper === 'INTERSECT' || upper === 'EXCEPT') {
        const modifier = up(i + 1);
        if (modifier === 'ALL' || modifier === 'DISTINCT') {
          result.push({ text: `${token} ${tokens[i + 1]}`, clause: true });
          i++;
        } else {
          result.push({ text: token, clause: true });
        }
        continue;
      }

      // INSERT ... ON CONFLICT: only an ON that is directly followed by CONFLICT.
      if (upper === 'ON' && up(i + 1) === 'CONFLICT' && keywords.has('CONFLICT')) {
        result.push({ text: `${token} ${tokens[i + 1]}`, clause: true });
        i++;
        continue;
      }

      // MySQL INSERT ... ON DUPLICATE KEY UPDATE col = VALUES(col), ...
      if (upper === 'ON' && up(i + 1) === 'DUPLICATE' && up(i + 2) === 'KEY' && up(i + 3) === 'UPDATE') {
        result.push({ text: tokens.slice(i, i + 4).join(' '), clause: true });
        inOnDuplicate = true;
        i += 3;
        continue;
      }

      if ((upper === 'INSERT' || upper === 'REPLACE') && up(i + 1) === 'INTO') {
        result.push({ text: `${token} ${tokens[i + 1]}`, clause: true });
        i++;
        continue;
      }

      if (upper === 'INSERT' && INSERT_MODIFIERS.includes(up(i + 1)) && up(i + 2) === 'INTO') {
        result.push({ text: tokens.slice(i, i + 3).join(' '), clause: true });
        i += 2;
        continue;
      }

      if (upper === 'DELETE' && up(i + 1) === 'FROM') {
        result.push({ text: `${token} ${tokens[i + 1]}`, clause: true });
        i++;
        continue;
      }

      const previous = previousUpper();
      const atStatementStart = previous === '' || previous === ';' || previous === '(';
      const isClause =
        upper === 'SELECT' ||
        upper === 'WHERE' ||
        upper === 'HAVING' ||
        upper === 'LIMIT' ||
        upper === 'OFFSET' ||
        (upper === 'VALUES' && !inOnDuplicate) ||
        (upper === 'FROM' && previous !== 'DISTINCT') ||
        (upper === 'UPDATE' && !['KEY', 'DO', 'FOR', 'OF', 'ON'].includes(previous)) ||
        (upper === 'SET' && !['ALTER', 'DELETE', 'CHARACTER'].includes(previous) &&
          !(previous === 'UPDATE' && i >= 2 && up(i - 2) === 'ON')) ||
        (upper === 'WITH' && atStatementStart) ||
        (upper === 'RETURNING' && keywords.has('RETURNING'));

      result.push({ text: token, clause: isClause });
    }

    return result;
  }

  format(sql: string): string {
    if (!sql.trim()) return '';

    const keywords = this.getAllKeywords();
    const tokens = this.groupTokens(this.tokenize(sql), keywords);
    const indentUnit = ' '.repeat(this.options.indentSize);
    const maxLength = this.options.maxLineLength;
    const leadingComma = this.options.commaPosition === 'before';

    // Clauses whose comma-separated items go on their own line (when there is more than one).
    const listClauses = new Set(['SELECT', 'SET', 'VALUES', 'RETURNING', 'ON DUPLICATE KEY UPDATE']);

    interface Frame {
      sub: boolean;
      level: number;
      clause: string;
      list: boolean;
      pendingBreak: boolean;
    }

    let out = '';
    let lineStart = true;
    let lineLevel = 0;
    let newStatement = false;
    // Set after INSERT INTO / CREATE TABLE: the first "(" that follows the table name is a column
    // list and gets a space before it ("users (id)"). Consumed by that "(" or by any clause/AS.
    let tableParen: 'insert' | 'create' | null = null;
    let afterCast = false;
    let statementFirstWord = '';
    // ALTER TABLE name action, action, ...: one action per line once there is more than one.
    let alterActions = false;
    let alterName: 'none' | 'expected' | 'reading' | 'done' = 'none';
    // Where a "," or ";" that follows a line comment is inserted, so it does not end up inside
    // the comment: the end of the text before the run of comments, or -1.
    let beforeLineComment = -1;
    let commentRunStart = -1;
    let previous: SqlToken | null = null;
    let previousPrevious: SqlToken | null = null;
    const stack: Frame[] = [{ sub: true, level: 0, clause: '', list: false, pendingBreak: false }];
    const top = () => stack[stack.length - 1];

    const newline = (level: number) => {
      out = out.replace(/[ \t]+$/, '');
      if (out && !out.endsWith('\n')) out += '\n';
      out += indentUnit.repeat(Math.max(0, level));
      lineStart = true;
      lineLevel = Math.max(0, level);
    };

    const currentLineLength = () => out.length - (out.lastIndexOf('\n') + 1);

    const emit = (text: string, spaceBefore: boolean) => {
      if (afterCast) spaceBefore = false;
      afterCast = false;
      if (spaceBefore && !lineStart && out && !/[\s([]$/.test(out)) out += ' ';
      out += text;
      lineStart = false;
    };

    const keywordText = (text: string) =>
      this.options.uppercaseKeywords
        ? text.split(/\s+/).map(word => word.toUpperCase()).join(' ')
        : text.split(/\s+/).join(' ');

    const isMultiItemList = (start: number) => {
      let depth = 0;
      for (let j = start + 1; j < tokens.length; j++) {
        const t = tokens[j];
        if (t.clause && depth === 0) return false;
        if (t.text === '(' || t.text === '[') depth++;
        else if (t.text === ')' || t.text === ']') {
          if (depth === 0) return false;
          depth--;
        } else if (t.text === ';') return false;
        else if (t.text === ',' && depth === 0) return true;
      }
      return false;
    };

    const isTableParen = (frame: Frame) => tableParen !== null && stack.length === 1 && frame === stack[0];

    // The name before "(" is a table, key or index name rather than a function: REFERENCES t (id),
    // KEY idx (col), ADD INDEX idx (col), CREATE INDEX idx ON t USING btree (col).
    const isNamedColumnList = (frame: Frame) => {
      const before = previousPrevious && !this.isProtectedToken(previousPrevious.text)
        ? previousPrevious.text.toUpperCase()
        : '';
      if (before === 'REFERENCES' || before === 'KEY' || before === 'INDEX') return true;
      return (before === 'ON' || before === 'USING') && statementFirstWord === 'CREATE' && frame === stack[0] && frame.clause === '';
    };

    const spaceBeforeParen = (frame: Frame) => {
      if (!previous) return false;
      if (previous.clause) return true;
      if (previous.text === '(' || previous.text === '[') return false;
      if (this.isProtectedToken(previous.text)) {
        // Quoted table names: INSERT INTO "users" (id), CREATE TABLE `t` (...).
        return /^["`]/.test(previous.text) && (isTableParen(frame) || isNamedColumnList(frame));
      }
      const upper = previous.text.toUpperCase();
      if (/^[A-Za-z_][A-Za-z0-9_$]*$/.test(previous.text)) {
        if (keywords.has(upper)) return !TYPE_OR_FUNCTION_LIKE.has(upper);
        return isTableParen(frame) || isNamedColumnList(frame);
      }
      if (previous.text.endsWith('.')) return false;
      if (/[A-Za-z0-9_$]$/.test(previous.text)) {
        // Qualified names such as schema.func or t.col.
        return isTableParen(frame) || isNamedColumnList(frame);
      }
      return true;
    };

    // Where a line that got too long continues: one level deeper than the items of a list, so a
    // wrapped column definition does not look like the next column.
    const wrapLevel = (frame: Frame) =>
      frame.level + 1 + (frame.list || (alterActions && stack.length === 1) ? 1 : 0);

    const isQuotedIdentifier = (value: string) => value.startsWith('`') || value.startsWith('"');
    // `db`.`table`, t.`col` and `t`.col are one qualified name: no space on either side of the dot.
    const continuesQualifiedName = (value: string) => {
      if (!previous || previous.clause) return false;
      if (isQuotedIdentifier(value)) return !this.isProtectedToken(previous.text) && previous.text.endsWith('.');
      return value.startsWith('.') && isQuotedIdentifier(previous.text);
    };

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const text = tok.text;
      const upper = text.toUpperCase();
      const frame = top();
      const isComment = isCommentToken(text, this.dialect);

      if (newStatement) {
        alterActions = false;
        alterName = 'none';
        out = out.trimEnd() + '\n\n';
        lineStart = true;
        lineLevel = 0;
        newStatement = false;
        tableParen = null;
        afterCast = false;
        statementFirstWord = '';
        stack.length = 1;
        stack[0] = { sub: true, level: 0, clause: '', list: false, pendingBreak: false };
        previous = null;
        previousPrevious = null;
      }

      if (isComment) {
        const commentLevel = frame.list || frame.pendingBreak ? frame.level + 1 : frame.sub ? lineLevel : frame.level;
        if (commentRunStart === -1) commentRunStart = out.trimEnd().length;
        if (!text.startsWith('/*')) beforeLineComment = commentRunStart;
        if (out) newline(commentLevel);
        out += text;
        lineStart = false;
        newline(commentLevel);
        continue;
      }
      const afterLineComment = beforeLineComment;
      beforeLineComment = -1;
      commentRunStart = -1;
      // Attach closing punctuation to the previous token, or put it before a preceding line comment.
      const attach = (punctuation: string) => {
        if (afterLineComment > 0) {
          out = out.slice(0, afterLineComment) + punctuation + out.slice(afterLineComment);
        } else if (afterLineComment === 0) {
          out += punctuation;
          lineStart = false;
        } else {
          out = out.trimEnd() + punctuation;
          lineStart = false;
        }
      };

      if (!statementFirstWord && !this.isProtectedToken(text)) statementFirstWord = upper;

      // Start of the first item of a multi-item SELECT/SET/VALUES list.
      if (frame.pendingBreak && !tok.clause) {
        const isModifier = upper === 'DISTINCT' || upper === 'ALL' ||
          (upper === 'ON' && previous?.text.toUpperCase() === 'DISTINCT') ||
          (text === '(' && previous?.text.toUpperCase() === 'ON' && previousPrevious?.text.toUpperCase() === 'DISTINCT');
        if (!isModifier) {
          frame.pendingBreak = false;
          frame.list = true;
          newline(frame.level + 1);
        }
      }

      // First action of a multi-action ALTER TABLE: the first word after the (possibly qualified
      // or quoted) table name.
      if (alterName === 'expected' && !['IF', 'EXISTS', 'ONLY'].includes(upper)) {
        alterName = 'reading';
      } else if (alterName === 'reading' && !text.startsWith('.') && !previous?.text.endsWith('.')) {
        alterName = 'done';
        if (stack.length === 1 && !tok.clause && /^[A-Za-z_]/.test(text) && isMultiItemList(i)) {
          alterActions = true;
          newline(1);
        }
      }

      if (this.isProtectedToken(text)) {
        const isPrefixedString = text.startsWith("'") && previous && /^(E|N|X|B)$/i.test(previous.text);
        const glued = isPrefixedString || continuesQualifiedName(text);
        if (maxLength > 0 && !lineStart && currentLineLength() + text.length + 1 > maxLength && !glued) {
          newline(wrapLevel(frame));
        }
        emit(text, !glued);
      } else if (tok.clause) {
        const inlineFrame = !frame.sub;
        if (inlineFrame) {
          emit(keywordText(text), true);
        } else {
          newline(frame.level);
          emit(keywordText(text), false);
          const name = keywordText(text).toUpperCase();
          frame.clause = name;
          frame.list = false;
          frame.pendingBreak = listClauses.has(name) && isMultiItemList(i);
          tableParen = /^(INSERT|REPLACE)( \w+)? INTO$/.test(name) ? 'insert' : null;
        }
      } else if (text === '(') {
        const next = tokens[i + 1];
        const nextUpper = next && !this.isProtectedToken(next.text) ? next.text.toUpperCase() : '';
        const isSubquery = next?.clause === true && (nextUpper === 'SELECT' || nextUpper === 'WITH');
        emit('(', spaceBeforeParen(frame));
        // CREATE TABLE name ( ... ): one column or constraint per line when there is more than one.
        const columnList = !isSubquery && tableParen === 'create' && stack.length === 1 && frame === stack[0] &&
          isMultiItemList(i);
        tableParen = null;
        if (columnList) {
          stack.push({ sub: true, level: 0, clause: '', list: false, pendingBreak: true });
        } else {
          stack.push({
            sub: isSubquery,
            level: lineLevel + 1,
            clause: '',
            list: false,
            pendingBreak: false,
          });
        }
      } else if (text === ')') {
        const closing = stack.length > 1 ? stack.pop()! : null;
        if (closing?.sub) {
          newline(closing.level - 1);
          out += ')';
          lineStart = false;
        } else {
          attach(')');
        }
      } else if (text === '[') {
        const spaced = !(previous && (/^[A-Za-z_][A-Za-z0-9_$]*$/.test(previous.text) || previous.text === ')' || previous.text === ']' || this.isProtectedToken(previous.text)));
        emit('[', spaced);
      } else if (text === ']') {
        attach(']');
      } else if (text === ',' && alterActions && stack.length === 1) {
        if (leadingComma) {
          newline(1);
          out += ',';
          lineStart = false;
        } else {
          attach(',');
          newline(1);
        }
      } else if (text === ',') {
        const breaksList = frame.sub && (frame.list || (frame.clause === 'WITH'));
        if (breaksList && leadingComma) {
          newline(frame.clause === 'WITH' ? frame.level : frame.level + 1);
          out += ',';
          lineStart = false;
        } else if (breaksList) {
          attach(',');
          newline(frame.clause === 'WITH' ? frame.level : frame.level + 1);
        } else {
          attach(',');
          if (afterLineComment === -1) out += ' ';
        }
      } else if (text === ';') {
        attach(';');
        newStatement = true;
      } else {
        const isKeyword = keywords.has(upper) && /^[A-Za-z_][A-Za-z0-9_$]*$/.test(text);
        const display = isKeyword && this.options.uppercaseKeywords ? upper : text;
        const afterQualifier = previous?.text.endsWith('.') && !previous.clause && text === '*';
        const isCast = text === '::';
        if (maxLength > 0 && !lineStart && !afterCast && /^[A-Za-z0-9_]/.test(display) && currentLineLength() + display.length + 1 > maxLength) {
          newline(wrapLevel(frame));
        }
        emit(display, !afterQualifier && !isCast && !continuesQualifiedName(text));
        if (isCast) afterCast = true;
        if (upper === 'TABLE' && statementFirstWord === 'CREATE') tableParen = 'create';
        if (upper === 'TABLE' && statementFirstWord === 'ALTER' && alterName === 'none') alterName = 'expected';
        if (upper === 'AS' && tableParen !== null) tableParen = null;
      }

      previousPrevious = previous;
      previous = tok;
    }

    return out.trim();
  }


  minify(sql: string): string {
    if (!sql.trim()) return '';
    const tokens = this.tokenize(sql).filter(token => !isCommentToken(token, this.dialect));
    const keywords = this.getAllKeywords();
    const isQuotedIdentifier = (value: string) => value.startsWith('`') || value.startsWith('"');
    let result = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const previousToken = tokens[i - 1];
      const noSpaceBefore = [')', ']', ',', ';'].includes(token);
      const noSpaceAfterPrevious = previousToken === '(' || previousToken === '[';
      const prefixedString = token.startsWith("'") && previousToken && /^(E|N|X|B)$/i.test(previousToken);
      // `db`.`table` stays one qualified name.
      const qualifiedName = previousToken !== undefined && (
        (isQuotedIdentifier(token) && !this.isProtectedToken(previousToken) && previousToken.endsWith('.')) ||
        (token.startsWith('.') && isQuotedIdentifier(previousToken)));
      const afterQualifier = token === '*' && previousToken !== undefined &&
        !this.isProtectedToken(previousToken) && previousToken.endsWith('.');
      // MySQL only reads name(...) as a function call when there is no space before "(".
      const callParen = token === '(' && previousToken !== undefined && (
        /^[A-Za-z_][A-Za-z0-9_$.]*$/.test(previousToken) || previousToken.startsWith('`')) &&
        (!keywords.has(previousToken.toUpperCase()) || TYPE_OR_FUNCTION_LIKE.has(previousToken.toUpperCase()));
      if (result && !noSpaceBefore && !noSpaceAfterPrevious && !prefixedString && !qualifiedName &&
        !afterQualifier && !callParen) result += ' ';
      result += token;
    }
    return result.trim();
  }
}


export const DEFAULT_SQL = `SELECT u.id, u.email, u.created_at, p.first_name, p.last_name, COUNT(o.id) as order_count, SUM(o.total) as lifetime_value
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' AND u.created_at >= '2024-01-01'
GROUP BY u.id, u.email, u.created_at, p.first_name, p.last_name
HAVING COUNT(o.id) > 0
ORDER BY lifetime_value DESC
LIMIT 100;`;
