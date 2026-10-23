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
  'WITH', 'RECURSIVE', 'LATERAL', 'ASC', 'DESC', 'OVER', 'PARTITION'
]);

const MYSQL_KEYWORDS = new Set([
  'ENGINE', 'CHARSET', 'COLLATE', 'AUTO_INCREMENT', 'UNSIGNED', 'ZEROFILL',
  'COMMENT', 'DELIMITER', 'LIMIT', 'OFFSET'
]);

const PG_KEYWORDS = new Set([
  'RETURNING', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'UUID', 'JSON',
  'JSONB', 'ARRAY', 'ILIKE', 'SIMILAR', 'TO', 'WINDOW', 'OVER',
  'PARTITION', 'RANGE', 'ROWS', 'PRECEDING', 'FOLLOWING', 'UNBOUNDED',
  'CURRENT', 'ROW'
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
        if (current) tokens.push(current);
        current = char;
        inString = true;
        stringChar = char;
        continue;
      }

      if (inString) {
        current += char;
        if (char === stringChar && nextChar === stringChar) {
          current += nextChar;
          i++;
          continue;
        }

        let precedingBackslashes = 0;
        for (let j = i - 1; j >= 0 && sql[j] === '\\'; j--) precedingBackslashes++;
        if (char === stringChar && precedingBackslashes % 2 === 0) {
          tokens.push(current);
          current = '';
          inString = false;
        }
        continue;
      }

      const operator = [
        '->>', '#>>', '!~~*', '~~*', '!~*', '::', '->', '#>', '||', '&&',
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
    return token.startsWith('--') ||
      token.startsWith('/*') ||
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

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const upper = up(i);

      if (!upper) {
        result.push({ text: token, clause: false });
        continue;
      }

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

      if (upper === 'INSERT' && up(i + 1) === 'INTO') {
        result.push({ text: `${token} ${tokens[i + 1]}`, clause: true });
        i++;
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
        upper === 'VALUES' ||
        (upper === 'FROM' && previous !== 'DISTINCT') ||
        (upper === 'UPDATE' && !['KEY', 'DO', 'FOR', 'OF'].includes(previous)) ||
        (upper === 'SET' && previous !== 'ALTER') ||
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

    const typeOrFunctionLike = new Set([
      'VARCHAR', 'CHAR', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'TIMESTAMP', 'TIME',
      'DATETIME', 'INT', 'INTEGER', 'BIGINT', 'TEXT', 'IF', 'LEFT', 'RIGHT', 'DATE',
      'UUID', 'JSON', 'JSONB', 'ARRAY', 'BOOLEAN', 'CHECK', 'REPLACE',
    ]);
    // Clauses whose comma-separated items go on their own line (when there is more than one).
    const listClauses = new Set(['SELECT', 'SET', 'VALUES', 'RETURNING']);

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
    let rootSpaceParen = false;
    let statementFirstWord = '';
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

    const spaceBeforeParen = (frame: Frame) => {
      if (!previous) return false;
      if (previous.clause) return true;
      if (previous.text === '(' || previous.text === '[') return false;
      if (this.isProtectedToken(previous.text)) return false;
      const upper = previous.text.toUpperCase();
      if (/^[A-Za-z_][A-Za-z0-9_$]*$/.test(previous.text)) {
        if (keywords.has(upper)) return !typeOrFunctionLike.has(upper);
        return rootSpaceParen && stack.length === 1 && frame === stack[0];
      }
      if (previous.text.endsWith('.')) return false;
      if (/[A-Za-z0-9_$]$/.test(previous.text)) {
        // Qualified names such as schema.func or t.col.
        return rootSpaceParen && stack.length === 1 && frame === stack[0];
      }
      return true;
    };

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const text = tok.text;
      const upper = text.toUpperCase();
      const frame = top();
      const isComment = text.startsWith('--') || text.startsWith('/*');

      if (newStatement) {
        out = out.trimEnd() + '\n\n';
        lineStart = true;
        lineLevel = 0;
        newStatement = false;
        rootSpaceParen = false;
        statementFirstWord = '';
        stack.length = 1;
        stack[0] = { sub: true, level: 0, clause: '', list: false, pendingBreak: false };
        previous = null;
        previousPrevious = null;
      }

      if (isComment) {
        const commentLevel = frame.list || frame.pendingBreak ? frame.level + 1 : lineLevel;
        if (out) newline(commentLevel);
        out += text;
        lineStart = false;
        newline(commentLevel);
        continue;
      }

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

      if (this.isProtectedToken(text)) {
        const isPrefixedString = text.startsWith("'") && previous && /^(E|N|X|B)$/i.test(previous.text);
        if (maxLength > 0 && !lineStart && currentLineLength() + text.length + 1 > maxLength && !isPrefixedString) {
          newline(frame.level + 1);
        }
        emit(text, !isPrefixedString);
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
          if (name === 'INSERT INTO') rootSpaceParen = true;
        }
      } else if (text === '(') {
        const next = tokens[i + 1];
        const nextUpper = next && !this.isProtectedToken(next.text) ? next.text.toUpperCase() : '';
        const isSubquery = next?.clause === true && (nextUpper === 'SELECT' || nextUpper === 'WITH');
        emit('(', spaceBeforeParen(frame));
        stack.push({
          sub: isSubquery,
          level: lineLevel + 1,
          clause: '',
          list: false,
          pendingBreak: false,
        });
      } else if (text === ')') {
        const closing = stack.length > 1 ? stack.pop()! : null;
        if (closing?.sub) {
          newline(closing.level - 1);
          out += ')';
          lineStart = false;
        } else {
          out = out.trimEnd() + ')';
          lineStart = false;
        }
      } else if (text === '[') {
        const spaced = !(previous && (/^[A-Za-z_][A-Za-z0-9_$]*$/.test(previous.text) || previous.text === ')' || previous.text === ']' || this.isProtectedToken(previous.text)));
        emit('[', spaced);
      } else if (text === ']') {
        out = out.trimEnd() + ']';
        lineStart = false;
      } else if (text === ',') {
        const breaksList = frame.sub && (frame.list || (frame.clause === 'WITH'));
        if (breaksList && leadingComma) {
          newline(frame.clause === 'WITH' ? frame.level : frame.level + 1);
          out += ',';
          lineStart = false;
        } else if (breaksList) {
          out = out.trimEnd() + ',';
          newline(frame.clause === 'WITH' ? frame.level : frame.level + 1);
        } else {
          out = out.trimEnd() + ', ';
        }
      } else if (text === ';') {
        out = out.trimEnd() + ';';
        lineStart = false;
        newStatement = true;
      } else {
        const isKeyword = keywords.has(upper) && /^[A-Za-z_][A-Za-z0-9_$]*$/.test(text);
        const display = isKeyword && this.options.uppercaseKeywords ? upper : text;
        const afterQualifier = previous?.text.endsWith('.') && !previous.clause && text === '*';
        if (maxLength > 0 && !lineStart && /^[A-Za-z0-9_]/.test(display) && currentLineLength() + display.length + 1 > maxLength) {
          newline(frame.level + 1);
        }
        emit(display, !afterQualifier);
        if (upper === 'TABLE' && statementFirstWord === 'CREATE') rootSpaceParen = true;
      }

      previousPrevious = previous;
      previous = tok;
    }

    return out.trim();
  }


  minify(sql: string): string {
    if (!sql.trim()) return '';
    const tokens = this.tokenize(sql).filter(token => !token.startsWith('--') && !token.startsWith('/*'));
    let result = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const previousToken = tokens[i - 1];
      const noSpaceBefore = [')', ']', ',', ';'].includes(token);
      const noSpaceAfterPrevious = previousToken === '(' || previousToken === '[';
      const prefixedString = token.startsWith("'") && previousToken && /^(E|N|X|B)$/i.test(previousToken);
      if (result && !noSpaceBefore && !noSpaceAfterPrevious && !prefixedString) result += ' ';
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
