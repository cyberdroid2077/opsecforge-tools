type SecureRandom = {
  randomUUID?: () => string;
  getRandomValues: (bytes: Uint8Array) => Uint8Array;
};

export function formatUuidV4(bytes: Uint8Array) {
  if (bytes.length !== 16) {
    throw new Error('UUID v4 generation requires exactly 16 random bytes.');
  }

  const value = Uint8Array.from(bytes);
  value[6] = (value[6] & 0x0f) | 0x40;
  value[8] = (value[8] & 0x3f) | 0x80;

  const hex = Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createUuidV4(random: SecureRandom | null = globalThis.crypto) {
  if (!random) {
    throw new Error('Secure browser randomness is unavailable.');
  }

  if (typeof random.randomUUID === 'function') {
    return random.randomUUID();
  }

  const bytes = new Uint8Array(16);
  random.getRandomValues(bytes);
  return formatUuidV4(bytes);
}

export function normalizeUuidCount(count: number) {
  if (!Number.isFinite(count)) {
    return 1;
  }

  return Math.min(100, Math.max(1, Math.trunc(count)));
}
