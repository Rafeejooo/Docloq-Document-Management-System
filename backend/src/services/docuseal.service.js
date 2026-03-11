// DocuSeal API Service — wrapper for e-signing via DocuSeal

import fs from 'fs/promises';
import path from 'path';

const DOCUSEAL_API_URL = process.env.DOCUSEAL_API_URL || 'https://api.docuseal.com';
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;

/**
 * Generic fetch wrapper for DocuSeal API
 */
async function docusealFetch(endpoint, options = {}) {
  const url = `${DOCUSEAL_API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[DocuSeal] API error ${res.status} on ${endpoint}:`, errorBody);
    throw new Error(`DocuSeal API error: ${res.status} — ${errorBody}`);
  }

  return res.json();
}

// ─────────────────────────────────────────
//  SUBMISSIONS
// ─────────────────────────────────────────

/**
 * Create a signing submission directly from a PDF file
 * This creates a one-off submission without needing a template first.
 * 
 * @param {Buffer} pdfBuffer - PDF file content
 * @param {string} documentName - Name of the document
 * @param {Object} signer - { email, name, role? }
 * @param {Object} options - { sendEmail?, completedRedirectUrl?, expireAt?, signatureField? }
 * @returns {Object} Submission with submitters and embed_src
 */
export async function createSubmissionFromPDF(pdfBuffer, documentName, signer, options = {}) {
  const base64 = pdfBuffer.toString('base64');

  // Build fields array — add signature field
  const fields = [];

  // Always add a signature field at the bottom of the document
  if (options.signatureField !== false) {
    fields.push({
      name: 'Signature',
      type: 'signature',
      role: signer.role || 'First Party',
      areas: options.signatureAreas || [
        {
          x: 0.1,      // 10% from left
          y: 0.85,     // 85% from top (near bottom)
          w: 0.35,     // 35% width
          h: 0.08,     // 8% height
          page: -1,    // Last page
        },
      ],
    });
  }

  // Add custom fields if provided (e.g., date, name)
  if (options.extraFields && Array.isArray(options.extraFields)) {
    fields.push(...options.extraFields);
  }

  const body = {
    name: documentName,
    send_email: options.sendEmail ?? false, // Default: don't send email (we embed instead)
    order: 'preserved',
    documents: [
      {
        name: documentName,
        file: base64,
        fields: fields.length > 0 ? fields : undefined,
      },
    ],
    submitters: [
      {
        role: signer.role || 'First Party',
        email: signer.email,
        name: signer.name || undefined,
        send_email: false, // Embed instead
        completed_redirect_url: options.completedRedirectUrl || undefined,
      },
    ],
  };

  if (options.expireAt) {
    body.expire_at = options.expireAt;
  }

  const result = await docusealFetch('/submissions/pdf', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return result;
}

/**
 * Create submission from an existing DocuSeal template
 */
export async function createSubmissionFromTemplate(templateId, signer, options = {}) {
  const body = {
    template_id: templateId,
    send_email: options.sendEmail ?? false,
    order: 'preserved',
    submitters: [
      {
        role: signer.role || 'First Party',
        email: signer.email,
        name: signer.name || undefined,
        send_email: false,
      },
    ],
  };

  return docusealFetch('/submissions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─────────────────────────────────────────
//  GET / CHECK
// ─────────────────────────────────────────

/**
 * Get submission details by ID
 */
export async function getSubmission(submissionId) {
  return docusealFetch(`/submissions/${submissionId}`);
}

/**
 * Get submission documents (signed PDFs)
 */
export async function getSubmissionDocuments(submissionId) {
  return docusealFetch(`/submissions/${submissionId}/documents`);
}

/**
 * Get submitter details
 */
export async function getSubmitter(submitterId) {
  return docusealFetch(`/submitters/${submitterId}`);
}

/**
 * List submitters by submission ID
 */
export async function listSubmitters(submissionId) {
  return docusealFetch(`/submitters?submission_id=${submissionId}`);
}

// ─────────────────────────────────────────
//  TEMPLATES
// ─────────────────────────────────────────

/**
 * Create a reusable template from PDF
 */
export async function createTemplateFromPDF(pdfBuffer, name, options = {}) {
  const base64 = pdfBuffer.toString('base64');

  const fields = [];
  if (options.signatureField !== false) {
    fields.push({
      name: 'Signature',
      type: 'signature',
      role: 'First Party',
    });
  }

  return docusealFetch('/templates/pdf', {
    method: 'POST',
    body: JSON.stringify({
      name,
      documents: [
        {
          name,
          file: base64,
          fields: fields.length > 0 ? fields : undefined,
        },
      ],
    }),
  });
}

/**
 * List templates
 */
export async function listTemplates(options = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit);
  if (options.q) params.append('q', options.q);
  const qs = params.toString();
  return docusealFetch(`/templates${qs ? '?' + qs : ''}`);
}

/**
 * Get template by ID
 */
export async function getTemplate(templateId) {
  return docusealFetch(`/templates/${templateId}`);
}

// ─────────────────────────────────────────
//  DOWNLOAD HELPERS
// ─────────────────────────────────────────

/**
 * Download a file from a URL and save to disk
 */
export async function downloadSignedDocument(url, savePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download signed document: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(savePath), { recursive: true });
  await fs.writeFile(savePath, buffer);

  return { savePath, size: buffer.length, buffer };
}

export default {
  createSubmissionFromPDF,
  createSubmissionFromTemplate,
  getSubmission,
  getSubmissionDocuments,
  getSubmitter,
  listSubmitters,
  createTemplateFromPDF,
  listTemplates,
  getTemplate,
  downloadSignedDocument,
};
