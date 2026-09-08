export type Base64Variant = 'standard' | 'url';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

const bytesToBinary = (bytes: Uint8Array) => {
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return binary;
};

export function encodeBase64Text(value: string, variant: Base64Variant) {
  const encoded = btoa(bytesToBinary(encoder.encode(value)));

  if (variant === 'url') {
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  return encoded;
}

const normalizeBase64 = (value: string, variant: Base64Variant) => {
  const compact = value.replace(/\s+/g, '');
  const alphabet = variant === 'url' ? /^[A-Za-z0-9_-]*={0,2}$/ : /^[A-Za-z0-9+/]*={0,2}$/;

  if (!compact || !alphabet.test(compact) || compact.length % 4 === 1) {
    throw new Error(`Invalid ${variant === 'url' ? 'Base64URL' : 'Base64'} input.`);
  }

  const firstPadding = compact.indexOf('=');
  if (firstPadding !== -1 && firstPadding < compact.length - 2) {
    throw new Error('Padding is only valid at the end of the input.');
  }

  const unpadded = compact.replace(/=+$/g, '');
  const suppliedPadding = compact.length - unpadded.length;
  const expectedPadding = (4 - (unpadded.length % 4)) % 4;
  if (suppliedPadding > 0 && suppliedPadding !== expectedPadding) {
    throw new Error('Invalid Base64 padding.');
  }

  const standard = variant === 'url'
    ? unpadded.replace(/-/g, '+').replace(/_/g, '/')
    : unpadded;
  const padding = (4 - (standard.length % 4)) % 4;

  return `${standard}${'='.repeat(padding)}`;
};

export function decodeBase64Text(value: string, variant: Base64Variant) {
  const binary = atob(normalizeBase64(value, variant));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  try {
    return decoder.decode(bytes);
  } catch {
    throw new Error('Decoded bytes are not valid UTF-8 text.');
  }
}
