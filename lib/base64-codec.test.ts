import { describe, expect, it } from 'vitest';
import { decodeBase64Text, encodeBase64Text } from './base64-codec';

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
