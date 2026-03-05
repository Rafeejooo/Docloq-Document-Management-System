// Document Hashing & DNA Generation Service
// SHA-256 via Node crypto, basic SimHash implementation, SSDEEP placeholder.

import crypto from 'crypto';
import { db } from '../db/index.js';
import { documents } from '../db/schema.js';
import { eq, or, sql } from 'drizzle-orm';

// ============================================================
// SHA-256
// ============================================================

/**
 * Generate a SHA-256 hex digest of a buffer or string.
 * @param {Buffer|string} input
 * @returns {string} — 64-char lowercase hex
 */
export const generateSHA256 = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

// ============================================================
// Text Normalisation (7-step pipeline)
// ============================================================

/**
 * Normalise raw text for consistent hashing.
 *
 * Steps:
 *  1. Lowercase
 *  2. Whitespace normalisation (collapse runs → single space)
 *  3. Punctuation removal
 *  4. Special character removal
 *  5. Unicode NFKD normalisation
 *  6. Accent / diacritic stripping
 *  7. Final whitespace cleanup (trim + collapse)
 *
 * @param {string} rawText
 * @returns {string}
 */
export const normalizeText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Lowercase
  text = text.toLowerCase();

  // 2. Whitespace normalisation — tabs, newlines, multi-spaces → single space
  text = text.replace(/\s+/g, ' ');

  // 3. Punctuation removal
  text = text.replace(/[.,;:!?'"()\[\]{}<>«»""''—–\-/\\|@#$%^&*_+=~`]/g, '');

  // 4. Special / non-printable character removal (keep basic alphanumeric + space)
  text = text.replace(/[^\p{L}\p{N}\s]/gu, '');

  // 5. Unicode NFKD normalisation
  text = text.normalize('NFKD');

  // 6. Strip combining diacritical marks (accents)
  text = text.replace(/[\u0300-\u036f]/g, '');

  // 7. Final whitespace cleanup
  text = text.replace(/\s+/g, ' ').trim();

  return text;
};

// ============================================================
// SimHash (64-bit) — lightweight implementation using BigInt
// ============================================================

/**
 * Generate word-level shingles from text.
 */
const shingle = (text, size = 3) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < size) return [words.join(' ')];
  const shingles = [];
  for (let i = 0; i <= words.length - size; i++) {
    shingles.push(words.slice(i, i + size).join(' '));
  }
  return shingles;
};

/**
 * Hash a string into a 64-bit BigInt using FNV-1a variant.
 */
const hash64 = (str) => {
  let h = 0xcbf29ce484222325n; // FNV offset basis
  const prime = 0x100000001b3n;
  for (let i = 0; i < str.length; i++) {
    h ^= BigInt(str.charCodeAt(i));
    h = (h * prime) & 0xFFFFFFFFFFFFFFFFn; // keep 64 bits
  }
  return h;
};

/**
 * Compute a 64-bit SimHash of the given text.
 * @param {string} text — normalised text
 * @returns {string} — 16-char hex string representing 64-bit hash
 */
export const generateSimHash = (text) => {
  if (!text) return '0000000000000000';

  const shingles = shingle(text);
  // Weighted accumulator for 64 bit positions
  const v = new Array(64).fill(0);

  for (const s of shingles) {
    const h = hash64(s);
    for (let i = 0; i < 64; i++) {
      if ((h >> BigInt(i)) & 1n) {
        v[i] += 1;
      } else {
        v[i] -= 1;
      }
    }
  }

  let fingerprint = 0n;
  for (let i = 0; i < 64; i++) {
    if (v[i] > 0) {
      fingerprint |= (1n << BigInt(i));
    }
  }
  return fingerprint.toString(16).padStart(16, '0');
};

/**
 * Compute Hamming distance between two 64-bit hex simhash strings.
 * @returns {number} 0-64
 */
export const hammingDistance = (a, b) => {
  const va = BigInt(`0x${a}`);
  const vb = BigInt(`0x${b}`);
  let xor = va ^ vb;
  let dist = 0;
  while (xor) {
    dist += Number(xor & 1n);
    xor >>= 1n;
  }
  return dist;
};

// ============================================================
// SSDEEP — placeholder
// ============================================================

/**
 * Generate an SSDEEP fuzzy hash.
 * TODO: Replace with real ssdeep library (ssdeep.js / ssdeep-wasm) when available.
 *       npm install ssdeep.js
 * @param {Buffer|string} _input
 * @returns {string}
 */
export const generateSSDeep = (_input) => {
  // TODO: Implement actual SSDEEP fuzzy hashing
  // Example with library:
  //   import ssdeep from 'ssdeep.js';
  //   return ssdeep.digest(Buffer.isBuffer(_input) ? _input : Buffer.from(_input));
  return 'PLACEHOLDER_SSDEEP';
};

// ============================================================
// Document DNA — combines all hashes
// ============================================================

/**
 * Generate the full Document DNA from normalised text.
 * @param {string} normalizedText
 * @returns {{ sha256: string, ssdeep: string, simhash: string }}
 */
export const generateDocumentDNA = (normalizedText) => {
  const sha256 = generateSHA256(normalizedText || '');
  const ssdeep = generateSSDeep(normalizedText || '');
  const simhash = generateSimHash(normalizedText || '');
  return { sha256, ssdeep, simhash };
};

// ============================================================
// Duplicate Check — query DB for exact + similar matches
// ============================================================

/**
 * Check whether a document with identical or similar hashes already exists.
 * @param {string} sha256
 * @param {string} ssdeep — currently placeholder
 * @param {string} simhash — 16-char hex
 * @returns {{ isExact: boolean, isSimilar: boolean, matches: Array }}
 */
export const checkDuplicate = async (sha256, ssdeep, simhash) => {
  const result = { isExact: false, isSimilar: false, matches: [] };

  try {
    // 1. Exact match — SHA-256
    const exactMatches = await db
      .select({
        id: documents.id,
        filename: documents.originalFilename,
        contentHash: documents.contentHash,
        simHash: documents.simHash,
      })
      .from(documents)
      .where(eq(documents.contentHash, sha256));

    if (exactMatches.length > 0) {
      result.isExact = true;
      result.matches.push(
        ...exactMatches.map((m) => ({ ...m, matchType: 'exact' })),
      );
    }

    // 2. Similar match — SimHash (Hamming distance ≤ 10 → ~84 % similar)
    // Because Drizzle does not have native bitwise XOR pop-count we fetch
    // candidates with a non-null simHash and filter in JS.
    if (simhash && simhash !== '0000000000000000') {
      const candidates = await db
        .select({
          id: documents.id,
          filename: documents.originalFilename,
          contentHash: documents.contentHash,
          simHash: documents.simHash,
        })
        .from(documents)
        .where(
          sql`${documents.simHash} IS NOT NULL AND ${documents.contentHash} != ${sha256}`,
        );

      for (const c of candidates) {
        if (!c.simHash) continue;
        const dist = hammingDistance(simhash, c.simHash);
        if (dist <= 10) {
          result.isSimilar = true;
          result.matches.push({
            ...c,
            matchType: 'similar',
            hammingDistance: dist,
            similarity: Math.round(((64 - dist) / 64) * 100),
          });
        }
      }
    }
  } catch (err) {
    console.error('[Hash] Duplicate check error:', err.message);
  }

  return result;
};
