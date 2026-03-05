// Encryption Service — Local key management with envelope encryption
// Uses AES-256-GCM. Master key from env encrypts per-document keys.
// TODO: Replace local master-key operations with AWS KMS when ready.

import crypto from 'crypto';
import uploadConfig from '../config/upload.config.js';

const { algorithm, keyLength, ivLength, authTagLength } = uploadConfig.encryption;

/**
 * Derive the master key buffer from the hex string in env.
 * Falls back to a deterministic dev key if not configured (logs warning).
 */
const getMasterKey = () => {
  // TODO: Replace with AWS KMS Decrypt call (envelope encryption via KMS)
  const hex = uploadConfig.encryption.masterKey;
  if (!hex) {
    console.warn('[Encryption] ⚠️  ENCRYPTION_MASTER_KEY not set — using insecure dev key');
    // Deterministic dev-only key (32 bytes)
    return crypto.createHash('sha256').update('docloq-dev-master-key-INSECURE').digest();
  }
  if (hex.length !== 64) {
    throw new Error('ENCRYPTION_MASTER_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
};

/**
 * Generate a new per-document encryption key (envelope encryption).
 * The plaintext key is used to encrypt the document, and then the
 * plaintext key itself is encrypted with the master key for storage.
 *
 * @returns {{ encryptedKey: string, plaintextKey: Buffer, keyId: string, salt: string, iv: string }}
 */
export const generateDocumentKey = () => {
  // TODO: Replace with AWS KMS GenerateDataKey API call
  const plaintextKey = crypto.randomBytes(keyLength); // 32 bytes
  const iv = crypto.randomBytes(ivLength);             // 16 bytes
  const salt = crypto.randomBytes(uploadConfig.encryption.saltLength); // 32 bytes
  const keyId = crypto.randomUUID();

  // Encrypt the document key with the master key (envelope encryption)
  const masterKey = getMasterKey();
  const masterIv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, masterKey, masterIv, {
    authTagLength,
  });
  const encPart1 = cipher.update(plaintextKey);
  const encPart2 = cipher.final();
  const tag = cipher.getAuthTag();

  // Combine masterIv + authTag + ciphertext for storage
  const encryptedKey = Buffer.concat([masterIv, tag, encPart1, encPart2]).toString('base64');

  return {
    encryptedKey,      // Store in DB (base64)
    plaintextKey,      // Use in memory only — never persist
    keyId,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
  };
};

/**
 * Decrypt a per-document key that was encrypted with the master key.
 * @param {string} encryptedKeyBase64 — base64 encoded encrypted key from DB
 * @returns {Buffer} plaintextKey
 */
export const decryptDocumentKey = (encryptedKeyBase64) => {
  // TODO: Replace with AWS KMS Decrypt API call
  const masterKey = getMasterKey();
  const raw = Buffer.from(encryptedKeyBase64, 'base64');

  const masterIv = raw.subarray(0, ivLength);
  const tag = raw.subarray(ivLength, ivLength + authTagLength);
  const ciphertext = raw.subarray(ivLength + authTagLength);

  const decipher = crypto.createDecipheriv(algorithm, masterKey, masterIv, {
    authTagLength,
  });
  decipher.setAuthTag(tag);

  const part1 = decipher.update(ciphertext);
  const part2 = decipher.final();

  return Buffer.concat([part1, part2]);
};

/**
 * Encrypt a file buffer with AES-256-GCM.
 * @param {Buffer} fileBuffer — plaintext file content
 * @param {Buffer} plaintextKey — 32-byte document key
 * @param {string} ivBase64 — base64-encoded IV
 * @returns {{ encryptedBuffer: Buffer, authTag: string }}
 */
export const encryptFile = (fileBuffer, plaintextKey, ivBase64) => {
  const iv = Buffer.from(ivBase64, 'base64');
  const cipher = crypto.createCipheriv(algorithm, plaintextKey, iv, {
    authTagLength,
  });

  const encPart1 = cipher.update(fileBuffer);
  const encPart2 = cipher.final();
  const authTag = cipher.getAuthTag().toString('base64');

  return {
    encryptedBuffer: Buffer.concat([encPart1, encPart2]),
    authTag,
  };
};

/**
 * Decrypt a file buffer.
 * @param {Buffer} encryptedBuffer
 * @param {string} encryptedKeyBase64 — encrypted document key from DB
 * @param {string} ivBase64 — base64-encoded IV from DB
 * @param {string} authTagBase64 — base64-encoded GCM auth tag
 * @returns {Buffer} — decrypted plaintext file
 */
export const decryptFile = (encryptedBuffer, encryptedKeyBase64, ivBase64, authTagBase64) => {
  const plaintextKey = decryptDocumentKey(encryptedKeyBase64);
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  const decipher = crypto.createDecipheriv(algorithm, plaintextKey, iv, {
    authTagLength,
  });
  decipher.setAuthTag(authTag);

  const part1 = decipher.update(encryptedBuffer);
  const part2 = decipher.final();

  return Buffer.concat([part1, part2]);
};
