// Document Routes

import { Router } from 'express';
import multer from 'multer';
import { 
  getAllDocuments, 
  getDocument, 
  uploadDocument, 
  serveDocument,
  downloadDocument, 
  deleteDocument,
  getOnlyOfficeConfig,
  onlyOfficeCallback
} from '../controllers/document.controller.js';
import { optionalAuth, authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Configure multer for memory storage (temporary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow office documents, PDFs, and text files
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

// Routes - using optionalAuth for testing (change to requireAuth for production)
router.get('/', optionalAuth, getAllDocuments);
router.get('/:id', optionalAuth, getDocument);
router.post('/upload', optionalAuth, upload.single('file'), uploadDocument);
router.get('/:id/file', serveDocument); // No auth for OnlyOffice to access
router.get('/:id/download', optionalAuth, downloadDocument);
router.delete('/:id', optionalAuth, deleteDocument);

// OnlyOffice specific routes
router.get('/:id/onlyoffice-config', optionalAuth, getOnlyOfficeConfig);
router.post('/:id/callback', onlyOfficeCallback); // No auth - OnlyOffice callback

export default router;
