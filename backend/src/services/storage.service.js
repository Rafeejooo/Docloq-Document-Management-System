// Storage Abstraction Layer
// Currently implements LocalStorageProvider.
// TODO: Replace with S3StorageProvider for production (AWS S3).

import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import uploadConfig from '../config/upload.config.js';

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

/**
 * Upload a file buffer to local storage.
 * @param {Buffer} fileBuffer
 * @param {string} key — relative path / filename (e.g. "abc-123.enc")
 * @param {object} metadata — optional metadata (ignored for local, stored as sidecar .meta.json)
 * @returns {{ key: string, bucket: string, size: number }}
 */
export const uploadFile = async (fileBuffer, key, metadata = {}) => {
  // TODO: Replace with S3 putObject when switching to AWS
  const destDir = uploadConfig.documentsDir;
  await ensureDir(destDir);

  const filePath = path.join(destDir, key);
  // Ensure sub-directories inside documents/ if key contains slashes
  await ensureDir(path.dirname(filePath));

  await fs.writeFile(filePath, fileBuffer);

  // Optionally persist metadata as sidecar JSON
  if (Object.keys(metadata).length > 0) {
    const metaPath = `${filePath}.meta.json`;
    await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2));
  }

  return {
    key,
    bucket: 'local',
    size: fileBuffer.length,
  };
};

/**
 * Download (read) a file from local storage.
 * @param {string} key
 * @returns {Buffer}
 */
export const downloadFile = async (key) => {
  // TODO: Replace with S3 getObject when switching to AWS
  const filePath = path.join(uploadConfig.documentsDir, key);

  try {
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`File not found: ${key}`);
    }
    throw err;
  }
};

/**
 * Delete a file from local storage.
 * @param {string} key
 * @returns {boolean}
 */
export const deleteFile = async (key) => {
  // TODO: Replace with S3 deleteObject when switching to AWS
  const filePath = path.join(uploadConfig.documentsDir, key);

  try {
    await fs.unlink(filePath);
    // Also remove sidecar metadata if present
    try { await fs.unlink(`${filePath}.meta.json`); } catch { /* ignore */ }
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
};

/**
 * Get a URL (or local file path) to access the file.
 * In local mode this returns the absolute path.
 * @param {string} key
 * @param {number} _expiresIn — ignored for local; used for presigned URLs in S3
 * @returns {string}
 */
export const getFileUrl = (key, _expiresIn = 3600) => {
  // TODO: Replace with S3 getSignedUrl when switching to AWS
  return path.join(uploadConfig.documentsDir, key);
};

/**
 * Check whether a file exists in storage.
 * @param {string} key
 * @returns {boolean}
 */
export const fileExists = async (key) => {
  // TODO: Replace with S3 headObject when switching to AWS
  const filePath = path.join(uploadConfig.documentsDir, key);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// ============================================================
// Helper: store to temp directory (used during upload pipeline)
// ============================================================

/**
 * Save an upload buffer to the temp directory.
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
  const qrDir = uploadConfig.qrCodesDir;
  await ensureDir(qrDir);

  const filePath = path.join(qrDir, filename);
  await fs.writeFile(filePath, qrBuffer);
  return filename;
};

// ============================================================
// Initialise storage directories on import
// ============================================================

export const initStorageDirs = async () => {
  await ensureDir(uploadConfig.storagePath);
  await ensureDir(uploadConfig.documentsDir);
  await ensureDir(uploadConfig.tempDir);
  await ensureDir(uploadConfig.qrCodesDir);
  await ensureDir(uploadConfig.thumbnailsDir);
};

// Auto-init directories
initStorageDirs().catch((err) =>
  console.error('[Storage] Failed to initialise storage directories:', err.message),
);

// ============================================================
// S3StorageProvider — placeholder for AWS production
// ============================================================

// TODO: Implement S3StorageProvider using @aws-sdk/client-s3
// export const s3UploadFile = async (fileBuffer, key, metadata) => { ... };
// export const s3DownloadFile = async (key) => { ... };
// export const s3DeleteFile = async (key) => { ... };
// export const s3GetFileUrl = async (key, expiresIn) => { ... };
// export const s3FileExists = async (key) => { ... };
//
// When ready, swap the default exports in this module to use S3
// based on uploadConfig.storageProvider === 's3'.
