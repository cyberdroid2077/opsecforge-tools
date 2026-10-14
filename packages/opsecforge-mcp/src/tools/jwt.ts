import { ToolError, readEnvSecret } from '../fsutil';
import { JwtError, analyzeJwt, decodeJwt } from '../../../../lib/jwt';
import { sanitizeForSharing } from '../../../../lib/safe-share-sanitizer';

const maskJson = (value: unknown) => {
  const result = sanitizeForSharing(JSON.stringify(value, null, 2));
  return { text: result.output, masked: result.findings.reduce((sum, f) => sum + f.count, 0) };
};

export function inspectJwt(args: { token?: string; token_env?: string; now?: number }): string {
  const hasToken = typeof args.token === 'string' && args.token.trim() !== '';
  const hasEnv = typeof args.token_env === 'string' && args.token_env !== '';
  if (hasToken && hasEnv) {
    throw new ToolError('Provide either "token_env" or "token", not both. Prefer "token_env".');
  }
  if (!hasToken && !hasEnv) {
    throw new ToolError('Provide "token_env" (the NAME of an environment variable holding the JWT) or "token".');
  }

  let raw = hasEnv ? readEnvSecret(args.token_env as string, '"token_env"') : (args.token as string);
  raw = raw.trim().replace(/^bearer\s+/i, '');

  let decoded;
  try {
    decoded = decodeJwt(raw);
  } catch (error) {
    if (error instanceof JwtError) throw new ToolError(error.message);
    throw error;
  }

  const analysis = analyzeJwt(decoded, args.now ?? Date.now());
  const header = maskJson(decoded.header);
  const claims = maskJson(decoded.payload);

  const lines: string[] = [
    'OpsecForge JWT inspection: DECODE ONLY. Decoding is not verification: this tool has no key, did not check the signature, and says nothing about whether the token is genuine or still accepted by the issuer.',
    hasEnv
      ? 'The token was read from an environment variable; it is not part of this response. The header and claims below are.'
      : 'The token was passed as a parameter, so it is already in the model context. Prefer token_env next time.',
    '',
    'Header:',
    header.text,
    '',
    'Claims:',
    claims.text,
  ];
  if (header.masked + claims.masked > 0) {
    lines.push(`(${header.masked + claims.masked} value(s) in the header/claims were masked because their field names look like secrets.)`);
  }

  const timeLines = Object.values(analysis.timeClaims).map((info) => `  ${info.claim}: ${info.display}`);
  if (timeLines.length > 0) lines.push('', 'Time claims:', ...timeLines);

  const alg = typeof decoded.header.alg === 'string' ? decoded.header.alg : undefined;
  const risks: string[] = [];
  for (const alert of analysis.alerts) risks.push(`[${alert.type}] ${alert.message}`);
  if (alg && /^HS(256|384|512)$/.test(alg)) {
    risks.push('[note] HS* tokens are verified with a shared secret: they cannot be verified offline here, and anyone holding that secret can mint tokens.');
  } else if (alg && alg.toLowerCase() !== 'none') {
    risks.push(`[note] ${alg} needs the issuer's public key (JWKS) to verify; this tool does not fetch keys or verify signatures.`);
  }
  lines.push('', 'Risk notes:', ...risks.map((risk) => `  - ${risk}`));
  lines.push('', `Signature segment: ${decoded.signature === '' ? 'empty' : `present (${decoded.signature.length} characters), not verified, not shown`}.`);
  return lines.join('\n');
}
