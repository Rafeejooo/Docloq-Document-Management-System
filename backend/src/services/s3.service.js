// S3-Compatible Storage Provider (Cloudflare R2 / MinIO / AWS S3)
// Uses @aws-sdk/client-s3 — compatible with R2, MinIO, and AWS S3.
// Switching providers requires only changing the endpoint URL and credentials.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import uploadConfig from '../config/upload.config.js';

let s3Client = null;

/**
 * Get or create the S3 client singleton.
 * Works identically against Cloudflare R2, MinIO, and AWS S3.
 */
const getClient = () => {
  if (s3Client) return s3Client;

  const { endpoint, region, accessKey, secretKey, forcePathStyle } = uploadConfig.s3;

  s3Client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle, // Required for MinIO and R2
  });

  console.log(`[S3] Client initialized → ${endpoint}`);
  return s3Client;
};

/**
 * Upload a file buffer to an S3/MinIO bucket.
 * @param {string} bucket
 * @param {string} key — object key (e.g. "doc-uuid/1234.pdf.enc")
 * @param {Buffer} buffer
 * @param {object} metadata — custom metadata key-value pairs
 * @returns {{ key: string, bucket: string, size: number }}
 */
export const s3Upload = async (bucket, key, buffer, metadata = {}) => {
  const client = getClient();

  // Flatten metadata values to strings (S3 metadata must be string values)
  const s3Metadata = {};
  for (const [k, v] of Object.entries(metadata)) {
    s3Metadata[k] = String(v);
  }

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    Metadata: s3Metadata,
  }));

  return { key, bucket, size: buffer.length };
};

/**
 * Download a file from an S3/MinIO bucket.
 * @param {string} bucket
 * @param {string} key
 * @returns {Buffer}
 */
export const s3Download = async (bucket, key) => {
  const client = getClient();

  const response = await client.send(new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }));

  // Convert readable stream to Buffer
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

/**
 * Delete a file from an S3/MinIO bucket.
 * @param {string} bucket
 * @param {string} key
 * @returns {boolean}
 */
export const s3Delete = async (bucket, key) => {
  const client = getClient();

  try {
    await client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
    return true;
  } catch (err) {
    if (err.name === 'NoSuchKey') return false;
    throw err;
  }
};

/**
 * Check if a file exists in an S3/MinIO bucket.
 * @param {string} bucket
 * @param {string} key
 * @returns {boolean}
 */
export const s3Exists = async (bucket, key) => {
  const client = getClient();

  try {
    await client.send(new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
};

/**
 * Generate a presigned download URL.
 * @param {string} bucket
 * @param {string} key
 * @param {number} expiresIn — seconds until URL expires (default 1 hour)
 * @returns {string} — presigned URL
 */
export const s3GetPresignedUrl = async (bucket, key, expiresIn = 3600) => {
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  // R2 max presigned URL expiry is 7 days (604800s)
  const clampedExpiry = Math.min(expiresIn, 604800);
  return getSignedUrl(client, command, { expiresIn: clampedExpiry });
};

/**
 * Move a file from documents bucket to archive bucket.
 * Used for GDPR-compliant archival of old document versions.
 * @param {string} key — object key to archive
 * @returns {{ archivedKey: string }}
 */
export const s3MoveToArchive = async (key) => {
  const client = getClient();
  const { documentsBucket, archiveBucket } = uploadConfig.s3;

  // Copy to archive bucket
  await client.send(new CopyObjectCommand({
    Bucket: archiveBucket,
    Key: key,
    CopySource: `/${documentsBucket}/${key}`,
  }));

  // Delete from documents bucket
  await client.send(new DeleteObjectCommand({
    Bucket: documentsBucket,
    Key: key,
  }));

  console.log(`[S3] Archived: ${documentsBucket}/${key} → ${archiveBucket}/${key}`);
  return { archivedKey: key };
};

/**
 * Restore a file from archive bucket back to documents bucket.
 * @param {string} key
 * @returns {{ restoredKey: string }}
 */
export const s3RestoreFromArchive = async (key) => {
  const client = getClient();
  const { documentsBucket, archiveBucket } = uploadConfig.s3;

  await client.send(new CopyObjectCommand({
    Bucket: documentsBucket,
    Key: key,
    CopySource: `/${archiveBucket}/${key}`,
  }));

  await client.send(new DeleteObjectCommand({
    Bucket: archiveBucket,
    Key: key,
  }));

  console.log(`[S3] Restored: ${archiveBucket}/${key} → ${documentsBucket}/${key}`);
  return { restoredKey: key };
};
