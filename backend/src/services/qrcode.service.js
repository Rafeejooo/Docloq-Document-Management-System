// QR Code Generation & Verification Service
// Uses the `qrcode` npm package (already installed).

import QRCode from 'qrcode';
import crypto from 'crypto';
import uploadConfig from '../config/upload.config.js';

const { signingSecret, verificationBaseUrl, shortCodeLength, width, errorCorrectionLevel } =
  uploadConfig.qrCode;

// ============================================================
// Short code generator
// ============================================================

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a cryptographically random alphanumeric short code.
 * @param {number} length
 * @returns {string}
 */
const generateShortCode = (length = shortCodeLength) => {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
};

// ============================================================
// HMAC Signing
// ============================================================

/**
 * Sign a payload string with HMAC-SHA256.
 * @param {string} data
 * @returns {string} hex signature
 */
const signPayload = (data) => {
  return crypto.createHmac('sha256', signingSecret).update(data).digest('hex');
};

// ============================================================
// Public API
// ============================================================

/**
 * Generate a verification QR code for a document.
 * @param {string} documentId
 * @param {string} sha256Hash — content hash of the document
 * @param {string} organizationId
 * @returns {{ qrBuffer: Buffer, shortCode: string, payload: object, signature: string, verificationUrl: string, payloadHash: string }}
 */
export const generateVerificationQR = async (documentId, sha256Hash, organizationId) => {
  const shortCode = generateShortCode();
  const timestamp = new Date().toISOString();

  const payload = {
    docId: documentId,
    hash: sha256Hash,
    org: organizationId,
    ts: timestamp,
    sc: shortCode,
  };

  const payloadString = JSON.stringify(payload);
  const signature = signPayload(payloadString);

  const verificationUrl = `${verificationBaseUrl}?code=${shortCode}`;

  // The full data embedded in the QR contains the verification URL + signature
  const qrData = JSON.stringify({
    url: verificationUrl,
    sig: signature,
    payload,
  });

  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(qrData, {
    errorCorrectionLevel,
    width,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

  return {
    qrBuffer,
    shortCode,
    payload,
    signature,
    verificationUrl,
    payloadHash,
  };
};

/**
 * Verify a QR code payload + signature.
 * @param {object} payload — the payload object from the QR code
 * @param {string} signature — HMAC signature from the QR code
 * @returns {{ isValid: boolean, documentId: string|null, hash: string|null }}
 */
export const verifyQRPayload = (payload, signature) => {
  try {
    const payloadString = JSON.stringify(payload);
    const expected = signPayload(payloadString);

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );

    return {
      isValid,
      documentId: isValid ? payload.docId : null,
      hash: isValid ? payload.hash : null,
      shortCode: isValid ? payload.sc : null,
    };
  } catch (err) {
    console.error('[QR] Verification error:', err.message);
    return { isValid: false, documentId: null, hash: null };
  }
};
