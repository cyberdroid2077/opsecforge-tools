import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const title = 'opsecforge-mcp: Local MCP Server to Redact Secrets';
const description =
  'A local stdio MCP server and Claude Code plugin that keeps .env files and keys out of agent context: redact files, scan commits, verify webhooks. Heuristic; read the limitations.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.opsecforge.com/agents' },
  keywords: ['MCP server redact secrets', 'keep .env out of Claude Code', 'opsecforge-mcp', 'Claude Code plugin secrets', 'Codex MCP', 'Cursor MCP'],
  openGraph: {
    title: 'opsecforge-mcp | OpsecForge',
    description,
    url: 'https://www.opsecforge.com/agents',
    type: 'website',
  },
};

const tools: Array<[string, string]> = [
  ['redact_file', 'Reads a local text file and returns it with secrets replaced by [REDACTED], plus a findings summary (type, count, line numbers). Original values are never returned.'],
  ['scan_secrets', 'Pre-commit check of files, directories, or the staged git diff; lists file:line, secret type and a masked preview, never the original value.'],
  ['redact_text', 'Redacts text the agent already has, to produce a safer copy to share outward. It cannot remove that text from the model context.'],
  ['verify_webhook', 'Verifies a GitHub, Stripe or generic HMAC webhook signature offline; the secret is read only from a named environment variable, and a mismatch comes with diagnostics.'],
  ['inspect_jwt', 'Decodes a JWT and returns header, claims, time-claim status and risk notes. Decoding is not verification; the signature is never checked.'],
  ['file_checksum', 'SHA-256 or SHA-512 of a local file (up to 32 MiB), optionally compared with an expected value.'],
];

const related: Array<[string, string, string]> = [
  ['/tools/env-sanitizer', 'Safe-to-Share Sanitizer', 'browser-local heuristic redaction of .env, logs and headers'],
  ['/tools/webhook-debugger', 'Webhook Signature Verifier', 'check a body, secret and signature in the browser'],
  ['/tools/jwt-decoder', 'JWT Decoder', 'decode a token header and payload in the browser'],
  ['/tools/hash-generator', 'File Checksum & Hash Generator', 'compare a local file with a trusted checksum'],
];

const pluginInstall = `/plugin marketplace add cyberdroid2077/opsecforge-tools
/plugin install opsecforge@opsecforge`;

const mcpOnly = 'claude mcp add opsecforge -- npx -y opsecforge-mcp';

const codexToml = `[mcp_servers.opsecforge]
command = "npx"
args = ["-y", "opsecforge-mcp"]`;

const cursorJson = `{
  "mcpServers": {
    "opsecforge": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "opsecforge-mcp"]
    }
  }
}`;

const denyRules = '{ "permissions": { "deny": ["Read(./.env)", "Read(./.env.local)", "Read(**/*.pem)", "Read(~/.ssh/**)"] } }';

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
      <code>{children}</code>
    </pre>
  );
}

export default function AgentsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-slate-950 p-6 text-slate-300 lg:p-24">
      <div className="w-full max-w-3xl">
        <Link href="/" className="mb-12 inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-emerald-400">
          <ArrowLeft size={16} /> Back to Hub
        </Link>
        <h1 className="mb-8 text-4xl font-bold text-slate-100">opsecforge-mcp: keep secrets out of AI agent context</h1>
        <div className="prose prose-invert prose-slate max-w-none lg:prose-lg">
          <p className="text-xl text-slate-400">
            <code>opsecforge-mcp</code> is a local MCP server (stdio) for AI coding agents such as Claude Code, Codex and Cursor. The agent passes a file path or an environment variable name, the work happens on your machine, and only redacted or derived results come back. It makes no network requests, needs no account or API key, and has no telemetry. Redaction is heuristic, so read the limitations below before relying on it.
          </p>
          <p>
            It is MIT-licensed, published on npm (version 0.1.1) and listed in the official MCP Registry as <code>io.github.cyberdroid2077/opsecforge</code>. It reuses the code that powers the browser tools on this site. Requires Node.js 20 or newer.
          </p>

          <h2 className="text-slate-100">Tools</h2>
          <p>Every tool is read-only and runs locally.</p>
          <ul>
            {tools.map(([name, text]) => (
              <li key={name}>
                <code>{name}</code>: {text}
              </li>
            ))}
          </ul>

          <h2 className="text-slate-100">Install</h2>
          <h3 className="text-slate-100">Claude Code: plugin (MCP server + guard hook + skill)</h3>
          <Code>{pluginInstall}</Code>
          <p>
            The plugin adds the MCP server, a <code>PreToolUse</code> hook that blocks <code>Read</code>, <code>Grep</code> and <code>Bash</code> calls that would directly read <code>.env</code>, <code>*.pem</code>, <code>*.key</code>, <code>id_rsa*</code>, <code>id_ed25519*</code>, <code>credentials</code>, <code>*.p12</code> and similar files (<code>.env.example</code>, <code>.env.sample</code>, <code>.env.template</code> and <code>*.pub</code> are allowed), and a skill that tells the agent which tool to use when. The hook&apos;s <code>onFailure: &quot;block&quot;</code> setting needs a recent Claude Code (v2.1.295 or later according to the hooks documentation); on older versions a hook that times out may be skipped instead of blocking.
          </p>
          <h3 className="text-slate-100">Claude Code: MCP server only</h3>
          <Code>{mcpOnly}</Code>
          <h3 className="text-slate-100">Codex</h3>
          <p>Add to <code>~/.codex/config.toml</code>:</p>
          <Code>{codexToml}</Code>
          <p>Or: <code>codex mcp add opsecforge -- npx -y opsecforge-mcp</code>.</p>
          <h3 className="text-slate-100">Cursor</h3>
          <p>Add to <code>.cursor/mcp.json</code> (project) or <code>~/.cursor/mcp.json</code> (global):</p>
          <Code>{cursorJson}</Code>
          <p>
            <code>verify_webhook</code> and <code>inspect_jwt</code> read secrets from environment variables by name; the variable must exist in the environment of the MCP server process. Do not paste the secret into chat. Optionally set <code>OPSECFORGE_MCP_ROOTS</code> to a path-delimiter-separated list of directories and the file tools refuse paths outside them.
          </p>

          <h2 id="limitations" className="text-slate-100">Limitations</h2>
          <ul>
            <li>The hook is a best-effort guard, not a sandbox. It parses the text of tool calls and does not stop a script from reading a secret file indirectly (for example <code>python app.py</code> that opens <code>.env</code>, <code>make</code>, <code>docker compose config</code>), <code>grep -r</code> over a directory containing a <code>.env</code>, or commands that build file names from shell variables or command output.</li>
            <li>
              For stronger protection, combine it with Claude Code&apos;s own controls: its sandbox and <code>Read</code> deny rules in <code>settings.json</code>, for example the following. Deny rules also have gaps and can produce prompts or false positives; test them.
              <Code>{denyRules}</Code>
            </li>
            <li>Redaction is heuristic and can miss secrets: custom token formats, secrets inside prose, base64-wrapped values, or values split across lines in unusual ways. It can also redact harmless values. Treat a clean result as &ldquo;nothing matched&rdquo;, not &ldquo;nothing there&rdquo;, and review output before sharing it.</li>
            <li>Parameters and results of every MCP tool pass through the model. <code>redact_text</code>, and <code>inspect_jwt</code> with <code>token</code>, cannot keep what you hand them out of the context.</li>
            <li>Codex and Cursor have no equivalent of the Claude Code <code>PreToolUse</code> hook, so there the tools are advisory: they only help if the agent chooses to call them instead of reading a file directly.</li>
            <li>Redacted output still contains everything that was not matched (hostnames, usernames, internal URLs, personal data).</li>
            <li><code>scan_secrets</code> is not a replacement for a dedicated scanner with a maintained rule set in CI.</li>
            <li>If a secret has already reached a model context, a log or a commit, rotate it.</li>
          </ul>

          <h2 className="text-slate-100">Links</h2>
          <ul>
            <li><a href="https://www.npmjs.com/package/opsecforge-mcp" rel="noopener">opsecforge-mcp on npm</a></li>
            <li><a href="https://github.com/cyberdroid2077/opsecforge-tools/tree/main/packages/opsecforge-mcp" rel="noopener">Source on GitHub</a> (MIT)</li>
          </ul>
          <h3 className="text-slate-100">Related browser tools on this site</h3>
          <ul>
            {related.map(([href, name, text]) => (
              <li key={href}>
                <Link href={href}>{name}</Link>: {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
