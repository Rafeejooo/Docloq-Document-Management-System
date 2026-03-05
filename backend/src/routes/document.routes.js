// Document Routes

import { Router } from 'express';
import multer from 'multer';
import { 
  getAllDocuments, 
  getDocument, 
  uploadDocument,
  uploadDocumentSimple,
  serveDocument,
  downloadDocument, 
  downloadDocumentDecrypted,
  downloadDocumentConverted,
  deleteDocument,
  getOnlyOfficeConfig,
  onlyOfficeCallback,
  forceSaveDocument,
  getDocumentVersions,
  verifyDocument,
  verifyByShortCode,
} from '../controllers/document.controller.js';
import { optionalAuth, authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      // Word
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Excel
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // PowerPoint
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // PDF
      'application/pdf',
      // Images
      'image/png',
      'image/jpeg',
      // Text
      'text/plain',
      // OpenDocument
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      // CSV
      'text/csv',
      // RTF
      'application/rtf',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`), false);
    }
  },
});

// === Public / optional-auth routes ===
router.get('/', optionalAuth, getAllDocuments);
router.get('/verify', verifyByShortCode);              // Public QR code verification by short code
router.get('/:id', optionalAuth, getDocument);
router.get('/:id/file', serveDocument);                // No auth — OnlyOffice must access this

// === Authenticated routes ===
router.post('/upload', optionalAuth, upload.single('file'), uploadDocument);                  // Full pipeline
router.post('/upload-simple', optionalAuth, upload.single('file'), uploadDocumentSimple);     // Legacy simple upload
router.get('/:id/versions', optionalAuth, getDocumentVersions);
router.get('/:id/download', optionalAuth, downloadDocumentDecrypted);                         // Decrypt + download
router.get('/:id/download-as', optionalAuth, downloadDocumentConverted);                       // Convert + download (format=pdf|docx|xlsx|png|jpg)
router.post('/:id/verify', optionalAuth, upload.single('file'), verifyDocument);              // Verify document
router.delete('/:id', optionalAuth, deleteDocument);

// === OnlyOffice specific routes ===
router.get('/:id/onlyoffice-config', optionalAuth, getOnlyOfficeConfig);
router.post('/:id/callback', onlyOfficeCallback);      // No auth — OnlyOffice callback
router.post('/:id/force-save', optionalAuth, forceSaveDocument);  // Manual save trigger

export default router;
