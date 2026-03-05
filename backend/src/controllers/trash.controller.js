// Trash Controller — List, Restore, Permanent Delete

import { db } from '../db/index.js';
import {
  trashItems,
  documents,
  documentVersions,
  forms,
  folders,
} from '../db/schema.js';
import { eq, desc, and, isNull } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';

// ──────────────────────────────────────────────
// Helper: resolve orgId (dev fallback)
// ──────────────────────────────────────────────
async function resolveOrgId(req) {
  let orgId = req.user?.organizationId;
  if (!orgId) {
    const { organizations } = await import('../db/schema.js');
    const [firstOrg] = await db.select().from(organizations).limit(1);
    if (firstOrg) orgId = firstOrg.id;
  }
  return orgId;
}

// ══════════════════════════════════════════════
//  LIST TRASH ITEMS
// ══════════════════════════════════════════════
export const listTrash = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    const items = await db
      .select()
      .from(trashItems)
      .where(eq(trashItems.organizationId, orgId))
      .orderBy(desc(trashItems.deletedAt));

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('List trash error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trash items' });
  }
};

// ══════════════════════════════════════════════
//  RESTORE ITEM FROM TRASH
// ══════════════════════════════════════════════
export const restoreItem = async (req, res) => {
  try {
    const { id } = req.params; // trashItems.id

    const [trashItem] = await db.select().from(trashItems).where(eq(trashItems.id, id));
    if (!trashItem) return res.status(404).json({ success: false, message: 'Trash item not found' });

    if (trashItem.itemType === 'document') {
      // Un-soft-delete the document
      await db.update(documents).set({
        deletedAt: null,
        deletedBy: null,
        status: 'active',
        updatedAt: new Date(),
        folderId: trashItem.originalFolderId || null,
      }).where(eq(documents.id, trashItem.itemId));

    } else if (trashItem.itemType === 'template') {
      // Reactivate the form template
      await db.update(forms).set({
        isActive: true,
        updatedAt: new Date(),
      }).where(eq(forms.id, trashItem.itemId));
    }

    // Remove from trash
    await db.delete(trashItems).where(eq(trashItems.id, id));

    res.json({ success: true, message: `${trashItem.itemType} restored successfully` });
  } catch (error) {
    console.error('Restore item error:', error);
    res.status(500).json({ success: false, message: 'Failed to restore item' });
  }
};

// ══════════════════════════════════════════════
//  PERMANENT DELETE (from trash)
// ══════════════════════════════════════════════
export const permanentDelete = async (req, res) => {
  try {
    const { id } = req.params; // trashItems.id

    const [trashItem] = await db.select().from(trashItems).where(eq(trashItems.id, id));
    if (!trashItem) return res.status(404).json({ success: false, message: 'Trash item not found' });

    if (trashItem.itemType === 'document') {
      const itemId = trashItem.itemId;

      // Delete encrypted storage directory
      const storagePath = path.join(process.cwd(), 'storage', 'documents', itemId);
      try {
        await fs.rm(storagePath, { recursive: true, force: true });
      } catch (err) {
        console.warn('Could not delete storage dir:', err.message);
      }

      // Delete legacy file if exists
      const meta = trashItem.itemMetadata || {};
      if (meta.filename) {
        const legacyPath = path.join(process.cwd(), 'uploads', meta.filename);
        try { await fs.unlink(legacyPath); } catch { /* ok */ }
      }

      // Delete DB record + versions cascade
      await db.delete(documents).where(eq(documents.id, itemId));

    } else if (trashItem.itemType === 'template') {
      // Hard delete the form
      await db.delete(forms).where(eq(forms.id, trashItem.itemId));
    }

    // Remove from trash
    await db.delete(trashItems).where(eq(trashItems.id, id));

    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to permanently delete item' });
  }
};

// ══════════════════════════════════════════════
//  EMPTY TRASH
// ══════════════════════════════════════════════
export const emptyTrash = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, message: 'No organization found' });

    // Get all trash items for org
    const items = await db
      .select()
      .from(trashItems)
      .where(eq(trashItems.organizationId, orgId));

    for (const item of items) {
      if (item.itemType === 'document') {
        const storagePath = path.join(process.cwd(), 'storage', 'documents', item.itemId);
        try { await fs.rm(storagePath, { recursive: true, force: true }); } catch { /* ok */ }
        const meta = item.itemMetadata || {};
        if (meta.filename) {
          try { await fs.unlink(path.join(process.cwd(), 'uploads', meta.filename)); } catch { /* ok */ }
        }
        await db.delete(documents).where(eq(documents.id, item.itemId));
      } else if (item.itemType === 'template') {
        await db.delete(forms).where(eq(forms.id, item.itemId));
      }
    }

    // Remove all trash items
    await db.delete(trashItems).where(eq(trashItems.organizationId, orgId));

    res.json({ success: true, message: `${items.length} items permanently deleted` });
  } catch (error) {
    console.error('Empty trash error:', error);
    res.status(500).json({ success: false, message: 'Failed to empty trash' });
  }
};
