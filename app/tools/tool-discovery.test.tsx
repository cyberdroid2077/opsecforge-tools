import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ToolDiscovery from '../../components/tools/ToolDiscovery';
import { toolDiscovery } from '../../lib/tool-discovery';

afterEach(cleanup);

describe('ToolDiscovery', () => {
  it('renders parseable JSON-LD and the related webhook guides', () => {
    const { container } = render(<ToolDiscovery slug="webhook-debugger" />);
    const scripts = [...container.querySelectorAll('script[type="application/ld+json"]')];

    expect(scripts).toHaveLength(2);
    expect(scripts.map((script) => JSON.parse(script.textContent ?? '')['@type'])).toEqual([
      'WebApplication',
      'BreadcrumbList',
    ]);
    expect(
      screen
        .getByRole('link', { name: /Webhook signature validation best practices/ })
        .getAttribute('href'),
    ).toBe('/blog/webhook-signature-validation-hmac-sha256-best-practices-2026');
    expect(
      screen.getByRole('link', { name: /CVE-2026-33143/ }).getAttribute('href'),
    ).toBe('/blog/cve-2026-33143-webhook-signature-verification-bypass-2026');
  });

  it('renders only structured data when a tool has nothing relevant to link', () => {
    const original = toolDiscovery['unix-timestamp'];

    toolDiscovery['unix-timestamp'] = { guides: [], tools: [] };

    try {
      const { container } = render(<ToolDiscovery slug="unix-timestamp" />);

      expect(container.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
      expect(container.querySelector('aside')).toBeNull();
    } finally {
      toolDiscovery['unix-timestamp'] = original;
    }
  });

  it('renders nothing for noindexed or unknown tools', () => {
    const { container } = render(<ToolDiscovery slug="lorem-ipsum" />);

    expect(container.innerHTML).toBe('');
  });
});
