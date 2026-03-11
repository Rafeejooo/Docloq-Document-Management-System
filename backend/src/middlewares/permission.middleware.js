// Permission Middleware — checks user's document/folder access based on custom roles

import { db } from '../db/index.js';
import {
  users,
  customRoles,
  rolePermissions,
  userRoleAssignments,
  folders,
  documents,
} from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';

// Permission priority levels
const PERM_PRIORITY = { none: 0, viewer: 1, editor: 2, admin: 3 };

/**
 * Get merged permission level for a user on a specific resource.
 * Returns the highest permission level granted from any assigned role.
 */
export const getUserPermissionLevel = async (userId, resourceType, resourceId, organizationId) => {
  // Get user's base role
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return 'none';

  // Admin and super_admin have full access
  if (['admin', 'super_admin'].includes(user.role)) {
    return 'admin';
  }

  // Get all active role assignments for this user
  const assignments = await db
    .select({ roleId: userRoleAssignments.roleId })
    .from(userRoleAssignments)
    .innerJoin(customRoles, eq(userRoleAssignments.roleId, customRoles.id))
    .where(
      and(
        eq(userRoleAssignments.userId, userId),
        eq(customRoles.organizationId, organizationId),
        eq(customRoles.isActive, true)
      )
    );

  if (assignments.length === 0) return 'none';

  const roleIds = assignments.map((a) => a.roleId);

  // Check direct permission on the resource
  const perms = await db
    .select({ permissionLevel: rolePermissions.permissionLevel })
    .from(rolePermissions)
    .where(
      and(
        inArray(rolePermissions.roleId, roleIds),
        eq(rolePermissions.resourceType, resourceType),
        eq(rolePermissions.resourceId, resourceId)
      )
    );

  // If resource is a document, also check parent folder permission
  if (resourceType === 'document') {
    const [doc] = await db
      .select({ folderId: documents.folderId })
      .from(documents)
      .where(eq(documents.id, resourceId))
      .limit(1);

    if (doc?.folderId) {
      const folderPerms = await db
        .select({ permissionLevel: rolePermissions.permissionLevel })
        .from(rolePermissions)
        .where(
          and(
            inArray(rolePermissions.roleId, roleIds),
            eq(rolePermissions.resourceType, 'folder'),
            eq(rolePermissions.resourceId, doc.folderId)
          )
        );
      perms.push(...folderPerms);
    }
  }

  // Get highest permission level
  let highest = 'none';
  for (const perm of perms) {
    if ((PERM_PRIORITY[perm.permissionLevel] || 0) > (PERM_PRIORITY[highest] || 0)) {
      highest = perm.permissionLevel;
    }
  }

  return highest;
};

/**
 * Get all resource permissions for a user (used for filtering document/folder lists).
 * Returns a map of { "folder:<id>": "viewer", "document:<id>": "editor", ... }
 */
export const getAllUserPermissions = async (userId, organizationId) => {
  // Get user's base role
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { hasFullAccess: false, permissions: {} };

  // Admin and super_admin have full access
  if (['admin', 'super_admin'].includes(user.role)) {
    return { hasFullAccess: true, permissions: {} };
  }

  // Get all active role assignments
  const assignments = await db
    .select({ roleId: userRoleAssignments.roleId })
    .from(userRoleAssignments)
    .innerJoin(customRoles, eq(userRoleAssignments.roleId, customRoles.id))
    .where(
      and(
        eq(userRoleAssignments.userId, userId),
        eq(customRoles.organizationId, organizationId),
        eq(customRoles.isActive, true)
      )
    );

  if (assignments.length === 0) {
    return { hasFullAccess: false, permissions: {} };
  }

  const roleIds = assignments.map((a) => a.roleId);

  const allPerms = await db
    .select()
    .from(rolePermissions)
    .where(inArray(rolePermissions.roleId, roleIds));

  // Merge: highest permission wins
  const merged = {};
  for (const perm of allPerms) {
    const key = `${perm.resourceType}:${perm.resourceId}`;
    const current = merged[key] || 'none';
    if ((PERM_PRIORITY[perm.permissionLevel] || 0) > (PERM_PRIORITY[current] || 0)) {
      merged[key] = perm.permissionLevel;
    }
  }

  return { hasFullAccess: false, permissions: merged };
};

/**
 * Middleware: require at minimum a specific permission level on a document or folder.
 * Usage: requirePermission('viewer') or requirePermission('editor')
 * Expects req.params.id to be the document/folder ID, and req.permissionResourceType to be set.
 */
export const requireDocumentPermission = (minLevel = 'viewer') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const organizationId = req.user?.organizationId;
      const resourceId = req.params.id;

      if (!userId || !organizationId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const permLevel = await getUserPermissionLevel(userId, 'document', resourceId, organizationId);
      
      if ((PERM_PRIORITY[permLevel] || 0) < (PERM_PRIORITY[minLevel] || 0)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this document',
          requiredLevel: minLevel,
          currentLevel: permLevel,
        });
      }

      req.permissionLevel = permLevel;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

export const requireFolderPermission = (minLevel = 'viewer') => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const organizationId = req.user?.organizationId;
      const resourceId = req.params.id;

      if (!userId || !organizationId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const permLevel = await getUserPermissionLevel(userId, 'folder', resourceId, organizationId);
      
      if ((PERM_PRIORITY[permLevel] || 0) < (PERM_PRIORITY[minLevel] || 0)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this folder',
          requiredLevel: minLevel,
          currentLevel: permLevel,
        });
      }

      req.permissionLevel = permLevel;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
      });
    }
  };
};

export default {
  getUserPermissionLevel,
  getAllUserPermissions,
  requireDocumentPermission,
  requireFolderPermission,
};
