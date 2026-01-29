// Document Controller - Temporary Upload for OnlyOffice Testing

import { db } from '../db/index.js';
import { documents } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

// Storage path for temporary uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// Get all documents
export const getAllDocuments = async (req, res) => {
  try {
    const allDocs = await db.select().from(documents).orderBy(desc(documents.createdAt));
    
    res.json({
      success: true,
      data: allDocs,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
    });
  }
};

// Get single document
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
    });
  }
};

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    await ensureUploadDir();
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    
    // Generate unique filename
    const fileExt = path.extname(originalname);
    const uniqueFilename = `${randomUUID()}${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);
    
    // Save file to disk
    await fs.writeFile(filePath, buffer);
    
    // For testing: Get first organization and user from database, or use null
    let orgId = null;
    let userId = null;
    
    try {
      // Try to get from authenticated user first
      if (req.user?.id && req.user?.organizationId) {
        orgId = req.user.organizationId;
        userId = req.user.id;
      } else {
        // Fallback: get first org and user from database
        const { organizations, users } = await import('../db/schema.js');
        const [firstOrg] = await db.select().from(organizations).limit(1);
        const [firstUser] = await db.select().from(users).limit(1);
        
        if (firstOrg) orgId = firstOrg.id;
        if (firstUser) userId = firstUser.id;
      }
    } catch (e) {
      console.warn('Could not get org/user for document:', e.message);
    }

    // If still no org/user, we can't insert due to foreign key constraints
    if (!orgId || !userId) {
      // Clean up uploaded file
      try { await fs.unlink(filePath); } catch {}
      return res.status(400).json({
        success: false,
        message: 'No organization or user found. Please run db:seed first.',
      });
    }
    
    // Save to database
    const [newDoc] = await db.insert(documents).values({
      organizationId: orgId,
      filename: uniqueFilename,
      originalFilename: originalname,
      mimeType: mimetype,
      fileSize: size,
      ownerId: userId,
      status: 'active',
    }).returning();
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: newDoc,
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
    });
  }
};

// Serve document file (for OnlyOffice)
export const serveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    const filePath = path.join(UPLOAD_DIR, doc.filename);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk',
      });
    }
    
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Serve document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve document',
    });
  }
};

// Download document
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    const filePath = path.join(UPLOAD_DIR, doc.filename);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk',
      });
    }
    
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalFilename}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document',
    });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, doc.filename);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('Could not delete file from disk:', err.message);
    }
    
    // Delete from database
    await db.delete(documents).where(eq(documents.id, id));
    
    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
    });
  }
};

// Get OnlyOffice config for viewing/editing
export const getOnlyOfficeConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode = 'view' } = req.query; // view or edit
    
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }
    
    // Get file extension for documentType
    const ext = path.extname(doc.originalFilename).toLowerCase().slice(1);
    const documentType = getDocumentType(ext);
    
    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format for OnlyOffice',
      });
    }
    
    // For OnlyOffice running in Docker, it needs to access the backend via host.docker.internal
    // On Mac/Windows Docker, host.docker.internal resolves to the host machine
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const backendUrlForDocker = process.env.BACKEND_URL_DOCKER || 'http://host.docker.internal:3000';
    const onlyOfficeUrl = process.env.ONLYOFFICE_URL || 'http://localhost:8082';
    
    // OnlyOffice configuration
    const config = {
      document: {
        fileType: ext,
        key: `${doc.id}-${doc.updatedAt?.getTime() || Date.now()}`, // Unique key for caching
        title: doc.originalFilename,
        // Use Docker-accessible URL for OnlyOffice to fetch the file
        url: `${backendUrlForDocker}/api/documents/${doc.id}/file`,
      },
      documentType: documentType,
      editorConfig: {
        mode: mode,
        lang: 'en',
        // Callback URL also needs to be Docker-accessible
        callbackUrl: `${backendUrlForDocker}/api/documents/${doc.id}/callback`,
        user: {
          id: req.user?.id || 'guest',
          name: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'Guest User',
        },
        customization: {
          autosave: true,
          chat: false,
          comments: true,
          help: false,
          hideRightMenu: false,
          logo: {
            image: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png`,
            imageEmbedded: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/logo.png`,
          },
        },
      },
      type: 'desktop', // desktop, mobile, embedded
    };
    
    res.json({
      success: true,
      data: {
        config,
        onlyOfficeUrl: `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js`,
      },
    });
  } catch (error) {
    console.error('Get OnlyOffice config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OnlyOffice configuration',
    });
  }
};

// OnlyOffice callback handler (for saving edits)
export const onlyOfficeCallback = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, url, key } = req.body;
    
    console.log('OnlyOffice callback:', { id, status, key });
    
    // Status codes:
    // 0 - no document with the key identifier could be found
    // 1 - document is being edited
    // 2 - document is ready for saving
    // 3 - document saving error occurred
    // 4 - document is closed with no changes
    // 6 - document is being edited, but the current document state is saved
    // 7 - error has occurred while force saving the document
    
    if (status === 2 || status === 6) {
      // Document ready for saving - download and save
      const [doc] = await db.select().from(documents).where(eq(documents.id, id));
      
      if (doc && url) {
        try {
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          
          const filePath = path.join(UPLOAD_DIR, doc.filename);
          await fs.writeFile(filePath, Buffer.from(buffer));
          
          // Update document timestamp
          await db.update(documents)
            .set({ updatedAt: new Date() })
            .where(eq(documents.id, id));
          
          console.log('Document saved successfully:', doc.originalFilename);
        } catch (saveError) {
          console.error('Error saving document from OnlyOffice:', saveError);
        }
      }
    }
    
    // OnlyOffice expects { "error": 0 } response
    res.json({ error: 0 });
  } catch (error) {
    console.error('OnlyOffice callback error:', error);
    res.json({ error: 0 }); // Still return success to OnlyOffice
  }
};

// Helper: Get document type for OnlyOffice
function getDocumentType(extension) {
  const wordExtensions = ['doc', 'docx', 'docm', 'dot', 'dotx', 'dotm', 'odt', 'fodt', 'ott', 'rtf', 'txt', 'html', 'htm', 'mht', 'xml', 'pdf', 'djvu', 'fb2', 'epub', 'xps', 'oxps'];
  const cellExtensions = ['xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'xltm', 'ods', 'fods', 'ots', 'csv'];
  const slideExtensions = ['ppt', 'pptx', 'pptm', 'pot', 'potx', 'potm', 'odp', 'fodp', 'otp', 'ppsx'];
  
  if (wordExtensions.includes(extension)) return 'word';
  if (cellExtensions.includes(extension)) return 'cell';
  if (slideExtensions.includes(extension)) return 'slide';
  
  return null;
}
