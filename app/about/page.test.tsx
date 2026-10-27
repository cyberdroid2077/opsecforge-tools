import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AboutPage from './page';

afterEach(cleanup);

describe('about page', () => {
  it('has a support section that links to GitHub Sponsors and states it buys no editorial influence', () => {
    const { container } = render(<AboutPage />);
    const heading = screen.getByRole('heading', { name: 'Supporting the site' });
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));

    expect(heading.id).toBe('support');
    expect(hrefs).toContain('https://github.com/sponsors/cyberdroid2077');
    expect(container.textContent).toContain('no extra features, private access or priority support');
    expect(container.textContent).toContain('does not decide what articles conclude');
  });
});
