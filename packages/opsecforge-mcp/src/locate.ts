import {
  REDACTION_MARKER,
  sanitizeForSharing,
  type SanitizerFinding,
} from '../../../lib/safe-share-sanitizer';

/**
 * lib/safe-share-sanitizer reports WHAT it redacted (kind + count) but not WHERE. This module adds
 * line numbers and masked previews without duplicating any detection rule: it runs the sanitizer
 * on the whole text, then aligns input lines with output lines to find the lines that changed.
 */

export type Location = {
  /** 1-based first line (in the input) of the redacted region. */
  startLine: number;
  /** 1-based last line of the region (equals startLine for a single-line redaction). */
  endLine: number;
  kind: string;
  /** Masked previews of the values found in this region. Never contains a whole value. */
  previews: string[];
  /** True when a private key block had no END line and was masked to the end of the text. */
  unterminated: boolean;
};

export type LocatedRedaction = {
  output: string;
  findings: SanitizerFinding[];
  locations: Location[];
};

/** Values shorter than this are never partially shown: 4 characters would be too large a share. */
const MIN_LENGTH_FOR_PREVIEW = 20;

export function maskPreview(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < MIN_LENGTH_FOR_PREVIEW) return '…';
  return `${Array.from(trimmed).slice(0, 4).join('')}…`;
}

const PRIVATE_BEGIN = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/;
const PRIVATE_END = /-----END (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/;

/* ------------------------------------------------------------------------------------------ */
/* Line diff (Myers). Hunks say which input lines the sanitizer rewrote and what they became.   */
/* ------------------------------------------------------------------------------------------ */

type Hunk = { aStart: number; aEnd: number; bStart: number; bEnd: number };

/** Cap on the edit distance; beyond it the whole differing middle becomes one region. */
const MAX_EDIT_DISTANCE = 2000;

function myersEdits(a: number[], b: number[]): { del: Uint8Array; ins: Uint8Array } | null {
  const n = a.length;
  const m = b.length;
  const del = new Uint8Array(n);
  const ins = new Uint8Array(m);
  if (n === 0 && m === 0) return { del, ins };
  const max = Math.min(n + m, MAX_EDIT_DISTANCE);
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  const trace: Int32Array[] = [];

  let found = -1;
  for (let d = 0; d <= max && found < 0; d += 1) {
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) x = v[offset + k + 1];
      else x = v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x += 1;
        y += 1;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        found = d;
        break;
      }
    }
  }
  if (found < 0) return null;

  let x = n;
  let y = m;
  for (let d = found; d > 0; d -= 1) {
    const previous = trace[d]; // snapshot of v after round d-1; index = k + d + 1
    const k = x - y;
    const useInsert = k === -d || (k !== d && previous[k - 1 + d + 1] < previous[k + 1 + d + 1]);
    const previousK = useInsert ? k + 1 : k - 1;
    const previousX = previous[previousK + d + 1];
    const previousY = previousX - previousK;
    while (x > previousX && y > previousY) {
      x -= 1;
      y -= 1;
    }
    if (x === previousX) ins[previousY] = 1;
    else del[previousX] = 1;
    x = previousX;
    y = previousY;
  }
  return { del, ins };
}

function diffHunks(a: string[], b: string[]): Hunk[] {
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const aMid = a.slice(prefix, a.length - suffix);
  const bMid = b.slice(prefix, b.length - suffix);
  if (aMid.length === 0 && bMid.length === 0) return [];

  const ids = new Map<string, number>();
  const toIds = (lines: string[]) =>
    lines.map((line) => {
      let id = ids.get(line);
      if (id === undefined) {
        id = ids.size;
        ids.set(line, id);
      }
      return id;
    });
  const edits = myersEdits(toIds(aMid), toIds(bMid));
  if (!edits) {
    return [{ aStart: prefix, aEnd: prefix + aMid.length, bStart: prefix, bEnd: prefix + bMid.length }];
  }

  const hunks: Hunk[] = [];
  let i = 0;
  let j = 0;
  while (i < aMid.length || j < bMid.length) {
    if (i < aMid.length && j < bMid.length && !edits.del[i] && !edits.ins[j]) {
      i += 1;
      j += 1;
      continue;
    }
    const aStart = i;
    const bStart = j;
    while (i < aMid.length && edits.del[i]) i += 1;
    while (j < bMid.length && edits.ins[j]) j += 1;
    if (i === aStart && j === bStart) {
      // Defensive: cannot happen for a valid edit script; never loop forever.
      i += 1;
      j += 1;
    }
    hunks.push({ aStart: prefix + aStart, aEnd: prefix + i, bStart: prefix + bStart, bEnd: prefix + j });
  }
  return hunks;
}

/** Original substrings that the sanitizer replaced with the marker on one changed line. */
function extractReplacedValues(before: string, after: string): string[] | null {
  const segments = after.split(REDACTION_MARKER);
  if (segments.length < 2) return null;
  if (!before.startsWith(segments[0])) return null;

  const values: string[] = [];
  let position = segments[0].length;
  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index];
    const isLast = index === segments.length - 1;
    let end: number;
    if (isLast) {
      if (!before.endsWith(segment) || before.length - segment.length < position) return null;
      end = before.length - segment.length;
    } else {
      if (segment === '') return null; // adjacent markers: boundary is ambiguous
      end = before.indexOf(segment, position);
      if (end === -1) return null;
    }
    values.push(before.slice(position, end));
    position = end + segment.length;
  }
  return values.filter((value) => value !== REDACTION_MARKER && value.trim() !== '');
}

const kindsOf = (findings: SanitizerFinding[]) => findings.map((finding) => finding.kind);

export function locateRedactions(input: string): LocatedRedaction {
  const whole = sanitizeForSharing(input);
  if (whole.output === input) {
    return { output: whole.output, findings: whole.findings, locations: [] };
  }

  const a = input.split('\n');
  const b = whole.output.split('\n');
  const locations: Location[] = [];

  const pairLocation = (lineIndex: number, before: string, after: string): Location => {
    const lineKinds = kindsOf(sanitizeForSharing(before).findings);
    return {
      startLine: lineIndex + 1,
      endLine: lineIndex + 1,
      kind: lineKinds.length > 0 ? lineKinds.join(', ') : 'Sensitive value (context-dependent)',
      previews: (extractReplacedValues(before, after) ?? []).map(maskPreview),
      unterminated: false,
    };
  };
  /** True when this input line, sanitized on its own, becomes exactly this one output line. */
  const isSingleLineChange = (before: string, after: string) =>
    before !== after && sanitizeForSharing(before).output === after;

  for (const hunk of diffHunks(a, b)) {
    let { aStart: start, aEnd: end, bStart: startOut, bEnd: endOut } = hunk;

    // A key block whose BEGIN/END lines survive unchanged: widen the region to the whole block.
    if (start > 0 && start < end && PRIVATE_BEGIN.test(a[start - 1]) && !PRIVATE_BEGIN.test(a[start])) {
      start -= 1;
      startOut -= 1;
      if (end < a.length && PRIVATE_END.test(a[end])) {
        end += 1;
        endOut += 1;
      }
    }

    const di = end - start;
    const dj = endOut - startOut;
    const asBlock = di !== dj || (di > 0 && PRIVATE_BEGIN.test(a[start]));
    if (!asBlock) {
      for (let k = 0; k < di; k += 1) {
        if (a[start + k] !== b[startOut + k]) locations.push(pairLocation(start + k, a[start + k], b[startOut + k]));
      }
      continue;
    }

    // A merged region can hold ordinary one-line redactions next to a multi-line block:
    // peel those off both ends so each keeps its own line number and preview.
    let s0 = start;
    let o0 = startOut;
    let e0 = end;
    let oe0 = endOut;
    while (s0 < e0 && o0 < oe0 && isSingleLineChange(a[s0], b[o0])) {
      locations.push(pairLocation(s0, a[s0], b[o0]));
      s0 += 1;
      o0 += 1;
    }
    const tail: Location[] = [];
    while (e0 > s0 && oe0 > o0 && isSingleLineChange(a[e0 - 1], b[oe0 - 1])) {
      tail.unshift(pairLocation(e0 - 1, a[e0 - 1], b[oe0 - 1]));
      e0 -= 1;
      oe0 -= 1;
    }
    if (s0 < e0) {
      const blockFindings = sanitizeForSharing(a.slice(s0, e0).join('\n')).findings;
      locations.push({
        startLine: s0 + 1,
        endLine: e0,
        kind: blockFindings.length > 0 ? kindsOf(blockFindings).join(', ') : 'Sensitive value (multi-line)',
        // Multi-line regions never get a preview: they may be key material or wrapped values.
        previews: [],
        unterminated: blockFindings.some((finding) => finding.unterminated),
      });
    }
    locations.push(...tail);
  }

  return { output: whole.output, findings: whole.findings, locations };
}
