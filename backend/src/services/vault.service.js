// HashiCorp Vault Service — Transit Secrets Engine for Key Management
// Replaces env-var-based master key with proper KMS-like key management.
// Transit engine: key material never leaves Vault process memory.

import Vault from 'node-vault';
import uploadConfig from '../config/upload.config.js';

let vaultClient = null;
let transitReady = false;

/**
 * Initialize the Vault client and verify Transit engine is available.
 * Safe to call multiple times — returns cached client after first init.
 */
export const initVault = async () => {
  if (vaultClient && transitReady) return vaultClient;

  const { addr, token } = uploadConfig.vault;

  vaultClient = Vault({
    apiVersion: 'v1',
    endpoint: addr,
    token,
  });

  try {
    // Check if Transit engine is already enabled
    const mounts = await vaultClient.mounts();
    if (!mounts['transit/']) {
      // Enable Transit secrets engine
      await vaultClient.mount({
        mount_point: 'transit',
        type: 'transit',
        description: 'DocLoq document encryption key management',
      });
      console.log('[Vault] Transit secrets engine enabled');
    }

    // Ensure the master key exists
    const keyName = uploadConfig.vault.transitKey;
    try {
      await vaultClient.read(`transit/keys/${keyName}`);
    } catch {
      // Key doesn't exist — create it
      await vaultClient.write(`transit/keys/${keyName}`, {
        type: 'aes256-gcm96',
        exportable: false,      // Key material can never be exported
        allow_plaintext_backup: false,
      });
      console.log(`[Vault] Created Transit key: ${keyName}`);
    }

    transitReady = true;
    console.log(`[Vault] Connected → ${addr} (Transit engine ready)`);
    return vaultClient;
  } catch (err) {
    console.error('[Vault] Initialization failed:', err.message);
    throw err;
  }
};

/**
 * Generate a new data encryption key (DEK) via Vault Transit.
 * Vault returns both the plaintext key (for immediate use) and the
 * ciphertext key (for storage in DB). The plaintext key is held in
 * memory only — never persisted.
 *
 * This is the "envelope encryption" pattern:
 *   Vault Transit (KEK) → encrypts → Document Key (DEK) → encrypts → Document
 *
 * @param {string} [keyName] — Transit key name (defaults to config)
 * @returns {{ plaintextKey: Buffer, encryptedKey: string }}
 */
export const generateDataKey = async (keyName) => {
  const client = await initVault();
  const name = keyName || uploadConfig.vault.transitKey;

  const result = await client.write(`transit/datakey/plaintext/${name}`, {
    bits: 256,
  });

  // Vault returns base64-encoded plaintext and vault-prefixed ciphertext
  const plaintextKey = Buffer.from(result.data.plaintext, 'base64');
  const encryptedKey = result.data.ciphertext; // e.g. "vault:v1:abc123..."

  return { plaintextKey, encryptedKey };
};

/**
 * Decrypt a data encryption key using Vault Transit.
 * Used when reading a document — retrieve the encrypted DEK from DB,
 * then ask Vault to decrypt it.
 *
 * @param {string} encryptedKey — Vault ciphertext (e.g. "vault:v1:abc123...")
 * @param {string} [keyName] — Transit key name
 * @returns {Buffer} — plaintext key (32 bytes)
 */
export const decryptDataKey = async (encryptedKey, keyName) => {
  const client = await initVault();
  const name = keyName || uploadConfig.vault.transitKey;

  const result = await client.write(`transit/decrypt/${name}`, {
    ciphertext: encryptedKey,
  });

  return Buffer.from(result.data.plaintext, 'base64');
};

/**
 * Encrypt data directly via Vault Transit (for small payloads like keys).
 * @param {Buffer|string} plaintext
 * @param {string} [keyName]
 * @returns {string} — Vault ciphertext
 */
export const encryptWithTransit = async (plaintext, keyName) => {
  const client = await initVault();
  const name = keyName || uploadConfig.vault.transitKey;

  const b64 = Buffer.isBuffer(plaintext)
    ? plaintext.toString('base64')
    : Buffer.from(plaintext).toString('base64');

  const result = await client.write(`transit/encrypt/${name}`, {
    plaintext: b64,
  });

  return result.data.ciphertext;
};

/**
 * Delete a Transit key — used for crypto shredding (GDPR Art 17).
 * Once deleted, ALL data encrypted with this key becomes permanently
 * unrecoverable. This is the core mechanism for right-to-be-forgotten.
 *
 * @param {string} keyName — Transit key to destroy
 */
export const cryptoShredKey = async (keyName) => {
  const client = await initVault();

  // First, allow deletion (keys are deletion-protected by default)
  await client.write(`transit/keys/${keyName}/config`, {
    deletion_allowed: true,
  });

  // Then delete the key — all data encrypted with it becomes unrecoverable
  await client.delete(`transit/keys/${keyName}`);

  console.log(`[Vault] CRYPTO SHRED: Key "${keyName}" permanently destroyed`);
};

/**
 * Rotate a Transit key. Old key versions are retained for decryption,
 * but new encryptions use the latest version.
 * @param {string} [keyName]
 */
export const rotateKey = async (keyName) => {
  const client = await initVault();
  const name = keyName || uploadConfig.vault.transitKey;

  await client.write(`transit/keys/${name}/rotate`, {});
  console.log(`[Vault] Key rotated: ${name}`);
};

/**
 * Create a per-document Transit key for fine-grained crypto shredding.
 * Each document gets its own key, so deleting one document's key
 * doesn't affect other documents.
 *
 * @param {string} documentId — UUID of the document
 * @returns {{ keyName: string, plaintextKey: Buffer, encryptedKey: string }}
 */
export const createDocumentKey = async (documentId) => {
  const client = await initVault();
  const keyName = `docloq-doc-${documentId}`;

  // Create a dedicated key for this document
  await client.write(`transit/keys/${keyName}`, {
    type: 'aes256-gcm96',
    exportable: false,
    allow_plaintext_backup: false,
  });

  // Generate a data key encrypted under this document-specific key
  const result = await client.write(`transit/datakey/plaintext/${keyName}`, {
    bits: 256,
  });

  return {
    keyName,
    plaintextKey: Buffer.from(result.data.plaintext, 'base64'),
    encryptedKey: result.data.ciphertext,
  };
};

/**
 * Check if Vault is available and the Transit engine is operational.
 * @returns {{ available: boolean, transitReady: boolean }}
 */
export const healthCheck = async () => {
  try {
    const client = await initVault();
    const health = await client.health();
    return {
      available: true,
      transitReady,
      sealed: health.sealed,
      initialized: health.initialized,
    };
  } catch {
    return { available: false, transitReady: false };
  }
};
