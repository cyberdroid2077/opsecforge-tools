import {
  MAX_TEXT_FILE_BYTES,
  ToolError,
  decodeText,
  formatBytes,
  looksBinary,
  readRegularFile,
} from '../fsutil';
import { locateRedactions, type Location } from '../locate';
import type { SanitizerFinding } from '../../../../lib/safe-share-sanitizer';

export const LOCAL_ONLY_NOTICE =
  'OpsecForge: the original values were read and redacted inside the local MCP server process. They did not leave this machine and are not part of this response.';

export const HEURISTIC_NOTICE =
  'Redaction is heuristic: it can miss custom or unexpected secret formats, so review the result before sharing it.';

const MAX_LISTED_LOCATIONS = 100;

export const describeRange = (location: Location) => {
  if (location.unterminated) return `L${location.startLine} to end of input`;
  return location.endLine > location.startLine
    ? `L${location.startLine}-${location.endLine}`
    : `L${location.startLine}`;
};

export function summarizeFindings(findings: SanitizerFinding[]): string[] {
  return findings.map((finding) => `  ${finding.kind}: ${finding.count}`);
}

export function summarizeLocations(locations: Location[]): string[] {
  const lines = locations
    .slice(0, MAX_LISTED_LOCATIONS)
    .map((location) => `  ${describeRange(location)}  ${location.kind}`);
  if (locations.length > MAX_LISTED_LOCATIONS) {
    lines.push(`  ... and ${locations.length - MAX_LISTED_LOCATIONS} more`);
  }
  return lines;
}

export async function redactFile(args: { path: string }): Promise<string> {
  const { absolutePath, bytes } = await readRegularFile(args.path, MAX_TEXT_FILE_BYTES);
  if (looksBinary(bytes)) {
    throw new ToolError(
      `This looks like a binary file (it contains NUL bytes), so it was not processed: ${absolutePath}`,
    );
  }
  const { text, hadInvalidUtf8 } = decodeText(bytes);
  const lineCount = text === '' ? 0 : text.split('\n').length;
  const result = locateRedactions(text);

  const lines: string[] = [LOCAL_ONLY_NOTICE, HEURISTIC_NOTICE, ''];
  lines.push(`File: ${absolutePath} (${formatBytes(bytes.length)}, ${lineCount} lines)`);
  if (hadInvalidUtf8) {
    lines.push('Note: the file is not valid UTF-8; invalid bytes were replaced before redaction.');
  }
  if (result.findings.length === 0) {
    lines.push('Findings: none of the known patterns matched (this is not proof the file is clean).');
  } else {
    lines.push(`Findings: ${result.findings.reduce((sum, f) => sum + f.count, 0)} redaction(s)`);
    lines.push('By type:', ...summarizeFindings(result.findings));
    if (result.locations.length > 0) {
      lines.push('Where (line numbers refer to the original file):', ...summarizeLocations(result.locations));
    }
  }
  lines.push('', '----- redacted content -----', result.output, '----- end of redacted content -----');
  return lines.join('\n');
}

export function redactText(args: { text: string }): string {
  if (typeof args.text !== 'string') throw new ToolError('"text" must be a string.');
  const bytes = Buffer.byteLength(args.text, 'utf8');
  if (bytes > MAX_TEXT_FILE_BYTES) {
    throw new ToolError(
      `Text is too large: ${formatBytes(bytes)} (limit ${formatBytes(MAX_TEXT_FILE_BYTES)}).`,
    );
  }
  const result = locateRedactions(args.text);
  const lines: string[] = [
    'OpsecForge: redacted copy for sharing outward (issues, tickets, commit messages, chat).',
    'Reminder: the text you passed to this tool was already in the model context. This tool does not remove it from there; it only produces a safer copy. To keep a secret out of the context, use redact_file with a path instead.',
    HEURISTIC_NOTICE,
    '',
  ];
  if (result.findings.length === 0) {
    lines.push('Findings: none of the known patterns matched (this is not proof the text is clean).');
  } else {
    lines.push(`Findings: ${result.findings.reduce((sum, f) => sum + f.count, 0)} redaction(s)`);
    lines.push('By type:', ...summarizeFindings(result.findings));
    if (result.locations.length > 0) {
      lines.push('Where (line numbers refer to the input text):', ...summarizeLocations(result.locations));
    }
  }
  lines.push('', '----- redacted text -----', result.output, '----- end of redacted text -----');
  return lines.join('\n');
}
