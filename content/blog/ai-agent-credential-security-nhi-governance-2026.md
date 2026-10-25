---
title: "AI Agent Credential Security: Keeping Secrets Out of Coding-Agent Context"
date: "2026-04-09"
updated: "2026-10-25"
description: "How a local MCP server and a PreToolUse hook keep .env files out of a coding agent's context, what the hook cannot catch, and a credential checklist to run before granting an agent access."
author: "OpsecForge Security Team"
category: "API Security"
tags: ["AI-agents", "NHI", "credential-security", "DevSecOps", "MCP", "Claude-Code"]
source_reviewed: "2026-10-25"
primary_source: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"
---

# AI Agent Credential Security: Keeping Secrets Out of Coding-Agent Context

An AI agent that can call tools is also a workload identity. It may need API keys, OAuth tokens, database credentials, or cloud permissions. The governance problem is whether you can answer four concrete questions:

- Which credentials can the agent use?
- What can each credential access?
- Who owns and can revoke it?
- What happens when it expires or is rotated?

If any answer is unknown, the agent has unmanaged access.

A coding agent adds a fifth problem that a service account does not have. To do its job it reads your files, and whatever it reads becomes part of the conversation sent to the model. Open a `.env` to "see which variables exist" and every value in it is now in the model context, and may also end up in conversation logs and in whatever the model provider retains under its [data usage terms](https://code.claude.com/docs/en/data-usage). Nothing was stolen. The secret was copied into places that are not in your credential inventory, and the only reliable fix for that is rotation.

This article describes how OpsecForge's local MCP server (`opsecforge-mcp`, described on the [/agents](/agents) page) approaches that problem, where its guard hook stops working, and what to check before you give any coding agent access.

## Keep the secret out of the context: pass a path, not content

The core design rule of `redact_file` is that the agent sends a file path and gets back a redacted copy. The file is read inside the local server process, so the original values are never part of the tool result. The tool description says the same thing to the model: "Pass a path, not file contents" (`definitions.ts`, line 76).

This is more reliable than telling an agent to read the file and be careful, because a model cannot repeat a value it never received. `verify_webhook` follows the same rule: it takes the name of an environment variable, and rejects a plaintext `secret` parameter without echoing it.

What `redact_file` actually does:

- It accepts only regular files of at most 1 MiB and refuses binary files.
- If `OPSECFORGE_MCP_ROOTS` is set, it refuses paths outside those directories.
- It runs the same sanitizer as the browser-based [Env Sanitizer](/tools/env-sanitizer), then reports the line numbers (of the original file) of what changed.
- The response begins with two notices (redacted locally; redaction is heuristic). The summary lists each finding type with a count and line numbers, never a value or a partial value.

Here is a synthetic `.env` (every value is invented, none of them is a working credential):

```text
APP_NAME=demo
LOG_LEVEL=info
DATABASE_URL=postgres://app:EXAMPLEpass0000@db.internal:5432/app
STRIPE_SECRET_KEY=sk_test_EXAMPLE0000EXAMPLE0000
GITHUB_TOKEN=ghp_EXAMPLE0000EXAMPLE0000EXAMPLE
SESSION_SECRET=0000-example-not-real
```

Running the repository's sanitizer function on this text (Node 22 with `--experimental-strip-types`, executing `lib/safe-share-sanitizer.ts` directly) produced this redacted text:

```text
APP_NAME=demo
LOG_LEVEL=info
DATABASE_URL=postgres://app:[REDACTED]@db.internal:5432/app
STRIPE_SECRET_KEY=[REDACTED]
GITHUB_TOKEN=[REDACTED]
SESSION_SECRET=[REDACTED]
```

and these findings: `Sensitive named field: 3` and `URL credential: 1`. Names like `APP_NAME` are left alone, so the agent still learns which variables exist. `DATABASE_URL` is not a secret-looking name, but the password inside the URL is caught by a separate rule; the internal hostname stays, which is the kind of detail redaction does not remove. The header and notices the MCP tool wraps around this text were not run here; they follow `redact.ts` lines 52 to 66.

## Intercept the call: the PreToolUse hook

A tool the agent may choose to use is advisory. In Claude Code, a [PreToolUse hook](https://code.claude.com/docs/en/hooks) runs before a tool call, and exit code 2 blocks the call and feeds stderr back to the model. The OpsecForge plugin registers `guard.js` for `Read|Grep|Bash` with `onFailure: "block"` (`hooks.json`, lines 5 to 12). When it blocks, it tells the model to call `redact_file` instead, or to read `.env.example`.

What it matches, by base name (`guard.js` lines 33 to 49): `.env` and `.env.*`, `.envrc`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `*.keystore`, `*.ppk`, `id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519` (and suffixed variants), `credentials` and `credentials.json`, `.netrc`, `.pgpass`, `.git-credentials`, `.htpasswd`. Matching is case-insensitive. Names ending in `.example`, `.sample` or `.template`, and `*.pub`, are allowed (lines 30 to 31).

For Bash it tokenizes the command and checks arguments of known readers such as `cat`, `head`, `grep`, `sed`, `source` and `curl` (lines 287 to 293). It peels wrappers like `sudo` and `env`, looks inside `bash -c` strings and `$(...)`, and checks input redirects, `git show HEAD:.env` arguments, quoted file names in inline `python -c` or `node -e` code, and symlinks with innocent names that point at a secret file. For `Grep` it checks the `path` and globs that could only name secret files.

Running the script's own `analyzeCommandString` function on sample commands shows the boundary. It flagged `cat .env`, `head -n 3 config/.env.production`, `bash -c "cat .env"`, `git show HEAD:.env`, `cat < .env` and `cat ~/.ssh/id_ed25519`, and allowed `cat .env.example` and `cp .env.example .env`. It did not flag any of these:

- `python app.py`, where the program opens `.env` itself
- `grep -r API_KEY .`, which walks into a directory that contains `.env`
- `cat "$F"`, where the file name sits in a shell variable
- `find . -name .env | xargs cat`, where the name arrives on stdin
- `cat .e*`, because a glob with fewer than three literal characters is judged too broad (line 117)

The script also fails closed. Malformed hook input, or an internal error, blocks the call (lines 494 to 499), and the README notes that `onFailure: "block"` needs Claude Code v2.1.295 or later.

The conclusion is the one the package README reaches: **the hook is a guardrail, not a boundary.** It parses text, so it catches the common accidental case, an agent reaching for `.env` because that is what the task suggests. It cannot see what a program does after it starts. The guard ships only as a Claude Code plugin, so in other MCP clients the tools only help if the agent chooses to call them. For a real boundary, add Claude Code's own `Read` deny rules and sandbox ([permissions documentation](https://code.claude.com/docs/en/permissions)), keep secrets out of the project directory, and use `OPSECFORGE_MCP_ROOTS` to limit which directories the file tools can read.

## Minimum control set, with an executable step for each

1. **Inventory every non-human identity.** Keep one row per credential: owner, purpose, environment, permissions, creation date, expiry, last rotation. Add the row before the agent gets the credential.
2. **Use least privilege.** For GitHub, create a [fine-grained personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) for the agent alone. GitHub documents that such a token is limited to one user or organization, can be limited to specific repositories, and carries specific permissions. Select only the repositories and the permissions the task needs, such as read-only contents, rather than reusing your own broad token. GitHub's [permission reference](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens) lists what each endpoint needs.
3. **Prefer short-lived credentials.** Use workload identity or token exchange where the platform supports it. Where you must use a static token, set an expiration date when creating it ([GitHub token expiration](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation)) and put the expiry in the inventory so it is noticed.
4. **Test rotation and revocation.** Rotate the agent's token once before relying on it, and confirm the agent fails closed afterwards. The [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) covers creation, rotation, revocation, expiry and auditing as one lifecycle.
5. **Separate environments.** Give the agent a development or sandbox credential. If a production secret must be handed to a tool, hand over the variable name (as `verify_webhook` does), not the value.
6. **Monitor use.** Watch for unexpected resources, locations, volumes and actions, and keep the credential itself out of logs. The [environment variable leaks article](/blog/environment-variable-leaks-security-risks) and the [API key leaks article](/blog/api-key-leaks-credential-security) cover where secrets tend to escape.
7. **Assume exposure means rotation.** If a secret reached a model context, a transcript, a log or a commit, treat it as disclosed and rotate it. Redacting afterwards does not take it back.

## Checklist before granting a coding agent access

- [ ] Does the agent have its own credential, separate from yours, with an owner and an expiry recorded?
- [ ] Is each token limited to the repositories, projects or accounts the task needs, and to read-only where possible?
- [ ] Are `.env`, key files and cloud credential files outside the directory the agent works in, or covered by `Read` deny rules?
- [ ] Is the agent's shell sandboxed or restricted, given that a text-matching hook cannot see inside a running script?
- [ ] Do MCP tools that handle secrets take paths or variable names rather than values? MCP's tools specification says there SHOULD always be a human in the loop with the ability to deny tool invocations ([MCP tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)); check your client actually prompts.
- [ ] Have you rehearsed rotating the agent's credential?
- [ ] Is there a pre-commit or CI secret scan, so a secret the agent writes into code is caught?

## Limits and honest caveats

Pattern-based redaction is heuristic. `redact_file` recognises common vendor key formats and secret-looking field names. It does not know your custom token formats, secrets inside prose, base64-wrapped values, or values split across lines in unusual ways. A result of "none of the known patterns matched" means exactly that, not that the file is clean, and it can also redact harmless values. Redacted output still contains everything that was not matched: hostnames, usernames, internal URLs and personal data. `redact_text` cannot remove text that is already in the context. Nothing here makes an agent safe; it narrows the common accidental path and leaves the rest to credential scoping, sandboxing and rotation.

<div class="my-12 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center sm:p-10 shadow-xl">
  <h3 class="mb-3 text-2xl font-bold text-slate-100">Redact configuration locally</h3>
  <p class="mb-8 text-slate-400 text-lg">Env Sanitizer heuristically masks common secret patterns in your browser. Review the result before sharing; OpsecForge does not receive the pasted input.</p>
  <a href="/tools/env-sanitizer" class="inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-bold !text-slate-950 !no-underline transition-colors hover:bg-emerald-400">
    Open Env Sanitizer →
  </a>
</div>

To use the same redaction from a coding agent, see the install steps and limitations on the [/agents](/agents) page.

## Sources

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html): lifecycle, least privilege, rotation, auditing
- [Claude Code hooks reference](https://code.claude.com/docs/en/hooks): PreToolUse, exit code 2, `onFailure`
- [Claude Code permissions](https://code.claude.com/docs/en/permissions): `Read` deny rules such as `Read(./.env)`
- [Claude Code data usage](https://code.claude.com/docs/en/data-usage): what is sent to and retained by the provider
- [Model Context Protocol: tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools): human-in-the-loop guidance
- [GitHub: managing your personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens): fine-grained token scoping
- [GitHub: token expiration and revocation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation)
- [GitHub: permissions required for fine-grained personal access tokens](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
- [opsecforge-mcp source and README](https://github.com/cyberdroid2077/opsecforge-tools/tree/main/packages/opsecforge-mcp)
