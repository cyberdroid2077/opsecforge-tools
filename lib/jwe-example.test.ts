// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createDecipheriv, webcrypto } from 'node:crypto';
import { decryptJwe, inspectJwe } from './jwe';
import { JWE_EXAMPLE } from './jwe-example';

describe('JWE example shown in the JWT decoder guide', () => {
  it('has the documented header and decrypts to the documented claims', async () => {
    expect(inspectJwe(JWE_EXAMPLE.token).header).toEqual(JWE_EXAMPLE.header);
    const result = await decryptJwe(JWE_EXAMPLE.token, JWE_EXAMPLE.keyHex, webcrypto.subtle as unknown as SubtleCrypto);
    expect(result.status).toBe('decrypted');
    expect(result.plaintext).toMatchObject({ kind: 'claims', claims: JWE_EXAMPLE.claims });
  });

  it('decrypts with node:crypto following the steps written in the guide', () => {
    const [header, encryptedKey, iv, ciphertext, tag] = JWE_EXAMPLE.token.split('.');
    expect(encryptedKey).toBe('');
    const decipher = createDecipheriv('aes-256-gcm', Buffer.from(JWE_EXAMPLE.keyHex, 'hex'), Buffer.from(iv, 'base64url'));
    decipher.setAAD(Buffer.from(header, 'ascii'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
    expect(JSON.parse(plaintext)).toEqual(JWE_EXAMPLE.claims);
  });
});
