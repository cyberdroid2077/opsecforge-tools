import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JwtDecoder from './page';
import { base64UrlEncodeString } from '@/lib/jwt';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// Synthetic token: invented claims, placeholder signature.
const token = (payload: Record<string, unknown>) =>
  [
    base64UrlEncodeString('{"alg":"HS256","typ":"JWT"}'),
    base64UrlEncodeString(JSON.stringify(payload)),
    'c2lnbmF0dXJl',
  ].join('.');

const decode = (payload: Record<string, unknown>) => {
  render(<JwtDecoder />);
  fireEvent.change(screen.getByPlaceholderText('Paste your encoded JWT here...'), {
    target: { value: token(payload) },
  });
};

describe('JWT decoder page', () => {
  it('does not mark a normal token (past iat, future exp) as expired', () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 5, 15, 12, 0, 0), toFake: ['Date'] });
    const now = Date.now() / 1000;
    decode({ sub: 'test-user-123', iat: now - 86400, exp: now + 86400 });

    expect(screen.getByText(/1 day ago/)).toBeInTheDocument();
    expect(screen.getByText(/in 1 day/)).toBeInTheDocument();
    expect(screen.queryByText(/EXPIRED/)).toBeNull();
  });

  it('marks only an exp in the past as expired', () => {
    vi.useFakeTimers({ now: Date.UTC(2026, 5, 15, 12, 0, 0), toFake: ['Date'] });
    const now = Date.now() / 1000;
    decode({ iat: now - 2 * 86400, exp: now - 86400 });

    expect(screen.getAllByText(/EXPIRED/)).toHaveLength(1);
  });

  it('renders an out-of-range exp as raw text instead of crashing', () => {
    decode({ iat: 1, exp: 1e20 });
    expect(screen.getAllByText(/out of representable date range/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Application error/)).toBeNull();
  });

  it('shows a readable error for an invalid token', () => {
    render(<JwtDecoder />);
    fireEvent.change(screen.getByPlaceholderText('Paste your encoded JWT here...'), {
      target: { value: 'not-a-jwt' },
    });
    expect(screen.getByText(/Must have 3 parts/)).toBeInTheDocument();
  });
});
