// Document Controller — Full upload pipeline + CRUD operations

import { db } from '../db/index.js';
import {
  documents,
  documentVersions,
  documentQrCodes,
  auditLogs,
  trashItems,
} from '../db/schema.js';
import { eq, desc, and, isNull, inArray } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

import { uploadPipeline } from '../services/upload-pipeline.service.js';
import { downloadFile, uploadFile } from '../services/storage.service.js';
import { decryptFile, encryptFile as encryptFileService, generateDocumentKey } from '../services/encryption.service.js';
import { verifyQRPayload } from '../services/qrcode.service.js';
import { generateSHA256 } from '../services/hash.service.js';
import { convertDocument, downloadFromUrl } from '../services/conversion.service.js';
import { getAllUserPermissions, getUserPermissionLevel } from '../middlewares/permission.middleware.js';
import { tasks } from '../db/schema.js';

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
    const allDocs = await db.select().from(documents)
      .where(isNull(documents.deletedAt))
      .orderBy(desc(documents.createdAt));

    // If user is authenticated, filter by permissions
    const userId = req.user?.userId || req.user?.id;
    const organizationId = req.user?.organizationId;

    if (userId && organizationId) {
      const { hasFullAccess, permissions } = await getAllUserPermissions(userId, organizationId);

      if (!hasFullAccess) {
        // Get documents that user has tasks assigned to (fill/sign/review/approve)
        const userTasks = await db
          .select({ relatedDocumentId: tasks.relatedDocumentId })
          .from(tasks)
          .where(
            and(
              eq(tasks.assignedTo, userId),
              inArray(tasks.status, ['in_progress', 'pending'])
            )
          );
        const taskDocIds = new Set(userTasks.map(t => t.relatedDocumentId).filter(Boolean));

        // Filter documents: user can only see documents they have permission for
        // Check both direct document permission and parent folder permission
        const filteredDocs = allDocs.filter((doc) => {
          // Check direct document permission
          const docKey = `document:${doc.id}`;
          if (permissions[docKey] && permissions[docKey] !== 'none') return true;

          // Check folder permission (if document is in a folder)
          if (doc.folderId) {
            const folderKey = `folder:${doc.folderId}`;
            if (permissions[folderKey] && permissions[folderKey] !== 'none') return true;
          }

          // Document owner always has access
          if (doc.ownerId === userId) return true;

          // User has an active task for this document
          if (taskDocIds.has(doc.id)) return true;

          return false;
        });

        return res.json({
          success: true,
          data: filteredDocs,
        });
      }
    }
    
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

    // Permission check for authenticated users
    const userId = req.user?.userId || req.user?.id;
    const organizationId = req.user?.organizationId;

    if (userId && organizationId) {
      // Owner always has access
      if (doc.ownerId !== userId) {
        const permLevel = await getUserPermissionLevel(userId, 'document', id, organizationId);
        if (permLevel === 'none') {
          // Also check if user has an active task for this document
          const [userTask] = await db
            .select({ id: tasks.id })
            .from(tasks)
            .where(
              and(
                eq(tasks.assignedTo, userId),
                eq(tasks.relatedDocumentId, id),
                inArray(tasks.status, ['in_progress', 'pending'])
              )
            )
            .limit(1);

          if (!userTask) {
            return res.status(403).json({
              success: false,
              message: 'You do not have permission to access this document',
            });
          }
        }
      }
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
// Upload simple — now routes through the FULL security pipeline
// Supports ?convertToDocx=true to auto-convert PDF uploads to DOCX
// ============================================================
export const uploadDocumentSimple = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let fileObj = { ...req.file };
    const convertToDocx = req.query.convertToDocx === 'true' || req.body.convertToDocx === 'true';

    // PDF → DOCX conversion if requested
    if (convertToDocx && (fileObj.mimetype === 'application/pdf' || path.extname(fileObj.originalname).toLowerCase() === '.pdf')) {
      console.log('[UploadSimple] Converting PDF to DOCX...');

      await ensureUploadDir();
      const tempFilename = `temp_${randomUUID()}.pdf`;
      const tempPath = path.join(UPLOAD_DIR, tempFilename);
      await fs.writeFile(tempPath, fileObj.buffer);

      try {
        const backendUrlDocker = process.env.BACKEND_URL_DOCKER || 'http://host.docker.internal:3000';
        const tempFileUrl = `${backendUrlDocker}/uploads/${tempFilename}`;

        const { url: convertedUrl } = await convertDocument(tempFileUrl, 'pdf', 'docx');
        const convertedBuffer = await downloadFromUrl(convertedUrl);
        fileObj = {
          ...fileObj,
          buffer: convertedBuffer,
          size: convertedBuffer.length,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          originalname: fileObj.originalname.replace(/\.pdf$/i, '.docx'),
        };
        console.log('[UploadSimple] PDF→DOCX conversion successful');
      } finally {
        try { await fs.unlink(tempPath); } catch {}
      }
    }

    // Resolve user + org
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
      return res.status(400).json({ success: false, message: 'No organization or user found.' });
    }

    // Run the FULL 14-step security pipeline (encryption, hashing, scan, honeytokens, QR)
    const result = await uploadPipeline(fileObj, userId, organizationId, folderId);

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

    let userId = req.user?.id || null;
    // Fallback: resolve user when no auth (dev mode)
    if (!userId) {
      try {
        const { users } = await import('../db/schema.js');
        const [firstUser] = await db.select().from(users).limit(1);
        if (firstUser) userId = firstUser.id;
      } catch { /* ok */ }
    }
    const orgId = doc.organizationId;
    const now = new Date();
    const autoDeleteDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Soft-delete: mark document as deleted
    await db.update(documents).set({
      deletedAt: now,
      deletedBy: userId,
      status: 'deleted',
      updatedAt: now,
    }).where(eq(documents.id, id));

    // Insert into trash_items for tracking
    await db.insert(trashItems).values({
      organizationId: orgId,
      itemType: 'document',
      itemId: id,
      originalFolderId: doc.folderId,
      originalPath: doc.originalFilename,
      itemMetadata: {
        originalFilename: doc.originalFilename,
        filename: doc.filename,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        ownerId: doc.ownerId,
      },
      autoDeleteAt: autoDeleteDate,
      deletedBy: userId,
      deletedAt: now,
    });

    res.json({
      success: true,
      message: 'Document moved to trash',
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
          autosave: false,
          forcesave: false,
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

// Force-save: calls OnlyOffice Command Service to trigger a save
export const forceSaveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const docKey = `${doc.id}-${doc.updatedAt?.getTime() || Date.now()}`;
    const onlyOfficeUrl = process.env.ONLYOFFICE_URL_INTERNAL || process.env.ONLYOFFICE_URL || 'http://localhost:8082';

    // Call the OnlyOffice Command Service API
    const response = await fetch(`${onlyOfficeUrl}/coauthoring/CommandService.ashx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        c: 'forcesave',
        key: docKey,
      }),
    });

    const result = await response.json();
    console.log('Force-save result:', result);

    // error 0 = success, error 4 = no changes
    if (result.error === 0 || result.error === 4) {
      res.json({ success: true, message: result.error === 4 ? 'No changes to save' : 'Document saved' });
    } else {
      res.status(500).json({ success: false, message: `Force-save failed (code ${result.error})` });
    }
  } catch (error) {
    console.error('Force-save error:', error);
    res.status(500).json({ success: false, message: 'Force-save failed' });
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

// ─────────────── MIME helpers for conversion ───────────────
const FORMAT_MIME_MAP = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  png:  'image/png',
  jpg:  'image/jpeg',
  csv:  'text/csv',
  txt:  'text/plain',
  odt:  'application/vnd.oasis.opendocument.text',
  ods:  'application/vnd.oasis.opendocument.spreadsheet',
  rtf:  'application/rtf',
};

function extFromMime(mime) {
  const map = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-powerpoint': 'ppt',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/vnd.oasis.opendocument.text': 'odt',
    'application/vnd.oasis.opendocument.spreadsheet': 'ods',
    'application/rtf': 'rtf',
  };
  return map[mime] || 'bin';
}

// Download document with optional format conversion via OnlyOffice
// GET /documents/:id/download-as?format=pdf|docx|xlsx|png|jpg
export const downloadDocumentConverted = async (req, res) => {
  try {
    const { id } = req.params;
    const targetFormat = (req.query.format || '').toLowerCase().trim();

    if (!targetFormat) {
      return res.status(400).json({ success: false, message: 'Missing ?format= parameter' });
    }

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const srcExt = extFromMime(doc.mimeType);

    // If requested format is same as source, serve the original file directly
    // (don't use redirect — Axios blob requests may not follow redirects properly)
    if (srcExt === targetFormat || (srcExt === 'doc' && targetFormat === 'docx') || (srcExt === 'xls' && targetFormat === 'xlsx')) {
      // Pipe through the normal download logic by importing the function
      req.params.id = id;
      return downloadDocumentDecrypted(req, res);
    }

    // Build the URL that OnlyOffice can fetch the source file from
    // OnlyOffice runs in Docker, so use the Docker-accessible URL (same as onlyoffice-config)
    const backendUrl = process.env.BACKEND_URL_DOCKER || 'http://host.docker.internal:3000';
    const fileUrl = `${backendUrl}/api/documents/${id}/file`;

    console.log(`[Convert] ${doc.originalFilename} (${srcExt}) → ${targetFormat}, url: ${fileUrl}`);

    // Call OnlyOffice conversion
    const convKey = `convert-${id}-${targetFormat}-${Date.now()}`;
    const { url: convertedUrl } = await convertDocument(fileUrl, srcExt, targetFormat, convKey);

    // Download converted file from OnlyOffice
    const convertedBuffer = await downloadFromUrl(convertedUrl);

    // Build output filename: replace extension
    const baseName = doc.originalFilename.replace(/\.[^.]+$/, '');
    const outputFilename = `${baseName}.${targetFormat}`;
    const outputMime = FORMAT_MIME_MAP[targetFormat] || 'application/octet-stream';

    // Audit log
    try {
      await db.insert(auditLogs).values({
        organizationId: doc.organizationId,
        userId: req.user?.id,
        action: 'download_converted',
        resourceType: 'document',
        resourceId: id,
        details: { sourceFormat: srcExt, targetFormat, filename: outputFilename },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch { /* non-critical */ }

    res.setHeader('Content-Type', outputMime);
    res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
    return res.send(convertedBuffer);
  } catch (error) {
    console.error('Download converted document error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert and download document',
    });
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
