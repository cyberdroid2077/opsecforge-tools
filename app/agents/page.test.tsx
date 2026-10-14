import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AgentsPage, { metadata } from './page';

afterEach(cleanup);

describe('agents page', () => {
  it('has one H1, canonical metadata and the install commands', () => {
    const { container } = render(<AgentsPage />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(metadata.alternates?.canonical).toBe('https://www.opsecforge.com/agents');
    expect(container.textContent).toContain('claude mcp add opsecforge -- npx -y opsecforge-mcp');
    expect(container.textContent).toContain('/plugin install opsecforge@opsecforge');
    for (const name of ['redact_file', 'scan_secrets', 'redact_text', 'verify_webhook', 'inspect_jwt', 'file_checksum']) {
      expect(container.textContent).toContain(name);
    }
  });

  it('states limitations and links to npm and existing tool routes', () => {
    const { container } = render(<AgentsPage />);
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));

    expect(screen.getByRole('heading', { name: 'Limitations' })).toBeTruthy();
    expect(container.textContent).toContain('best-effort guard, not a sandbox');
    expect(container.textContent).toContain('Codex and Cursor have no equivalent');
    expect(hrefs).toContain('https://www.npmjs.com/package/opsecforge-mcp');
    for (const route of ['env-sanitizer', 'webhook-debugger', 'jwt-decoder', 'hash-generator']) {
      expect(hrefs).toContain(`/tools/${route}`);
    }
  });
});
