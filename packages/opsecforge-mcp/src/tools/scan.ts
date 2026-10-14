import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';
import {
  MAX_TEXT_FILE_BYTES,
  ToolError,
  decodeText,
  expandPath,
  looksBinary,
  readRegularFile,
} from '../fsutil';
import { locateRedactions } from '../locate';
import { HEURISTIC_NOTICE, describeRange } from './redact';

const execFileAsync = promisify(execFile);

const SKIP_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  'coverage',
  '.venv',
  'venv',
  '__pycache__',
  '.turbo',
  '.cache',
  'target',
]);
const MAX_FILES = 2000;
const MAX_REPORTED = 200;
const GIT_OUTPUT_LIMIT = 32 * 1024 * 1024;

type Hit = { file: string; line: string; kind: string; preview: string };

const displayPath = (absolute: string) => {
  const relative = path.relative(process.cwd(), absolute);
  return relative === '' || relative.startsWith('..') || path.isAbsolute(relative) ? absolute : relative;
};

type ScanStats = { scanned: number; skippedLarge: number; skippedBinary: number; skippedOther: number };

function scanTextInto(file: string, text: string, lineOffset: number, hits: Hit[]) {
  const { locations } = locateRedactions(text);
  for (const location of locations) {
    const shifted = {
      ...location,
      startLine: location.startLine + lineOffset,
      endLine: location.endLine + lineOffset,
    };
    hits.push({
      file,
      line: shifted.unterminated
        ? `${shifted.startLine}-end`
        : describeRange(shifted).replace(/^L/, ''),
      kind: location.kind,
      preview: location.previews.length > 0 ? location.previews.join(', ') : '(multi-line, not shown)',
    });
  }
}

async function collectFiles(inputs: string[], stats: ScanStats): Promise<string[]> {
  const files: string[] = [];
  const visit = async (target: string, explicit: boolean) => {
    if (files.length >= MAX_FILES) return;
    let info;
    try {
      info = await fs.lstat(target);
    } catch (error) {
      if (explicit) {
        const code = (error as NodeJS.ErrnoException).code;
        throw new ToolError(code === 'ENOENT' ? `Path not found: ${target}` : `Could not access: ${target}`);
      }
      stats.skippedOther += 1;
      return;
    }
    if (info.isSymbolicLink() && !explicit) {
      stats.skippedOther += 1; // never follow symlinks found while walking a directory
      return;
    }
    if (info.isSymbolicLink()) {
      const real = await fs.stat(target).catch(() => null);
      if (!real) throw new ToolError(`Broken symbolic link: ${target}`);
      if (real.isFile()) files.push(target);
      else await visit(await fs.realpath(target), false);
      return;
    }
    if (info.isDirectory()) {
      const entries = await fs.readdir(target, { withFileTypes: true });
      entries.sort((x, y) => x.name.localeCompare(y.name));
      for (const entry of entries) {
        if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
        await visit(path.join(target, entry.name), false);
      }
      return;
    }
    if (info.isFile()) files.push(target);
    else stats.skippedOther += 1;
  };
  for (const input of inputs) await visit(expandPath(input), true);
  return files;
}

async function scanFiles(inputs: string[], hits: Hit[], stats: ScanStats) {
  const files = await collectFiles(inputs, stats);
  for (const file of files) {
    try {
      const { bytes } = await readRegularFile(file, MAX_TEXT_FILE_BYTES);
      if (looksBinary(bytes)) {
        stats.skippedBinary += 1;
        continue;
      }
      scanTextInto(displayPath(file), decodeText(bytes).text, 0, hits);
      stats.scanned += 1;
    } catch (error) {
      const message = error instanceof ToolError ? error.message : '';
      if (message.includes('too large')) stats.skippedLarge += 1;
      else stats.skippedOther += 1;
    }
  }
}

/** Added lines of `git diff --cached`, grouped into runs of consecutive new-file lines. */
export function parseStagedDiff(diff: string): { file: string; startLine: number; lines: string[] }[] {
  const chunks: { file: string; startLine: number; lines: string[] }[] = [];
  let file: string | null = null;
  let newLine = 0;
  let current: { file: string; startLine: number; lines: string[] } | null = null;

  const unquote = (raw: string) => {
    let name = raw.trim();
    if (name.startsWith('"') && name.endsWith('"')) name = name.slice(1, -1).replace(/\\(.)/g, '$1');
    return name.replace(/\t.*$/, '');
  };

  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      file = null;
      current = null;
      continue;
    }
    if (line.startsWith('+++ ')) {
      const name = unquote(line.slice(4));
      file = name === '/dev/null' ? null : name.replace(/^b\//, '');
      current = null;
      continue;
    }
    if (line.startsWith('--- ')) continue;
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      newLine = Number.parseInt(hunk[1], 10);
      current = null;
      continue;
    }
    if (file === null) continue;
    if (line.startsWith('+')) {
      if (!current) {
        current = { file, startLine: newLine, lines: [] };
        chunks.push(current);
      }
      current.lines.push(line.slice(1));
      newLine += 1;
    } else if (line.startsWith('\\')) {
      continue; // "\ No newline at end of file"
    } else {
      current = null;
      if (line.startsWith(' ')) newLine += 1;
    }
  }
  return chunks;
}

async function scanStaged(hits: Hit[]): Promise<number> {
  let stdout: string;
  try {
    const result = await execFileAsync(
      'git',
      ['-c', 'core.quotepath=off', 'diff', '--cached', '--no-color', '--no-ext-diff', '--unified=0', '--no-renames'],
      { maxBuffer: GIT_OUTPUT_LIMIT, encoding: 'utf8', cwd: process.cwd(), windowsHide: true },
    );
    stdout = result.stdout;
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === 'ENOENT') throw new ToolError('git was not found on PATH, so staged changes cannot be scanned.');
    if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      throw new ToolError('The staged diff is too large to scan (over 32 MiB). Scan specific paths instead.');
    }
    const detail = (err.stderr ?? '').split('\n')[0]?.trim();
    throw new ToolError(
      `git diff --cached failed in ${process.cwd()}${detail ? `: ${detail}` : ''}. Is this directory a git repository?`,
    );
  }
  const chunks = parseStagedDiff(stdout);
  const filesSeen = new Set<string>();
  for (const chunk of chunks) {
    filesSeen.add(chunk.file);
    scanTextInto(chunk.file, chunk.lines.join('\n'), chunk.startLine - 1, hits);
  }
  return filesSeen.size;
}

export async function scanSecrets(args: { paths?: string[]; staged?: boolean }): Promise<string> {
  const paths = args.paths ?? [];
  const staged = args.staged === true;
  if (paths.length === 0 && !staged) {
    throw new ToolError('Provide "paths" (files or directories to scan), set "staged": true, or both.');
  }
  const hits: Hit[] = [];
  const stats: ScanStats = { scanned: 0, skippedLarge: 0, skippedBinary: 0, skippedOther: 0 };

  if (paths.length > 0) await scanFiles(paths, hits, stats);
  const fileScanCount = stats.scanned;
  const stagedCount = staged ? await scanStaged(hits) : 0;

  hits.sort((x, y) =>
    x.file === y.file ? Number.parseInt(x.line, 10) - Number.parseInt(y.line, 10) : x.file.localeCompare(y.file),
  );

  const lines: string[] = [];
  const scope = [
    paths.length > 0 ? `${fileScanCount} file(s) from paths` : null,
    staged ? `${stagedCount} file(s) with staged additions` : null,
  ]
    .filter(Boolean)
    .join(' + ');
  const skipped = [
    stats.skippedLarge ? `${stats.skippedLarge} over 1 MiB` : null,
    stats.skippedBinary ? `${stats.skippedBinary} binary` : null,
    stats.skippedOther ? `${stats.skippedOther} unreadable/other` : null,
  ].filter(Boolean);
  lines.push(
    'OpsecForge scan: original values were not returned; previews show at most the first 4 characters of long values and never any part of short ones.',
    HEURISTIC_NOTICE,
    `Scanned ${scope}${skipped.length > 0 ? `; skipped ${skipped.join(', ')}` : ''}.`,
  );
  if (paths.length === 0 && stagedCount === 0) {
    lines.push('Nothing was staged, or the staged changes add no text lines.');
  }
  if (hits.length === 0) {
    lines.push('Result: no known secret patterns found (this is not proof that nothing sensitive is present).');
  } else {
    lines.push(`Result: ${hits.length} potential secret location(s). Format: file:line  type  preview`);
    for (const hit of hits.slice(0, MAX_REPORTED)) {
      lines.push(`${hit.file}:${hit.line}  ${hit.kind}  ${hit.preview}`);
    }
    if (hits.length > MAX_REPORTED) lines.push(`... and ${hits.length - MAX_REPORTED} more not listed.`);
  }
  return lines.join('\n');
}
