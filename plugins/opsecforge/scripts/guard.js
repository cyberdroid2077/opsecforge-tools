#!/usr/bin/env node
'use strict';

/**
 * OpsecForge PreToolUse guard for Claude Code (Read | Grep | Bash).
 *
 * Refuses to let the model read well-known secret files directly (.env, *.pem, *.key, id_rsa, ...)
 * and points it at the OpsecForge MCP tool that returns a redacted copy instead.
 *
 * This is a best-effort guard, NOT a sandbox. It parses text only: it cannot see what a script
 * reads, what `grep -r` walks into, or what a variable expands to. See the package README.
 *
 * Contract (https://code.claude.com/docs/en/hooks): the hook receives JSON on stdin.
 *   exit 0            -> allow
 *   exit 2 + stderr   -> block; stderr is shown to the model
 * Any failure of this script itself blocks (fail closed). Ordinary files never hit that path.
 *
 * No dependencies: only Node built-ins, so it works from the plugin cache as-is.
 */

const fs = require('node:fs');
const path = require('node:path');

const REDACT_TOOL = 'mcp__plugin_opsecforge_opsecforge__redact_file';

/* ------------------------------------------------------------------------------------------ */
/* Which file names are secret                                                                 */
/* ------------------------------------------------------------------------------------------ */

const ALLOW_SUFFIX = /\.(?:example|sample|template)$/i;
const ALLOW_PUBLIC_KEY = /\.pub$/i;

const DENY_PATTERNS = [
  /^\.env(?:\..+)?$/i, // .env, .env.local, .env.production, ...
  /^\.envrc$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.jks$/i,
  /\.keystore$/i,
  /\.ppk$/i,
  /^id_(?:rsa|dsa|ecdsa|ed25519)(?:[._-].*)?$/i, // id_rsa, id_ed25519, id_rsa_work, id_rsa.bak
  /^credentials(?:\.json)?$/i, // ~/.aws/credentials, credentials.json
  /^\.netrc$/i,
  /^\.pgpass$/i,
  /^\.git-credentials$/i,
  /^\.htpasswd$/i,
];

/** Representative names used to decide whether a glob such as `.env*` or `*.pem` could match. */
const SAMPLE_SECRET_NAMES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.envrc',
  'server.pem',
  'private.key',
  'cert.p12',
  'cert.pfx',
  'store.jks',
  'id_rsa',
  'id_ed25519',
  'id_ecdsa',
  'credentials',
  'credentials.json',
  '.netrc',
  '.pgpass',
  '.git-credentials',
];

function isSecretBaseName(name) {
  if (!name) return false;
  if (ALLOW_SUFFIX.test(name) || ALLOW_PUBLIC_KEY.test(name)) return false;
  return DENY_PATTERNS.some((pattern) => pattern.test(name));
}

const GLOB_CHARS = /[*?[\]{}]/;

function globToRegExp(glob) {
  let source = '';
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === '*') source += '.*';
    else if (ch === '?') source += '.';
    else if (ch === '[') {
      const close = glob.indexOf(']', i + 1);
      if (close === -1) source += '\\[';
      else {
        let cls = glob.slice(i + 1, close).replace(/\\/g, '\\\\');
        if (cls.startsWith('!')) cls = `^${cls.slice(1)}`;
        source += `[${cls}]`;
        i = close;
      }
    } else if (ch === '{') {
      const close = glob.indexOf('}', i + 1);
      if (close === -1) source += '\\{';
      else {
        const alternatives = glob
          .slice(i + 1, close)
          .split(',')
          .map((alt) => alt.replace(/[.+^$()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.'));
        source += `(?:${alternatives.join('|')})`;
        i = close;
      }
    } else source += ch.replace(/[.+^$()|\\\]}]/g, '\\$&');
  }
  return new RegExp(`^${source}$`, 'i');
}

/** A glob (as used by `grep --include`, the Grep tool's glob or a shell word) that could name a secret file. */
function globCouldMatchSecret(glob) {
  const base = glob.split('/').filter(Boolean).pop() || '';
  if (!GLOB_CHARS.test(base)) return isSecretBaseName(base);
  const literal = base.replace(/[*?[\]{}]/g, '');
  if (literal.replace(/[,!^-]/g, '').length < 3) return false; // `*`, `*.t*`, `?` and friends: too broad to judge
  let regexp;
  try {
    regexp = globToRegExp(base);
  } catch {
    return false;
  }
  return SAMPLE_SECRET_NAMES.some((sample) => regexp.test(sample));
}

/** Strips quoting residue and shell prefixes from a path-like token. */
function cleanPathToken(token) {
  let value = token.trim();
  value = value.replace(/^file:\/\//, '');
  // $HOME/x, ${HOME}/x, ~/x: only the final component matters here.
  value = value.replace(/\/+$/, '');
  return value;
}

function isSecretPath(token) {
  if (typeof token !== 'string' || token === '') return false;
  const value = cleanPathToken(token);
  if (value === '') return false;
  const base = path.basename(value);
  if (GLOB_CHARS.test(base)) return globCouldMatchSecret(base);
  if (isSecretBaseName(base)) return true;
  // A symlink with an innocent name that points at a secret file.
  if (!/[$`*?]/.test(value)) {
    try {
      if (fs.lstatSync(value).isSymbolicLink()) {
        return isSecretBaseName(path.basename(fs.realpathSync(value)));
      }
    } catch {
      // missing file or no permission: nothing to resolve
    }
  }
  return false;
}

/* ------------------------------------------------------------------------------------------ */
/* Bash command parsing                                                                        */
/* ------------------------------------------------------------------------------------------ */

/**
 * Splits a command line into simple commands (arrays of words). Handles single/double quotes,
 * backslashes, `; & | ( ) newline` and backtick/`$(` boundaries, and drops redirection targets
 * of output redirects. `<` redirects are kept as a pair ['<', target] so inputs can be checked.
 */
function tokenize(command) {
  const commands = [];
  let words = [];
  let word = '';
  let inWord = false;

  const pushWord = () => {
    if (inWord) words.push(word);
    word = '';
    inWord = false;
  };
  const pushCommand = () => {
    pushWord();
    if (words.length > 0) commands.push(words);
    words = [];
  };

  let i = 0;
  const n = command.length;
  while (i < n) {
    const ch = command[i];
    if (ch === "'") {
      const end = command.indexOf("'", i + 1);
      const stop = end === -1 ? n : end;
      word += command.slice(i + 1, stop);
      inWord = true;
      i = stop + 1;
    } else if (ch === '"') {
      inWord = true;
      i += 1;
      while (i < n && command[i] !== '"') {
        if (command[i] === '\\' && i + 1 < n) {
          word += command[i + 1];
          i += 2;
        } else {
          word += command[i];
          i += 1;
        }
      }
      i += 1;
    } else if (ch === '\\') {
      if (i + 1 < n) {
        word += command[i + 1];
        inWord = true;
      }
      i += 2;
    } else if (ch === ' ' || ch === '\t') {
      pushWord();
      i += 1;
    } else if (ch === '\n' || ch === ';' || ch === '(' || ch === ')' || ch === '`' || ch === '{' || ch === '}') {
      // `{` and `}` only separate when they stand alone as words (`{ cat .env; }`); inside a word
      // (brace expansion such as .env{,.bak}) they are literal.
      if ((ch === '{' || ch === '}') && (inWord || (i + 1 < n && !/\s/.test(command[i + 1])))) {
        word += ch;
        inWord = true;
        i += 1;
      } else {
        pushCommand();
        i += 1;
      }
    } else if (ch === '|' || ch === '&') {
      if (ch === '&' && command[i + 1] === '>') {
        // &> file / &>> file: output redirect
        pushWord();
        words.push('>');
        i += command[i + 2] === '>' ? 3 : 2;
        continue;
      }
      pushCommand();
      i += command[i + 1] === ch || command[i + 1] === '&' ? 2 : 1;
    } else if (ch === '<' || ch === '>') {
      // A leading file-descriptor digit belongs to the redirect, not to a word.
      if (inWord && /^\d+$/.test(word)) {
        word = '';
        inWord = false;
      }
      pushWord();
      if (ch === '>') {
        let j = i + 1;
        if (command[j] === '>' || command[j] === '|') j += 1;
        if (command[j] === '&') j += 1;
        words.push('>');
        i = j;
      } else if (command[i + 1] === '<') {
        // here-doc / here-string: not a file read
        const here = command[i + 2] === '<' ? 3 : 2;
        words.push('<<');
        i += here;
      } else {
        words.push('<');
        i += 1;
      }
    } else {
      word += ch;
      inWord = true;
      i += 1;
    }
  }
  pushCommand();
  return commands;
}

/** Removes output-redirect pairs and returns [cleanWords, inputRedirectTargets]. */
function splitRedirects(words) {
  const clean = [];
  const inputs = [];
  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    if (w === '>') {
      i += 1; // skip the target
    } else if (w === '<') {
      if (i + 1 < words.length) inputs.push(words[i + 1]);
      i += 1;
    } else if (w === '<<') {
      i += 1; // skip the here-doc delimiter / here-string text
    } else {
      clean.push(w);
    }
  }
  return [clean, inputs];
}

const READERS = new Set([
  'cat', 'head', 'tail', 'less', 'more', 'sed', 'awk', 'gawk', 'mawk', 'nawk', 'grep', 'egrep', 'fgrep',
  'rg', 'ag', 'ack', 'source', '.', 'cp', 'base64', 'bat', 'batcat', 'nl', 'tac', 'od', 'xxd', 'hexdump',
  'strings', 'cut', 'sort', 'uniq', 'diff', 'cmp', 'paste', 'fold', 'rev', 'openssl', 'jq', 'yq', 'column',
  'fmt', 'expand', 'zcat', 'scp', 'rsync', 'curl', 'wget', 'gpg', 'shasum', 'sha1sum', 'sha256sum',
  'sha512sum', 'md5sum',
]);

/** `git <sub> ... <path>` subcommands that print file content or history of a path. */
const GIT_READ_SUBCOMMANDS = new Set([
  'show', 'diff', 'log', 'blame', 'annotate', 'grep', 'cat-file', 'difftool', 'whatchanged', 'stash',
]);

/** Interpreters whose inline code (-c / -e) is scanned for quoted secret-file names. */
const INTERPRETERS = /^(?:python[0-9.]*|node|nodejs|deno|bun|ruby|perl|php)$/;
const INLINE_CODE_FLAGS = new Set(['-c', '-e', '-p', '-r', '--eval', '--print', '--command']);

/** Options that name files to SKIP, not to read: `grep --exclude=.env` must not be a hit. */
const EXCLUDE_OPTIONS = new Set([
  '--exclude', '--exclude-dir', '--exclude-from', '--ignore-file', '--ignore', '--glob-ignore',
]);

const OPTIONS_WITH_VALUE = {
  sudo: new Set(['-u', '-g', '-h', '-p', '-C', '-D', '-R', '-T', '-U']),
  env: new Set(['-u', '-C', '-S']),
  nice: new Set(['-n']),
  timeout: new Set(['-s', '-k']),
  stdbuf: new Set(['-i', '-o', '-e']),
};

const WRAPPERS = new Set(['sudo', 'doas', 'env', 'command', 'builtin', 'exec', 'time', 'nohup', 'nice', 'ionice', 'stdbuf', 'timeout', 'xargs', 'setsid', 'chronic']);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish']);
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

function check(token) {
  return isSecretPath(token) ? token : null;
}

/** Returns the offending path token if this simple command reads a secret file, else null. */
function analyzeSimpleCommand(rawWords, depth) {
  const [words, redirectInputs] = splitRedirects(rawWords);

  for (const target of redirectInputs) {
    const hit = check(target);
    if (hit) return hit;
  }

  let index = 0;
  while (index < words.length && ASSIGNMENT.test(words[index])) index += 1;
  // `export A=b`/`local` style prefixes do not read files.
  if (index >= words.length) return null;

  // Peel wrappers (sudo, env, time, nice, ...) down to the real program.
  for (let guard = 0; guard < 8 && index < words.length; guard += 1) {
    const program = path.basename(words[index]);
    if (!WRAPPERS.has(program)) break;
    index += 1;
    const withValue = OPTIONS_WITH_VALUE[program] || new Set();
    while (index < words.length) {
      const w = words[index];
      if (w === '--') {
        index += 1;
        break;
      }
      if (w.startsWith('-') && w.length > 1) {
        index += withValue.has(w) ? 2 : 1;
      } else if (program === 'env' && ASSIGNMENT.test(w)) {
        index += 1;
      } else if ((program === 'timeout' || program === 'nice') && /^[0-9.]+[smhd]?$/.test(w)) {
        index += 1;
      } else {
        break;
      }
    }
    if (program === 'xargs') {
      // `xargs cat` reads names from stdin: nothing to inspect, but the remainder may be explicit.
      continue;
    }
  }
  if (index >= words.length) return null;

  const program = path.basename(words[index]);
  const args = words.slice(index + 1);

  // Shells and eval: look inside the command string.
  if (SHELLS.has(program)) {
    const dashC = args.findIndex((a) => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(a));
    if (dashC !== -1 && args[dashC + 1] !== undefined) {
      return analyzeCommandString(args[dashC + 1], depth + 1);
    }
    // `bash script.sh` / `bash .env`: the file itself is read by the shell.
    for (const a of args) {
      if (!a.startsWith('-')) {
        const hit = check(a);
        if (hit) return hit;
        break;
      }
    }
    return null;
  }
  if (program === 'eval') {
    return analyzeCommandString(args.join(' '), depth + 1);
  }

  if (program === 'git') {
    let sub = null;
    for (let i = 0; i < args.length; i += 1) {
      if (args[i] === '-C' || args[i] === '-c' || args[i] === '--git-dir' || args[i] === '--work-tree') i += 1;
      else if (!args[i].startsWith('-')) {
        sub = args[i];
        break;
      }
    }
    if (sub && GIT_READ_SUBCOMMANDS.has(sub)) {
      for (const a of args) {
        if (a.startsWith('-')) continue;
        const hit = check(a.includes(':') ? a.slice(a.lastIndexOf(':') + 1) : a);
        if (hit) return hit;
      }
    }
    return null;
  }

  if (INTERPRETERS.test(program)) {
    for (let i = 0; i < args.length - 1; i += 1) {
      if (!INLINE_CODE_FLAGS.has(args[i])) continue;
      for (const literal of args[i + 1].matchAll(/(["'])((?:(?!\1)[^\\\n])+)\1/g)) {
        if (!/\s/.test(literal[2]) && isSecretPath(literal[2])) return literal[2];
      }
    }
    return null;
  }

  if (!READERS.has(program)) return null;

  // cp/rsync/scp: only the sources are read. `cp .env.example .env` writes .env and must pass.
  if (program === 'cp' || program === 'rsync' || program === 'scp') {
    const positional = [];
    let targetDirectoryGiven = false;
    for (let i = 0; i < args.length; i += 1) {
      const a = args[i];
      if (a === '-t' || a === '--target-directory') {
        targetDirectoryGiven = true;
        i += 1;
        continue;
      }
      if (a.startsWith('--target-directory=')) {
        targetDirectoryGiven = true;
        continue;
      }
      if (a.startsWith('-')) continue;
      positional.push(a);
    }
    const sources = targetDirectoryGiven ? positional : positional.slice(0, -1);
    for (const source of sources) {
      const hit = check(source.replace(/^[^:/]+:/, ''));
      if (hit) return hit;
    }
    return null;
  }

  for (const a of args) {
    if (a.startsWith('-')) {
      // --file=.env, -f.env, --data-binary=@.env
      const eq = a.indexOf('=');
      if (eq !== -1 && !EXCLUDE_OPTIONS.has(a.slice(0, eq))) {
        const hit = check(a.slice(eq + 1).replace(/^@/, ''));
        if (hit) return hit;
      }
      continue;
    }
    const hit = check(a.replace(/^@/, ''));
    if (hit) return hit;
  }
  return null;
}

function analyzeCommandString(command, depth) {
  if (depth > 4) return null;
  // Command substitutions inside double quotes are invisible to the tokenizer: look inside them too.
  for (const match of command.matchAll(/\$\(([^()]*)\)|`([^`]*)`/g)) {
    const inner = match[1] !== undefined ? match[1] : match[2];
    const hit = analyzeCommandString(inner, depth + 1);
    if (hit) return hit;
  }
  for (const words of tokenize(command)) {
    const hit = analyzeSimpleCommand(words, depth);
    if (hit) return hit;
  }
  return null;
}

/* ------------------------------------------------------------------------------------------ */
/* Hook entry                                                                                  */
/* ------------------------------------------------------------------------------------------ */

function block(tool, subject) {
  const lines = [
    `OpsecForge guard: ${tool} was blocked because it would read a secret file directly (${subject}).`,
    `Do not read it with ${tool}, cat, grep or similar: the raw values would enter your context.`,
    `Use the MCP tool ${REDACT_TOOL} with {"path": "<the file>"} instead. It reads the file locally and returns the text with secrets replaced by [REDACTED], plus a findings summary.`,
    'If you only need to know which variables exist, read .env.example (or .env.sample / .env.template) instead.',
  ];
  process.stderr.write(`${lines.join('\n')}\n`);
  process.exit(2);
}

function failClosed(reason) {
  process.stderr.write(
    `OpsecForge guard: could not evaluate this tool call (${reason}), so it was blocked (fail closed). Check the plugin installation or disable the plugin if this persists.\n`,
  );
  process.exit(2);
}

function decide(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return failClosed('hook input is not a JSON object');
  }
  const tool = input.tool_name;
  if (tool !== 'Read' && tool !== 'Grep' && tool !== 'Bash') return; // not ours: allow
  const args = input.tool_input;
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return failClosed(`tool_input missing for ${tool}`);
  }

  if (tool === 'Read') {
    if (typeof args.file_path !== 'string') return failClosed('Read without file_path');
    if (isSecretPath(args.file_path)) block('Read', args.file_path);
    return;
  }

  if (tool === 'Grep') {
    if (args.path !== undefined && typeof args.path !== 'string') return failClosed('Grep path is not a string');
    if (args.glob !== undefined && typeof args.glob !== 'string') return failClosed('Grep glob is not a string');
    if (typeof args.path === 'string' && isSecretPath(args.path)) block('Grep', args.path);
    if (typeof args.glob === 'string' && args.glob.trim() !== '') {
      for (const part of args.glob.split(/\s+/)) {
        if (part && globCouldMatchSecret(part.replace(/^!/, '')) && !part.startsWith('!')) {
          block('Grep', `glob ${args.glob}`);
        }
      }
    }
    return;
  }

  // Bash
  if (typeof args.command !== 'string') return failClosed('Bash without command');
  const offender = analyzeCommandString(args.command, 0);
  if (offender) block('Bash', offender);
}

function main() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    raw += chunk;
  });
  process.stdin.on('error', () => failClosed('could not read hook input'));
  process.stdin.on('end', () => {
    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      return failClosed('hook input is not valid JSON');
    }
    try {
      decide(input);
    } catch (error) {
      return failClosed(`internal error: ${error && error.name ? error.name : 'unknown'}`);
    }
    process.exit(0);
  });
}

process.on('uncaughtException', (error) => failClosed(`internal error: ${error && error.name ? error.name : 'unknown'}`));

if (require.main === module) {
  main();
} else {
  module.exports = { isSecretPath, analyzeCommandString, globCouldMatchSecret, tokenize };
}
