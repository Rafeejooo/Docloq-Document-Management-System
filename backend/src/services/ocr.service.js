/**
 * OCR & Image Processing Service
 *
 * Handles: content type detection, page counting, image rotation,
 * image enhancement, and Tesseract OCR for document analysis.
 *
 * Uses: tesseract.js (WASM-based, no system dependency), sharp (image processing)
 */

import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// ─── OCR Worker Pool (lazy-init, reusable) ────────────────────────────
let ocrWorker = null;
let workerIdleTimer = null;
const WORKER_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize or get the reusable OCR worker.
 * Lazy-loaded on first OCR request, terminated after 5 min idle.
 */
export const getOCRWorker = async (lang = 'eng') => {
  if (ocrWorker) {
    resetIdleTimer();
    return ocrWorker;
  }

  console.log('[OCR] Initializing Tesseract worker...');
  ocrWorker = await createWorker(lang, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        // Only log recognition progress at 25% intervals
        if (m.progress && m.progress % 0.25 < 0.02) {
          console.log(`[OCR] Recognition: ${Math.round(m.progress * 100)}%`);
        }
      }
    },
  });

  console.log('[OCR] Tesseract worker ready');
  resetIdleTimer();
  return ocrWorker;
};

/**
 * Terminate the OCR worker to free memory (~100-200MB).
 */
export const terminateOCRWorker = async () => {
  if (workerIdleTimer) {
    clearTimeout(workerIdleTimer);
    workerIdleTimer = null;
  }
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
    console.log('[OCR] Worker terminated (idle timeout or manual)');
  }
};

function resetIdleTimer() {
  if (workerIdleTimer) clearTimeout(workerIdleTimer);
  workerIdleTimer = setTimeout(() => terminateOCRWorker(), WORKER_IDLE_TIMEOUT);
}

// ─── Page Count ───────────────────────────────────────────────────────

/**
 * Get the number of pages in a document.
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - MIME type
 * @returns {Promise<number>} Page count
 */
export const getPageCount = async (buffer, mimeType) => {
  if (mimeType === 'application/pdf') {
    try {
      const data = await pdfParse(buffer, { max: 0 }); // max:0 = metadata only
      return data.numpages || 1;
    } catch (err) {
      console.warn('[OCR] Failed to get PDF page count:', err.message);
      return 1;
    }
  }

  if (mimeType.startsWith('image/')) {
    return 1;
  }

  // Text files, office docs = 1 logical page
  return 1;
};

// ─── Content Type Detection ───────────────────────────────────────────

/**
 * Detect whether a document contains text, images, or both.
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - MIME type
 * @returns {Promise<{ contentType: string, pageDetails: Array }>}
 *   contentType: 'full-text' | 'mixed' | 'image-only'
 *   pageDetails: [{ page: 1, type: 'text'|'image', charCount: N }]
 */
export const detectContentType = async (buffer, mimeType) => {
  // Standalone images are always image-only
  if (mimeType.startsWith('image/')) {
    return {
      contentType: 'image-only',
      pageDetails: [{ page: 1, type: 'image', charCount: 0 }],
    };
  }

  // Text files are always full-text
  if (mimeType.startsWith('text/')) {
    const charCount = buffer.toString('utf-8').length;
    return {
      contentType: 'full-text',
      pageDetails: [{ page: 1, type: 'text', charCount }],
    };
  }

  // Office docs (DOCX, etc.) treated as full-text
  if (mimeType.includes('officedocument') || mimeType.includes('msword') ||
      mimeType.includes('opendocument')) {
    return {
      contentType: 'full-text',
      pageDetails: [{ page: 1, type: 'text', charCount: -1 }], // -1 = unknown
    };
  }

  // PDF: analyze each page for text content
  if (mimeType === 'application/pdf') {
    return await detectPDFContentType(buffer);
  }

  return {
    contentType: 'full-text',
    pageDetails: [{ page: 1, type: 'text', charCount: 0 }],
  };
};

/**
 * Analyze each page of a PDF to determine if it contains text or is image-based.
 */
async function detectPDFContentType(buffer) {
  try {
    const data = await pdfParse(buffer);
    const totalPages = data.numpages || 1;
    const totalText = (data.text || '').trim();

    // If the entire PDF has very little text, it's likely all image-based
    if (totalText.length < 20 * totalPages) {
      const pageDetails = [];
      for (let i = 1; i <= totalPages; i++) {
        pageDetails.push({ page: i, type: 'image', charCount: 0 });
      }
      return { contentType: 'image-only', pageDetails };
    }

    // For single-page PDFs, simple check
    if (totalPages === 1) {
      const type = totalText.length < 20 ? 'image' : 'text';
      return {
        contentType: type === 'image' ? 'image-only' : 'full-text',
        pageDetails: [{ page: 1, type, charCount: totalText.length }],
      };
    }

    // For multi-page: try to estimate per-page text distribution
    // pdf-parse gives us all text concatenated, so we split by common page break patterns
    const textPerPage = splitTextByPages(totalText, totalPages);
    const pageDetails = [];
    let hasText = false;
    let hasImage = false;

    for (let i = 0; i < totalPages; i++) {
      const pageText = textPerPage[i] || '';
      const charCount = pageText.trim().length;
      const type = charCount < 20 ? 'image' : 'text';
      pageDetails.push({ page: i + 1, type, charCount });
      if (type === 'text') hasText = true;
      if (type === 'image') hasImage = true;
    }

    let contentType = 'full-text';
    if (hasText && hasImage) contentType = 'mixed';
    else if (!hasText) contentType = 'image-only';

    return { contentType, pageDetails };
  } catch (err) {
    console.warn('[OCR] PDF content detection failed:', err.message);
    return {
      contentType: 'full-text',
      pageDetails: [{ page: 1, type: 'text', charCount: 0 }],
    };
  }
}

/**
 * Best-effort split of PDF text into pages.
 * Uses form-feed characters (\f) which pdf-parse inserts between pages.
 */
function splitTextByPages(text, totalPages) {
  // pdf-parse uses \f (form feed) as page separator
  const pages = text.split('\f');

  // If we got the right number of pages, great
  if (pages.length >= totalPages) {
    return pages.slice(0, totalPages);
  }

  // Otherwise, split evenly
  const avgLen = Math.ceil(text.length / totalPages);
  const result = [];
  for (let i = 0; i < totalPages; i++) {
    result.push(text.substring(i * avgLen, (i + 1) * avgLen));
  }
  return result;
}

// ─── PDF Page to Image Extraction ─────────────────────────────────────

/**
 * Extract a specific page from a PDF as a PNG image buffer.
 * Uses sharp's built-in PDF rendering (via libvips/poppler).
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {number} pageIndex - 0-based page index
 * @returns {Promise<Buffer>} PNG image buffer
 */
export const extractPageAsImage = async (pdfBuffer, pageIndex = 0) => {
  try {
    const image = await sharp(pdfBuffer, {
      page: pageIndex,
      density: 300, // 300 DPI for good OCR quality
    })
      .png()
      .toBuffer();

    console.log(`[OCR] Extracted page ${pageIndex + 1} as image (${Math.round(image.length / 1024)}KB)`);
    return image;
  } catch (err) {
    console.error(`[OCR] Failed to extract page ${pageIndex + 1}:`, err.message);
    throw new Error(`Failed to extract page ${pageIndex + 1} as image: ${err.message}`);
  }
};

// ─── Image Rotation Detection & Correction ────────────────────────────

/**
 * Detect and correct image rotation.
 * 1. Auto-rotate based on EXIF orientation data
 * 2. If no EXIF, use basic dimension heuristic
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<{ buffer: Buffer, wasRotated: boolean, rotation: number }>}
 */
export const detectAndCorrectRotation = async (imageBuffer) => {
  try {
    // sharp.rotate() with no arguments auto-rotates based on EXIF
    const rotated = sharp(imageBuffer).rotate();
    const metadata = await sharp(imageBuffer).metadata();
    const rotatedBuffer = await rotated.toBuffer();
    const rotatedMeta = await sharp(rotatedBuffer).metadata();

    // Check if dimensions changed (indicating rotation occurred)
    const wasRotated = metadata.width !== rotatedMeta.width || metadata.height !== rotatedMeta.height;
    const rotation = wasRotated ? (metadata.orientation || 0) : 0;

    if (wasRotated) {
      console.log(`[OCR] Image auto-rotated (EXIF orientation: ${metadata.orientation})`);
    }

    return { buffer: rotatedBuffer, wasRotated, rotation };
  } catch (err) {
    console.warn('[OCR] Rotation detection failed, using original:', err.message);
    return { buffer: imageBuffer, wasRotated: false, rotation: 0 };
  }
};

// ─── Image Enhancement for OCR ────────────────────────────────────────

/**
 * Enhance an image for better OCR accuracy.
 * Pipeline: grayscale → normalize contrast → sharpen → resize if too small
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<{ buffer: Buffer, wasEnhanced: boolean, enhancements: string[] }>}
 */
export const enhanceImage = async (imageBuffer) => {
  const enhancements = [];

  try {
    let pipeline = sharp(imageBuffer);
    const metadata = await sharp(imageBuffer).metadata();

    // 1. Convert to grayscale (simplifies for OCR)
    pipeline = pipeline.grayscale();
    enhancements.push('grayscale');

    // 2. Normalize contrast (stretch histogram)
    pipeline = pipeline.normalize();
    enhancements.push('contrast-normalize');

    // 3. Sharpen for text clarity
    pipeline = pipeline.sharpen({ sigma: 1.5, m1: 1.0, m2: 0.5 });
    enhancements.push('sharpen');

    // 4. If image is small, upscale for better OCR
    if (metadata.width && metadata.width < 1000) {
      const scale = Math.ceil(1000 / metadata.width);
      pipeline = pipeline.resize({
        width: metadata.width * scale,
        height: metadata.height * scale,
        kernel: 'lanczos3',
      });
      enhancements.push(`upscale-${scale}x`);
    }

    // 5. Output as PNG (lossless, best for OCR)
    const enhancedBuffer = await pipeline.png().toBuffer();

    console.log(`[OCR] Image enhanced: ${enhancements.join(', ')}`);
    return { buffer: enhancedBuffer, wasEnhanced: true, enhancements };
  } catch (err) {
    console.warn('[OCR] Enhancement failed, using original:', err.message);
    return { buffer: imageBuffer, wasEnhanced: false, enhancements: [] };
  }
};

// ─── Tesseract OCR ────────────────────────────────────────────────────

/**
 * Perform OCR on an image buffer using Tesseract.
 * @param {Buffer} imageBuffer - Image buffer (PNG/JPEG)
 * @param {string} lang - Language code (default: 'eng')
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export const performOCR = async (imageBuffer, lang = 'eng') => {
  const worker = await getOCRWorker(lang);

  try {
    console.log(`[OCR] Starting text recognition (${Math.round(imageBuffer.length / 1024)}KB image)...`);
    const { data } = await worker.recognize(imageBuffer);

    const text = (data.text || '').trim();
    const confidence = Math.round(data.confidence || 0);

    console.log(`[OCR] Recognition complete: ${text.length} chars, ${confidence}% confidence`);
    return { text, confidence };
  } catch (err) {
    console.error('[OCR] Recognition failed:', err.message);
    throw new Error(`OCR recognition failed: ${err.message}`);
  }
};

// ─── Full Image Processing Pipeline ───────────────────────────────────

/**
 * Full pipeline: detect rotation → correct → enhance → OCR
 * @param {Buffer} imageBuffer - Raw image buffer
 * @param {string} lang - OCR language (default: 'eng')
 * @returns {Promise<{ text: string, confidence: number, wasRotated: boolean, wasEnhanced: boolean, enhancements: string[] }>}
 */
export const processImageForAI = async (imageBuffer, lang = 'eng') => {
  console.log('[OCR] Starting full image processing pipeline...');

  // Step 1: Detect and correct rotation
  const { buffer: rotatedBuffer, wasRotated } = await detectAndCorrectRotation(imageBuffer);

  // Step 2: Enhance image for OCR
  const { buffer: enhancedBuffer, wasEnhanced, enhancements } = await enhanceImage(rotatedBuffer);

  // Step 3: Run OCR
  const { text, confidence } = await performOCR(enhancedBuffer, lang);

  console.log(`[OCR] Pipeline complete → ${text.length} chars, ${confidence}% confidence, rotated=${wasRotated}, enhanced=${wasEnhanced}`);

  return {
    text,
    confidence,
    wasRotated,
    wasEnhanced,
    enhancements,
  };
};

// ─── Extract Text from Specific PDF Pages ─────────────────────────────

/**
 * Extract text from specific pages of a PDF.
 * For text pages: direct extraction via pdf-parse.
 * For image pages: render to image → OCR pipeline.
 *
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {number[]} pageNumbers - 1-based page numbers to extract
 * @param {Array} pageDetails - from detectContentType()
 * @returns {Promise<{ pages: Array, ocrPages: number[], totalConfidence: number }>}
 */
export const extractTextFromPages = async (pdfBuffer, pageNumbers, pageDetails) => {
  // Get all text from PDF (split by pages)
  const data = await pdfParse(pdfBuffer);
  const totalPages = data.numpages || 1;
  const allPageTexts = splitTextByPages(data.text || '', totalPages);

  const pages = [];
  const ocrPages = [];
  let totalConfidence = 0;
  let ocrCount = 0;

  for (const pageNum of pageNumbers) {
    if (pageNum < 1 || pageNum > totalPages) {
      pages.push({ page: pageNum, text: '', method: 'skipped', error: 'Page out of range' });
      continue;
    }

    const detail = pageDetails.find(d => d.page === pageNum);
    const isImagePage = detail?.type === 'image';

    if (!isImagePage) {
      // Text page — direct extraction
      const text = (allPageTexts[pageNum - 1] || '').trim();
      pages.push({ page: pageNum, text, method: 'text-extract', confidence: 100 });
    } else {
      // Image page — render to image, then OCR
      try {
        const imageBuffer = await extractPageAsImage(pdfBuffer, pageNum - 1);
        const ocrResult = await processImageForAI(imageBuffer);
        pages.push({
          page: pageNum,
          text: ocrResult.text,
          method: 'ocr',
          confidence: ocrResult.confidence,
          wasRotated: ocrResult.wasRotated,
          wasEnhanced: ocrResult.wasEnhanced,
        });
        ocrPages.push(pageNum);
        totalConfidence += ocrResult.confidence;
        ocrCount++;
      } catch (err) {
        console.error(`[OCR] Failed to process page ${pageNum}:`, err.message);
        pages.push({ page: pageNum, text: '', method: 'ocr-failed', error: err.message });
      }
    }
  }

  return {
    pages,
    ocrPages,
    avgOCRConfidence: ocrCount > 0 ? Math.round(totalConfidence / ocrCount) : 0,
  };
};
