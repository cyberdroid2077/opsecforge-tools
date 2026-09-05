import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Home from './page';

afterEach(cleanup);

describe('homepage', () => {
  it('publishes the approved hero and one primary sanitizer action', () => {
    const { container } = render(<Home />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Developer tools. No uploads.');
    expect(screen.getByText('Format, inspect, and verify sensitive data directly in your browser.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Open Safe-to-Share Sanitizer/ }).getAttribute('href')).toBe('/tools/env-sanitizer');
    expect(container.querySelectorAll('a[href^="#"]')).toHaveLength(0);
  });

  it('uses the production routes for secondary tools and guides', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: /Webhook Signature Verifier/ }).getAttribute('href')).toBe('/tools/webhook-debugger');
    expect(screen.getByRole('link', { name: /File Checksum & Hash Generator/ }).getAttribute('href')).toBe('/tools/hash-generator');
    expect(screen.getByRole('link', { name: /Base64 Converter/ }).getAttribute('href')).toBe('/tools/base64-converter');
    expect(screen.getByRole('link', { name: /How to Sanitize .env Files Before Sharing/ }).getAttribute('href')).toBe('/blog/how-to-sanitize-env-files-before-sharing');
    expect(screen.getByRole('link', { name: /View complete tools center/ }).getAttribute('href')).toBe('/tools');
    expect(screen.getByRole('link', { name: /View all articles/ }).getAttribute('href')).toBe('/blog');
  });

  it('includes canonical website and primary-tool structured data', () => {
    const { container } = render(<Home />);
    const jsonLd = container.querySelector('script[type="application/ld+json"]');

    expect(jsonLd).not.toBeNull();
    expect(jsonLd?.textContent).toContain('https://www.opsecforge.com/');
    expect(jsonLd?.textContent).toContain('https://www.opsecforge.com/tools/env-sanitizer');
    expect(jsonLd?.textContent).toContain('https://www.opsecforge.com/tools/webhook-debugger');
  });
});
