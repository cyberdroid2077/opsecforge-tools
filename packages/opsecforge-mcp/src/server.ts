import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod/v4';
import { TOOLS, inputJsonSchema, type ToolDefinition } from './definitions';
import { ToolError } from './fsutil';

declare const __PKG_VERSION__: string;
export const VERSION = typeof __PKG_VERSION__ === 'string' ? __PKG_VERSION__ : '0.0.0-dev';

const INSTRUCTIONS = [
  'OpsecForge local tools. Everything runs on this machine; nothing is sent to a remote service.',
  'Prefer passing a file path or an environment variable NAME over pasting a secret: parameters and results of every tool pass through the model.',
  'redact_file: read .env/config/log/key files with secrets masked. scan_secrets: pre-commit check. redact_text: redact text already in context before sharing it outward. verify_webhook: signing secret from an env var name only. inspect_jwt: decode (not verify) a token, prefer token_env. file_checksum: SHA-256/512.',
  'All redaction and scanning is heuristic and can miss custom secret formats.',
].join(' ');

const SECRET_LIKE_KEY = /secret|token|password|passwd|key|credential|bearer/i;

function describeValidationError(tool: ToolDefinition, error: z.ZodError): string {
  const unknownKeys: string[] = [];
  const other: string[] = [];
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') unknownKeys.push(...issue.keys);
    else other.push(`${issue.path.length > 0 ? issue.path.join('.') : 'arguments'}: ${issue.message}`);
  }
  const parts: string[] = [];
  if (unknownKeys.length > 0) {
    parts.push(`Unknown parameter(s) for ${tool.name}: ${unknownKeys.join(', ')}.`);
    if (unknownKeys.some((key) => SECRET_LIKE_KEY.test(key))) {
      parts.push(
        'OpsecForge tools never accept secrets, signing keys or tokens as plaintext parameters, because everything passed as a parameter goes through the model. Put the secret in an environment variable and pass its NAME (secret_env / token_env), or pass a file path.',
      );
    }
    const allowed = Object.keys((tool.schema.shape as Record<string, unknown>) ?? {});
    parts.push(`Accepted parameters: ${allowed.join(', ')}.`);
  }
  if (other.length > 0) parts.push(`Invalid arguments for ${tool.name}: ${other.join('; ')}.`);
  return parts.join(' ');
}

export function createServer(): Server {
  const server = new Server(
    { name: 'opsecforge', version: VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: inputJsonSchema(tool) as { type: 'object'; [key: string]: unknown },
      annotations: {
        title: tool.title,
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const fail = (text: string) => ({ isError: true, content: [{ type: 'text' as const, text }] });
    try {
      const tool = TOOLS.find((candidate) => candidate.name === request.params.name);
      if (!tool) {
        return fail(`Unknown tool: ${String(request.params.name).slice(0, 80)}. Available: ${TOOLS.map((t) => t.name).join(', ')}.`);
      }
      const parsed = tool.schema.safeParse(request.params.arguments ?? {});
      if (!parsed.success) return fail(describeValidationError(tool, parsed.error));
      const text = await tool.run(parsed.data as never);
      return { content: [{ type: 'text' as const, text }] };
    } catch (error) {
      if (error instanceof ToolError) return fail(error.message);
      // Unexpected failure: report the class of error, never raw internals that might hold values.
      const name = error instanceof Error ? error.name : 'Error';
      return fail(`${request.params.name} failed unexpectedly (${name}). No data was returned.`);
    }
  });

  return server;
}
