import { createHash } from 'node:crypto';
import {
  MAX_BODY_BYTES,
  ToolError,
  formatBytes,
  readEnvSecret,
  readRegularFile,
} from '../fsutil';
import {
  verifyGenericWebhook,
  verifyGitHubWebhook,
  verifyStripeWebhook,
  type HmacAlgorithm,
} from '../../../../lib/webhook-verifier';

export type WebhookArgs = {
  provider: 'github' | 'stripe' | 'generic';
  body_path: string;
  secret_env: string;
  signature: string;
  algorithm?: HmacAlgorithm;
  tolerance_seconds?: number;
  /** Test hook: clock override in Unix seconds. Not exposed in the tool schema. */
  nowSeconds?: number;
};

type Outcome = {
  matched: boolean;
  formatError?: string;
  stripe?: { timestamp: number; ageSeconds: number; withinTolerance: boolean };
};

const HEX = /^[0-9a-f]+$/i;
const HEX_LENGTH: Record<HmacAlgorithm, number> = { sha1: 40, sha256: 64, sha512: 128 };

/** Generic providers (e.g. Shopify) often send base64; the shared verifier takes hex. */
function normalizeGenericSignature(signature: string, algorithm: HmacAlgorithm): string {
  const trimmed = signature.trim();
  const bare = trimmed.includes('=') && /^[a-z0-9]+=/i.test(trimmed) ? trimmed.slice(trimmed.indexOf('=') + 1) : trimmed;
  if (HEX.test(bare) && bare.length === HEX_LENGTH[algorithm]) return trimmed;
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) {
    const bytes = Buffer.from(trimmed, 'base64');
    if (bytes.length * 2 === HEX_LENGTH[algorithm]) return bytes.toString('hex');
  }
  return trimmed;
}

async function runVerification(
  args: WebhookArgs,
  payload: string,
  secret: string,
  algorithm: HmacAlgorithm,
): Promise<Outcome> {
  try {
    if (args.provider === 'github') {
      const matched = await verifyGitHubWebhook({
        payload,
        secret,
        signatureHeader: args.signature,
      });
      return { matched };
    }
    if (args.provider === 'stripe') {
      const result = await verifyStripeWebhook({
        payload,
        secret,
        signatureHeader: args.signature,
        toleranceSeconds: args.tolerance_seconds,
        nowSeconds: args.nowSeconds,
      });
      return {
        matched: result.signatureMatched,
        stripe: {
          timestamp: result.timestamp,
          ageSeconds: result.ageSeconds,
          withinTolerance: result.withinTolerance,
        },
      };
    }
    const matched = await verifyGenericWebhook({
      payload,
      secret,
      signature: normalizeGenericSignature(args.signature, algorithm),
      algorithm,
    });
    return { matched };
  } catch (error) {
    return { matched: false, formatError: error instanceof Error ? error.message : 'Invalid signature.' };
  }
}

/** Alternative byte sequences a body may have had when the sender signed it. */
function bodyVariants(payload: string): { label: string; payload: string }[] {
  const variants: { label: string; payload: string }[] = [];
  const add = (label: string, candidate: string) => {
    if (candidate !== payload && !variants.some((v) => v.payload === candidate)) {
      variants.push({ label, payload: candidate });
    }
  };
  if (/\r?\n$/.test(payload)) add('without the trailing newline', payload.replace(/\r?\n$/, ''));
  else add('with a trailing newline added', `${payload}\n`);
  if (payload.includes('\r\n')) add('with CRLF line endings converted to LF', payload.replace(/\r\n/g, '\n'));
  else if (payload.includes('\n')) add('with LF line endings converted to CRLF', payload.replace(/\n/g, '\r\n'));
  if (payload.startsWith('﻿')) add('without the leading byte order mark', payload.slice(1));
  try {
    const parsed: unknown = JSON.parse(payload.replace(/^﻿/, ''));
    add('re-serialized as minified JSON', JSON.stringify(parsed));
    add('re-serialized as 2-space pretty-printed JSON', JSON.stringify(parsed, null, 2));
  } catch {
    // not JSON: only whitespace variants apply
  }
  return variants;
}

const looksPrettyPrintedJson = (payload: string) => {
  try {
    JSON.parse(payload);
  } catch {
    return false;
  }
  return /\n[ \t]+["{\[]/.test(payload);
};

export async function verifyWebhook(args: WebhookArgs): Promise<string> {
  const algorithm = args.algorithm ?? 'sha256';
  if (args.provider !== 'generic' && args.algorithm && args.algorithm !== 'sha256') {
    throw new ToolError(`"algorithm" only applies to provider "generic"; ${args.provider} always uses sha256.`);
  }
  if (typeof args.signature !== 'string' || args.signature.trim() === '') {
    throw new ToolError('"signature" must be the signature header value (it is not a secret).');
  }
  if (args.provider !== 'stripe' && args.tolerance_seconds !== undefined) {
    throw new ToolError('"tolerance_seconds" only applies to provider "stripe".');
  }

  const secret = readEnvSecret(args.secret_env, '"secret_env"');
  const { absolutePath, bytes } = await readRegularFile(args.body_path, MAX_BODY_BYTES);

  let payload: string;
  try {
    payload = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new ToolError(
      'The body is not valid UTF-8, which the shared verifier needs to hash it byte-for-byte. Verify binary bodies with `openssl dgst -hmac` instead.',
    );
  }

  const outcome = await runVerification(args, payload, secret, algorithm);
  const lines: string[] = [];
  const bodySha = createHash('sha256').update(bytes).digest('hex');
  const notes: string[] = [];

  if (outcome.formatError) {
    lines.push('Result: INVALID SIGNATURE HEADER FORMAT (no HMAC comparison was possible)');
    notes.push(`Signature header: ${outcome.formatError}`);
  } else if (outcome.matched && outcome.stripe && !outcome.stripe.withinTolerance) {
    lines.push('Result: SIGNATURE MATCHES BUT THE TIMESTAMP IS OUTSIDE THE TOLERANCE (treat as invalid)');
  } else if (outcome.matched) {
    lines.push('Result: MATCH (HMAC over the exact body bytes equals the signature)');
  } else {
    lines.push('Result: NO MATCH');
  }

  lines.push(
    `Provider: ${args.provider}${args.provider === 'generic' ? ` (HMAC-${algorithm.toUpperCase()})` : ''}`,
    `Body: ${absolutePath} (${formatBytes(bytes.length)}, sha256 of the bytes ${bodySha})`,
    `Secret: read from the environment variable ${args.secret_env}; its value is never returned.`,
  );

  if (!outcome.formatError) notes.push('Signature header format: OK.');

  if (outcome.stripe) {
    const { timestamp, ageSeconds, withinTolerance } = outcome.stripe;
    const tolerance = args.tolerance_seconds ?? 300;
    notes.push(
      `Timestamp: t=${timestamp} (${new Date(timestamp * 1000).toISOString()}), ${
        ageSeconds >= 0 ? `${ageSeconds}s old` : `${-ageSeconds}s in the future`
      }; tolerance ${tolerance}s: ${withinTolerance ? 'within tolerance' : 'OUTSIDE tolerance (replayed or delayed delivery, or a wrong clock)'}.`,
    );
  }

  if (!outcome.matched) {
    if (!outcome.formatError) {
      const variants = bodyVariants(payload);
      const hits: string[] = [];
      for (const variant of variants) {
        const alt = await runVerification(args, variant.payload, secret, algorithm);
        if (alt.matched) hits.push(variant.label);
      }
      if (hits.length > 0) {
        notes.push(
          `Reformatted body: the signature DOES match if the body is ${hits.join(' / ')}. The bytes in ${args.body_path} are not the bytes the sender signed. Capture the raw request body before any JSON parsing or re-serialization, and do not save it through an editor that adds a trailing newline.`,
        );
      } else {
        notes.push(
          'Reformatted body: none of the common whitespace/JSON re-serialization variants of the body match either.',
        );
      }
      if (looksPrettyPrintedJson(payload)) {
        notes.push(
          'The body is indented JSON. Providers sign the raw bytes they sent (usually compact JSON); a pretty-printed copy will not verify.',
        );
      }
      if (secret !== secret.trim()) {
        const trimmed = await runVerification(args, payload, secret.trim(), algorithm);
        notes.push(
          trimmed.matched
            ? `The value of ${args.secret_env} has leading or trailing whitespace/newline, and the signature matches once it is trimmed. Fix the secret value.`
            : `The value of ${args.secret_env} has leading or trailing whitespace/newline (a common cause of mismatches), but trimming it does not fix this one.`,
        );
      }
      if (/^(["']).*\1$/.test(secret)) {
        notes.push(`The value of ${args.secret_env} is wrapped in quote characters; check that they are not part of the secret.`);
      }
      if (args.provider === 'stripe') {
        if (/^(sk|rk|pk)_/.test(secret)) {
          notes.push(`The value of ${args.secret_env} looks like a Stripe API key, not a webhook signing secret (those start with whsec_).`);
        } else if (!secret.startsWith('whsec_')) {
          notes.push(`The value of ${args.secret_env} does not start with whsec_, which Stripe webhook signing secrets do.`);
        }
      }
      if (args.provider === 'github') {
        notes.push('GitHub signs the raw request body with the webhook secret; confirm the secret matches the one configured for this specific webhook.');
      }
    }
  }

  lines.push('Diagnostics:', ...notes.map((note) => `  - ${note}`));
  lines.push(
    'Note: a match shows the signature was produced with this secret over these exact bytes; it does not establish anything else about the sender.',
  );
  return lines.join('\n');
}
