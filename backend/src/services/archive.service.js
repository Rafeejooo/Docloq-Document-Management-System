// Archive & Crypto Shredding Service
//
// Handles document lifecycle:
//   - Archive: move old versions to archive bucket (MinIO) or archive dir (local)
//   - Restore: move archived versions back to active storage
//   - Crypto Shred: GDPR Art 17 — destroy encryption keys, making data permanently unrecoverable
//
// Crypto shredding works by deleting the encryption key (from Vault or DB).
// Without the key, the AES-256-GCM ciphertext cannot be decrypted — ever.

import { eq, and, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { documents, documentVersions, auditLogs } from '../db/schema.js';
import uploadConfig from '../config/upload.config.js';
import { s3MoveToArchive, s3RestoreFromArchive, s3Delete } from './minio.service.js';
import { deleteDocumentVector } from './qdrant.service.js';

const keyProvider = uploadConfig.keyProvider;

// Lazy-load vault to avoid connection errors when not using vault
let vaultService = null;
const getVaultService = async () => {
  if (!vaultService) vaultService = await import('./vault.service.js');
  return vaultService;
};

/**
 * Archive a document version — move encrypted file to archive storage.
 * The file remains encrypted and can be restored later.
 *
 * @param {string} versionId — UUID of the document version to archive
 * @param {string} userId — who triggered the archive
 * @returns {{ success: boolean, archivedKey: string }}
 */
export const archiveVersion = async (versionId, userId) => {
  const [version] = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.id, versionId))
    .limit(1);

  if (!version) throw new Error(`Version not found: ${versionId}`);
  if (version.archiveStatus === 'archived') throw new Error('Version is already archived');

  const storageKey = version.s3Key;

  if (uploadConfig.storageProvider === 'minio') {
    await s3MoveToArchive(storageKey);
  }
  // For local storage, we just update the status (no physical move)

  // Update archive status in DB
  await db
    .update(documentVersions)
    .set({
      archiveStatus: 'archived',
      s3Bucket: uploadConfig.storageProvider === 'minio'
        ? uploadConfig.s3.archiveBucket
        : 'local-archive',
    })
    .where(eq(documentVersions.id, versionId));

  // Audit log
  await db.insert(auditLogs).values({
    organizationId: (await getDocOrgId(version.documentId)),
    userId,
    action: 'archive',
    resourceType: 'document_version',
    resourceId: versionId,
    details: { storageKey, documentId: version.documentId },
  });

  console.log(`[Archive] Version ${versionId} archived`);
  return { success: true, archivedKey: storageKey };
};

/**
 * Restore an archived version back to active storage.
 *
 * @param {string} versionId
 * @param {string} userId
 * @returns {{ success: boolean }}
 */
export const restoreVersion = async (versionId, userId) => {
  const [version] = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.id, versionId))
    .limit(1);

  if (!version) throw new Error(`Version not found: ${versionId}`);
  if (version.archiveStatus !== 'archived') throw new Error('Version is not archived');

  if (uploadConfig.storageProvider === 'minio') {
    await s3RestoreFromArchive(version.s3Key);
  }

  await db
    .update(documentVersions)
    .set({
      archiveStatus: 'active',
      s3Bucket: uploadConfig.storageProvider === 'minio'
        ? uploadConfig.s3.documentsBucket
        : 'local',
    })
    .where(eq(documentVersions.id, versionId));

  await db.insert(auditLogs).values({
    organizationId: (await getDocOrgId(version.documentId)),
    userId,
    action: 'restore',
    resourceType: 'document_version',
    resourceId: versionId,
    details: { documentId: version.documentId },
  });

  console.log(`[Archive] Version ${versionId} restored`);
  return { success: true };
};

/**
 * Crypto Shred a document — GDPR Art 17 (Right to Erasure).
 *
 * This permanently destroys ALL encryption keys for a document,
 * making the ciphertext in storage permanently unreadable.
 *
 * Steps:
 *   1. Delete per-document key from Vault (if using Vault)
 *   2. Nullify encryption key in database for ALL versions
 *   3. Delete vector embedding from Qdrant
 *   4. Optionally delete the ciphertext files from storage
 *   5. Update document status to 'deleted'
 *   6. Audit log the crypto shredding event
 *
 * @param {string} documentId — UUID of the document
 * @param {string} userId — who triggered the shred
 * @param {object} options
 * @param {boolean} options.deleteCiphertext — also delete encrypted files from storage (default: true)
 * @returns {{ success: boolean, versionsShredded: number }}
 */
export const cryptoShred = async (documentId, userId, { deleteCiphertext = true } = {}) => {
  // Get all versions for this document
  const versions = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId));

  if (versions.length === 0) throw new Error(`No versions found for document: ${documentId}`);

  // Step 1: Destroy Vault per-document key (if applicable)
  if (keyProvider === 'vault') {
    try {
      const vault = await getVaultService();
      const perDocKeyName = `docloq-doc-${documentId}`;
      await vault.cryptoShredKey(perDocKeyName);
    } catch (err) {
      // Per-document key might not exist if using shared master key
      console.warn(`[CryptoShred] Vault key deletion: ${err.message}`);
    }
  }

  // Step 2: Nullify encryption keys in DB for ALL versions
  await db
    .update(documentVersions)
    .set({
      encryptionKeyId: null,
      archiveStatus: 'deleted',
    })
    .where(eq(documentVersions.documentId, documentId));

  // Step 3: Delete vector embedding from Qdrant
  try {
    await deleteDocumentVector(documentId);
  } catch (err) {
    console.warn(`[CryptoShred] Qdrant vector deletion: ${err.message}`);
  }

  // Step 4: Optionally delete the ciphertext files
  if (deleteCiphertext && uploadConfig.storageProvider === 'minio') {
    for (const version of versions) {
      try {
        // Delete from whichever bucket the version is in
        const bucket = version.archiveStatus === 'archived'
          ? uploadConfig.s3.archiveBucket
          : uploadConfig.s3.documentsBucket;
        await s3Delete(bucket, version.s3Key);
      } catch (err) {
        console.warn(`[CryptoShred] File deletion failed for ${version.s3Key}: ${err.message}`);
      }
    }
  }

  // Step 5: Update document status
  await db
    .update(documents)
    .set({ status: 'deleted' })
    .where(eq(documents.id, documentId));

  // Step 6: Audit log
  const orgId = await getDocOrgId(documentId);
  await db.insert(auditLogs).values({
    organizationId: orgId,
    userId,
    action: 'delete',
    resourceType: 'document',
    resourceId: documentId,
    details: {
      method: 'crypto_shredding',
      versionsShredded: versions.length,
      ciphertextDeleted: deleteCiphertext,
      gdprArticle: 'Art. 17 Right to Erasure',
    },
  });

  console.log(`[CryptoShred] Document ${documentId}: ${versions.length} versions permanently destroyed`);
  return { success: true, versionsShredded: versions.length };
};

/**
 * Find and archive document versions older than a threshold.
 * Intended to be called periodically (e.g. daily cron).
 *
 * @param {number} olderThanDays — archive versions older than this (default: 365)
 * @param {string} systemUserId — system user ID for audit log
 * @returns {{ archivedCount: number }}
 */
export const archiveOldVersions = async (olderThanDays = 365, systemUserId = 'system') => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const oldVersions = await db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.archiveStatus, 'active'),
        lt(documentVersions.createdAt, cutoffDate),
      ),
    );

  let archivedCount = 0;
  for (const version of oldVersions) {
    try {
      await archiveVersion(version.id, systemUserId);
      archivedCount++;
    } catch (err) {
      console.error(`[Archive] Failed to archive version ${version.id}:`, err.message);
    }
  }

  if (archivedCount > 0) {
    console.log(`[Archive] Archived ${archivedCount} versions older than ${olderThanDays} days`);
  }

  return { archivedCount };
};

// ============================================================
// Internal helper
// ============================================================

const getDocOrgId = async (documentId) => {
  const [doc] = await db
    .select({ organizationId: documents.organizationId })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  return doc?.organizationId || null;
};
