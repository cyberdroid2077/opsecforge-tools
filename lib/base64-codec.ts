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

export function encodeBase64Bytes(bytes: Uint8Array, variant: Base64Variant) {
  const encoded = btoa(bytesToBinary(bytes));

  if (variant === 'url') {
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  return encoded;
}

export function encodeBase64Text(value: string, variant: Base64Variant) {
  return encodeBase64Bytes(encoder.encode(value), variant);
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

export function decodeBase64Bytes(value: string, variant: Base64Variant) {
  const binary = atob(normalizeBase64(value, variant));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Decodes to bytes and reports UTF-8 text when the bytes are valid UTF-8, otherwise `text` is null. */
export function decodeBase64Detailed(value: string, variant: Base64Variant) {
  const bytes = decodeBase64Bytes(value, variant);

  try {
    return { bytes, text: decoder.decode(bytes) as string | null };
  } catch {
    return { bytes, text: null as string | null };
  }
}

export function decodeBase64Text(value: string, variant: Base64Variant) {
  const { text } = decodeBase64Detailed(value, variant);

  if (text === null) {
    throw new Error('Decoded bytes are not valid UTF-8 text.');
  }

  return text;
}

export const HEX_VIEW_BYTE_LIMIT = 4096;

/** Lowercase, space-separated hex. Shows at most `limit` bytes and reports truncation. */
export function formatHexView(bytes: Uint8Array, limit = HEX_VIEW_BYTE_LIMIT) {
  const shown = Math.min(bytes.length, limit);
  const parts: string[] = [];

  for (let index = 0; index < shown; index += 1) {
    parts.push(bytes[index].toString(16).padStart(2, '0'));
  }

  return { hex: parts.join(' '), shown, total: bytes.length, truncated: bytes.length > shown };
}

export type Base64Detection = 'standard' | 'url' | 'ambiguous' | 'invalid-mixed';
export type Base64PaddingStatus = 'none-needed' | 'correct' | 'missing' | 'incorrect';

export interface Base64Analysis {
  /** True when nothing but whitespace was supplied. */
  empty: boolean;
  /** Alphabet detected from the characters used. `ambiguous` means only characters shared by both alphabets. */
  variant: Base64Detection;
  /** Number of whitespace characters removed before analysis. */
  whitespaceStripped: number;
  /** Length after whitespace removal, including padding. */
  compactLength: number;
  paddingPresent: boolean;
  paddingCount: number;
  paddingStatus: Base64PaddingStatus;
  /** Length of the unpadded data characters modulo 4. A remainder of 1 can never be valid. */
  lengthMod4: number;
  malformedLength: boolean;
  /** First character outside both alphabets (or a misplaced `=`). `index` is the 0-based position in the original input. */
  invalidChar: { char: string; index: number } | null;
  /** True when the decoder would accept the input (missing padding is accepted). */
  valid: boolean;
  /** Decoded length in bytes, or null when the input is not valid. */
  byteLength: number | null;
}

export function analyzeBase64Input(value: string): Base64Analysis {
  let compact = '';
  let invalidChar: Base64Analysis['invalidChar'] = null;
  let whitespaceStripped = 0;
  const positions: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (/\s/.test(char)) {
      whitespaceStripped += 1;
    } else {
      compact += char;
      positions.push(index);
    }
  }

  const unpadded = compact.replace(/=+$/g, '');
  const paddingCount = compact.length - unpadded.length;
  let hasStandard = false;
  let hasUrl = false;

  for (let i = 0; i < unpadded.length; i += 1) {
    const char = unpadded[i];
    if (char === '+' || char === '/') {
      hasStandard = true;
    } else if (char === '-' || char === '_') {
      hasUrl = true;
    } else if (!/[A-Za-z0-9]/.test(char) && !invalidChar) {
      invalidChar = { char, index: positions[i] };
    }
  }

  const lengthMod4 = unpadded.length % 4;
  const malformedLength = lengthMod4 === 1;
  const expectedPadding = lengthMod4 === 0 ? 0 : 4 - lengthMod4;
  let paddingStatus: Base64PaddingStatus;
  if (paddingCount === 0) {
    paddingStatus = expectedPadding === 0 ? 'none-needed' : 'missing';
  } else {
    paddingStatus = paddingCount === expectedPadding ? 'correct' : 'incorrect';
  }

  const variant: Base64Detection = hasStandard && hasUrl
    ? 'invalid-mixed'
    : hasStandard ? 'standard' : hasUrl ? 'url' : 'ambiguous';
  const empty = compact.length === 0;
  const valid = !empty && !invalidChar && !malformedLength && paddingStatus !== 'incorrect' && variant !== 'invalid-mixed';

  return {
    empty,
    variant,
    whitespaceStripped,
    compactLength: compact.length,
    paddingPresent: paddingCount > 0,
    paddingCount,
    paddingStatus,
    lengthMod4,
    malformedLength,
    invalidChar,
    valid,
    byteLength: valid ? Math.floor((unpadded.length * 3) / 4) : null,
  };
}

/** Swaps the alphabet and adds or strips padding without decoding. Throws a descriptive Error on bad input. */
export function convertBase64Variant(value: string, to: Base64Variant, options: { padding: boolean }) {
  const analysis = analyzeBase64Input(value);

  if (analysis.empty) {
    throw new Error('Enter a Base64 or Base64URL string to convert.');
  }
  if (analysis.invalidChar) {
    throw new Error(`Invalid character ${JSON.stringify(analysis.invalidChar.char)} at position ${analysis.invalidChar.index + 1}.`);
  }
  if (analysis.variant === 'invalid-mixed') {
    throw new Error('Input mixes standard (+ /) and URL-safe (- _) characters, so the variant is unclear.');
  }
  if (analysis.malformedLength) {
    throw new Error('Length is 1 more than a multiple of 4, which cannot be valid Base64. The string may be cut off.');
  }
  if (analysis.paddingStatus === 'incorrect') {
    throw new Error('Invalid Base64 padding.');
  }

  const unpadded = value.replace(/\s+/g, '').replace(/=+$/g, '');
  const swapped = to === 'url'
    ? unpadded.replace(/\+/g, '-').replace(/\//g, '_')
    : unpadded.replace(/-/g, '+').replace(/_/g, '/');

  return options.padding ? `${swapped}${'='.repeat((4 - (swapped.length % 4)) % 4)}` : swapped;
}

export interface Base64DataUrl {
  /** Media type as written before `;base64`; RFC 2397's default when the URL omits it. */
  mediaType: string;
  payload: string;
  /** Index in the original input where the payload starts. */
  payloadOffset: number;
}

/** Splits an RFC 2397 `data:` URL that carries a `;base64` payload. Returns null for anything else. */
export function parseBase64DataUrl(value: string): Base64DataUrl | null {
  const match = /^\s*data:([^,]*?);base64,/i.exec(value);

  if (!match) {
    return null;
  }

  return {
    mediaType: match[1] || 'text/plain;charset=US-ASCII',
    payload: value.slice(match[0].length),
    payloadOffset: match[0].length,
  };
}

export function buildBase64DataUrl(mediaType: string, bytes: Uint8Array) {
  return `data:${mediaType || 'application/octet-stream'};base64,${encodeBase64Bytes(bytes, 'standard')}`;
}

export interface FileSignature {
  label: string;
  extension: string;
  mediaType: string;
  /** True for raster formats the page previews in an img element. */
  previewable: boolean;
}

const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0));

const FILE_SIGNATURES: Array<FileSignature & { magic: number[]; offset?: number; also?: { magic: number[]; offset: number } }> = [
  { label: 'PNG image', extension: 'png', mediaType: 'image/png', previewable: true, magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { label: 'JPEG image', extension: 'jpg', mediaType: 'image/jpeg', previewable: true, magic: [0xff, 0xd8, 0xff] },
  { label: 'GIF image', extension: 'gif', mediaType: 'image/gif', previewable: true, magic: ascii('GIF87a') },
  { label: 'GIF image', extension: 'gif', mediaType: 'image/gif', previewable: true, magic: ascii('GIF89a') },
  { label: 'WebP image', extension: 'webp', mediaType: 'image/webp', previewable: true, magic: ascii('RIFF'), also: { magic: ascii('WEBP'), offset: 8 } },
  { label: 'PDF document', extension: 'pdf', mediaType: 'application/pdf', previewable: false, magic: ascii('%PDF-') },
  { label: 'ZIP archive (also .docx, .xlsx, .jar)', extension: 'zip', mediaType: 'application/zip', previewable: false, magic: [0x50, 0x4b, 0x03, 0x04] },
  { label: 'gzip data', extension: 'gz', mediaType: 'application/gzip', previewable: false, magic: [0x1f, 0x8b] },
];

const startsWithAt = (bytes: Uint8Array, magic: number[], offset = 0) =>
  bytes.length >= offset + magic.length && magic.every((byte, index) => bytes[offset + index] === byte);

/**
 * Matches the leading bytes against a short list of well-known file signatures.
 * A match only means the data starts like that format; it does not validate the rest of the file.
 */
export function detectFileSignature(bytes: Uint8Array): FileSignature | null {
  for (const { magic, also, ...signature } of FILE_SIGNATURES) {
    if (startsWithAt(bytes, magic) && (!also || startsWithAt(bytes, also.magic, also.offset))) {
      return signature;
    }
  }

  return null;
}

/** Largest file the page encodes in one step; the output is about 4/3 of this in characters. */
export const BASE64_FILE_BYTE_LIMIT = 5 * 1024 * 1024;
/** Longest encoded string rendered in the output box; the full value is still copied or saved. */
export const BASE64_PREVIEW_CHAR_LIMIT = 100_000;
/** Largest decoded image shown as an inline preview. */
export const BASE64_IMAGE_PREVIEW_BYTE_LIMIT = 2 * 1024 * 1024;
