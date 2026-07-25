export type HmacAlgorithm = 'sha1' | 'sha256' | 'sha512';

export type StripeVerificationResult = {
  signatureMatched: boolean;
  timestamp: number;
  ageSeconds: number;
  withinTolerance: boolean;
};

const WEB_CRYPTO_HASHES: Record<HmacAlgorithm, string> = {
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha512: 'SHA-512',
};

const HEX_LENGTHS: Record<HmacAlgorithm, number> = {
  sha1: 40,
  sha256: 64,
  sha512: 128,
};

export const webCryptoHashName = (algorithm: HmacAlgorithm) =>
  WEB_CRYPTO_HASHES[algorithm];

const normalizeHexSignature = (signature: string, algorithm: HmacAlgorithm) => {
  const trimmed = signature.trim();
  const separator = trimmed.indexOf('=');
  const prefix = separator >= 0 ? trimmed.slice(0, separator).toLowerCase() : null;
  const hex = separator >= 0 ? trimmed.slice(separator + 1) : trimmed;

  if (prefix && prefix !== algorithm) {
    throw new Error(`Expected a ${algorithm}= signature prefix.`);
  }
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length !== HEX_LENGTHS[algorithm]) {
    throw new Error(`Expected exactly ${HEX_LENGTHS[algorithm]} hexadecimal characters.`);
  }

  return hex.toLowerCase();
};

const hexToBytes = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }
  return bytes;
};

async function verifyHmac(
  payload: string,
  secret: string,
  signatureHex: string,
  algorithm: HmacAlgorithm,
) {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: { name: webCryptoHashName(algorithm) } },
    false,
    ['verify'],
  );

  return globalThis.crypto.subtle.verify(
    'HMAC',
    key,
    hexToBytes(signatureHex),
    encoder.encode(payload),
  );
}

export async function verifyGenericWebhook(input: {
  payload: string;
  secret: string;
  signature: string;
  algorithm: HmacAlgorithm;
}) {
  const signatureHex = normalizeHexSignature(input.signature, input.algorithm);
  return verifyHmac(input.payload, input.secret, signatureHex, input.algorithm);
}

export async function verifyGitHubWebhook(input: {
  payload: string;
  secret: string;
  signatureHeader: string;
}) {
  if (!input.signatureHeader.trim().toLowerCase().startsWith('sha256=')) {
    throw new Error('GitHub verification requires the complete sha256= X-Hub-Signature-256 value.');
  }

  const signatureHex = normalizeHexSignature(input.signatureHeader, 'sha256');
  return verifyHmac(input.payload, input.secret, signatureHex, 'sha256');
}

const parseStripeHeader = (signatureHeader: string) => {
  const values = signatureHeader.split(',').reduce<Record<string, string[]>>((result, part) => {
    const separator = part.indexOf('=');
    if (separator < 1) return result;

    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!key || !value) return result;
    result[key] = [...(result[key] ?? []), value];
    return result;
  }, {});

  const timestampText = values.t?.[0];
  const timestamp = timestampText && /^\d+$/.test(timestampText)
    ? Number.parseInt(timestampText, 10)
    : Number.NaN;
  const signatures = values.v1 ?? [];

  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    throw new Error('Stripe-Signature must include one valid t= Unix timestamp.');
  }
  if (signatures.length === 0) {
    throw new Error('Stripe-Signature must include at least one v1= signature.');
  }

  return { timestamp, signatures };
};

export async function verifyStripeWebhook(input: {
  payload: string;
  secret: string;
  signatureHeader: string;
  toleranceSeconds?: number;
  nowSeconds?: number;
}): Promise<StripeVerificationResult> {
  const toleranceSeconds = input.toleranceSeconds ?? 300;
  if (!Number.isFinite(toleranceSeconds) || toleranceSeconds <= 0) {
    throw new Error('Stripe timestamp tolerance must be greater than zero seconds.');
  }

  const { timestamp, signatures } = parseStripeHeader(input.signatureHeader);
  const signedPayload = `${timestamp}.${input.payload}`;
  let signatureMatched = false;

  for (const signature of signatures) {
    try {
      const signatureHex = normalizeHexSignature(signature, 'sha256');
      if (await verifyHmac(signedPayload, input.secret, signatureHex, 'sha256')) {
        signatureMatched = true;
        break;
      }
    } catch {
      // A malformed v1 value does not prevent checking another signature during secret rotation.
    }
  }

  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ageSeconds = nowSeconds - timestamp;

  return {
    signatureMatched,
    timestamp,
    ageSeconds,
    withinTolerance: Math.abs(ageSeconds) <= toleranceSeconds,
  };
}
