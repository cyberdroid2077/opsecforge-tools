import { z } from 'zod/v4';
import { redactFile, redactText } from './tools/redact';
import { scanSecrets } from './tools/scan';
import { verifyWebhook } from './tools/webhook';
import { inspectJwt } from './tools/jwt';
import { fileChecksum } from './tools/checksum';

export type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  schema: z.ZodObject;
  run: (args: never) => Promise<string> | string;
};

const sharedLimits =
  'Only regular files are accepted (no directories, pipes or devices), up to 1 MiB, and binary files are refused.';

const redactFileSchema = z
  .object({
    path: z.string().min(1).describe('Path of the local text file to read (absolute, relative to the server working directory, or starting with ~/).'),
  })
  .strict();

const scanSecretsSchema = z
  .object({
    paths: z
      .array(z.string().min(1))
      .max(200)
      .optional()
      .describe('Files or directories to scan. Directories are walked recursively (skipping .git, node_modules, build output and symlinks; at most 2000 files).'),
    staged: z
      .boolean()
      .optional()
      .describe('When true, scan only the lines added in `git diff --cached` (the staged changes) in the server working directory.'),
  })
  .strict();

const redactTextSchema = z
  .object({
    text: z.string().describe('Text to redact. NOTE: this text is already in your context; see the tool description.'),
  })
  .strict();

const verifyWebhookSchema = z
  .object({
    provider: z.enum(['github', 'stripe', 'generic']).describe('github: X-Hub-Signature-256 (sha256=<hex>). stripe: Stripe-Signature header (t=...,v1=...). generic: plain HMAC over the body, hex (or base64) signature.'),
    body_path: z.string().min(1).describe('Path to a file holding the RAW request body exactly as received (not re-serialized). Read as bytes, up to 10 MiB.'),
    secret_env: z.string().min(1).describe('NAME of the environment variable that holds the signing secret (for example GITHUB_WEBHOOK_SECRET). Never the secret itself.'),
    signature: z.string().min(1).describe('The signature header value as received. It is not a secret.'),
    algorithm: z.enum(['sha1', 'sha256', 'sha512']).optional().describe('HMAC hash for provider "generic" (default sha256). Not used by github or stripe.'),
    tolerance_seconds: z.number().positive().max(86400).optional().describe('Stripe only: maximum allowed age of the signed timestamp in seconds (default 300).'),
  })
  .strict();

const inspectJwtSchema = z
  .object({
    token_env: z.string().min(1).optional().describe('NAME of an environment variable that holds the JWT. Preferred: the raw token then never passes through the model.'),
    token: z.string().min(1).optional().describe('The JWT itself. Passing it here puts it in the model context; use token_env when possible.'),
  })
  .strict();

const fileChecksumSchema = z
  .object({
    path: z.string().min(1).describe('Path of the file to hash (regular file, up to 32 MiB).'),
    algorithm: z.enum(['sha256', 'sha512']).describe('Digest algorithm.'),
    expected: z.string().optional().describe('Optional expected digest (hex; "sha256:<hex>" and sha256sum-style "<hex>  name" are accepted) to compare against.'),
  })
  .strict();

export const TOOLS: ToolDefinition[] = [
  {
    name: 'redact_file',
    title: 'Redact a local file',
    description:
      `Reads a local text file on this machine and returns its content with secrets (API keys, tokens, passwords, private keys, connection-string credentials, JWTs, cookies) replaced by [REDACTED], plus a findings summary (type, count, line numbers). The original values are read inside the local MCP server process only and are never returned, so use this instead of Read or cat for .env files, config files, logs, key files and similar. Pass a path, not file contents. ${sharedLimits} The response starts with a notice that the original values did not leave the machine or reach the model. Redaction is heuristic and can miss custom formats.`,
    schema: redactFileSchema,
    run: ((args: z.infer<typeof redactFileSchema>) => redactFile(args)) as ToolDefinition['run'],
  },
  {
    name: 'scan_secrets',
    title: 'Scan files or staged changes for secrets',
    description:
      'Pre-commit check. Scans files or directories (paths) and/or the lines added in the staged git diff (staged: true) for known secret patterns. Lists only file:line, the secret type and a masked preview (at most the first 4 characters of values of 20+ characters; short values are shown as an ellipsis), never the original value. Provide paths, staged, or both. Heuristic: a clean result is not proof that nothing sensitive is present.',
    schema: scanSecretsSchema,
    run: ((args: z.infer<typeof scanSecretsSchema>) => scanSecrets(args)) as ToolDefinition['run'],
  },
  {
    name: 'redact_text',
    title: 'Redact text already in context',
    description:
      'Redacts secrets in text you ALREADY HAVE (for example before pasting logs into an issue, ticket, chat message or commit message) and returns the redacted copy with a findings summary. Honest limitation: the text you pass as the argument is already in the model context, and calling this tool does not remove it from there; it only produces a safer copy to share outward. To avoid putting a secret into the context at all, use redact_file with a path instead. Heuristic: can miss custom formats.',
    schema: redactTextSchema,
    run: ((args: z.infer<typeof redactTextSchema>) => redactText(args)) as ToolDefinition['run'],
  },
  {
    name: 'verify_webhook',
    title: 'Verify a webhook signature offline',
    description:
      'Verifies a GitHub, Stripe or generic HMAC webhook signature locally and explains why a mismatch happened. The signing secret is read ONLY from the environment variable named in secret_env; there is no parameter for a plaintext secret and one is rejected if supplied. The body is read as raw bytes from body_path. Returns match / no match plus diagnostics: whether the signature header is well-formed, whether the Stripe timestamp is outside the tolerance, whether the body looks reformatted (trailing newline, CRLF, re-serialized or pretty-printed JSON) and common secret mistakes (whitespace, wrong key type). It sends nothing over the network and never returns the secret or a computed signature.',
    schema: verifyWebhookSchema,
    run: ((args: z.infer<typeof verifyWebhookSchema>) => verifyWebhook(args)) as ToolDefinition['run'],
  },
  {
    name: 'inspect_jwt',
    title: 'Decode a JWT and flag risks',
    description:
      'Decodes a JWT locally and returns its header, claims (field values whose names look like secrets are masked), time-claim status (exp, nbf, iat) and risk notes such as alg none, HMAC algorithms that cannot be verified offline, missing exp, and jku/jwk/x5u key-injection headers. DECODING IS NOT VERIFICATION: this tool has no key, never checks the signature and cannot tell you the token is genuine. Prefer token_env (the NAME of an environment variable) so the raw token does not pass through the model; a token passed as `token` is already in the context. The claims returned are in the model context either way.',
    schema: inspectJwtSchema,
    run: ((args: z.infer<typeof inspectJwtSchema>) => inspectJwt(args)) as ToolDefinition['run'],
  },
  {
    name: 'file_checksum',
    title: 'Compute and compare a file checksum',
    description:
      'Computes the SHA-256 or SHA-512 digest of a local file (regular file, up to 32 MiB) and optionally compares it with an expected value. A match proves only that the file equals whatever the expected value was taken from, so it is only as trustworthy as the source of that value.',
    schema: fileChecksumSchema,
    run: ((args: z.infer<typeof fileChecksumSchema>) => fileChecksum(args)) as ToolDefinition['run'],
  },
];

export function inputJsonSchema(definition: ToolDefinition) {
  const json = z.toJSONSchema(definition.schema, { io: 'input', target: 'draft-7' }) as Record<string, unknown>;
  delete json.$schema;
  return json;
}
