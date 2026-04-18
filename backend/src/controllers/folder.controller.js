// Folder Controller — CRUD with hierarchy support

import { db } from '../db/index.js';
import { folders, documents, auditLogs } from '../db/schema.js';
import { eq, and, desc, asc, isNull, like } from 'drizzle-orm';
import { getAllUserPermissions } from '../middlewares/permission.middleware.js';

// ──────────────────────────────────────────────
// GET all folders (flat list, frontend builds tree)
// ──────────────────────────────────────────────
export const getAllFolders = async (req, res) => {
  try {
    const orgId = req.user?.organizationId;

    if (!orgId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const allFolders = await db
      .select()
      .from(folders)
      .where(and(eq(folders.organizationId, orgId), eq(folders.isActive, true)))
      .orderBy(asc(folders.sortOrder), asc(folders.name));

    // Count documents per folder
    const allDocs = await db
      .select({ id: documents.id, folderId: documents.folderId })
      .from(documents)
      .where(eq(documents.organizationId, orgId));

    const docCountMap = {};
    for (const doc of allDocs) {
      if (doc.folderId) {
        docCountMap[doc.folderId] = (docCountMap[doc.folderId] || 0) + 1;
      }
    }

    const foldersWithCount = allFolders.map(f => ({
      ...f,
      documentCount: docCountMap[f.id] || 0,
    }));

    // Filter folders by permissions for non-admin users
    const userId = req.user?.userId || req.user?.id;
    if (userId && orgId) {
      const { hasFullAccess, permissions } = await getAllUserPermissions(userId, orgId);

      if (!hasFullAccess) {
        const filteredFolders = foldersWithCount.filter((folder) => {
          const folderKey = `folder:${folder.id}`;
          return permissions[folderKey] && permissions[folderKey] !== 'none';
        });

        return res.json({ success: true, data: filteredFolders });
      }
    }

    res.json({ success: true, data: foldersWithCount });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch folders' });
  }
};

// ──────────────────────────────────────────────
// GET single folder with its documents
// ──────────────────────────────────────────────
export const getFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    // Get documents in this folder
    const folderDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.folderId, id))
      .orderBy(desc(documents.createdAt));

    // Get child folders
    const childFolders = await db
      .select()
      .from(folders)
      .where(and(eq(folders.parentId, id), eq(folders.isActive, true)))
      .orderBy(asc(folders.sortOrder), asc(folders.name));

    res.json({
      success: true,
      data: {
        folder,
        documents: folderDocs,
        children: childFolders,
      },
    });
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch folder' });
  }
};

// ──────────────────────────────────────────────
// CREATE folder
// ──────────────────────────────────────────────
export const createFolder = async (req, res) => {
  try {
    const { name, parentId, color, icon, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required' });
    }

    const orgId = req.user?.organizationId;
    const userId = req.user?.id;

    if (!orgId || !userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Build materialized path
    let path = `/${name.trim()}`;
    let depth = 0;

    if (parentId) {
      const [parent] = await db.select().from(folders).where(eq(folders.id, parentId));
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent folder not found' });
      }
      path = `${parent.path}/${name.trim()}`;
      depth = (parent.depth || 0) + 1;
    }

    // Get next sort order
    const siblings = await db
      .select()
      .from(folders)
      .where(
        parentId
          ? and(eq(folders.parentId, parentId), eq(folders.organizationId, orgId))
          : and(isNull(folders.parentId), eq(folders.organizationId, orgId)),
      );
    const sortOrder = siblings.length;

    const [newFolder] = await db.insert(folders).values({
      organizationId: orgId,
      name: name.trim(),
      parentId: parentId || null,
      path,
      depth,
      sortOrder,
      color: color || null,
      icon: icon || null,
      description: description || null,
      createdBy: userId,
      isActive: true,
    }).returning();

    // Audit log
    if (userId && orgId) {
      await db.insert(auditLogs).values({
        organizationId: orgId,
        userId,
        action: 'create',
        resourceType: 'folder',
        resourceId: newFolder.id,
        details: { name: newFolder.name, parentId },
        ipAddress: req.ip,
        userAgent: req.headers?.['user-agent'],
      });
    }

    res.status(201).json({ success: true, data: newFolder });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ success: false, message: 'Failed to create folder' });
  }
};

// ──────────────────────────────────────────────
// UPDATE folder (rename, color, icon)
// ──────────────────────────────────────────────
export const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, icon, description } = req.body;

    const [existing] = await db.select().from(folders).where(eq(folders.id, id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    const updates = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;
    if (description !== undefined) updates.description = description;

    // If name changed, update path for this folder and all descendants
    if (name && name.trim() !== existing.name) {
      const oldPath = existing.path;
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = parentPath ? `${parentPath}/${name.trim()}` : `/${name.trim()}`;
      updates.path = newPath;

      // Update all descendants' paths
      const descendants = await db
        .select()
        .from(folders)
        .where(like(folders.path, `${oldPath}/%`));

      for (const desc of descendants) {
        const updatedPath = desc.path.replace(oldPath, newPath);
        await db.update(folders).set({ path: updatedPath, updatedAt: new Date() }).where(eq(folders.id, desc.id));
      }
    }

    const [updated] = await db
      .update(folders)
      .set(updates)
      .where(eq(folders.id, id))
      .returning();

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ success: false, message: 'Failed to update folder' });
  }
};

// ──────────────────────────────────────────────
// DELETE folder (soft delete)
// ──────────────────────────────────────────────
export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(folders).where(eq(folders.id, id));
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    // Soft-delete this folder and all descendants
    const descendantFolders = await db
      .select()
      .from(folders)
      .where(like(folders.path, `${existing.path}/%`));

    const folderIds = [id, ...descendantFolders.map(f => f.id)];

    for (const fid of folderIds) {
      await db.update(folders).set({ isActive: false, updatedAt: new Date() }).where(eq(folders.id, fid));
    }

    // Unlink documents (set folderId to null) so they move to "root"
    for (const fid of folderIds) {
      await db.update(documents).set({ folderId: null }).where(eq(documents.folderId, fid));
    }

    res.json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete folder' });
  }
};

// ──────────────────────────────────────────────
// MOVE document to a folder
// ──────────────────────────────────────────────
export const moveDocumentToFolder = async (req, res) => {
  try {
    const { documentId, folderId } = req.body;

    if (!documentId) {
      return res.status(400).json({ success: false, message: 'documentId is required' });
    }

    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // folderId = null means move to root (unfiled)
    if (folderId) {
      const [folder] = await db.select().from(folders).where(eq(folders.id, folderId));
      if (!folder) {
        return res.status(404).json({ success: false, message: 'Folder not found' });
      }
    }

    await db
      .update(documents)
      .set({ folderId: folderId || null, updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    res.json({ success: true, message: 'Document moved successfully' });
  } catch (error) {
    console.error('Move document error:', error);
    res.status(500).json({ success: false, message: 'Failed to move document' });
  }
};

// ──────────────────────────────────────────────
// MOVE folder to a new parent (or root)
// ──────────────────────────────────────────────
export const moveFolder = async (req, res) => {
  try {
    const { folderId, newParentId } = req.body;

    if (!folderId) {
      return res.status(400).json({ success: false, message: 'folderId is required' });
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(folderId)) {
      return res.status(400).json({ success: false, message: 'Invalid folderId format' });
    }
    if (newParentId && !UUID_RE.test(newParentId)) {
      return res.status(400).json({ success: false, message: 'Invalid newParentId format' });
    }

    // prevent moving a folder into itself
    if (folderId === newParentId) {
      return res.status(400).json({ success: false, message: 'Cannot move folder into itself' });
    }

    const [folder] = await db.select().from(folders).where(eq(folders.id, folderId));
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    // validate new parent exists (unless moving to root)
    let parentPath = '';
    if (newParentId) {
      const [parent] = await db.select().from(folders).where(eq(folders.id, newParentId));
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Target folder not found' });
      }
      // prevent moving into own descendant
      if (parent.path.startsWith(folder.path + '/')) {
        return res.status(400).json({ success: false, message: 'Cannot move folder into its own descendant' });
      }
      parentPath = parent.path;
    }

    const oldPath = folder.path;
    const newPath = parentPath ? `${parentPath}/${folder.name}` : `/${folder.name}`;

    // update this folder
    await db
      .update(folders)
      .set({ parentId: newParentId || null, path: newPath, updatedAt: new Date() })
      .where(eq(folders.id, folderId));

    // update all descendants' paths
    const descendants = await db
      .select()
      .from(folders)
      .where(like(folders.path, `${oldPath}/%`));

    for (const desc of descendants) {
      const updatedPath = desc.path.replace(oldPath, newPath);
      await db.update(folders).set({ path: updatedPath, updatedAt: new Date() }).where(eq(folders.id, desc.id));
    }

    res.json({ success: true, message: 'Folder moved successfully' });
  } catch (error) {
    console.error('Move folder error:', error);
    res.status(500).json({ success: false, message: 'Failed to move folder' });
  }
};
