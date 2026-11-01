import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JwtDecoder from './page';
import { base64UrlEncodeString } from '@/lib/jwt';
import { VECTORS } from '@/lib/jwt-verify.test-vectors';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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

describe('JWT decoder page: optional local signature verification', () => {
  const pasteToken = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText('Paste your encoded JWT here...'), { target: { value } });
  const clickVerify = () => fireEvent.click(screen.getByText('Verify signature', { selector: 'button' }));

  const setup = () => {
    vi.stubGlobal('crypto', webcrypto);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const hrefBefore = window.location.href;
    render(<JwtDecoder />);
    return { fetchSpy, setItem, hrefBefore };
  };

  it('shows a match for an HS256 token and the correct secret, with no network, storage or URL use', async () => {
    const { fetchSpy, setItem, hrefBefore } = setup();
    pasteToken(VECTORS.hs.HS256);
    fireEvent.change(screen.getByLabelText('Shared secret'), { target: { value: VECTORS.secrets.short } });
    clickVerify();

    expect(await screen.findByText(/Signature matches/)).toBeInTheDocument();
    expect(screen.getByText(/does not make the token trustworthy/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.location.href).toBe(hrefBefore);
  });

  it('shows a mismatch for the wrong secret', async () => {
    const { fetchSpy } = setup();
    pasteToken(VECTORS.hs.HS256);
    fireEvent.change(screen.getByLabelText('Shared secret'), { target: { value: 'not-the-secret' } });
    clickVerify();

    expect(await screen.findByText(/Signature does not match/)).toBeInTheDocument();
    expect(screen.queryByText(/Signature matches/)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not verify while typing and clears the result when the token changes', async () => {
    setup();
    pasteToken(VECTORS.hs.HS256);
    fireEvent.change(screen.getByLabelText('Shared secret'), { target: { value: VECTORS.secrets.short } });
    expect(screen.queryByText(/Signature matches/)).toBeNull();

    clickVerify();
    expect(await screen.findByText(/Signature matches/)).toBeInTheDocument();

    pasteToken(VECTORS.hs.HS384);
    expect(screen.queryByText(/Signature matches/)).toBeNull();
    expect(screen.queryByText(/Signature does not match/)).toBeNull();
  });

  it('masks the shared secret and can show it', () => {
    setup();
    pasteToken(VECTORS.hs.HS256);
    const field = screen.getByLabelText('Shared secret');
    expect(field).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByLabelText('Show secret'));
    expect(field).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide secret')).toBeInTheDocument();
  });

  it('asks for a public key for RS256 and verifies it without any network request', async () => {
    const { fetchSpy } = setup();
    pasteToken(VECTORS.rsa.tokens.RS256);
    expect(screen.queryByLabelText('Shared secret')).toBeNull();
    fireEvent.change(screen.getByLabelText('Public key (PEM, JWK or JWKS)'), { target: { value: VECTORS.rsa.pem } });
    clickVerify();

    expect(await screen.findByText(/Signature matches/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('explains that an alg none token has nothing to verify', () => {
    setup();
    pasteToken(VECTORS.noneToken);
    expect(screen.getByText(/unsigned, so there is no signature to verify/)).toBeInTheDocument();
    expect(screen.queryByText('Verify signature', { selector: 'button' })).toBeNull();
  });

  it('no longer claims the signature cannot be verified', () => {
    setup();
    pasteToken(VECTORS.hs.HS256);
    expect(screen.queryByText(/Cannot Be Verified/i)).toBeNull();
    expect(screen.queryByText(/does not request it/i)).toBeNull();
  });
});
