export const REDACTION_MARKER = '[REDACTED]';

export type SanitizerFinding = {
  kind: string;
  count: number;
};

export type SanitizerResult = {
  output: string;
  findings: SanitizerFinding[];
};

const alreadyRedacted = (value: string) =>
  /\[(?:REDACTED|MASKED)\]|<redacted>|\*{4,}/i.test(value);

const isSensitiveName = (name: string) => {
  const normalized = name.toLowerCase();

  if (
    /(?:^|[_.-])public[_.-]?key(?:$|[_.-])/.test(normalized) ||
    /(?:^|[_.-])key[_.-]?(?:id|name|type)(?:$|[_.-])/.test(normalized) ||
    /(?:^|[_.-])token[_.-]?(?:endpoint|type|url)(?:$|[_.-])/.test(normalized) ||
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

const redactScalar = (rawValue: string) => {
  const leading = rawValue.match(/^\s*/)?.[0] ?? '';
  const value = rawValue.slice(leading.length);

  if (!value || alreadyRedacted(value)) {
    return rawValue;
  }

  if (value[0] === '"' || value[0] === "'") {
    const quote = value[0];
    const closingQuote = value.lastIndexOf(quote);
    if (closingQuote > 0) {
      return `${leading}${quote}${REDACTION_MARKER}${quote}${value.slice(closingQuote + 1)}`;
    }
  }

  const suffixMatch = value.match(/(\s*(?:[,;]\s*)?(?:#.*|\/\/.*)?)$/);
  const suffix = suffixMatch?.[0] ?? '';
  return `${leading}${REDACTION_MARKER}${suffix}`;
};

export function sanitizeForSharing(input: string): SanitizerResult {
  if (!input) {
    return { output: '', findings: [] };
  }

  const counts = new Map<string, number>();
  const record = (kind: string) => counts.set(kind, (counts.get(kind) ?? 0) + 1);
  let output = input;

  output = output.replace(
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    (match) => {
      if (alreadyRedacted(match)) return match;
      record('Private key block');
      return `-----BEGIN PRIVATE KEY-----\n${REDACTION_MARKER}\n-----END PRIVATE KEY-----`;
    },
  );

  output = output.replace(
    /(["'])([A-Za-z_][A-Za-z0-9_.-]*)\1(\s*:\s*)(["'])((?:\\.|[^\\])*?)\4/g,
    (match, keyQuote: string, key: string, separator: string, valueQuote: string, value: string) => {
      if (!isSensitiveName(key) || alreadyRedacted(value)) return match;
      record('Sensitive named field');
      return `${keyQuote}${key}${keyQuote}${separator}${valueQuote}${REDACTION_MARKER}${valueQuote}`;
    },
  );

  output = output
    .split(/\n/)
    .map((line) => {
      const match = line.match(
        /^(\s*(?:export\s+)?)(["']?)([A-Za-z_][A-Za-z0-9_.-]*)\2(\s*[:=]\s*)(.*)$/,
      );
      if (!match || !isSensitiveName(match[3]) || alreadyRedacted(match[5])) {
        return line;
      }

      record('Sensitive named field');
      return `${match[1]}${match[2]}${match[3]}${match[2]}${match[4]}${redactScalar(match[5])}`;
    })
    .join('\n');

  const trackedReplace = (
    pattern: RegExp,
    kind: string,
    replacement: (...args: string[]) => string,
  ) => {
    output = output.replace(pattern, (...args) => {
      const match = args[0] as string;
      if (alreadyRedacted(match)) return match;
      record(kind);
      return replacement(...(args as string[]));
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
