import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FloatingTicketButton from '../components/FloatingTicketButton';

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: vi.fn() }));

vi.mock('next/navigation', () => ({ usePathname: pathnameMock }));

beforeEach(() => pathnameMock.mockReset());
afterEach(cleanup);

describe('FloatingTicketButton', () => {
  it('stays hidden on the homepage', () => {
    pathnameMock.mockReturnValue('/');

    render(<FloatingTicketButton />);

    expect(screen.queryByRole('button', { name: 'Report a Bug' })).toBeNull();
  });

  it('remains available on tool pages', () => {
    pathnameMock.mockReturnValue('/tools/env-sanitizer');

    render(<FloatingTicketButton />);

    expect(screen.getByRole('button', { name: 'Report a Bug' })).toBeTruthy();
  });
});
