export const REDACTION_MARKER = '[REDACTED]';

export type SanitizerFinding = {
  kind: string;
  count: number;
};

export type SanitizerResult = {
  output: string;
  findings: SanitizerFinding[];
};

/**
 * A value counts as "already redacted" only when the WHOLE value is the canonical placeholder this
 * tool emits (optionally wrapped in matching quotes). Partial masks such as `pa****word` or
 * `xx[REDACTED]yy` are untrusted input and are redacted like any other value.
 */
const isCanonicalPlaceholder = (value: string) => {
  const trimmed = value.trim();
  return (
    trimmed === REDACTION_MARKER ||
    trimmed === `"${REDACTION_MARKER}"` ||
    trimmed === `'${REDACTION_MARKER}'`
  );
};

/** Splits camelCase / PascalCase / acronym boundaries with underscores: `APIKey` -> `API_Key`. */
const splitCamelCase = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2');

const isSensitiveName = (name: string) => {
  const normalized = splitCamelCase(name).toLowerCase();

  if (
    /(?:^|[_.-])public[_.-]?key(?:$|[_.-])/.test(normalized) ||
    /(?:^|[_.-])key[_.-]?(?:id|name|type)(?:$|[_.-])/.test(normalized) ||
    /(?:^|[_.-])token[_.-]?(?:endpoint|type|url)(?:$|[_.-])/.test(normalized) ||
    /(?:^|[_.-])token[_.-]?(?:count|limit|ttl|expires?|expiry|expiration|lifetime|length|size)(?:$|[_.-])/.test(
      normalized,
    ) ||
    /(?:^|[_.-])(?:key|token|secret)[_.-]?(?:hint|example)(?:$|[_.-])/.test(normalized)
  ) {
    return false;
  }

  return (
    /(?:^|[_.-])(?:password|passwd|pwd|secret|token|api[_.-]?key|access[_.-]?key|private[_.-]?key|client[_.-]?secret)(?:$|[_.-])/.test(
      normalized,
    ) || /(?:^|[_.-])key$/.test(normalized)
  );
};

/**
 * Trailing text that is not part of an unquoted value: a separator (`,` / `;`) and/or a comment.
 * A comment only starts after whitespace, so `abc#def` and `abc//def` are entirely secret.
 */
const UNQUOTED_SUFFIX = /(?:\s+(?:#|\/\/).*|\s*[,;]\s*(?:(?:#|\/\/).*)?|\s+)?$/;

const redactScalar = (rawValue: string) => {
  const leading = rawValue.match(/^\s*/)?.[0] ?? '';
  const value = rawValue.slice(leading.length);

  if (!value || isCanonicalPlaceholder(value)) {
    return rawValue;
  }

  if (value[0] === '"' || value[0] === "'") {
    const quote = value[0];
    const closingQuote = value.lastIndexOf(quote);
    if (closingQuote > 0) {
      return `${leading}${quote}${REDACTION_MARKER}${quote}${value.slice(closingQuote + 1)}`;
    }
  }

  const suffix = value.match(UNQUOTED_SUFFIX)?.[0] ?? '';
  return `${leading}${REDACTION_MARKER}${suffix}`;
};

/** YAML block scalar header: `|`, `>`, with optional chomping / indentation indicators + comment. */
const BLOCK_SCALAR_HEADER = /^[|>](?:[+-]?\d?|\d[+-])(?:\s+#.*)?$/;

const leadingWhitespace = (line: string) => line.match(/^\s*/)?.[0].length ?? 0;

const NAMED_LINE = /^(\s*(?:-\s+)*(?:export\s+)?)(["']?)([A-Za-z_][A-Za-z0-9_.-]*)\2(\s*[:=]\s*)(.*)$/;

const PRIVATE_KEY_BLOCK =
  /-----BEGIN ((?:[A-Z0-9]+ )*)PRIVATE KEY( BLOCK)?-----[\s\S]*?-----END \1PRIVATE KEY\2-----/g;

const isRedactedPrivateKeyBody = (block: string) => {
  const body = block
    .replace(/^-----BEGIN [^\n-]*-----/, '')
    .replace(/-----END [^\n-]*-----$/, '');
  return body.trim() === REDACTION_MARKER;
};

export function sanitizeForSharing(input: string): SanitizerResult {
  if (!input) {
    return { output: '', findings: [] };
  }

  const counts = new Map<string, number>();
  const record = (kind: string) => counts.set(kind, (counts.get(kind) ?? 0) + 1);
  let output = input;

  // PEM, OpenSSH and PGP private key blocks (RSA/EC/DSA/OPENSSH/ENCRYPTED/PGP ... PRIVATE KEY).
  output = output.replace(PRIVATE_KEY_BLOCK, (match) => {
    if (isRedactedPrivateKeyBody(match)) return match;
    record('Private key block');
    return `-----BEGIN PRIVATE KEY-----\n${REDACTION_MARKER}\n-----END PRIVATE KEY-----`;
  });

  output = output.replace(
    /(["'])([A-Za-z_][A-Za-z0-9_.-]*)\1(\s*:\s*)(["'])((?:\\.|[^\\])*?)\4/g,
    (match, keyQuote: string, key: string, separator: string, valueQuote: string, value: string) => {
      if (!isSensitiveName(key) || value === REDACTION_MARKER) return match;
      record('Sensitive named field');
      return `${keyQuote}${key}${keyQuote}${separator}${valueQuote}${REDACTION_MARKER}${valueQuote}`;
    },
  );

  output = redactNamedLines(output, () => record('Sensitive named field'));

  const trackedReplace = (
    pattern: RegExp,
    kind: string,
    replacement: (...args: string[]) => string,
  ) => {
    output = output.replace(pattern, (...args) => {
      const match = args[0] as string;
      const next = replacement(...(args as string[]));
      // Re-running the tool over its own output must be a no-op and must not count as a finding.
      if (next === match) return match;
      record(kind);
      return next;
    });
  };

  trackedReplace(
    /((?:Authorization|Proxy-Authorization)\s*:\s*(?:Bearer|Basic)\s+)[^'"\s\\]+/gi,
    'Authorization credential',
    (_match, prefix) => `${prefix}${REDACTION_MARKER}`,
  );
  trackedReplace(
    /((?:X-Api-Key|Api-Key)\s*:\s*)[^'"\s\\]+/gi,
    'API key header',
    (_match, prefix) => `${prefix}${REDACTION_MARKER}`,
  );
  trackedReplace(
    /((?:Cookie|Set-Cookie)\s*:\s*)[^'"\r\n\\]+/gi,
    'Cookie header',
    (_match, prefix) => `${prefix}${REDACTION_MARKER}`,
  );
  trackedReplace(
    /((?:--user|-u)\s+["']?[^:\s"']+:)[^"'\s]+/g,
    'cURL user credential',
    (_match, prefix) => `${prefix}${REDACTION_MARKER}`,
  );
  trackedReplace(
    /([?&](?:access_token|refresh_token|api[_-]?key|client_secret|password|passwd|pwd|token|secret)=)[^&#\s'"]+/gi,
    'Sensitive query parameter',
    (_match, prefix) => `${prefix}${REDACTION_MARKER}`,
  );
  trackedReplace(
    /(\b[a-z][a-z0-9+.-]*:\/\/[^:\s/@]+:)[^@\s/]+(@)/gi,
    'URL credential',
    (_match, prefix, suffix) => `${prefix}${REDACTION_MARKER}${suffix}`,
  );
  trackedReplace(
    /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    'AWS access key ID',
    () => REDACTION_MARKER,
  );
  trackedReplace(
    /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
    'Stripe secret key',
    () => REDACTION_MARKER,
  );
  trackedReplace(
    /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
    'GitHub token',
    () => REDACTION_MARKER,
  );
  // --- Vendor token formats (kept conservative: fixed prefix + long, restricted-alphabet body) ---
  // Anthropic: sk-ant-api03-..., sk-ant-admin01-...
  trackedReplace(
    /\bsk-ant-[A-Za-z0-9_-]{20,}(?![A-Za-z0-9_-])/g,
    'Anthropic API key',
    () => REDACTION_MARKER,
  );
  // OpenAI: sk-proj-... / sk-svcacct-... / sk-admin-... and the legacy sk-<48 alphanumerics>.
  trackedReplace(
    /\bsk-(?:(?:proj|svcacct|admin)-[A-Za-z0-9_-]{20,}|[A-Za-z0-9]{32,})(?![A-Za-z0-9_-])/g,
    'OpenAI API key',
    () => REDACTION_MARKER,
  );
  // Google API key: "AIza" + 35 URL-safe characters (39 in total).
  trackedReplace(
    /\bAIza[0-9A-Za-z_-]{35}(?![0-9A-Za-z_-])/g,
    'Google API key',
    () => REDACTION_MARKER,
  );
  // Slack: xoxb- (bot), xoxp- (user), xoxo-, xoxa- (app), xoxs- (session).
  trackedReplace(
    /\bxox[bpoas]-[0-9A-Za-z-]{10,}(?![0-9A-Za-z-])/g,
    'Slack token',
    () => REDACTION_MARKER,
  );
  // GitLab personal / project / group access tokens.
  trackedReplace(
    /\bglpat-[0-9A-Za-z_-]{20,}(?![0-9A-Za-z_-])/g,
    'GitLab token',
    () => REDACTION_MARKER,
  );
  // GitHub fine-grained personal access tokens.
  trackedReplace(
    /\bgithub_pat_[0-9A-Za-z_]{22,}(?![0-9A-Za-z_])/g,
    'GitHub fine-grained token',
    () => REDACTION_MARKER,
  );
  // SendGrid: "SG." + 22 + "." + 43 URL-safe characters.
  trackedReplace(
    /\bSG\.[0-9A-Za-z_-]{22}\.[0-9A-Za-z_-]{43}(?![0-9A-Za-z_-])/g,
    'SendGrid API key',
    () => REDACTION_MARKER,
  );
  trackedReplace(
    /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    'JWT-like token',
    () => REDACTION_MARKER,
  );

  return {
    output,
    findings: Array.from(counts, ([kind, count]) => ({ kind, count })),
  };
}

/**
 * Line-oriented pass for `NAME=value`, `name: value`, `export NAME=value` and `- name: value`.
 * Handles values that span lines so that no continuation line is left behind:
 *  - YAML block scalars (`password: |`, `key: >-`): the whole indented block is replaced;
 *  - quoted values whose closing quote is on a later line.
 */
function redactNamedLines(text: string, onRedact: () => void): string {
  const pieces = text.split(/(\r?\n)/);
  const lines: string[] = [];
  const eols: string[] = [];
  for (let i = 0; i < pieces.length; i += 2) {
    lines.push(pieces[i]);
    eols.push(pieces[i + 1] ?? '');
  }

  let result = '';
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(NAMED_LINE);

    if (!match || !isSensitiveName(match[3]) || isCanonicalPlaceholder(match[5])) {
      result += line + eols[i];
      continue;
    }

    const [, prefix, nameQuote, name, separator, rawValue] = match;
    const head = `${prefix}${nameQuote}${name}${nameQuote}${separator}`;
    const value = rawValue.trim();

    // YAML block scalar: replace every continuation line with a single placeholder line.
    if (BLOCK_SCALAR_HEADER.test(value)) {
      const baseIndent = prefix.length;
      let last = -1;
      for (let j = i + 1; j < lines.length; j += 1) {
        if (lines[j].trim() === '') continue;
        if (leadingWhitespace(lines[j]) <= baseIndent) break;
        last = j;
      }
      if (last === -1) {
        result += line + eols[i];
        continue;
      }
      const blockText = lines
        .slice(i + 1, last + 1)
        .map((l) => l.trim())
        .join('')
        .trim();
      if (blockText === REDACTION_MARKER) {
        result += lines.slice(i, last + 1).map((l, k) => l + eols[i + k]).join('');
        i = last;
        continue;
      }
      const firstContent = lines.slice(i + 1, last + 1).find((l) => l.trim() !== '') ?? '';
      const indent = firstContent.slice(0, leadingWhitespace(firstContent));
      onRedact();
      result += line + eols[i] + indent + REDACTION_MARKER + eols[last];
      i = last;
      continue;
    }

    // Quoted value whose closing quote is on a later line (multi-line .env / config values).
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.lastIndexOf(quote) === 0) {
      let close = -1;
      for (let j = i + 1; j < lines.length; j += 1) {
        if (lines[j].includes(quote)) {
          close = j;
          break;
        }
      }
      if (close !== -1) {
        const closing = lines[close];
        const rest = closing.slice(closing.lastIndexOf(quote) + 1);
        onRedact();
        result += `${head}${quote}${REDACTION_MARKER}${quote}${rest}${eols[close]}`;
        i = close;
        continue;
      }
    }

    const redacted = `${head}${redactScalar(rawValue)}`;
    if (redacted !== line) onRedact();
    result += redacted + eols[i];
  }

  return result;
}
