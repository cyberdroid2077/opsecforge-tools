import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { VERSION, createServer } from './server';

const arg = process.argv[2];
if (arg === '--version' || arg === '-v') {
  process.stdout.write(`${VERSION}\n`);
} else if (arg === '--help' || arg === '-h') {
  process.stdout.write(
    [
      `opsecforge-mcp ${VERSION}`,
      'Local MCP server (stdio). Start it from an MCP client, for example:',
      '  claude mcp add opsecforge -- npx -y opsecforge-mcp',
      'Tools: redact_file, scan_secrets, redact_text, verify_webhook, inspect_jwt, file_checksum',
      'Docs: https://www.opsecforge.com',
      '',
    ].join('\n'),
  );
} else {
  // stdout carries the protocol; every diagnostic must go to stderr.
  process.on('unhandledRejection', (reason) => {
    process.stderr.write(`opsecforge-mcp: unhandled rejection (${reason instanceof Error ? reason.name : 'unknown'})\n`);
  });
  process.on('uncaughtException', (error) => {
    process.stderr.write(`opsecforge-mcp: uncaught exception (${error.name})\n`);
  });
  const server = createServer();
  server.connect(new StdioServerTransport()).catch((error: unknown) => {
    process.stderr.write(`opsecforge-mcp: failed to start (${error instanceof Error ? error.message : 'unknown error'})\n`);
    process.exit(1);
  });
}
