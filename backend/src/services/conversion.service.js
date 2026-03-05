// Conversion Service — PDF→DOCX using OnlyOffice Conversion API
// Also provides blank DOCX creation

import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import archiver from 'archiver';

const ONLYOFFICE_URL = process.env.ONLYOFFICE_URL_INTERNAL || process.env.ONLYOFFICE_URL || 'http://localhost:8082';

/**
 * Create a minimal blank .docx file buffer using archiver (proper OOXML zip).
 */
export async function createBlankDocx() {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
            xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
            xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
            xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
            xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
            mc:Ignorable="w14 wp14">
  <w:body>
    <w:p>
      <w:pPr><w:rPr></w:rPr></w:pPr>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  return new Promise((resolve, reject) => {
    const chunks = [];
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    archive.append(contentTypes, { name: '[Content_Types].xml' });
    archive.append(rels, { name: '_rels/.rels' });
    archive.append(document, { name: 'word/document.xml' });
    archive.append(styles, { name: 'word/styles.xml' });
    archive.append(wordRels, { name: 'word/_rels/document.xml.rels' });

    archive.finalize();
  });
}

/**
 * Convert a file using OnlyOffice Conversion API.
 * @param {string} fileUrl - URL accessible by OnlyOffice to fetch the source file
 * @param {string} fromType - Source file extension (e.g. 'pdf')
 * @param {string} outputType - Target format (e.g., 'docx', 'pdf')
 * @param {string} [key] - Unique key for the conversion
 * @returns {Promise<{url: string}>} - URL to download the converted file from OnlyOffice
 */
export async function convertDocument(fileUrl, fromType, outputType, key) {
  const conversionUrl = `${ONLYOFFICE_URL}/ConvertService.ashx`;

  const payload = {
    async: false,
    filetype: fromType,
    key: key || randomUUID(),
    outputtype: outputType,
    url: fileUrl,
  };

  console.log('[Conversion] Requesting conversion:', payload);

  const response = await fetch(conversionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OnlyOffice conversion failed: ${response.status} — ${text}`);
  }

  // OnlyOffice Conversion API returns XML, not JSON
  const xmlText = await response.text();
  console.log('[Conversion] Raw response:', xmlText);

  // Parse XML response: <FileResult><FileUrl>...</FileUrl><Percent>100</Percent><EndConvert>True</EndConvert></FileResult>
  const errorMatch = xmlText.match(/<Error>(\d+)<\/Error>/);
  const errorCode = errorMatch ? parseInt(errorMatch[1], 10) : 0;
  if (errorCode !== 0) {
    throw new Error(`OnlyOffice conversion error code: ${errorCode}`);
  }

  const urlMatch = xmlText.match(/<FileUrl>(.*?)<\/FileUrl>/);
  if (!urlMatch || !urlMatch[1]) {
    throw new Error(`OnlyOffice conversion returned no file URL. Response: ${xmlText}`);
  }

  // Unescape XML entities in URL (&amp; → &)
  let convertedFileUrl = urlMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

  // OnlyOffice returns URLs relative to its internal address (port 80 inside container).
  // Rewrite to the external URL so Node.js can fetch it.
  // e.g. http://localhost/ → http://localhost:8082/
  const externalUrl = ONLYOFFICE_URL.replace(/\/$/, '');
  convertedFileUrl = convertedFileUrl
    .replace(/^http:\/\/localhost(\/|:80\/)/, `${externalUrl}/`)
    .replace(/^http:\/\/onlyoffice[^/]*(\/|:80\/)/, `${externalUrl}/`)
    .replace(/^http:\/\/0\.0\.0\.0(\/|:80\/)/, `${externalUrl}/`);

  console.log('[Conversion] Success, converted file at:', convertedFileUrl);
  return { url: convertedFileUrl };
}

/**
 * Download a file from a URL and return as Buffer.
 */
export async function downloadFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download from ${url}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
