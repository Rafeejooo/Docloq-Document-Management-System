// Document Rewriter Service — Format-specific watermark injection into document buffers
// Supports: TXT (direct), DOCX (jszip XML), PDF (pdf-lib annotations)

import JSZip from 'jszip';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import uploadConfig from '../config/upload.config.js';

const { supportedCategories } = uploadConfig.downloadWatermark;
const { mimeToCategory } = uploadConfig;

/**
 * Apply a watermark function to a document buffer based on its MIME type.
 * @param {Buffer} buffer — decrypted document content
 * @param {string} mimeType — document MIME type
 * @param {(text: string) => { modifiedText: string, watermarkToken: string, positions: number[] }} watermarkFn
 *   — function that injects watermark into extracted text
 * @returns {Promise<{ buffer: Buffer, method: string, success: boolean }>}
 */
export const watermarkBuffer = async (buffer, mimeType, watermarkFn) => {
  const category = mimeToCategory[mimeType];

  if (!category || !supportedCategories.includes(category)) {
    return { buffer, method: 'unsupported', success: false };
  }

  try {
    switch (category) {
      case 'text':
        return await watermarkText(buffer, watermarkFn);
      case 'office':
        return await watermarkDocx(buffer, mimeType, watermarkFn);
      case 'pdf':
        return await watermarkPdf(buffer, watermarkFn);
      default:
        return { buffer, method: 'unsupported', success: false };
    }
  } catch (error) {
    console.warn(`[DocumentRewriter] Watermark injection failed for ${mimeType}:`, error.message);
    return { buffer, method: 'error', success: false };
  }
};

// ============================================================
// Plain Text
// ============================================================

async function watermarkText(buffer, watermarkFn) {
  const text = buffer.toString('utf-8');
  const { modifiedText, watermarkToken, positions } = watermarkFn(text);
  return {
    buffer: Buffer.from(modifiedText, 'utf-8'),
    method: 'text_direct',
    success: true,
    watermarkToken,
    positions,
  };
}

// ============================================================
// DOCX (Office Open XML)
// ============================================================

async function watermarkDocx(buffer, mimeType, watermarkFn) {
  // Only handle actual DOCX files (not XLS, XLSX, PPT, PPTX)
  const docxMimes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  if (!docxMimes.includes(mimeType)) {
    // For spreadsheets/presentations, inject via metadata approach
    return await watermarkOfficeMetadata(buffer, watermarkFn);
  }

  const zip = await JSZip.loadAsync(buffer);
  const docXmlFile = zip.file('word/document.xml');

  if (!docXmlFile) {
    console.warn('[DocumentRewriter] DOCX missing word/document.xml — falling back to metadata');
    return await watermarkOfficeMetadata(buffer, watermarkFn);
  }

  const docXml = await docXmlFile.async('string');

  // Extract all text content from <w:t> elements
  const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  const textSegments = [];
  let xmlMatch;
  while ((xmlMatch = textRegex.exec(docXml)) !== null) {
    textSegments.push(xmlMatch[1]);
  }

  const fullText = textSegments.join('');

  if (!fullText || fullText.length < 10) {
    return await watermarkOfficeMetadata(buffer, watermarkFn);
  }

  // Apply watermark to the extracted text
  const { modifiedText, watermarkToken, positions } = watermarkFn(fullText);

  // Strategy: prepend the invisible watermark chars to the first <w:t> element
  // This preserves document structure while injecting invisible characters
  const invisibleChars = extractInvisibleChars(fullText, modifiedText);

  let modifiedXml = docXml;
  let injected = false;

  // Find the first <w:t> element and prepend invisible chars to its content
  modifiedXml = docXml.replace(
    /(<w:t[^>]*>)([\s\S]*?)(<\/w:t>)/,
    (match, openTag, content, closeTag) => {
      injected = true;
      // Ensure xml:space="preserve" so invisible chars are kept
      const preserveTag = openTag.includes('xml:space')
        ? openTag
        : openTag.replace('<w:t', '<w:t xml:space="preserve"');
      return `${preserveTag}${invisibleChars}${content}${closeTag}`;
    }
  );

  if (!injected) {
    return await watermarkOfficeMetadata(buffer, watermarkFn);
  }

  zip.file('word/document.xml', modifiedXml);
  const modifiedBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return {
    buffer: modifiedBuffer,
    method: 'docx_xml',
    success: true,
    watermarkToken,
    positions,
  };
}

/**
 * Fallback: inject watermark into Office file custom properties.
 */
async function watermarkOfficeMetadata(buffer, watermarkFn) {
  try {
    const zip = await JSZip.loadAsync(buffer);

    // Create a dummy text to watermark and store in a custom XML part
    const dummyText = 'docloq-watermark-carrier-text-for-invisible-encoding';
    const { modifiedText, watermarkToken, positions } = watermarkFn(dummyText);

    // Add as a custom XML part
    zip.file('customXml/watermark.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<watermark>${modifiedText}</watermark>`);

    const modifiedBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return {
      buffer: modifiedBuffer,
      method: 'office_metadata',
      success: true,
      watermarkToken,
      positions,
    };
  } catch (error) {
    console.warn('[DocumentRewriter] Office metadata watermark failed:', error.message);
    return { buffer, method: 'error', success: false };
  }
}

// ============================================================
// PDF
// ============================================================

async function watermarkPdf(buffer, watermarkFn) {
  // Generate invisible text to inject
  const dummyText = 'docloq-watermark-carrier-text-for-invisible-encoding';
  const { modifiedText, watermarkToken, positions } = watermarkFn(dummyText);
  const invisibleChars = extractInvisibleChars(dummyText, modifiedText);

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      return { buffer, method: 'pdf_empty', success: false };
    }

    // Embed a standard font for the invisible text
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Draw invisible text on the first page (zero opacity, 1pt, bottom-left)
    const firstPage = pages[0];
    firstPage.drawText(invisibleChars, {
      x: 0,
      y: 0,
      size: 1,
      font,
      opacity: 0,
    });

    // Also embed in PDF metadata as a custom property
    pdfDoc.setKeywords([`dwm:${invisibleChars}`]);

    const modifiedBuffer = Buffer.from(await pdfDoc.save());

    return {
      buffer: modifiedBuffer,
      method: 'pdf_annotation',
      success: true,
      watermarkToken,
      positions,
    };
  } catch (error) {
    console.warn('[DocumentRewriter] PDF watermark via annotation failed:', error.message);

    // Fallback: try metadata-only approach
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      pdfDoc.setKeywords([`dwm:${invisibleChars}`]);
      const modifiedBuffer = Buffer.from(await pdfDoc.save());

      return {
        buffer: modifiedBuffer,
        method: 'pdf_metadata',
        success: true,
        watermarkToken,
        positions,
      };
    } catch (metaError) {
      console.warn('[DocumentRewriter] PDF metadata watermark also failed:', metaError.message);
      return { buffer, method: 'error', success: false };
    }
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Extract the invisible characters that were added by the watermark function.
 * Compares original text with watermarked text to isolate the injected chars.
 */
function extractInvisibleChars(originalText, modifiedText) {
  const wmCharSet = new Set(uploadConfig.downloadWatermark.chars);
  let invisible = '';
  for (const ch of modifiedText) {
    if (wmCharSet.has(ch)) {
      invisible += ch;
    }
  }
  return invisible;
}
