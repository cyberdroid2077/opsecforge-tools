// Every secret here is synthetic. Values are assembled at runtime from fragments so that no
// secret-shaped literal sits in the repository (and nothing trips push-protection scanners).
import { createHmac } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export const SYN = {
  stripe: ['sk', 'live', 'SYNTHETIC0123456789ABCDEF'].join('_'),
  aws: ['AKIA', 'SYNTHETICEXAMPLE'].join(''),
  github: ['ghp', 'SYNTHETICTOKEN0123456789abcdef'].join('_'),
  password: 'Synth3tic-NotReal-Passw0rd',
  shortPassword: 'hunter2-Synth',
  dbPassword: 'SyntheticDbPassw0rd99',
  keyBody: 'U1lOVEhFVElDLUtFWS1NQVRFUklBTC1ET05PVC1VU0U=',
  keyBody2: 'U0VDT05ELVNZTlRIRVRJQy1CT0RZLURPLU5PVC1VU0U=',
  webhookSecret: ['whsec', 'SYNTHETICWEBHOOKSECRET0123'].join('_'),
};

const b64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

export function makeJwt(
  payload: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'HS256', typ: 'JWT' },
  signature = 'c3ludGhldGljLXNpZ25hdHVyZS1ub3QtcmVhbA',
) {
  return `${b64url(header)}.${b64url(payload)}.${signature}`;
}

export const pemBlock = (label: string, body = SYN.keyBody, terminated = true) =>
  [`-----BEGIN ${label}-----`, body, terminated ? `-----END ${label}-----` : null]
    .filter((line): line is string => line !== null)
    .join('\n');

export function makeTempDir(prefix = 'opsecforge-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function writeFile(dir: string, name: string, content: string | Buffer) {
  const full = path.join(dir, name);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

export const hmacHex = (secret: string, payload: string, algorithm = 'sha256') =>
  createHmac(algorithm, secret).update(payload).digest('hex');
