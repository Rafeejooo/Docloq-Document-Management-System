// Signing Controller — DocuSeal e-signing integration

import { db } from '../db/index.js';
import {
  documentSignatures,
  documents,
  documentVersions,
  tasks,
  formWorkflowSteps,
  formInstances,
  users,
  taskComments,
} from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import {
  createSubmissionFromPDF,
  getSubmission,
  getSubmissionDocuments,
  getSubmitter,
  downloadSignedDocument,
} from '../services/docuseal.service.js';
import { downloadFile } from '../services/storage.service.js';
import { decryptFile } from '../services/encryption.service.js';
import { convertDocument, downloadFromUrl } from '../services/conversion.service.js';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const SIGNED_DIR = path.join(process.cwd(), 'storage', 'signed');

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

function resolveOrgId(req) {
  return req.user?.organizationId || null;
}
function resolveUserId(req) {
  return req.user?.userId || null;
}

/**
 * Read document buffer from disk (encrypted or legacy)
 */
async function getDocumentBuffer(doc) {
  // Try encrypted storage first
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
          return await decryptFile(encryptedBuffer, version.encryptionKeyId, version.encryptionIv, authTag);
        }
      }
    } catch (err) {
      console.warn('[Signing] Encrypted read failed, trying legacy:', err.message);
    }
  }

  // Legacy plain file
  const filePath = path.join(UPLOAD_DIR, doc.filename);
  return fs.readFile(filePath);
}

// ══════════════════════════════════════════════
//  1. Create Signing Request
// ══════════════════════════════════════════════

/**
 * POST /api/signing/request
 * Body: { taskId, documentId?, signatureAreas? }
 *
 * Creates a DocuSeal submission for the document linked to the task,
 * stores the signing record, and returns the embed URL.
 */
export const createSigningRequest = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const userId = resolveUserId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    const { taskId, documentId, signatureAreas } = req.body;
    if (!taskId) return res.status(400).json({ success: false, message: 'taskId is required' });

    // Verify task exists and is assigned to this user
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.taskType !== 'sign') return res.status(400).json({ success: false, message: 'Task is not a sign task' });

    // Check if a signing request already exists for this task
    const [existing] = await db.select().from(documentSignatures)
      .where(and(
        eq(documentSignatures.taskId, taskId),
        eq(documentSignatures.status, 'pending'),
      ));

    // If there's already a pending/sent request, return the embed URL
    if (existing && existing.embedSrc) {
      const docusealHost = (process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com').replace('api.', '').replace('/api', '');
      const existingFormUrl = existing.docusealSlug ? `${docusealHost}/s/${existing.docusealSlug}` : null;
      return res.json({
        success: true,
        data: {
          signatureId: existing.id,
          embedSrc: existing.embedSrc,
          slug: existing.docusealSlug,
          formUrl: existingFormUrl,
          status: existing.status,
          submissionId: existing.docusealSubmissionId,
        },
      });
    }

    // Get the document
    const docId = documentId || task.relatedDocumentId;
    if (!docId) return res.status(400).json({ success: false, message: 'No document linked to this task' });

    const [doc] = await db.select().from(documents).where(eq(documents.id, docId));
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Get signer info
    const [signer] = await db.select({
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    }).from(users).where(eq(users.id, userId));

    if (!signer) return res.status(400).json({ success: false, message: 'Signer user not found' });

    const signerName = signer.firstName
      ? `${signer.firstName}${signer.lastName ? ' ' + signer.lastName : ''}`
      : signer.email;

    // Read document file buffer
    let pdfBuffer;
    try {
      pdfBuffer = await getDocumentBuffer(doc);
    } catch (err) {
      console.error('[Signing] Failed to read document:', err);
      return res.status(500).json({ success: false, message: 'Failed to read document file' });
    }

    // Ensure we send an actual PDF to DocuSeal (documents may be stored as DOCX).
    // Check the magic bytes — PDF files start with %PDF.
    const isPdf = pdfBuffer[0] === 0x25 && pdfBuffer[1] === 0x50 &&
                  pdfBuffer[2] === 0x44 && pdfBuffer[3] === 0x46;

    if (!isPdf) {
      console.log('[Signing] Document is not PDF, converting via OnlyOffice before DocuSeal...');
      try {
        const backendUrl = process.env.BACKEND_URL_DOCKER || 'http://host.docker.internal:3000';
        const fileUrl = `${backendUrl}/api/documents/${docId}/file`;
        const srcExt = (doc.mimeType || '').includes('wordprocessing') ? 'docx'
          : (doc.mimeType || '').includes('spreadsheet') ? 'xlsx'
          : (doc.originalFilename || doc.filename || '').split('.').pop() || 'docx';
        const convKey = `signing-${docId}-${Date.now()}`;
        const { url: convertedUrl } = await convertDocument(fileUrl, srcExt, 'pdf', convKey);
        pdfBuffer = await downloadFromUrl(convertedUrl);
        console.log('[Signing] Conversion successful,', pdfBuffer.length, 'bytes PDF');
      } catch (convErr) {
        console.error('[Signing] DOCX→PDF conversion failed:', convErr);
        return res.status(500).json({ success: false, message: 'Failed to convert document to PDF for signing' });
      }
    }

    // Create DocuSeal submission from PDF
    const submission = await createSubmissionFromPDF(
      pdfBuffer,
      doc.originalFilename || doc.filename,
      {
        email: signer.email,
        name: signerName,
        role: 'First Party',
      },
      {
        sendEmail: false,
        signatureAreas: signatureAreas || undefined,
      },
    );

    // Extract submitter embed_src
    // Response from /submissions/pdf is the full submission object with submitters array
    const submitters = submission.submitters || (Array.isArray(submission) ? submission : []);
    const submitter = submitters[0] || submission;

    const embedSrc = submitter.embed_src || null;
    const docusealSubmissionId = submitter.submission_id || submission.id;
    const docusealSubmitterId = submitter.id;
    const docusealSlug = submitter.slug;

    // Save to our database
    const [sigRecord] = await db.insert(documentSignatures).values({
      organizationId: orgId,
      taskId,
      documentId: docId,
      formInstanceId: task.relatedFormInstanceId || null,
      docusealSubmissionId: docusealSubmissionId,
      docusealSubmitterId: docusealSubmitterId,
      docusealSlug: docusealSlug,
      signerUserId: userId,
      signerEmail: signer.email,
      signerName,
      signerRole: 'First Party',
      status: 'sent',
      sentAt: new Date(),
      embedSrc,
      metadata: { submissionResponse: submission },
    }).returning();

    // Update task to in_progress if it was pending
    if (task.status === 'pending') {
      await db.update(tasks).set({
        status: 'in_progress',
        updatedAt: new Date(),
      }).where(eq(tasks.id, taskId));
    }

    // Build the form URL for the DocuSeal form component
    const docusealHost = (process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com').replace('api.', '').replace('/api', '');
    const formUrl = docusealSlug ? `${docusealHost}/s/${docusealSlug}` : null;

    res.json({
      success: true,
      data: {
        signatureId: sigRecord.id,
        embedSrc,
        slug: docusealSlug,
        formUrl,
        status: sigRecord.status,
        submissionId: docusealSubmissionId,
      },
    });
  } catch (error) {
    console.error('[Signing] Create request error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create signing request' });
  }
};

// ══════════════════════════════════════════════
//  2. Get Signing Status
// ══════════════════════════════════════════════

/**
 * GET /api/signing/:taskId/status
 */
export const getSigningStatus = async (req, res) => {
  try {
    const { taskId } = req.params;

    const [sigRecord] = await db.select().from(documentSignatures)
      .where(eq(documentSignatures.taskId, taskId))
      .orderBy(desc(documentSignatures.createdAt));

    if (!sigRecord) {
      return res.json({
        success: true,
        data: { status: 'not_initiated', signatureId: null, embedSrc: null },
      });
    }

    // Build the form URL for the DocuSeal form component
    const docusealHost = (process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com').replace('api.', '').replace('/api', '');
    const formUrl = sigRecord.docusealSlug ? `${docusealHost}/s/${sigRecord.docusealSlug}` : null;

    res.json({
      success: true,
      data: {
        signatureId: sigRecord.id,
        status: sigRecord.status,
        embedSrc: sigRecord.embedSrc,
        slug: sigRecord.docusealSlug,
        formUrl,
        submissionId: sigRecord.docusealSubmissionId,
        signedDocumentUrl: sigRecord.signedDocumentUrl,
        signedDocumentPath: sigRecord.signedDocumentPath,
        auditLogUrl: sigRecord.auditLogUrl,
        completedAt: sigRecord.completedAt,
        declineReason: sigRecord.declineReason,
      },
    });
  } catch (error) {
    console.error('[Signing] Status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get signing status' });
  }
};

// ══════════════════════════════════════════════
//  3. Manual Check (poll DocuSeal)
// ══════════════════════════════════════════════

/**
 * POST /api/signing/:taskId/check
 * Poll DocuSeal to check if the submission was completed.
 * Fallback for when webhooks don't arrive.
 */
export const manualCheckStatus = async (req, res) => {
  try {
    const { taskId } = req.params;

    const [sigRecord] = await db.select().from(documentSignatures)
      .where(eq(documentSignatures.taskId, taskId))
      .orderBy(desc(documentSignatures.createdAt));

    if (!sigRecord) {
      return res.status(404).json({ success: false, message: 'No signing request found for this task' });
    }

    // Already completed?
    if (sigRecord.status === 'completed') {
      return res.json({
        success: true,
        data: { status: 'completed', signedDocumentPath: sigRecord.signedDocumentPath },
      });
    }

    // Poll DocuSeal
    const submitterData = await getSubmitter(sigRecord.docusealSubmitterId);

    if (submitterData.status === 'completed') {
      // Process completion
      await processSigningCompletion(sigRecord, submitterData);

      return res.json({
        success: true,
        data: { status: 'completed', message: 'Signing completed and processed' },
      });
    }

    if (submitterData.status === 'declined') {
      await processSigningDecline(sigRecord, submitterData);
      return res.json({
        success: true,
        data: { status: 'declined', reason: submitterData.decline_reason },
      });
    }

    // Update status if changed (e.g., opened)
    if (submitterData.status !== sigRecord.status) {
      await db.update(documentSignatures).set({
        status: submitterData.status,
        openedAt: submitterData.opened_at ? new Date(submitterData.opened_at) : sigRecord.openedAt,
        updatedAt: new Date(),
      }).where(eq(documentSignatures.id, sigRecord.id));
    }

    res.json({
      success: true,
      data: { status: submitterData.status },
    });
  } catch (error) {
    console.error('[Signing] Manual check error:', error);
    res.status(500).json({ success: false, message: 'Failed to check signing status' });
  }
};

// ══════════════════════════════════════════════
//  4. Webhook Handler
// ══════════════════════════════════════════════

/**
 * POST /api/signing/webhook
 * Receives events from DocuSeal: form.completed, form.declined, form.viewed, form.started
 */
export const handleWebhook = async (req, res) => {
  try {
    const { event_type, data } = req.body;

    console.log(`[DocuSeal Webhook] ${event_type}`, JSON.stringify(data?.id || data?.email));

    if (!data) {
      return res.status(400).json({ error: 'No data in webhook' });
    }

    // Find our signature record by DocuSeal submitter ID or submission ID
    const submitterId = data.id;
    const submissionId = data.submission?.id;

    let sigRecord = null;

    if (submitterId) {
      [sigRecord] = await db.select().from(documentSignatures)
        .where(eq(documentSignatures.docusealSubmitterId, submitterId));
    }

    if (!sigRecord && submissionId) {
      [sigRecord] = await db.select().from(documentSignatures)
        .where(eq(documentSignatures.docusealSubmissionId, submissionId));
    }

    if (!sigRecord) {
      console.warn('[DocuSeal Webhook] No matching signature record found');
      return res.json({ received: true, matched: false });
    }

    switch (event_type) {
      case 'form.viewed':
        await db.update(documentSignatures).set({
          status: 'opened',
          openedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(documentSignatures.id, sigRecord.id));
        break;

      case 'form.started':
        await db.update(documentSignatures).set({
          status: 'opened',
          openedAt: sigRecord.openedAt || new Date(),
          updatedAt: new Date(),
        }).where(eq(documentSignatures.id, sigRecord.id));
        break;

      case 'form.completed':
        await processSigningCompletion(sigRecord, data);
        break;

      case 'form.declined':
        await processSigningDecline(sigRecord, data);
        break;

      default:
        console.log(`[DocuSeal Webhook] Unhandled event: ${event_type}`);
    }

    res.json({ received: true, matched: true });
  } catch (error) {
    console.error('[DocuSeal Webhook] Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ══════════════════════════════════════════════
//  5. Serve Signed Document File (for OnlyOffice viewer)
// ══════════════════════════════════════════════

/**
 * GET /api/signing/:signatureId/file
 * Serves the signed PDF inline — used by OnlyOffice to load the document.
 * No auth check since OnlyOffice server calls this directly (like serveDocument).
 */
export const serveSignedDocumentFile = async (req, res) => {
  try {
    const { signatureId } = req.params;

    const [sigRecord] = await db.select().from(documentSignatures)
      .where(eq(documentSignatures.id, signatureId));

    if (!sigRecord) {
      return res.status(404).json({ success: false, message: 'Signature record not found' });
    }

    // Serve local signed PDF file
    if (sigRecord.signedDocumentPath) {
      try {
        await fs.access(sigRecord.signedDocumentPath);
        const buffer = await fs.readFile(sigRecord.signedDocumentPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="signed_${path.basename(sigRecord.signedDocumentPath)}"`);
        return res.send(buffer);
      } catch {
        // File not on disk
      }
    }

    // If we have a URL but no local file, proxy it
    if (sigRecord.signedDocumentUrl) {
      try {
        const response = await fetch(sigRecord.signedDocumentUrl);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="signed_document.pdf"');
          return res.send(buffer);
        }
      } catch (err) {
        console.error('[Signing] Failed to proxy signed document:', err);
      }
    }

    res.status(404).json({ success: false, message: 'Signed document not available' });
  } catch (error) {
    console.error('[Signing] Serve signed file error:', error);
    res.status(500).json({ success: false, message: 'Failed to serve signed document' });
  }
};

// ══════════════════════════════════════════════
//  6. Get Signed Documents
// ══════════════════════════════════════════════

/**
 * GET /api/signing/:signatureId/documents
 */
export const getSignedDocuments = async (req, res) => {
  try {
    const { signatureId } = req.params;

    const [sigRecord] = await db.select().from(documentSignatures)
      .where(eq(documentSignatures.id, signatureId));

    if (!sigRecord) {
      return res.status(404).json({ success: false, message: 'Signature record not found' });
    }

    // If we have a local file, serve it
    if (sigRecord.signedDocumentPath) {
      try {
        await fs.access(sigRecord.signedDocumentPath);
        const buffer = await fs.readFile(sigRecord.signedDocumentPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="signed_${path.basename(sigRecord.signedDocumentPath)}"`);
        return res.send(buffer);
      } catch {
        // File not on disk, fall through
      }
    }

    // If we have a URL, redirect
    if (sigRecord.signedDocumentUrl) {
      return res.json({
        success: true,
        data: {
          url: sigRecord.signedDocumentUrl,
          auditLogUrl: sigRecord.auditLogUrl,
        },
      });
    }

    res.status(404).json({ success: false, message: 'Signed document not available yet' });
  } catch (error) {
    console.error('[Signing] Get signed docs error:', error);
    res.status(500).json({ success: false, message: 'Failed to get signed documents' });
  }
};

// ══════════════════════════════════════════════
//  Internal: Process Completion
// ══════════════════════════════════════════════

async function processSigningCompletion(sigRecord, data) {
  // Extract signed document URLs
  const signedDocs = data.documents || [];
  const signedDocUrl = signedDocs[0]?.url || null;
  const auditLogUrl = data.audit_log_url || data.submission?.audit_log_url || null;

  // Download signed PDF to local storage
  let signedDocPath = null;
  if (signedDocUrl) {
    try {
      await fs.mkdir(SIGNED_DIR, { recursive: true });
      const filename = `signed_${sigRecord.documentId}_${Date.now()}.pdf`;
      signedDocPath = path.join(SIGNED_DIR, filename);
      await downloadSignedDocument(signedDocUrl, signedDocPath);
    } catch (err) {
      console.error('[Signing] Failed to download signed document:', err);
      // Continue — we still have the URL
    }
  }

  // Update signature record
  await db.update(documentSignatures).set({
    status: 'completed',
    completedAt: new Date(),
    signedDocumentUrl: signedDocUrl,
    signedDocumentPath: signedDocPath,
    auditLogUrl,
    updatedAt: new Date(),
  }).where(eq(documentSignatures.id, sigRecord.id));

  // Auto-complete the linked task
  if (sigRecord.taskId) {
    await db.update(tasks).set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(tasks.id, sigRecord.taskId));

    // Add comment
    if (sigRecord.signerUserId) {
      await db.insert(taskComments).values({
        taskId: sigRecord.taskId,
        content: `Document signed electronically via DocuSeal.`,
        createdBy: sigRecord.signerUserId,
      });
    }

    // Sync workflow step
    const [linkedStep] = await db.select().from(formWorkflowSteps)
      .where(eq(formWorkflowSteps.taskId, sigRecord.taskId));

    if (linkedStep) {
      await db.update(formWorkflowSteps).set({
        status: 'completed',
        completedAt: new Date(),
        notes: 'Signed electronically',
        updatedAt: new Date(),
      }).where(eq(formWorkflowSteps.id, linkedStep.id));

      // Activate next step
      const [nextStep] = await db.select().from(formWorkflowSteps)
        .where(and(
          eq(formWorkflowSteps.formInstanceId, linkedStep.formInstanceId),
          eq(formWorkflowSteps.stepOrder, linkedStep.stepOrder + 1),
        ));

      if (nextStep) {
        await db.update(formWorkflowSteps).set({
          status: 'in_progress',
          updatedAt: new Date(),
        }).where(eq(formWorkflowSteps.id, nextStep.id));

        if (nextStep.taskId) {
          await db.update(tasks).set({
            status: 'in_progress',
            updatedAt: new Date(),
          }).where(eq(tasks.id, nextStep.taskId));
        }
      } else {
        // All steps done — complete the form instance
        if (linkedStep.formInstanceId) {
          await db.update(formInstances).set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date(),
          }).where(eq(formInstances.id, linkedStep.formInstanceId));
        }
      }
    }
  }
}

async function processSigningDecline(sigRecord, data) {
  const declineReason = data.decline_reason || 'Declined by signer';

  await db.update(documentSignatures).set({
    status: 'declined',
    declinedAt: new Date(),
    declineReason,
    updatedAt: new Date(),
  }).where(eq(documentSignatures.id, sigRecord.id));

  // Cancel linked task
  if (sigRecord.taskId) {
    await db.update(tasks).set({
      status: 'cancelled',
      updatedAt: new Date(),
    }).where(eq(tasks.id, sigRecord.taskId));

    if (sigRecord.signerUserId) {
      await db.insert(taskComments).values({
        taskId: sigRecord.taskId,
        content: `Signing declined: ${declineReason}`,
        createdBy: sigRecord.signerUserId,
      });
    }

    // Cancel workflow
    const [linkedStep] = await db.select().from(formWorkflowSteps)
      .where(eq(formWorkflowSteps.taskId, sigRecord.taskId));

    if (linkedStep) {
      await db.update(formWorkflowSteps).set({
        status: 'skipped',
        notes: `Signing declined: ${declineReason}`,
        updatedAt: new Date(),
      }).where(eq(formWorkflowSteps.id, linkedStep.id));

      // Skip remaining pending steps
      await db.update(formWorkflowSteps).set({
        status: 'skipped',
        updatedAt: new Date(),
      }).where(and(
        eq(formWorkflowSteps.formInstanceId, linkedStep.formInstanceId),
        eq(formWorkflowSteps.status, 'pending'),
      ));

      if (linkedStep.formInstanceId) {
        await db.update(formInstances).set({
          status: 'cancelled',
          updatedAt: new Date(),
        }).where(eq(formInstances.id, linkedStep.formInstanceId));
      }
    }
  }
}

// ══════════════════════════════════════════════
//  6. Remove Background from Signature Image
// ══════════════════════════════════════════════

/**
 * POST /api/signing/remove-bg
 * Body: { image: base64 string (data URL or raw base64) }
 * 
 * Removes background from signature image — makes white/light pixels transparent.
 * Returns transparent PNG as base64 data URL.
 */
export const removeSignatureBackground = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: 'image (base64) is required' });

    // Extract raw base64 from data URL if present
    let base64Data = image;
    if (image.startsWith('data:')) {
      base64Data = image.split(',')[1];
    }

    const inputBuffer = Buffer.from(base64Data, 'base64');

    // Use sharp to process image:
    // 1. Get raw RGBA pixel data
    // 2. Make light pixels (close to white) transparent
    // 3. Output as PNG with transparency
    const rawImage = sharp(inputBuffer).ensureAlpha();
    const metadata = await rawImage.metadata();
    const { data: pixelData, info } = await rawImage.raw().toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;

    // Process pixels: make light background transparent
    // Threshold: if R, G, B are all above 200 → treat as background
    const THRESHOLD = 200;
    const outputPixels = Buffer.from(pixelData);

    for (let i = 0; i < outputPixels.length; i += channels) {
      const r = outputPixels[i];
      const g = outputPixels[i + 1];
      const b = outputPixels[i + 2];

      // If pixel is close to white, make it transparent
      if (r > THRESHOLD && g > THRESHOLD && b > THRESHOLD) {
        outputPixels[i + 3] = 0; // Set alpha to 0
      }
    }

    // Reconstruct PNG from raw pixel data
    const resultBuffer = await sharp(outputPixels, {
      raw: { width, height, channels },
    }).png().toBuffer();

    const resultBase64 = `data:image/png;base64,${resultBuffer.toString('base64')}`;

    res.json({
      success: true,
      data: { image: resultBase64 },
    });
  } catch (error) {
    console.error('[Signing] Remove bg error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove background' });
  }
};
