// Watermark Scanner Controller — Scan leaked documents for invisible watermarks
// Detects both per-download watermarks (U+2060-63) and upload honeytokens (U+200B-FEFF)

import { db } from '../db/index.js';
import { downloadWatermarks, documents, users, documentHoneytokens } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { extractDownloadWatermark } from '../services/download-watermark.service.js';
import { extractHoneytokens } from '../services/honeytoken.service.js';
import { extractText } from '../services/upload-pipeline.service.js';

/**
 * POST /api/watermark-scanner/scan
 * Accept a file upload, extract text, scan for watermarks, identify leaker.
 */
export const scanForWatermark = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { buffer, mimetype, originalname } = req.file;

    // Extract text from the uploaded file
    let extractedText = '';
    try {
      extractedText = await extractText(buffer, mimetype);
    } catch (err) {
      console.warn('[WatermarkScanner] Text extraction failed:', err.message);
      // Fallback: try direct buffer toString for text files
      if (mimetype === 'text/plain') {
        extractedText = buffer.toString('utf-8');
      }
    }

    if (!extractedText || extractedText.length < 5) {
      return res.json({
        success: true,
        data: {
          found: false,
          message: 'Could not extract readable text from the uploaded file',
          filename: originalname,
        },
      });
    }

    // Scan for per-download watermarks (U+2060-U+2063)
    const downloadResult = extractDownloadWatermark(extractedText);

    // Scan for upload honeytokens (U+200B-FEFF)
    const honeytokenResult = extractHoneytokens(extractedText);

    const result = {
      found: false,
      filename: originalname,
      downloadWatermark: null,
      uploadHoneytoken: null,
    };

    // Process download watermark result
    if (downloadResult.payload && downloadResult.confidence > 0.4) {
      const { w: watermarkId, d: docId, u: downloaderId } = downloadResult.payload;

      // Lookup watermark record in DB
      let watermarkRecord = null;
      let downloaderInfo = null;
      let documentInfo = null;

      if (watermarkId) {
        const [wmRow] = await db
          .select()
          .from(downloadWatermarks)
          .where(eq(downloadWatermarks.watermarkId, watermarkId))
          .limit(1);
        watermarkRecord = wmRow || null;
      }

      if (downloaderId) {
        const [userRow] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, downloaderId))
          .limit(1);
        downloaderInfo = userRow || null;
      }

      if (docId) {
        const [docRow] = await db
          .select({
            id: documents.id,
            originalFilename: documents.originalFilename,
            mimeType: documents.mimeType,
          })
          .from(documents)
          .where(eq(documents.id, docId))
          .limit(1);
        documentInfo = docRow || null;
      }

      result.found = true;
      result.downloadWatermark = {
        watermarkId,
        confidence: downloadResult.confidence,
        positions: downloadResult.positions.length,
        downloader: downloaderInfo
          ? {
              id: downloaderInfo.id,
              name: `${downloaderInfo.firstName || ''} ${downloaderInfo.lastName || ''}`.trim() || downloaderInfo.email,
              email: downloaderInfo.email,
            }
          : downloaderId ? { id: downloaderId, name: 'Unknown User', email: null } : null,
        document: documentInfo
          ? { id: documentInfo.id, name: documentInfo.originalFilename, mimeType: documentInfo.mimeType }
          : docId ? { id: docId, name: 'Unknown Document' } : null,
        downloadedAt: watermarkRecord?.createdAt || downloadResult.payload.t,
        ipAddress: watermarkRecord?.ipAddress || null,
        method: watermarkRecord?.documentFormat || 'unicode_invisible',
      };
    }

    // Process honeytoken result
    if (honeytokenResult.payload && honeytokenResult.confidence > 0.4) {
      const { d: docId, u: uploaderId, o: orgId } = honeytokenResult.payload;

      let uploaderInfo = null;
      if (uploaderId) {
        const [userRow] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, uploaderId))
          .limit(1);
        uploaderInfo = userRow || null;
      }

      result.uploadHoneytoken = {
        method: honeytokenResult.method,
        confidence: honeytokenResult.confidence,
        uploader: uploaderInfo
          ? {
              id: uploaderInfo.id,
              name: `${uploaderInfo.firstName || ''} ${uploaderInfo.lastName || ''}`.trim() || uploaderInfo.email,
              email: uploaderInfo.email,
            }
          : uploaderId ? { id: uploaderId, name: 'Unknown User' } : null,
        documentId: docId || null,
        organizationId: orgId || null,
        timestamp: honeytokenResult.payload.t || null,
      };

      if (!result.found) {
        result.found = true;
      }
    }

    if (!result.found) {
      result.message = 'No watermarks or honeytokens detected. The document may have been sanitized or is not from this system.';
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[WatermarkScanner] Scan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to scan document' });
  }
};

/**
 * GET /api/watermark-scanner/history/:documentId
 * List all watermarked downloads for a specific document.
 */
export const getWatermarkHistory = async (req, res) => {
  try {
    const { documentId } = req.params;

    const records = await db
      .select({
        id: downloadWatermarks.id,
        watermarkId: downloadWatermarks.watermarkId,
        documentFormat: downloadWatermarks.documentFormat,
        ipAddress: downloadWatermarks.ipAddress,
        createdAt: downloadWatermarks.createdAt,
        isActive: downloadWatermarks.isActive,
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(downloadWatermarks)
      .leftJoin(users, eq(downloadWatermarks.downloadedBy, users.id))
      .where(eq(downloadWatermarks.documentId, documentId))
      .orderBy(desc(downloadWatermarks.createdAt));

    const history = records.map((r) => ({
      id: r.id,
      watermarkId: r.watermarkId,
      user: r.firstName
        ? `${r.firstName}${r.lastName ? ' ' + r.lastName : ''}`
        : r.email?.split('@')[0] || 'Unknown',
      email: r.email,
      downloadedAt: r.createdAt,
      ipAddress: r.ipAddress,
      format: r.documentFormat,
      isActive: r.isActive,
    }));

    return res.json({ success: true, data: history });
  } catch (error) {
    console.error('[WatermarkScanner] History error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch watermark history' });
  }
};

/**
 * GET /api/watermark-scanner/details/:watermarkId
 * Get full details of a specific watermark record.
 */
export const getWatermarkDetails = async (req, res) => {
  try {
    const { watermarkId } = req.params;

    const [record] = await db
      .select()
      .from(downloadWatermarks)
      .where(eq(downloadWatermarks.watermarkId, watermarkId))
      .limit(1);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Watermark record not found' });
    }

    // Get user info
    let userInfo = null;
    if (record.downloadedBy) {
      const [user] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, record.downloadedBy))
        .limit(1);
      userInfo = user || null;
    }

    // Get document info
    let docInfo = null;
    if (record.documentId) {
      const [doc] = await db
        .select({
          id: documents.id,
          originalFilename: documents.originalFilename,
          mimeType: documents.mimeType,
        })
        .from(documents)
        .where(eq(documents.id, record.documentId))
        .limit(1);
      docInfo = doc || null;
    }

    return res.json({
      success: true,
      data: {
        ...record,
        downloader: userInfo
          ? {
              id: userInfo.id,
              name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userInfo.email,
              email: userInfo.email,
            }
          : null,
        document: docInfo
          ? { id: docInfo.id, name: docInfo.originalFilename, mimeType: docInfo.mimeType }
          : null,
      },
    });
  } catch (error) {
    console.error('[WatermarkScanner] Details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch watermark details' });
  }
};
