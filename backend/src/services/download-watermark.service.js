// Download Watermark Service — Per-download invisible watermarking
// Uses U+2060-U+2063 (non-overlapping with honeytoken ZWC chars U+200B-FEFF)
// Each download event produces a unique watermark encoding the downloader's identity.

import crypto from 'crypto';
import uploadConfig from '../config/upload.config.js';

const { chars: wmChars, positionCount } = uploadConfig.downloadWatermark;

// ============================================================
// Payload encoding / decoding helpers
// ============================================================

/**
 * Encode a payload object into a binary string of '0' and '1'.
 */
const payloadToBits = (payload) => {
  const json = JSON.stringify(payload);
  let bits = '';
  for (let i = 0; i < json.length; i++) {
    bits += json.charCodeAt(i).toString(2).padStart(8, '0');
  }
  return bits;
};

/**
 * Decode a binary string back to a payload object.
 */
const bitsToPayload = (bits) => {
  const chars = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    chars.push(String.fromCharCode(parseInt(bits.substring(i, i + 8), 2)));
  }
  try {
    return JSON.parse(chars.join(''));
  } catch {
    return null;
  }
};

// ============================================================
// Invisible character encoding (U+2060-U+2063)
// ============================================================

/**
 * Encode payload bits into invisible character string.
 * Uses 4 chars to encode 2 bits at a time (same approach as honeytoken ZWC).
 */
const bitsToInvisible = (bits) => {
  let result = '';
  for (let i = 0; i < bits.length; i += 2) {
    const pair = bits.substring(i, i + 2).padEnd(2, '0');
    const idx = parseInt(pair, 2); // 0-3
    result += wmChars[idx];
  }
  return result;
};

/**
 * Decode invisible characters back to binary string.
 */
const invisibleToBits = (invisible) => {
  let bits = '';
  for (const ch of invisible) {
    const idx = wmChars.indexOf(ch);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(2, '0');
  }
  return bits;
};

// ============================================================
// Injection — distribute watermark across text at random positions
// ============================================================

/**
 * Inject invisible download watermark into text content.
 * @param {string} textContent — extracted document text
 * @param {object} payload — { w: watermarkId, d: docId, u: downloaderId, t: isoTimestamp }
 * @returns {{ modifiedText: string, watermarkToken: string, positions: number[] }}
 */
export const injectDownloadWatermark = (textContent, payload) => {
  const payloadBits = payloadToBits(payload);
  const invisibleString = bitsToInvisible(payloadBits);

  // Split invisible string into chunks to distribute across positions
  const chunkSize = Math.ceil(invisibleString.length / positionCount);
  const chunks = [];
  for (let i = 0; i < invisibleString.length; i += chunkSize) {
    chunks.push(invisibleString.substring(i, i + chunkSize));
  }

  const textLen = textContent.length;
  if (textLen === 0) {
    return {
      modifiedText: invisibleString + textContent,
      watermarkToken: crypto.createHash('sha256').update(invisibleString).digest('hex'),
      positions: [0],
    };
  }

  // Generate truly random insertion positions (crypto.randomInt for each)
  // This makes every download unique even for the same document+user
  const rawPositions = [];
  for (let i = 0; i < chunks.length; i++) {
    rawPositions.push(crypto.randomInt(0, textLen));
  }
  // Sort ascending so we insert from start to end (adjusting offset)
  rawPositions.sort((a, b) => a - b);

  let modifiedText = textContent;
  let offset = 0;
  const finalPositions = [];

  for (let i = 0; i < chunks.length; i++) {
    const pos = rawPositions[i] + offset;
    modifiedText = modifiedText.slice(0, pos) + chunks[i] + modifiedText.slice(pos);
    finalPositions.push(rawPositions[i]); // Store original position (without offset)
    offset += chunks[i].length;
  }

  // Token = SHA-256 of the invisible string + positions
  const watermarkToken = crypto
    .createHash('sha256')
    .update(JSON.stringify({ invisible: invisibleString, positions: finalPositions }))
    .digest('hex');

  return {
    modifiedText,
    watermarkToken,
    positions: finalPositions,
  };
};

// ============================================================
// Extraction — scan text for U+2060-U+2063 sequences
// ============================================================

/**
 * Extract download watermark payload from text content.
 * @param {string} textContent — text extracted from a suspected leaked document
 * @returns {{ payload: object|null, confidence: number, positions: number[] }}
 */
export const extractDownloadWatermark = (textContent) => {
  // Collect all invisible character sequences (U+2060-U+2063)
  const wmRegex = /[\u2060-\u2063]+/g;
  let allInvisible = '';
  const positions = [];
  let match;

  while ((match = wmRegex.exec(textContent)) !== null) {
    allInvisible += match[0];
    positions.push(match.index);
  }

  if (!allInvisible || allInvisible.length < 4) {
    return { payload: null, confidence: 0, positions: [] };
  }

  const bits = invisibleToBits(allInvisible);
  const payload = bitsToPayload(bits);

  if (!payload) {
    return { payload: null, confidence: 0.2, positions };
  }

  // Validate payload structure
  const hasWatermarkId = !!payload.w;
  const hasDocId = !!payload.d;
  const hasUserId = !!payload.u;
  const hasTimestamp = !!payload.t;

  let confidence = 0.5;
  if (hasWatermarkId) confidence += 0.15;
  if (hasDocId) confidence += 0.1;
  if (hasUserId) confidence += 0.15;
  if (hasTimestamp) confidence += 0.1;

  return {
    payload,
    confidence: Math.min(confidence, 1),
    positions,
  };
};

/**
 * Generate a payload hash for DB storage.
 */
export const hashPayload = (payload) => {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
};
