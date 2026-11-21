import { describe, expect, it } from 'vitest';
import {
  analyzeBase64Input,
  buildBase64DataUrl,
  convertBase64Variant,
  decodeBase64Bytes,
  decodeBase64Detailed,
  decodeBase64Text,
  detectFileSignature,
  encodeBase64Bytes,
  encodeBase64Text,
  formatHexView,
  parseBase64DataUrl,
} from './base64-codec';

describe('base64 input diagnostics', () => {
  it('detects the variant from the characters used', () => {
    expect(analyzeBase64Input('+/+/Pg==').variant).toBe('standard');
    expect(analyzeBase64Input('-_-_Pg').variant).toBe('url');
    expect(analyzeBase64Input('SGVsbG8=').variant).toBe('ambiguous');
    expect(analyzeBase64Input('a+b-c').variant).toBe('invalid-mixed');
    expect(analyzeBase64Input('a+b-c').valid).toBe(false);
  });

  it('flags a remainder of 1 as malformed', () => {
    const result = analyzeBase64Input('QUFBQ');
    expect(result.lengthMod4).toBe(1);
    expect(result.malformedLength).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.byteLength).toBeNull();
  });

  it('reports missing padding and the decoded byte length', () => {
    const result = analyzeBase64Input('QQ');
    expect(result.paddingStatus).toBe('missing');
    expect(result.paddingPresent).toBe(false);
    expect(result.valid).toBe(true);
    expect(result.byteLength).toBe(1);
    expect(analyzeBase64Input('QQ==').paddingStatus).toBe('correct');
    expect(analyzeBase64Input('QUFB').paddingStatus).toBe('none-needed');
    expect(analyzeBase64Input('SGVsbG8==').paddingStatus).toBe('incorrect');
    expect(analyzeBase64Input('SGVsbG8=').byteLength).toBe(5);
  });

  it('reports the first invalid character with its original index and counts stripped whitespace', () => {
    const result = analyzeBase64Input('SGVs\nbG8 *x!');
    expect(result.whitespaceStripped).toBe(2);
    expect(result.invalidChar).toEqual({ char: '*', index: 9 });
    expect(result.valid).toBe(false);

    const clean = analyzeBase64Input(' SGVs\r\nbG8= ');
    expect(clean.whitespaceStripped).toBe(4);
    expect(clean.valid).toBe(true);
    expect(clean.byteLength).toBe(5);
    expect(analyzeBase64Input('QQ=Q').invalidChar).toEqual({ char: '=', index: 2 });
  });

  it('treats empty input as empty', () => {
    expect(analyzeBase64Input('  \n').empty).toBe(true);
    expect(analyzeBase64Input('').valid).toBe(false);
  });
});

describe('binary-safe decode', () => {
  it('returns bytes and a hex view for non-UTF-8 data', () => {
    const { bytes, text } = decodeBase64Detailed('-_-_Pg', 'url');
    expect(text).toBeNull();
    expect(formatHexView(bytes)).toEqual({ hex: 'fb ff bf 3e', shown: 4, total: 4, truncated: false });
  });

  it('still returns text for UTF-8 bytes', () => {
    expect(decodeBase64Detailed('SGVsbG8=', 'standard').text).toBe('Hello');
  });

  it('caps the hex view and reports truncation', () => {
    const view = formatHexView(new Uint8Array(5000).fill(10));
    expect(view.shown).toBe(4096);
    expect(view.total).toBe(5000);
    expect(view.truncated).toBe(true);
    expect(view.hex.split(' ')).toHaveLength(4096);
    expect(view.hex.slice(0, 5)).toBe('0a 0a');
  });
});

describe('variant conversion without decoding', () => {
  it('swaps alphabets and handles padding for bytes fb ff bf 3e', () => {
    expect(convertBase64Variant('+/+/Pg==', 'url', { padding: true })).toBe('-_-_Pg==');
    expect(convertBase64Variant('+/+/Pg==', 'url', { padding: false })).toBe('-_-_Pg');
    expect(convertBase64Variant('-_-_Pg', 'standard', { padding: true })).toBe('+/+/Pg==');
    expect(convertBase64Variant('-_-_Pg==', 'standard', { padding: false })).toBe('+/+/Pg');
  });

  it('maps MDA/ and MDA_ to each other', () => {
    expect(convertBase64Variant('MDA/', 'url', { padding: false })).toBe('MDA_');
    expect(convertBase64Variant('MDA_', 'standard', { padding: false })).toBe('MDA/');
  });

  it('ignores whitespace and rejects bad input with clear errors', () => {
    expect(convertBase64Variant('+/+/\nPg==', 'url', { padding: false })).toBe('-_-_Pg');
    expect(() => convertBase64Variant('a+b-c', 'url', { padding: false })).toThrow('mixes');
    expect(() => convertBase64Variant('QUFBQ', 'url', { padding: false })).toThrow('cannot be valid');
    expect(() => convertBase64Variant('QU*B', 'url', { padding: false })).toThrow('position 3');
    expect(() => convertBase64Variant('SGVsbG8==', 'url', { padding: false })).toThrow('padding');
    expect(() => convertBase64Variant('', 'url', { padding: false })).toThrow('Enter');
  });
});

describe('base64 text codec', () => {
  it('round-trips Unicode text with standard Base64', () => {
    const input = 'OpsecForge — 安全 🔐';
    const encoded = encodeBase64Text(input, 'standard');

    expect(decodeBase64Text(encoded, 'standard')).toBe(input);
  });

  it('uses the URL-safe alphabet and omits padding', () => {
    expect(encodeBase64Text('synthetic?ÿ', 'url')).not.toMatch(/[+/=]/);
    expect(decodeBase64Text('SGVsbG8td29ybGQ_', 'url')).toBe('Hello-world?');
  });

  it('accepts omitted Base64URL padding and whitespace in pasted input', () => {
    expect(decodeBase64Text('SGVsbG8g\nd29ybGQ', 'url')).toBe('Hello world');
  });

  it('rejects the wrong alphabet and malformed lengths', () => {
    expect(() => decodeBase64Text('SGVsbG8_', 'standard')).toThrow('Invalid Base64 input');
    expect(() => decodeBase64Text('A', 'url')).toThrow('Invalid Base64URL input');
    expect(() => decodeBase64Text('YQ=', 'standard')).toThrow('Invalid Base64 padding');
  });

  it('rejects decoded bytes that are not UTF-8 text', () => {
    expect(() => decodeBase64Text('/w==', 'standard')).toThrow('not valid UTF-8');
  });
});

describe('base64 bytes, data URLs, and file signatures', () => {
  it('encodes every byte value and round-trips through both variants', () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, index) => index);

    expect(encodeBase64Bytes(bytes, 'standard')).toBe(Buffer.from(bytes).toString('base64'));
    expect(encodeBase64Bytes(bytes, 'url')).toBe(Buffer.from(bytes).toString('base64url'));
    expect([...decodeBase64Bytes(encodeBase64Bytes(bytes, 'url'), 'url')]).toEqual([...bytes]);
  });

  it('encodes input larger than one String.fromCharCode chunk', () => {
    const bytes = Uint8Array.from({ length: 0x8000 * 2 + 5 }, (_, index) => (index * 31) % 256);

    expect(encodeBase64Bytes(bytes, 'standard')).toBe(Buffer.from(bytes).toString('base64'));
  });

  it('splits a base64 data URL and leaves other input alone', () => {
    expect(parseBase64DataUrl('data:image/png;base64,iVBORw0KGgo=')).toEqual({
      mediaType: 'image/png',
      payload: 'iVBORw0KGgo=',
      payloadOffset: 22,
    });
    expect(parseBase64DataUrl('data:text/plain;charset=utf-8;base64,aMOpbGxv')?.mediaType).toBe('text/plain;charset=utf-8');
    // RFC 2397: an omitted media type means text/plain;charset=US-ASCII.
    expect(parseBase64DataUrl('data:;base64,YQ==')).toEqual({
      mediaType: 'text/plain;charset=US-ASCII',
      payload: 'YQ==',
      payloadOffset: 13,
    });
    expect(parseBase64DataUrl('data:text/plain,hello')).toBeNull();
    expect(parseBase64DataUrl('SGVsbG8=')).toBeNull();
    expect(parseBase64DataUrl('data:text/plain,a;base64,b')).toBeNull();
  });

  it('builds a data URL with the standard alphabet and a fallback media type', () => {
    const bytes = Uint8Array.from([0xfb, 0xff, 0xbf, 0x3e]);

    expect(buildBase64DataUrl('image/png', bytes)).toBe('data:image/png;base64,+/+/Pg==');
    expect(buildBase64DataUrl('', bytes)).toBe('data:application/octet-stream;base64,+/+/Pg==');
  });

  it('recognises file signatures and nothing else', () => {
    const of = (...bytes: number[]) => detectFileSignature(Uint8Array.from(bytes));
    const text = (value: string) => detectFileSignature(new TextEncoder().encode(value));

    expect(of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)?.extension).toBe('png');
    expect(of(0xff, 0xd8, 0xff, 0xe0)?.extension).toBe('jpg');
    expect(text('GIF89a...')?.extension).toBe('gif');
    expect(text('GIF87a...')?.extension).toBe('gif');
    expect(text('%PDF-1.7')?.extension).toBe('pdf');
    expect(of(0x50, 0x4b, 0x03, 0x04)?.extension).toBe('zip');
    expect(of(0x1f, 0x8b, 0x08)?.extension).toBe('gz');
    expect(text('RIFF\u0010\u0000\u0000\u0000WEBPVP8 ')?.extension).toBe('webp');
    expect(text('RIFF\u0010\u0000\u0000\u0000WAVEfmt ')).toBeNull();
    expect(of(0x89, 0x50, 0x4e)).toBeNull();
    expect(text('Hello')).toBeNull();
    expect(of()).toBeNull();
  });
});
