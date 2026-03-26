// Encryption Service — Envelope encryption with AES-256-GCM
//
// Key providers:
//   - "local"  → master key from env var (development)
//   - "vault"  → HashiCorp Vault Transit engine (production)
//
// Switching provider requires only changing KEY_PROVIDER env var.

import crypto from 'crypto';
import uploadConfig from '../config/upload.config.js';

const { algorithm, keyLength, ivLength, authTagLength } = uploadConfig.encryption;
const keyProvider = uploadConfig.keyProvider; // 'local' | 'vault'

// Lazy-load vault service only when needed to avoid connection errors in local mode
let vaultService = null;
const getVaultService = async () => {
  if (!vaultService) {
    vaultService = await import('./vault.service.js');
  }
  return vaultService;
};

// ============================================================
// Local Key Provider — master key from env var
// ============================================================

// Ephemeral master key — generated once per process when env var is missing.
// Encrypted files won't be decryptable after restart unless ENCRYPTION_MASTER_KEY is set.
let _ephemeralMasterKey = null;

const getMasterKey = () => {
  const hex = uploadConfig.encryption.masterKey;
  if (!hex) {
    if (!_ephemeralMasterKey) {
      _ephemeralMasterKey = crypto.randomBytes(32);
      console.warn('[Encryption] ENCRYPTION_MASTER_KEY not set — using random ephemeral key (data lost on restart)');
    }
    return _ephemeralMasterKey;
  }
  if (hex.length !== 64) {
    throw new Error('ENCRYPTION_MASTER_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
};

const localGenerateDocumentKey = () => {
  const plaintextKey = crypto.randomBytes(keyLength);
  const iv = crypto.randomBytes(ivLength);
  const salt = crypto.randomBytes(uploadConfig.encryption.saltLength);
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
    encryptedKey,
    plaintextKey,
    keyId,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
  };
};

const localDecryptDocumentKey = (encryptedKeyBase64) => {
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

// ============================================================
// Vault Key Provider — Transit engine
// ============================================================

const vaultGenerateDocumentKey = async () => {
  const vault = await getVaultService();
  const { plaintextKey, encryptedKey } = await vault.generateDataKey();

  const iv = crypto.randomBytes(ivLength);
  const salt = crypto.randomBytes(uploadConfig.encryption.saltLength);
  const keyId = crypto.randomUUID();

  return {
    encryptedKey,      // Vault ciphertext (e.g. "vault:v1:abc...")
    plaintextKey,      // 32-byte Buffer — use in memory only
    keyId,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
  };
};

const vaultDecryptDocumentKey = async (encryptedKey) => {
  const vault = await getVaultService();
  return vault.decryptDataKey(encryptedKey);
};

// ============================================================
// Public API — provider-agnostic
// ============================================================

/**
 * Generate a new per-document encryption key (envelope encryption).
 * The plaintext key is used to encrypt the document, and then the
 * plaintext key itself is encrypted for storage.
 *
 * @returns {Promise<{ encryptedKey: string, plaintextKey: Buffer, keyId: string, salt: string, iv: string }>}
 */
export const generateDocumentKey = async () => {
  if (keyProvider === 'vault') {
    return vaultGenerateDocumentKey();
  }
  return localGenerateDocumentKey();
};

/**
 * Decrypt a per-document key that was encrypted with the master key / Vault.
 * @param {string} encryptedKey — encrypted key from DB
 * @returns {Promise<Buffer>} plaintextKey
 */
export const decryptDocumentKey = async (encryptedKey) => {
  if (keyProvider === 'vault') {
    return vaultDecryptDocumentKey(encryptedKey);
  }
  return localDecryptDocumentKey(encryptedKey);
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
 * @param {string} encryptedKey — encrypted document key from DB
 * @param {string} ivBase64 — base64-encoded IV from DB
 * @param {string} authTagBase64 — base64-encoded GCM auth tag
 * @returns {Promise<Buffer>} — decrypted plaintext file
 */
export const decryptFile = async (encryptedBuffer, encryptedKey, ivBase64, authTagBase64) => {
  const plaintextKey = await decryptDocumentKey(encryptedKey);
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
