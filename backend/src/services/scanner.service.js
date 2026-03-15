// Malware Scanner Service — Abstraction Layer
//
// Development mode (SCANNER_ENABLED=false): always returns clean.
// ClamAV mode (SCANNER_ENABLED=true): connects to ClamAV daemon via TCP.
//
// === ClamAV Docker Setup ===
// Add to your docker-compose.yml:
//
//   clamav:
//     image: clamav/clamav:latest
//     container_name: docloq_clamav
//     ports:
//       - "3310:3310"
//     volumes:
//       - clamav_data:/var/lib/clamav
//     restart: unless-stopped
//
//   volumes:
//     clamav_data:
//
// Then set SCANNER_ENABLED=true, CLAMAV_HOST=localhost, CLAMAV_PORT=3310
// ============================================================

import fs from 'fs/promises';
import net from 'net';
import uploadConfig from '../config/upload.config.js';

const { enabled, clamavHost, clamavPort } = uploadConfig.scanner;

// ============================================================
// ClamAV TCP client (clamd protocol over INSTREAM)
// ============================================================

/**
 * Scan a buffer via ClamAV INSTREAM command.
 * @param {Buffer} buffer
 * @returns {{ isClean: boolean, threatName: string|null }}
 */
const clamavScan = (buffer) => {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let response = '';
    const timeout = 30_000; // 30 seconds

    client.setTimeout(timeout);

    client.connect(clamavPort, clamavHost, () => {
      // Send INSTREAM command
      client.write('zINSTREAM\0');

      // Send data in chunks (max 2 KB each for safety, though clamd allows more)
      const CHUNK_SIZE = 2048;
      for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
        const chunk = buffer.subarray(i, i + CHUNK_SIZE);
        // 4-byte big-endian length prefix + chunk
        const sizeHeader = Buffer.alloc(4);
        sizeHeader.writeUInt32BE(chunk.length, 0);
        client.write(sizeHeader);
        client.write(chunk);
      }

      // End stream with zero-length chunk
      const endHeader = Buffer.alloc(4);
      endHeader.writeUInt32BE(0, 0);
      client.write(endHeader);
    });

    client.on('data', (data) => {
      response += data.toString();
    });

    client.on('end', () => {
      // Parse response:  "stream: OK\0" or "stream: <ThreatName> FOUND\0"
      // ClamAV uses null-terminated strings, so strip \0 before parsing
      const trimmed = response.replace(/\0/g, '').trim();
      if (trimmed.endsWith('OK')) {
        resolve({ isClean: true, threatName: null });
      } else {
        const match = trimmed.match(/stream:\s*(.+)\s+FOUND/);
        resolve({
          isClean: false,
          threatName: match ? match[1] : 'UNKNOWN',
        });
      }
    });

    client.on('error', (err) => {
      reject(new Error(`ClamAV connection error: ${err.message}`));
    });

    client.on('timeout', () => {
      client.destroy();
      reject(new Error('ClamAV scan timed out'));
    });
  });
};

// ============================================================
// Public API
// ============================================================

/**
 * Scan a file for malware.
 * @param {string} filePath — path to the file on disk
 * @returns {{ isClean: boolean, threatName: string|null, scanTime: number }}
 */
export const scanFile = async (filePath) => {
  const start = Date.now();

  if (!enabled) {
    console.warn('[Scanner] ⚠️  Scanning disabled (SCANNER_ENABLED=false). Skipping scan.');
    return {
      isClean: true,
      threatName: null,
      scanTime: Date.now() - start,
      skipped: true,
    };
  }

  try {
    const buffer = await fs.readFile(filePath);
    const result = await clamavScan(buffer);
    return {
      ...result,
      scanTime: Date.now() - start,
      skipped: false,
    };
  } catch (err) {
    console.error('[Scanner] Scan failed:', err.message);
    // If ClamAV is unreachable, fail open with a warning in dev, fail closed in prod
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Malware scan failed — cannot proceed in production without scan.');
    }
    console.warn('[Scanner] ⚠️  ClamAV unreachable — allowing file in development mode.');
    return {
      isClean: true,
      threatName: null,
      scanTime: Date.now() - start,
      skipped: true,
      error: err.message,
    };
  }
};

/**
 * Scan a buffer directly (without writing to disk first).
 * @param {Buffer} buffer
 * @returns {{ isClean: boolean, threatName: string|null, scanTime: number }}
 */
export const scanBuffer = async (buffer) => {
  const start = Date.now();

  if (!enabled) {
    console.warn('[Scanner] ⚠️  Scanning disabled. Skipping.');
    return { isClean: true, threatName: null, scanTime: Date.now() - start, skipped: true };
  }

  try {
    const result = await clamavScan(buffer);
    return { ...result, scanTime: Date.now() - start, skipped: false };
  } catch (err) {
    console.error('[Scanner] Buffer scan failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Malware scan failed.');
    }
    return { isClean: true, threatName: null, scanTime: Date.now() - start, skipped: true, error: err.message };
  }
};
