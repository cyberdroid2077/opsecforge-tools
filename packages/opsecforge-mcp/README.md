# opsecforge-mcp

A **local** MCP server (stdio) for AI coding agents such as Claude Code, Codex and Cursor. It helps keep secrets out of the model context: the agent passes a **file path** or an **environment variable name**, the work happens on your machine, and only redacted or derived results come back.

- Nothing is sent to any remote service. The server makes no network requests.
- No account, no API key, no telemetry.
- Source: [github.com/cyberdroid2077/opsecforge-tools](https://github.com/cyberdroid2077/opsecforge-tools/tree/main/packages/opsecforge-mcp) (MIT). It reuses the same tested code that powers the browser tools at [opsecforge.com](https://www.opsecforge.com).

> **Read the limitations below before relying on this.** Redaction is heuristic, the Claude Code hook is a best-effort guard rather than a sandbox, and Codex and Cursor have no hook at all.

## Install

Requires Node.js 20 or newer.

### Claude Code: plugin (recommended: MCP server + guard hook + skill)

```text
/plugin marketplace add cyberdroid2077/opsecforge-tools
/plugin install opsecforge@opsecforge
```

The plugin adds three things:

1. the MCP server (`npx -y opsecforge-mcp@0.1`), exposed as `mcp__plugin_opsecforge_opsecforge__*`;
2. a `PreToolUse` hook that blocks `Read`, `Grep` and `Bash` calls that would directly read `.env`, `*.pem`, `*.key`, `id_rsa*`, `id_ed25519*`, `credentials`, `*.p12` and similar files, and tells the model to use `redact_file` instead (`.env.example`, `.env.sample`, `.env.template` and `*.pub` are allowed);
3. a skill that tells the agent which tool to use when.

The hook's `onFailure: "block"` setting needs a recent Claude Code (v2.1.295 or later according to the hooks documentation). On older versions a hook that times out may be skipped instead of blocking.

### Claude Code: MCP server only

```bash
claude mcp add opsecforge -- npx -y opsecforge-mcp
```

### Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.opsecforge]
command = "npx"
args = ["-y", "opsecforge-mcp"]
```

(or `codex mcp add opsecforge -- npx -y opsecforge-mcp`).

### Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "opsecforge": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "opsecforge-mcp"]
    }
  }
}
```

### Environment variables the tools read

`verify_webhook` and `inspect_jwt` read secrets from environment variables **by name**. The variable must exist in the environment of the MCP server process. Export it in the shell that starts the agent, or add an `env` entry to the server's configuration in your client. Do not paste the secret into chat and do not commit it.

Optional hardening: set `OPSECFORGE_MCP_ROOTS` to a path-delimiter-separated list of directories (for example `/home/me/projects`) and the file tools refuse paths outside them.

## Tools

Every tool is read-only, runs locally, and returns readable errors instead of crashing the server.

### `redact_file({ path })`

Reads a local text file and returns it with secrets replaced by `[REDACTED]`, plus a findings summary: type, count and **line numbers** (of the original file). Original values are never returned, and no part of a value is shown. The response starts with a notice that the original values did not leave the machine or reach the model.

Only regular files (no directories, pipes, devices), at most **1 MiB**; larger files fail with an explicit message. Binary files are refused. Detects, among others: private key blocks (including **unterminated** ones, which are masked from BEGIN to the end of the text), sensitive named fields (`password`, `token`, `secret`, `*_KEY`, ...), `Authorization` / cookie / API-key headers, URL credentials, AWS, Stripe, GitHub, GitLab, Slack, Google, OpenAI, Anthropic and SendGrid key formats, and JWT-shaped strings.

### `scan_secrets({ paths?, staged? })`

Pre-commit check. Scans files or directories (`paths`) and/or only the lines added in `git diff --cached` (`staged: true`). Lists `file:line`, the secret type and a masked preview: the first 4 characters for values of 20 or more characters, otherwise just `…`. Never returns an original value. Directory scans skip `.git`, `node_modules`, build output and symlinks, read at most 2000 files of at most 1 MiB, and skip binaries.

### `redact_text({ text })`

Redacts text the agent **already has**, for example before pasting logs into an issue or ticket. **That text is already in the model context**; this tool cannot take it back out. It only produces a safer copy to share outward. To keep a secret out of the context in the first place, use `redact_file` with a path.

### `verify_webhook({ provider, body_path, secret_env, signature, algorithm?, tolerance_seconds? })`

Verifies a `github` (`X-Hub-Signature-256`), `stripe` (`Stripe-Signature`) or `generic` HMAC (hex or base64, `sha1`/`sha256`/`sha512`) signature offline.

- The secret comes **only** from the environment variable named by `secret_env`. There is no plaintext secret parameter; any unknown parameter (for example `secret`) is rejected with an explanation, and the value is not echoed.
- The body is read from `body_path` as raw bytes (up to 10 MiB). Save it exactly as received.
- Returns match / no match plus diagnostics: signature header well-formed or not; Stripe timestamp age and whether it is outside the tolerance (default 300 s); whether the body looks **reformatted** (it tests whether the signature would match with the trailing newline removed or added, CRLF/LF changed, a BOM removed, or the JSON minified or pretty-printed); whitespace or quote characters around the secret; a Stripe API key used where a `whsec_` signing secret is needed.
- It never returns the secret or a computed signature.

### `inspect_jwt({ token_env?, token? })`

Decodes a JWT and returns the header, the claims, time-claim status (`exp`, `nbf`, `iat`, `auth_time`) and risk notes: `alg: none`, HMAC algorithms that cannot be verified offline, a missing `exp`, `jku`/`jwk`/`x5u` headers. **Decoding is not verification**: the tool has no key and never checks the signature. Prefer `token_env` (the variable name) so the raw token does not pass through the model; a `token` parameter is already in the context. Claim values under secret-looking field names are masked, but the claims you get back are in the context either way.

### `file_checksum({ path, algorithm, expected? })`

SHA-256 or SHA-512 of a local file (up to 32 MiB), optionally compared with an expected value (`<hex>`, `sha256:<hex>` and `sha256sum` output are accepted). A match proves only that the file equals whatever the expected value came from.

## Honest limitations

- **The hook is a best-effort guard, not a sandbox.** It parses the text of tool calls. It does not stop a script from reading a secret file indirectly (`python app.py` that opens `.env`, `make`, `docker compose config`), `grep -r` over a directory that contains a `.env`, commands that use shell variables or command output as file names (`cat "$FILE"`, `find . -name .env | xargs cat`), or anything a language runtime does inside a program. Treat it as a speed bump that catches the common, accidental case.
- **For stronger protection, combine it with Claude Code's own controls**: run in its sandbox, and add `Read` deny rules for your secret paths in `settings.json` (check the permissions documentation for the exact pattern syntax), for example:

  ```json
  { "permissions": { "deny": ["Read(./.env)", "Read(./.env.local)", "Read(**/*.pem)", "Read(~/.ssh/**)"] } }
  ```

  Deny rules also have gaps and can produce prompts or false positives; test them.
- **Redaction is heuristic and can miss secrets.** It recognises common formats and secret-looking field names. It does not know your custom token formats, secrets inside prose, base64-wrapped values, or secrets split across lines in unusual ways. Review the output before sharing it, and treat a clean result as "nothing matched", not "nothing there". It can also redact harmless values (false positives).
- **Parameters and results of every MCP tool pass through the model.** That is why the tools take paths and variable names. `redact_text` and `inspect_jwt` with `token` cannot keep what you hand them out of the context.
- **Codex and Cursor have no equivalent of the Claude Code `PreToolUse` hook.** There the tools are advisory: they only help if the agent chooses to call them instead of reading a file directly. Use each client's own permission and sandbox settings alongside them.
- Redacted output still contains everything that was not matched (hostnames, usernames, internal URLs, personal data).
- `scan_secrets` is not a replacement for a dedicated scanner with a maintained rule set in CI.
- If a secret has already reached a model context, a log or a commit, **rotate it**.

## Learn more

Browser-local versions of these checks and the background behind them, all at [opsecforge.com](https://www.opsecforge.com):

- [Env file sanitizer](https://www.opsecforge.com/tools/env-sanitizer) and [How to sanitize .env files before sharing](https://www.opsecforge.com/blog/how-to-sanitize-env-files-before-sharing)
- [Webhook debugger](https://www.opsecforge.com/tools/webhook-debugger) and [Webhook signature validation with HMAC-SHA256](https://www.opsecforge.com/blog/webhook-signature-validation-hmac-sha256-best-practices-2026)
- [JWT decoder](https://www.opsecforge.com/tools/jwt-decoder) and [How to decode JWTs client-side](https://www.opsecforge.com/blog/how-to-decode-jwt-tokens-client-side)
- [Hash and file checksum generator](https://www.opsecforge.com/tools/hash-generator) and [Hash generators and data integrity](https://www.opsecforge.com/blog/hash-generator-tools-data-integrity-security)
- [Environment variable security and secrets management](https://www.opsecforge.com/blog/environment-variable-security-secrets-management)
- [AI agent credential security](https://www.opsecforge.com/blog/ai-agent-credential-security-nhi-governance-2026)

## License

MIT
