// Upload Processing Pipeline — Main Orchestrator
//
// Pipeline steps:
//  1. VALIDATE        — file type, size, magic bytes
//  2. TEMP STORE      — save to temp directory
//  3. SCAN            — malware scan (ClamAV or skip in dev)
//  4. EXTRACT TEXT    — extract text from PDF / plain text (office/image = raw hash)
//  5. NORMALIZE       — 7-step normalisation pipeline
//  6. HASH            — Document DNA (SHA-256, SSDEEP, SimHash)
//  7. DUPLICATE CHECK — look for existing exact / similar documents
//  8. HONEYTOKEN      — inject honeytokens (text-based files only)
//  9. QR CODE         — generate verification QR
// 10. ENCRYPT         — AES-256-GCM encryption
// 11. STORE           — persist encrypted file to storage (local / S3)
// 12. DATABASE        — insert into documents, versions, honeytokens, qr codes, audit logs
// 13. CLEANUP         — secure-wipe temp file
// 14. RETURN          — return document metadata + warnings

import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { eq } from 'drizzle-orm';

import uploadConfig from '../config/upload.config.js';
import { db } from '../db/index.js';
import {
  documents,
  documentVersions,
  documentHoneytokens,
  documentQrCodes,
  temporaryUploads,
  auditLogs,
} from '../db/schema.js';

import { saveToTemp, uploadFile } from './storage.service.js';
import { generateDocumentKey, encryptFile } from './encryption.service.js';
import {
  generateSHA256,
  normalizeText,
  generateDocumentDNA,
  checkDuplicate,
} from './hash.service.js';
import { injectHoneytokens } from './honeytoken.service.js';
import { generateVerificationQR } from './qrcode.service.js';
import { scanFile } from './scanner.service.js';
import { secureWipe } from './secure-wipe.service.js';
import { saveQrCode } from './storage.service.js';

// ============================================================
// Helpers
// ============================================================

const log = (step, msg) => console.log(`[Upload Pipeline] Step ${step}: ${msg}`);

/**
 * Attempt to extract text from file buffer based on MIME type category.
 */
const extractText = async (buffer, mimeType) => {
  const category = uploadConfig.mimeToCategory[mimeType] || 'unknown';

  switch (category) {
    case 'pdf': {
      try {
        const { default: pdfParse } = await import('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text || '';
      } catch (err) {
        console.warn('[Pipeline] pdf-parse failed, falling back to raw hash:', err.message);
        return null; // Will hash raw buffer instead
      }
    }

    case 'text':
      return buffer.toString('utf-8');

    case 'office':
      // TODO: Implement office text extraction (mammoth for docx, xlsx-parse, etc.)
      // For now, return null → pipeline will hash the raw file bytes
      return null;

    case 'image':
      // No text to extract from images
      return null;

    default:
      return null;
  }
};

// ============================================================
// Main Pipeline
// ============================================================

/**
 * Process a file upload through the full 14-step pipeline.
 *
 * @param {{ buffer: Buffer, originalname: string, mimetype: string, size: number }} file — multer file
 * @param {string} userId
 * @param {string} organizationId
 * @param {string|null} folderId
 * @returns {{ success: boolean, data?: object, warnings?: string[], message?: string }}
 */
export const uploadPipeline = async (file, userId, organizationId, folderId = null) => {
  const sessionId = randomUUID();
  const warnings = [];
  let tempPath = null;

  try {
    // ──────────────────────────────────────────────
    // STEP 1: VALIDATE
    // ──────────────────────────────────────────────
    log(1, 'Validating file...');

    if (!file || !file.buffer) {
      throw new Error('No file buffer provided');
    }

    // Check size
    if (file.size > uploadConfig.maxFileSize) {
      throw new Error(`File exceeds maximum size of ${uploadConfig.maxFileSize / (1024 * 1024)} MB`);
    }

    // Check MIME type from multer header
    if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }

    // Deep inspection: magic bytes
    const detectedType = await fileTypeFromBuffer(file.buffer);
    if (detectedType) {
      if (!uploadConfig.allowedMimeTypes.includes(detectedType.mime)) {
        throw new Error(`Detected file type (${detectedType.mime}) does not match allowed types`);
      }
    }
    // Plain text files may not have magic bytes — that's fine

    // ──────────────────────────────────────────────
    // STEP 2: TEMP STORE
    // ──────────────────────────────────────────────
    log(2, 'Saving to temp storage...');
    const ext = path.extname(file.originalname) || '.bin';
    const tempResult = await saveToTemp(file.buffer, sessionId, ext);
    tempPath = tempResult.tempPath;

    // Record upload session in DB
    await db.insert(temporaryUploads).values({
      uploadSessionId: sessionId,
      userId,
      organizationId,
      originalFilename: file.originalname,
      tempFilePath: tempPath,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'scanning',
      expiresAt: new Date(Date.now() + uploadConfig.tempUpload.expirationMinutes * 60 * 1000),
    });

    // ──────────────────────────────────────────────
    // STEP 3: SCAN (malware)
    // ──────────────────────────────────────────────
    log(3, 'Scanning for malware...');
    const scanResult = await scanFile(tempPath);

    if (!scanResult.isClean) {
      await secureWipe(tempPath);
      tempPath = null;
      throw new Error(`File rejected: malware detected (${scanResult.threatName})`);
    }

    if (scanResult.skipped) {
      warnings.push('Malware scan was skipped (scanner disabled or unavailable)');
    }

    // ──────────────────────────────────────────────
    // STEP 4: EXTRACT TEXT
    // ──────────────────────────────────────────────
    log(4, 'Extracting text content...');
    await updateTempStatus(sessionId, 'processing', 'extraction');
    const textContent = await extractText(file.buffer, file.mimetype);
    const hasText = textContent !== null && textContent.length > 0;

    if (!hasText) {
      warnings.push('Text extraction not available for this file type — hashing raw bytes');
    }

    // ──────────────────────────────────────────────
    // STEP 5: NORMALIZE
    // ──────────────────────────────────────────────
    log(5, 'Normalizing text...');
    await updateTempStatus(sessionId, 'processing', 'normalization');
    const normalizedText = hasText ? normalizeText(textContent) : null;

    // ──────────────────────────────────────────────
    // STEP 6: HASH — Document DNA
    // ──────────────────────────────────────────────
    log(6, 'Generating Document DNA...');
    await updateTempStatus(sessionId, 'processing', 'hashing');

    // If we extracted text, hash the normalised text. Otherwise hash the raw buffer.
    const hashInput = normalizedText || file.buffer;
    const dna = generateDocumentDNA(
      typeof hashInput === 'string' ? hashInput : hashInput.toString('base64'),
    );

    // Always compute a raw-file SHA-256 for the version record
    const rawFileSha256 = generateSHA256(file.buffer);

    // ──────────────────────────────────────────────
    // STEP 7: DUPLICATE CHECK
    // ──────────────────────────────────────────────
    log(7, 'Checking for duplicates...');
    const dupResult = await checkDuplicate(dna.sha256, dna.ssdeep, dna.simhash);

    if (dupResult.isExact) {
      warnings.push(`Exact duplicate found: ${dupResult.matches.filter((m) => m.matchType === 'exact').map((m) => m.filename).join(', ')}`);
    }
    if (dupResult.isSimilar) {
      warnings.push(`Similar documents found: ${dupResult.matches.filter((m) => m.matchType === 'similar').map((m) => `${m.filename} (${m.similarity}%)`).join(', ')}`);
    }

    // ──────────────────────────────────────────────
    // STEP 8: HONEYTOKEN
    // ──────────────────────────────────────────────
    log(8, 'Injecting honeytokens...');
    await updateTempStatus(sessionId, 'processing', 'honeytoken');

    let honeytokenResult = null;
    // Only inject into text-based content that we were able to extract
    if (hasText && normalizedText) {
      const docId = randomUUID(); // Pre-generate document ID
      honeytokenResult = {
        docId,
        ...injectHoneytokens(textContent, {
          documentId: docId,
          userId,
          organizationId,
        }),
      };
    }

    // The document ID — either from honeytoken step or newly generated
    const documentId = honeytokenResult?.docId || randomUUID();

    // ──────────────────────────────────────────────
    // STEP 9: QR CODE
    // ──────────────────────────────────────────────
    log(9, 'Generating verification QR code...');
    await updateTempStatus(sessionId, 'processing', 'qr');

    const qrResult = await generateVerificationQR(documentId, dna.sha256, organizationId);
    const qrFilename = `${documentId}-qr.png`;
    await saveQrCode(qrResult.qrBuffer, qrFilename);

    // ──────────────────────────────────────────────
    // STEP 10: ENCRYPT
    // ──────────────────────────────────────────────
    log(10, 'Encrypting file...');
    await updateTempStatus(sessionId, 'processing', 'encryption');

    // If honeytokens were injected into text, encrypt the modified text.
    // Otherwise encrypt the original file buffer.
    let bufferToEncrypt = file.buffer;
    if (honeytokenResult && honeytokenResult.modifiedText) {
      bufferToEncrypt = Buffer.from(honeytokenResult.modifiedText, 'utf-8');
      log(10, 'Encrypting honeytoken-modified content');
    }

    const keyData = generateDocumentKey();
    const encResult = encryptFile(bufferToEncrypt, keyData.plaintextKey, keyData.iv);

    // ──────────────────────────────────────────────
    // STEP 11: STORE — persist encrypted file
    // ──────────────────────────────────────────────
    log(11, 'Storing encrypted file...');
    const storageKey = `${documentId}/${Date.now()}${ext}.enc`;
    const storageResult = await uploadFile(encResult.encryptedBuffer, storageKey, {
      documentId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      authTag: encResult.authTag,
    });

    // ──────────────────────────────────────────────
    // STEP 12: DATABASE — insert all records
    // ──────────────────────────────────────────────
    log(12, 'Writing to database...');
    await updateTempStatus(sessionId, 'processing', 'database');

    // 12a. Insert document
    const [newDoc] = await db.insert(documents).values({
      id: documentId,
      organizationId,
      folderId: folderId || null,
      filename: storageKey,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      ownerId: userId,
      status: 'active',
      contentHash: dna.sha256,
      ssdeepHash: dna.ssdeep,
      simHash: dna.simhash,
      versionCount: 1,
    }).returning();

    // 12b. Insert document version
    const [newVersion] = await db.insert(documentVersions).values({
      documentId,
      versionNumber: 1,
      s3Key: storageKey,            // Works for local storage too
      s3Bucket: storageResult.bucket,
      fileSize: file.size,
      encryptionKeyId: keyData.encryptedKey, // base64-encoded encrypted document key (for decryption)
      encryptionIv: keyData.iv,
      encryptionSalt: keyData.salt,
      sha256Hash: rawFileSha256,
      bodyHash: dna.sha256,
      archiveStatus: 'active',
      createdBy: userId,
      changeNote: 'Initial upload',
    }).returning();

    // 12c. Update document currentVersionId
    await db.update(documents)
      .set({ currentVersionId: newVersion.id })
      .where(eq(documents.id, documentId));

    // 12d. Insert honeytoken record (if applicable)
    if (honeytokenResult) {
      await db.insert(documentHoneytokens).values({
        documentId,
        versionId: newVersion.id,
        zwcToken: honeytokenResult.tokens.zwcToken,
        zwcPositions: honeytokenResult.tokens.zwcPositions,
        homoglyphToken: honeytokenResult.tokens.homoglyphToken,
        homoglyphPositions: honeytokenResult.tokens.homoglyphPositions,
        whitespaceToken: honeytokenResult.tokens.whitespaceToken,
        whitespacePositions: honeytokenResult.tokens.whitespacePositions,
        combinedPayloadHash: honeytokenResult.tokens.combinedPayloadHash,
        isActive: true,
      });
    }

    // 12e. Insert QR code record
    await db.insert(documentQrCodes).values({
      documentId,
      versionId: newVersion.id,
      payloadHash: qrResult.payloadHash,
      signatureHash: qrResult.signature,
      verificationUrl: qrResult.verificationUrl,
      shortCode: qrResult.shortCode,
      qrImageS3Key: qrFilename,
      isActive: true,
    });

    // 12f. Audit log
    await db.insert(auditLogs).values({
      organizationId,
      userId,
      action: 'create',
      resourceType: 'document',
      resourceId: documentId,
      details: {
        filename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        hasHoneytokens: !!honeytokenResult,
        duplicateWarnings: dupResult.isExact || dupResult.isSimilar,
        pipelineSessionId: sessionId,
      },
    });

    // 12g. Update temp upload → completed
    await db
      .update(temporaryUploads)
      .set({
        status: 'completed',
        resultDocumentId: documentId,
        completedAt: new Date(),
      })
      .where(eq(temporaryUploads.uploadSessionId, sessionId));

    // Also store the encrypted key in a retrievable way.
    // In a real production setup the encryptedKey goes into a separate keys table
    // or is stored alongside the version. We stash it in the version's metadata
    // via an update (since the schema doesn't have a dedicated column, we reuse s3Key metadata).
    // For now, the encryptedKey + authTag are stored as JSON in a sidecar approach:
    // The storage.service already saved a .meta.json with authTag.
    // We also need the encryptedKey available for decryption — store in version:
    // We'll use encryptionKeyId to hold encrypted key data (expand later if schema updated).

    // ──────────────────────────────────────────────
    // STEP 13: CLEANUP — secure wipe temp file
    // ──────────────────────────────────────────────
    log(13, 'Cleaning up temp files...');
    if (tempPath) {
      await secureWipe(tempPath);
      tempPath = null;
    }

    // ──────────────────────────────────────────────
    // STEP 14: RETURN
    // ──────────────────────────────────────────────
    log(14, 'Upload complete ✓');

    return {
      success: true,
      data: {
        document: newDoc,
        version: newVersion,
        qrCode: {
          shortCode: qrResult.shortCode,
          verificationUrl: qrResult.verificationUrl,
        },
        dna: {
          sha256: dna.sha256,
          ssdeep: dna.ssdeep,
          simhash: dna.simhash,
        },
        encryption: {
          keyId: keyData.keyId,
          algorithm: 'aes-256-gcm',
        },
        storage: {
          key: storageKey,
          bucket: storageResult.bucket,
        },
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (err) {
    console.error('[Upload Pipeline] Error:', err.message);

    // Cleanup temp file on failure
    if (tempPath) {
      try {
        await secureWipe(tempPath);
      } catch (cleanErr) {
        console.error('[Upload Pipeline] Cleanup also failed:', cleanErr.message);
      }
    }

    // Update temp upload status → failed
    try {
      await db
        .update(temporaryUploads)
        .set({ status: 'failed', errorMessage: err.message })
        .where(eq(temporaryUploads.uploadSessionId, sessionId));
    } catch { /* best-effort */ }

    return {
      success: false,
      message: err.message,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
};

// ============================================================
// Internal helper: update temp upload status
// ============================================================

const updateTempStatus = async (sessionId, status, stage) => {
  try {
    await db
      .update(temporaryUploads)
      .set({ status, processingStage: stage })
      .where(eq(temporaryUploads.uploadSessionId, sessionId));
  } catch { /* non-critical */ }
};
