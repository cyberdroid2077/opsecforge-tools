import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JwtDecoder from './page';
import { base64UrlEncodeString } from '@/lib/jwt';
import { VECTORS } from '@/lib/jwt-verify.test-vectors';
import { JWE_EXAMPLE } from '@/lib/jwe-example';
import { JWE_VECTORS } from '@/lib/jwe.test-vectors';

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
  fireEvent.change(screen.getByPlaceholderText('Paste your encoded JWT or JWE here...'), {
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
    fireEvent.change(screen.getByPlaceholderText('Paste your encoded JWT or JWE here...'), {
      target: { value: 'not-a-jwt' },
    });
    expect(screen.getByText(/Must have 3 parts/)).toBeInTheDocument();
  });
});

describe('JWT decoder page: optional local signature verification', () => {
  const pasteToken = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText('Paste your encoded JWT or JWE here...'), { target: { value } });
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

describe('JWT decoder page: encrypted JWTs (JWE)', () => {
  const pasteToken = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText('Paste your encoded JWT or JWE here...'), { target: { value } });

  const setup = () => {
    vi.stubGlobal('crypto', webcrypto);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const hrefBefore = window.location.href;
    render(<JwtDecoder />);
    return { fetchSpy, setItem, hrefBefore };
  };

  it('shows the protected header and part sizes of a five-part token instead of a format error', () => {
    setup();
    pasteToken(JWE_EXAMPLE.token);

    expect(screen.queryByText(/Must have 3 parts/)).toBeNull();
    expect(screen.getByText(/This is an encrypted JWT \(JWE\)/)).toBeInTheDocument();
    expect(screen.getByText(/"enc": "A256GCM"/)).toBeInTheDocument();
    expect(screen.getByText('12 bytes (96 bits)')).toBeInTheDocument();
    expect(screen.getByText('16 bytes (128 bits)')).toBeInTheDocument();
    expect(screen.getByText('empty')).toBeInTheDocument();
    // Nothing is decrypted until the user asks.
    expect(screen.queryByText(/test-user-123/, { selector: 'span' })).toBeNull();
    expect(screen.queryByText('Verify signature', { selector: 'button' })).toBeNull();
  });

  it('decrypts the guide example with its test key, with no network, storage or URL use', async () => {
    const { fetchSpy, setItem, hrefBefore } = setup();
    pasteToken(JWE_EXAMPLE.token);
    fireEvent.change(screen.getByLabelText('Shared key (oct JWK, hex or Base64URL)'), { target: { value: JWE_EXAMPLE.keyHex } });
    expect(screen.queryByText(/^Decrypted with/)).toBeNull();
    fireEvent.click(screen.getByText('Decrypt', { selector: 'button' }));

    expect(await screen.findByText(/^Decrypted with dir and A256GCM/)).toBeInTheDocument();
    expect(screen.getByText('"test-user-123"')).toBeInTheDocument();
    expect(screen.getByText(/2100-01-01 00:00:00\.000 UTC/)).toBeInTheDocument();
    expect(screen.getByText(/does not show who created the token/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(window.location.href).toBe(hrefBefore);
  });

  it('reports a wrong key as a failure and shows no plaintext', async () => {
    setup();
    pasteToken(JWE_EXAMPLE.token);
    fireEvent.change(screen.getByLabelText('Shared key (oct JWK, hex or Base64URL)'), { target: { value: 'ab'.repeat(32) } });
    fireEvent.click(screen.getByText('Decrypt', { selector: 'button' }));

    expect(await screen.findByText('Decryption failed')).toBeInTheDocument();
    expect(screen.queryByText('"test-user-123"')).toBeNull();
  });

  it('drops the key and the result when the token changes', async () => {
    setup();
    pasteToken(JWE_EXAMPLE.token);
    fireEvent.change(screen.getByLabelText('Shared key (oct JWK, hex or Base64URL)'), { target: { value: JWE_EXAMPLE.keyHex } });
    fireEvent.click(screen.getByText('Decrypt', { selector: 'button' }));
    expect(await screen.findByText(/^Decrypted with/)).toBeInTheDocument();

    pasteToken(JWE_VECTORS.dir.token);
    expect(screen.queryByText(/^Decrypted with/)).toBeNull();
    expect(screen.getByLabelText('Shared key (oct JWK, hex or Base64URL)')).toHaveValue('');
  });

  it('asks for the right kind of key per algorithm and explains RSA1_5', () => {
    setup();
    pasteToken(JWE_VECTORS.rsaOaep.token);
    expect(screen.getByLabelText('RSA private key (PKCS#8 PEM or JWK)')).toBeInTheDocument();
    expect(screen.getByText(/recipient's RSA key is 4096 bits/)).toBeInTheDocument();

    pasteToken(JWE_VECTORS.pbes2.token);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');

    pasteToken(JWE_VECTORS.ecdhEs.token);
    expect(screen.getByLabelText('EC private key (PKCS#8 PEM or JWK)')).toBeInTheDocument();

    pasteToken(JWE_VECTORS.rsa15.token);
    expect(screen.getByText(/Web Crypto API in browsers does not offer that algorithm/)).toBeInTheDocument();
    expect(screen.queryByText('Decrypt', { selector: 'button' })).toBeNull();
  });

  it('hands a nested JWT back to the decoder', async () => {
    setup();
    // dir + A128GCM around the HS256 test vector, built here with Web Crypto.
    const keyBytes = new Uint8Array(16).fill(5);
    const header = base64UrlEncodeString('{"alg":"dir","enc":"A128GCM","cty":"JWT"}');
    const iv = new Uint8Array(12).fill(1);
    const cryptoKey = await webcrypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
    const sealed = Buffer.from(
      await webcrypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(header), tagLength: 128 },
        cryptoKey,
        new TextEncoder().encode(VECTORS.hs.HS256),
      ),
    );
    const token = [
      header,
      '',
      Buffer.from(iv).toString('base64url'),
      sealed.subarray(0, -16).toString('base64url'),
      sealed.subarray(-16).toString('base64url'),
    ].join('.');

    pasteToken(token);
    fireEvent.change(screen.getByLabelText('Shared key (oct JWK, hex or Base64URL)'), { target: { value: '05'.repeat(16) } });
    fireEvent.click(screen.getByText('Decrypt', { selector: 'button' }));
    fireEvent.click(await screen.findByText('Decode the nested token'));

    expect(screen.getByPlaceholderText('Paste your encoded JWT or JWE here...')).toHaveValue(VECTORS.hs.HS256);
    expect(screen.getByText('Verify signature', { selector: 'button' })).toBeInTheDocument();
  });

  it('shows a readable error for a five-part token whose header is not JSON', () => {
    setup();
    pasteToken('bm90LWpzb24.a.b.c.d');
    expect(screen.getByText(/protected header segment is not valid JSON/)).toBeInTheDocument();
  });
});
