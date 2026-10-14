import { constants as fsConstants } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { sanitizeForSharing } from '../../../lib/safe-share-sanitizer';

/** A failure whose message is safe and useful to show to the model. */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}

export const MAX_TEXT_FILE_BYTES = 1024 * 1024; // 1 MiB: redact_file / scan_secrets
export const MAX_BODY_BYTES = 10 * 1024 * 1024; // webhook bodies
export const MAX_CHECKSUM_FILE_BYTES = 32 * 1024 * 1024; // same ceiling as lib/file-checksum

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MiB` : `${bytes} bytes`;

export function expandPath(input: string): string {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new ToolError('A non-empty file path is required.');
  }
  if (input.includes('\0')) throw new ToolError('The path contains a NUL byte.');
  let p = input.trim();
  if (p === '~') p = os.homedir();
  else if (p.startsWith('~/')) p = path.join(os.homedir(), p.slice(2));
  return path.resolve(p);
}

/**
 * Optional hardening: OPSECFORGE_MCP_ROOTS="/a:/b" (platform path delimiter) restricts every file
 * tool to those directory trees. Unset means no restriction (the tools can read what the user can).
 */
async function assertInsideAllowedRoots(realFile: string) {
  const raw = process.env.OPSECFORGE_MCP_ROOTS;
  if (!raw) return;
  const roots = raw.split(path.delimiter).filter(Boolean);
  for (const root of roots) {
    let realRoot: string;
    try {
      realRoot = await fs.realpath(path.resolve(root));
    } catch {
      continue;
    }
    const rel = path.relative(realRoot, realFile);
    if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) return;
  }
  throw new ToolError(
    'The path is outside the directories allowed by OPSECFORGE_MCP_ROOTS for this server.',
  );
}

const describeFsError = (error: unknown, displayPath: string): ToolError => {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  switch (code) {
    case 'ENOENT':
      return new ToolError(`File not found: ${displayPath}`);
    case 'EACCES':
    case 'EPERM':
      return new ToolError(`Permission denied reading: ${displayPath}`);
    case 'EISDIR':
      return new ToolError(`Not a regular file (it is a directory): ${displayPath}`);
    case 'ELOOP':
      return new ToolError(`Too many levels of symbolic links: ${displayPath}`);
    default:
      return new ToolError(`Could not read ${displayPath}${code ? ` (${code})` : ''}.`);
  }
};

export type LoadedFile = { absolutePath: string; bytes: Buffer };

/**
 * Reads a regular file (never a directory, FIFO, socket or device) of at most `maxBytes`.
 * The size is enforced on the open handle and again on the bytes actually read, so a file that
 * grows between the checks cannot slip past the limit.
 */
export async function readRegularFile(input: string, maxBytes: number): Promise<LoadedFile> {
  const absolutePath = expandPath(input);
  let handle: fs.FileHandle | undefined;
  try {
    const first = await fs.stat(absolutePath);
    if (!first.isFile()) {
      throw new ToolError(
        `Not a regular file (directories, pipes, sockets and devices are refused): ${absolutePath}`,
      );
    }
    await assertInsideAllowedRoots(await fs.realpath(absolutePath));
    handle = await fs.open(absolutePath, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
    const stat = await handle.stat();
    if (!stat.isFile()) {
      throw new ToolError(`Not a regular file: ${absolutePath}`);
    }
    if (stat.size > maxBytes) {
      throw new ToolError(
        `File is too large: ${formatBytes(stat.size)} (limit ${formatBytes(maxBytes)}): ${absolutePath}`,
      );
    }
    const buffer = Buffer.allocUnsafe(Math.min(stat.size, maxBytes) + 1);
    let filled = 0;
    while (filled < buffer.length) {
      const { bytesRead } = await handle.read(buffer, filled, buffer.length - filled, filled);
      if (bytesRead === 0) break;
      filled += bytesRead;
    }
    if (filled > maxBytes) {
      throw new ToolError(
        `File is too large: it grew past the limit of ${formatBytes(maxBytes)}: ${absolutePath}`,
      );
    }
    return { absolutePath, bytes: buffer.subarray(0, filled) };
  } catch (error) {
    if (error instanceof ToolError) throw error;
    throw describeFsError(error, absolutePath);
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

/** True when the first 8 KiB contain a NUL byte, the usual signature of binary data. */
export const looksBinary = (bytes: Uint8Array) => bytes.subarray(0, 8192).includes(0);

export type DecodedText = { text: string; hadInvalidUtf8: boolean };

/** Decodes UTF-8 without dropping a BOM; falls back to replacement characters if invalid. */
export function decodeText(bytes: Uint8Array): DecodedText {
  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes),
      hadInvalidUtf8: false,
    };
  } catch {
    return {
      text: new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(bytes),
      hadInvalidUtf8: true,
    };
  }
}

/**
 * Environment variable NAMES only. Accepts UPPER_SNAKE_CASE (up to 64 chars) or lower_snake_case
 * (up to 40 chars). Mixed-case or long strings are what a pasted secret looks like, so they are
 * rejected without being echoed.
 */
const ENV_NAME_PATTERNS = [/^[A-Z_][A-Z0-9_]{0,63}$/, /^[a-z_][a-z0-9_]{0,39}$/];

export const looksLikeEnvName = (value: string) =>
  ENV_NAME_PATTERNS.some((pattern) => pattern.test(value)) &&
  sanitizeForSharing(value).output === value;

export function readEnvSecret(envName: string, purpose: string): string {
  if (typeof envName !== 'string' || !looksLikeEnvName(envName)) {
    throw new ToolError(
      `${purpose} must be the NAME of an environment variable (for example MY_WEBHOOK_SECRET: UPPER_SNAKE_CASE), not a secret value. The value you passed was not echoed.`,
    );
  }
  const value = process.env[envName];
  if (value === undefined || value === '') {
    throw new ToolError(
      `Environment variable ${envName} is not set (or is empty) in the MCP server's environment. Export it in the shell that starts the agent, or set it in the MCP server's "env" configuration, then restart the agent.`,
    );
  }
  return value;
}
