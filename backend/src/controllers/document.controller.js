// Document Controller — Full upload pipeline + CRUD operations

import { db } from '../db/index.js';
import {
  documents,
  documentVersions,
  documentQrCodes,
  auditLogs,
} from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

import { uploadPipeline } from '../services/upload-pipeline.service.js';
import { downloadFile, uploadFile } from '../services/storage.service.js';
import { decryptFile, encryptFile as encryptFileService, generateDocumentKey } from '../services/encryption.service.js';
import { verifyQRPayload } from '../services/qrcode.service.js';
import { generateSHA256 } from '../services/hash.service.js';

// ============================================================
// Legacy: Upload directory for plain OnlyOffice files
// ============================================================
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// Get all documents
export const getAllDocuments = async (req, res) => {
  try {
    const allDocs = await db.select().from(documents).orderBy(desc(documents.createdAt));
    
    res.json({
      success: true,
      data: allDocs,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
    });
  }
};

// Get single document
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
    });
  }
};

// Upload document — full pipeline (encryption, hashing, honeytokens, QR)
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Resolve user + org (from JWT middleware or fallback for testing)
    let userId = req.user?.id;
    let organizationId = req.user?.organizationId;
    const folderId = req.body?.folderId || null;

    if (!userId || !organizationId) {
      try {
        const { organizations, users } = await import('../db/schema.js');
        const [firstOrg] = await db.select().from(organizations).limit(1);
        const [firstUser] = await db.select().from(users).limit(1);
        if (firstOrg) organizationId = firstOrg.id;
        if (firstUser) userId = firstUser.id;
      } catch (e) {
        console.warn('Could not resolve org/user:', e.message);
      }
    }

    if (!userId || !organizationId) {
      return res.status(400).json({
        success: false,
        message: 'No organization or user found. Please run db:seed first or authenticate.',
      });
    }

    // Run the full 14-step pipeline
    const result = await uploadPipeline(req.file, userId, organizationId, folderId);

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: result.message,
        warnings: result.warnings,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded and processed successfully',
      data: result.data,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
    });
  }
};

// ============================================================
// Upload simple (legacy, for OnlyOffice direct saving)
// ============================================================
export const uploadDocumentSimple = async (req, res) => {
  try {
    await ensureUploadDir();

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    const fileExt = path.extname(originalname);
    const uniqueFilename = `${randomUUID()}${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);
    await fs.writeFile(filePath, buffer);

    let orgId = req.user?.organizationId;
    let userId = req.user?.id;

    if (!orgId || !userId) {
      const { organizations, users } = await import('../db/schema.js');
      const [firstOrg] = await db.select().from(organizations).limit(1);
      const [firstUser] = await db.select().from(users).limit(1);
      if (firstOrg) orgId = firstOrg.id;
      if (firstUser) userId = firstUser.id;
    }

    if (!orgId || !userId) {
      try { await fs.unlink(filePath); } catch {}
      return res.status(400).json({ success: false, message: 'No organization or user found.' });
    }

    const [newDoc] = await db.insert(documents).values({
      organizationId: orgId,
      filename: uniqueFilename,
      originalFilename: originalname,
      mimeType: mimetype,
      fileSize: size,
      ownerId: userId,
      status: 'active',
    }).returning();

    res.status(201).json({ success: true, message: 'Document uploaded (simple)', data: newDoc });
  } catch (error) {
    console.error('Simple upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

// Serve document file (for OnlyOffice) — handles both legacy and encrypted pipeline files
export const serveDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // ── Strategy 1: Pipeline-encrypted file (has a version with encryption data) ──
    if (doc.currentVersionId) {
      try {
        const [version] = await db
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.id, doc.currentVersionId));

        if (version && version.encryptionKeyId && version.encryptionIv && version.s3Key) {
          // Read encrypted file from storage/documents/
          const encryptedBuffer = await downloadFile(version.s3Key);

          // Read authTag from sidecar meta.json
          let authTag = null;
          try {
            const metaBuffer = await downloadFile(`${version.s3Key}.meta.json`);
            const meta = JSON.parse(metaBuffer.toString());
            authTag = meta.authTag;
          } catch {
            // Try direct path as fallback
            const metaPath = path.join(process.cwd(), 'storage', 'documents', `${version.s3Key}.meta.json`);
            try {
              const metaRaw = await fs.readFile(metaPath, 'utf-8');
              const meta = JSON.parse(metaRaw);
              authTag = meta.authTag;
            } catch { /* no meta file */ }
          }

          if (authTag) {
            const decryptedBuffer = decryptFile(
              encryptedBuffer,
              version.encryptionKeyId,
              version.encryptionIv,
              authTag,
            );

            res.setHeader('Content-Type', doc.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename}"`);
            return res.send(decryptedBuffer);
          }
        }
      } catch (err) {
        console.warn('Encrypted serve failed, falling back to legacy:', err.message);
      }
    }

    // ── Strategy 2: Legacy plain file in uploads/ ──
    const legacyPath = path.join(UPLOAD_DIR, doc.filename);
    try {
      await fs.access(legacyPath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk',
      });
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename}"`);

    const fileBuffer = await fs.readFile(legacyPath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Serve document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve document',
    });
  }
};

// Download document (handles both legacy and encrypted pipeline files)
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // ── Pipeline-encrypted file ──
    if (doc.currentVersionId) {
      try {
        const [version] = await db
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.id, doc.currentVersionId));

        if (version && version.encryptionKeyId && version.encryptionIv && version.s3Key) {
          const encryptedBuffer = await downloadFile(version.s3Key);

          let authTag = null;
          try {
            const metaBuffer = await downloadFile(`${version.s3Key}.meta.json`);
            const meta = JSON.parse(metaBuffer.toString());
            authTag = meta.authTag;
          } catch {
            const metaPath = path.join(process.cwd(), 'storage', 'documents', `${version.s3Key}.meta.json`);
            try {
              const metaRaw = await fs.readFile(metaPath, 'utf-8');
              authTag = JSON.parse(metaRaw).authTag;
            } catch { /* no meta */ }
          }

          if (authTag) {
            const decryptedBuffer = decryptFile(
              encryptedBuffer,
              version.encryptionKeyId,
              version.encryptionIv,
              authTag,
            );

            res.setHeader('Content-Type', doc.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${doc.originalFilename}"`);
            return res.send(decryptedBuffer);
          }
        }
      } catch (err) {
        console.warn('Encrypted download failed, falling back to legacy:', err.message);
      }
    }

    // ── Legacy plain file ──
    const filePath = path.join(UPLOAD_DIR, doc.filename);
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk',
      });
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalFilename}"`);

    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document',
    });
  }
};

// Delete document (handles both legacy and encrypted pipeline files)
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Try deleting encrypted storage directory
    const storagePath = path.join(process.cwd(), 'storage', 'documents', id);
    try {
      await fs.rm(storagePath, { recursive: true, force: true });
    } catch (err) {
      console.warn('Could not delete storage dir:', err.message);
    }

    // Try deleting legacy file
    const legacyPath = path.join(UPLOAD_DIR, doc.filename);
    try {
      await fs.unlink(legacyPath);
    } catch (err) {
      // Not in legacy uploads — that's fine
    }

    // Delete from database
    await db.delete(documents).where(eq(documents.id, id));

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
    });
  }
};

// Get OnlyOffice config for viewing/editing
export const getOnlyOfficeConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode = 'view' } = req.query; // view or edit
    
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Get file extension for documentType
    const ext = path.extname(doc.originalFilename).toLowerCase().slice(1);
    const documentType = getDocumentType(ext);
    
    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format for OnlyOffice',
      });
    }
    
    // For OnlyOffice running in Docker, it needs to access the backend via host.docker.internal
    // On Mac/Windows Docker, host.docker.internal resolves to the host machine
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const backendUrlForDocker = process.env.BACKEND_URL_DOCKER || 'http://host.docker.internal:3000';
    const onlyOfficeUrl = process.env.ONLYOFFICE_URL || 'http://localhost:8082';
    
    // OnlyOffice configuration
    const config = {
      document: {
        fileType: ext,
        key: `${doc.id}-${doc.updatedAt?.getTime() || Date.now()}`, // Unique key for caching
        title: doc.originalFilename,
        // Use Docker-accessible URL for OnlyOffice to fetch the file
        url: `${backendUrlForDocker}/api/documents/${doc.id}/file`,
      },
      documentType: documentType,
      editorConfig: {
        mode: mode,
        lang: 'en',
        // Callback URL also needs to be Docker-accessible
        callbackUrl: `${backendUrlForDocker}/api/documents/${doc.id}/callback`,
        user: {
          id: req.user?.id || 'guest',
          name: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'Guest User',
        },
        customization: {
          autosave: true,
          chat: false,
          comments: true,
          help: false,
          hideRightMenu: false,
          logo: {
            image: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png`,
            imageEmbedded: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png`,
          },
        },
      },
      type: 'desktop', // desktop, mobile, embedded
    };
    
    res.json({
      success: true,
      data: {
        config,
        onlyOfficeUrl: `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`,
      },
    });
  } catch (error) {
    console.error('Get OnlyOffice config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OnlyOffice configuration',
    });
  }
};

// OnlyOffice callback handler (for saving edits)
export const onlyOfficeCallback = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, url, key } = req.body;

    console.log('OnlyOffice callback:', { id, status, key });

    // Status codes:
    // 0 - no document with the key identifier could be found
    // 1 - document is being edited
    // 2 - document is ready for saving
    // 3 - document saving error occurred
    // 4 - document is closed with no changes
    // 6 - document is being edited, but the current document state is saved
    // 7 - error has occurred while force saving the document

    if (status === 2 || status === 6) {
      const [doc] = await db.select().from(documents).where(eq(documents.id, id));

      if (doc && url) {
        try {
          const response = await fetch(url);
          const buffer = Buffer.from(await response.arrayBuffer());

          // Check if this is a pipeline-encrypted document (has a current version with encryption)
          let isPipelineDoc = false;
          let currentVersion = null;

          if (doc.currentVersionId) {
            [currentVersion] = await db
              .select()
              .from(documentVersions)
              .where(eq(documentVersions.id, doc.currentVersionId));

            if (currentVersion && currentVersion.encryptionKeyId && currentVersion.encryptionIv) {
              isPipelineDoc = true;
            }
          }

          if (isPipelineDoc) {
            // ── Pipeline document: re-encrypt and store in storage/documents/ ──
            const ext = path.extname(doc.originalFilename);
            const newKeyData = generateDocumentKey();
            const encResult = encryptFileService(buffer, newKeyData.plaintextKey, newKeyData.iv);

            // New storage key for the updated version
            const newStorageKey = `${doc.id}/${Date.now()}${ext}.enc`;
            await uploadFile(encResult.encryptedBuffer, newStorageKey, {
              documentId: doc.id,
              originalName: doc.originalFilename,
              mimeType: doc.mimeType,
              authTag: encResult.authTag,
            });

            // Increment version
            const newVersionNumber = (currentVersion.versionNumber || 1) + 1;

            // Insert new version
            const [newVersion] = await db.insert(documentVersions).values({
              documentId: doc.id,
              versionNumber: newVersionNumber,
              s3Key: newStorageKey,
              s3Bucket: 'local',
              fileSize: buffer.length,
              encryptionKeyId: newKeyData.encryptedKey,
              encryptionIv: newKeyData.iv,
              encryptionSalt: newKeyData.salt,
              sha256Hash: generateSHA256(buffer),
              archiveStatus: 'active',
              createdBy: doc.ownerId,
              changeNote: 'Edited via OnlyOffice',
            }).returning();

            // Update document
            await db.update(documents)
              .set({
                currentVersionId: newVersion.id,
                versionCount: newVersionNumber,
                filename: newStorageKey,
                fileSize: buffer.length,
                updatedAt: new Date(),
              })
              .where(eq(documents.id, id));

            console.log('Pipeline document saved & re-encrypted:', doc.originalFilename, `(v${newVersionNumber})`);
          } else {
            // ── Legacy document: save plain file to uploads/ ──
            const filePath = path.join(UPLOAD_DIR, doc.filename);
            await fs.writeFile(filePath, buffer);

            await db.update(documents)
              .set({ updatedAt: new Date() })
              .where(eq(documents.id, id));

            console.log('Legacy document saved:', doc.originalFilename);
          }
        } catch (saveError) {
          console.error('Error saving document from OnlyOffice:', saveError);
        }
      }
    }

    // OnlyOffice expects { "error": 0 } response
    res.json({ error: 0 });
  } catch (error) {
    console.error('OnlyOffice callback error:', error);
    res.json({ error: 0 }); // Still return success to OnlyOffice
  }
};

// ============================================================
// NEW ENDPOINTS: Versions, Download (decrypt), Verify
// ============================================================

// Get all versions of a document
export const getDocumentVersions = async (req, res) => {
  try {
    const { id } = req.params;

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const versions = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, id))
      .orderBy(desc(documentVersions.versionNumber));

    res.json({ success: true, data: versions });
  } catch (error) {
    console.error('Get document versions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch document versions' });
  }
};

// Download document (decrypt from encrypted storage)
export const downloadDocumentDecrypted = async (req, res) => {
  try {
    const { id } = req.params;
    const versionNumber = req.query.version ? parseInt(req.query.version, 10) : null;

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Get specific version or current
    let version;
    if (versionNumber) {
      [version] = await db
        .select()
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentId, id),
            eq(documentVersions.versionNumber, versionNumber),
          ),
        );
    } else if (doc.currentVersionId) {
      [version] = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.id, doc.currentVersionId));
    } else {
      // Fallback: latest version
      [version] = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, id))
        .orderBy(desc(documentVersions.versionNumber))
        .limit(1);
    }

    if (!version) {
      return res.status(404).json({ success: false, message: 'Document version not found' });
    }

    // Try encrypted download first
    try {
      const encryptedBuffer = await downloadFile(version.s3Key);

      // Read authTag from sidecar meta or version record
      // We stored metadata alongside the file in storage.service
      let authTag = null;
      try {
        const metaPath = `${version.s3Key}.meta.json`;
        const metaBuffer = await downloadFile(metaPath);
        const meta = JSON.parse(metaBuffer.toString());
        authTag = meta.authTag;
      } catch {
        // No sidecar meta — look in storage documents dir
        const storagePath = path.join(process.cwd(), 'storage', 'documents', `${version.s3Key}.meta.json`);
        try {
          const metaRaw = await fs.readFile(storagePath, 'utf-8');
          const meta = JSON.parse(metaRaw);
          authTag = meta.authTag;
        } catch { /* no meta */ }
      }

      if (authTag) {
        const decryptedBuffer = decryptFile(
          encryptedBuffer,
          version.encryptionKeyId, // This holds the encryptedKey in our pipeline
          version.encryptionIv,
          authTag,
        );

        // Audit log
        await db.insert(auditLogs).values({
          organizationId: doc.organizationId,
          userId: req.user?.id,
          action: 'download',
          resourceType: 'document',
          resourceId: id,
          details: { versionNumber: version.versionNumber, encrypted: true },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        res.setHeader('Content-Type', doc.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${doc.originalFilename}"`);
        return res.send(decryptedBuffer);
      }
    } catch (err) {
      console.warn('Encrypted download failed, trying legacy path:', err.message);
    }

    // Fallback: legacy unencrypted file in uploads/
    const legacyPath = path.join(UPLOAD_DIR, doc.filename);
    try {
      await fs.access(legacyPath);
      const fileBuffer = await fs.readFile(legacyPath);
      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${doc.originalFilename}"`);
      return res.send(fileBuffer);
    } catch {
      return res.status(404).json({ success: false, message: 'File not found in storage' });
    }
  } catch (error) {
    console.error('Download decrypted document error:', error);
    res.status(500).json({ success: false, message: 'Failed to download document' });
  }
};

// Verify document (QR code payload or hash comparison)
export const verifyDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { payload, signature, hash } = req.body;

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const result = { verified: false, methods: [] };

    // Method 1: QR payload + signature verification
    if (payload && signature) {
      const qrResult = verifyQRPayload(payload, signature);
      result.methods.push({
        method: 'qr_signature',
        valid: qrResult.isValid,
        documentId: qrResult.documentId,
      });
      if (qrResult.isValid && qrResult.documentId === id) {
        result.verified = true;
      }
    }

    // Method 2: Hash comparison
    if (hash) {
      const hashMatch = doc.contentHash === hash;
      result.methods.push({
        method: 'hash_comparison',
        valid: hashMatch,
        expectedHash: doc.contentHash,
        providedHash: hash,
      });
      if (hashMatch) {
        result.verified = true;
      }
    }

    // Method 3: If a file was uploaded for comparison
    if (req.file) {
      const uploadHash = generateSHA256(req.file.buffer);
      const hashMatch = doc.contentHash === uploadHash;
      result.methods.push({
        method: 'file_comparison',
        valid: hashMatch,
        expectedHash: doc.contentHash,
        uploadedHash: uploadHash,
      });
      if (hashMatch) {
        result.verified = true;
      }
    }

    // If no verification method provided
    if (result.methods.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one verification method: payload+signature, hash, or file upload',
      });
    }

    // Audit log
    await db.insert(auditLogs).values({
      organizationId: doc.organizationId,
      userId: req.user?.id,
      action: 'verify',
      resourceType: 'document',
      resourceId: id,
      details: { verified: result.verified, methods: result.methods.map((m) => m.method) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify document' });
  }
};

// ============================================================
// QR code verification by short code (public endpoint)
// ============================================================
export const verifyByShortCode = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Missing code parameter' });
    }

    const [qr] = await db
      .select()
      .from(documentQrCodes)
      .where(eq(documentQrCodes.shortCode, code));

    if (!qr) {
      return res.status(404).json({ success: false, message: 'Verification code not found' });
    }

    const [doc] = await db.select().from(documents).where(eq(documents.id, qr.documentId));

    // Increment scan count
    await db
      .update(documentQrCodes)
      .set({
        scanCount: (qr.scanCount || 0) + 1,
        lastScannedAt: new Date(),
      })
      .where(eq(documentQrCodes.id, qr.id));

    res.json({
      success: true,
      data: {
        verified: true,
        document: doc
          ? {
              id: doc.id,
              filename: doc.originalFilename,
              mimeType: doc.mimeType,
              status: doc.status,
              contentHash: doc.contentHash,
              createdAt: doc.createdAt,
            }
          : null,
        qrCode: {
          shortCode: qr.shortCode,
          scanCount: (qr.scanCount || 0) + 1,
          createdAt: qr.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Verify by short code error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// Helper: Get document type for OnlyOffice
function getDocumentType(extension) {
  const wordExtensions = ['doc', 'docx', 'docm', 'dot', 'dotx', 'dotm', 'odt', 'fodt', 'ott', 'rtf', 'txt', 'html', 'htm', 'mht', 'xml', 'pdf', 'djvu', 'fb2', 'epub', 'xps', 'oxps'];
  const cellExtensions = ['xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'xltm', 'ods', 'fods', 'ots', 'csv'];
  const slideExtensions = ['ppt', 'pptx', 'pptm', 'pot', 'potx', 'potm', 'odp', 'fodp', 'otp', 'ppsx'];
  
  if (wordExtensions.includes(extension)) return 'word';
  if (cellExtensions.includes(extension)) return 'cell';
  if (slideExtensions.includes(extension)) return 'slide';
  
  return null;
}
