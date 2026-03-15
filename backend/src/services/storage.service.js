// Storage Abstraction Layer
// Supports two providers:
//   - "local"  → files on disk (development default)
//   - "minio"  → MinIO / AWS S3 via @aws-sdk/client-s3
//
// All public functions have the same signature regardless of provider.
// Switching provider requires only changing STORAGE_PROVIDER env var.

import fs from 'fs/promises';
import path from 'path';
import uploadConfig from '../config/upload.config.js';
import {
  s3Upload,
  s3Download,
  s3Delete,
  s3Exists,
  s3GetPresignedUrl,
} from './minio.service.js';

const provider = uploadConfig.storageProvider; // 'local' | 'minio'

// ============================================================
// LocalStorageProvider — saves files to local disk
// ============================================================

const ensureDir = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const localUpload = async (fileBuffer, key, metadata = {}) => {
  const destDir = uploadConfig.documentsDir;
  await ensureDir(destDir);

  const filePath = path.join(destDir, key);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, fileBuffer);

  if (Object.keys(metadata).length > 0) {
    const metaPath = `${filePath}.meta.json`;
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));
  }

  return { key, bucket: 'local', size: fileBuffer.length };
};

const localDownload = async (key) => {
  const filePath = path.join(uploadConfig.documentsDir, key);
  try {
    return await fs.readFile(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error(`File not found: ${key}`);
    throw err;
  }
};

const localDelete = async (key) => {
  const filePath = path.join(uploadConfig.documentsDir, key);
  try {
    await fs.unlink(filePath);
    try { await fs.unlink(`${filePath}.meta.json`); } catch { /* ignore */ }
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
};

const localGetFileUrl = (key) => {
  return path.join(uploadConfig.documentsDir, key);
};

const localExists = async (key) => {
  const filePath = path.join(uploadConfig.documentsDir, key);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// ============================================================
// MinIO / S3 Provider — delegates to minio.service.js
// ============================================================

const minioUpload = async (fileBuffer, key, metadata = {}) => {
  const result = await s3Upload(uploadConfig.s3.documentsBucket, key, fileBuffer, metadata);

  // Also upload sidecar .meta.json (needed for authTag retrieval during download)
  if (Object.keys(metadata).length > 0) {
    const metaBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
    await s3Upload(uploadConfig.s3.documentsBucket, `${key}.meta.json`, metaBuffer, {
      contentType: 'application/json',
    });
  }

  return result;
};

const minioDownload = async (key) => {
  return s3Download(uploadConfig.s3.documentsBucket, key);
};

const minioDelete = async (key) => {
  return s3Delete(uploadConfig.s3.documentsBucket, key);
};

const minioGetFileUrl = async (key, expiresIn = 3600) => {
  return s3GetPresignedUrl(uploadConfig.s3.documentsBucket, key, expiresIn);
};

const minioExists = async (key) => {
  return s3Exists(uploadConfig.s3.documentsBucket, key);
};

// ============================================================
// Public API — provider-agnostic
// ============================================================

/**
 * Upload a file buffer to storage.
 * @param {Buffer} fileBuffer
 * @param {string} key — relative path / filename (e.g. "abc-123.enc")
 * @param {object} metadata — optional metadata
 * @returns {{ key: string, bucket: string, size: number }}
 */
export const uploadFile = async (fileBuffer, key, metadata = {}) => {
  if (provider === 'minio') return minioUpload(fileBuffer, key, metadata);
  return localUpload(fileBuffer, key, metadata);
};

/**
 * Download (read) a file from storage.
 * @param {string} key
 * @returns {Buffer}
 */
export const downloadFile = async (key) => {
  if (provider === 'minio') return minioDownload(key);
  return localDownload(key);
};

/**
 * Delete a file from storage.
 * @param {string} key
 * @returns {boolean}
 */
export const deleteFile = async (key) => {
  if (provider === 'minio') return minioDelete(key);
  return localDelete(key);
};

/**
 * Get a URL (or local file path) to access the file.
 * For MinIO: returns a presigned URL (temporary, secure).
 * For local: returns the absolute file path.
 * @param {string} key
 * @param {number} expiresIn — seconds (only used for MinIO/S3)
 * @returns {string|Promise<string>}
 */
export const getFileUrl = (key, expiresIn = 3600) => {
  if (provider === 'minio') return minioGetFileUrl(key, expiresIn);
  return localGetFileUrl(key);
};

/**
 * Check whether a file exists in storage.
 * @param {string} key
 * @returns {boolean}
 */
export const fileExists = async (key) => {
  if (provider === 'minio') return minioExists(key);
  return localExists(key);
};

// ============================================================
// Helper: store to temp directory (always local — temp is local disk)
// ============================================================

/**
 * Save an upload buffer to the temp directory.
 * Temp storage is always local regardless of provider.
 * @param {Buffer} fileBuffer
 * @param {string} sessionId — unique upload session id
 * @param {string} ext — file extension including dot, e.g. ".pdf"
 * @returns {{ tempPath: string, sessionId: string }}
 */
export const saveToTemp = async (fileBuffer, sessionId, ext) => {
  const tempDir = uploadConfig.tempDir;
  await ensureDir(tempDir);

  const tempFilename = `${sessionId}${ext}`;
  const tempPath = path.join(tempDir, tempFilename);
  await fs.writeFile(tempPath, fileBuffer);

  return { tempPath, sessionId };
};

/**
 * Store a QR code image buffer.
 * @param {Buffer} qrBuffer
 * @param {string} filename
 * @returns {string} — storage key for the QR image
 */
export const saveQrCode = async (qrBuffer, filename) => {
  if (provider === 'minio') {
    await s3Upload(uploadConfig.s3.qrBucket, filename, qrBuffer, {
      contentType: 'image/png',
    });
    return filename;
  }

  // Local fallback
  const qrDir = uploadConfig.qrCodesDir;
  await ensureDir(qrDir);
  const filePath = path.join(qrDir, filename);
  await fs.writeFile(filePath, qrBuffer);
  return filename;
};

// ============================================================
// Initialise local storage directories on import
// ============================================================

export const initStorageDirs = async () => {
  // Always create local dirs (needed for temp at minimum)
  await ensureDir(uploadConfig.storagePath);
  await ensureDir(uploadConfig.tempDir);

  if (provider === 'local') {
    await ensureDir(uploadConfig.documentsDir);
    await ensureDir(uploadConfig.qrCodesDir);
    await ensureDir(uploadConfig.thumbnailsDir);
    console.log('[Storage] Provider: local (filesystem)');
  } else {
    console.log(`[Storage] Provider: ${provider} (S3-compatible → ${uploadConfig.s3.endpoint})`);
  }
};

// Auto-init directories
initStorageDirs().catch((err) =>
  console.error('[Storage] Failed to initialise storage directories:', err.message),
);
