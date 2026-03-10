// User Management Controller

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users, organizations, userSessions } from '../db/schema.js';
import { eq, and, like, or, desc, asc, sql } from 'drizzle-orm';
import authConfig from '../config/auth.config.js';

// Get All Users
export const getUsers = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    let conditions = [eq(users.organizationId, organizationId)];

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      );
    }

    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (status === 'active') {
      conditions.push(eq(users.isActive, true));
    } else if (status === 'inactive') {
      conditions.push(eq(users.isActive, false));
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)::int` })
      .from(users)
      .where(and(...conditions));

    // Get users with pagination
    const rawUsers = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(sortOrder === 'desc' ? desc(users[sortBy]) : asc(users[sortBy]))
      .limit(parseInt(limit))
      .offset(offset);

    // Remove sensitive data from each user
    const userList = rawUsers.map(({ passwordHash, twoFactorSecret, ...user }) => user);

    res.status(200).json({
      success: true,
      data: {
        users: userList,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get User By ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const [rawUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .limit(1);

    if (!rawUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Remove sensitive data
    const { passwordHash, twoFactorSecret, ...user } = rawUser;

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create User (Admin only)
export const createUser = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role = 'user',
      departmentId,
      position,
      phone,
    } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Validate role
    const allowedRoles = ['user', 'manager', 'admin', 'auditor', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed: user, manager, admin, auditor, viewer',
      });
    }

    // Super admin cannot be created via API
    if (role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot create super admin via API',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, authConfig.password.saltRounds);

    // Create user
    const userId = uuidv4();
    await db.insert(users).values({
      id: userId,
      organizationId,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role,
      departmentId: departmentId || null,
      position,
      phone,
      isActive: true,
      isEmailVerified: true, // Auto verify for admin-created users so they can login immediately
    });

    // Fetch the created user (select all then exclude sensitive fields)
    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Remove sensitive data
    const { passwordHash: _, twoFactorSecret, ...newUser } = createdUser;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, role: currentUserRole, userId: currentUserId } = req.user;
    const { 
      firstName, 
      lastName, 
      role,
      departmentId,
      position,
      phone,
      isActive,
    } = req.body;

    // Check if user exists and belongs to same organization
    const [existingUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .limit(1);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent changing own role (unless super_admin)
    if (id === currentUserId && role && role !== existingUser.role && currentUserRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    // Prevent non-super_admin from modifying super_admin
    if (existingUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify super admin',
      });
    }

    // Validate role if being changed
    if (role) {
      const allowedRoles = ['user', 'editor', 'admin'];
      if (!allowedRoles.includes(role) && role !== 'super_admin') {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
      }

      // Only super_admin can set super_admin role
      if (role === 'super_admin' && currentUserRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can assign super admin role',
        });
      }
    }

    // Build update object
    const updateData = {
      updatedAt: new Date(),
    };

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (position !== undefined) updateData.position = position;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        departmentId: users.departmentId,
        position: users.position,
        phone: users.phone,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        updatedAt: users.updatedAt,
      });

    // If user was deactivated, invalidate all their sessions
    if (isActive === false) {
      await db.delete(userSessions).where(eq(userSessions.userId, id));
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, role: currentUserRole, userId: currentUserId } = req.user;

    // Prevent self-deletion
    if (id === currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Check if user exists and belongs to same organization
    const [existingUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .limit(1);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent non-super_admin from deleting super_admin
    if (existingUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin',
      });
    }

    // Delete user sessions first
    await db.delete(userSessions).where(eq(userSessions.userId, id));

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Reset User Password (Admin)
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, role: currentUserRole } = req.user;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if user exists and belongs to same organization
    const [existingUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .limit(1);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent non-super_admin from resetting super_admin password
    if (existingUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot reset super admin password',
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, authConfig.password.saltRounds);

    // Update password
    await db
      .update(users)
      .set({ 
        passwordHash, 
        updatedAt: new Date(),
        // Force re-login
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, id));

    // Invalidate all user sessions
    await db.delete(userSessions).where(eq(userSessions.userId, id));

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. User will need to login again.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Toggle User Status
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, role: currentUserRole, userId: currentUserId } = req.user;

    // Prevent self-deactivation
    if (id === currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own status',
      });
    }

    // Check if user exists and belongs to same organization
    const [existingUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .limit(1);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent non-super_admin from toggling super_admin
    if (existingUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change super admin status',
      });
    }

    const newStatus = !existingUser.isActive;

    // Update status
    await db
      .update(users)
      .set({ 
        isActive: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    // If deactivated, invalidate all sessions
    if (!newStatus) {
      await db.delete(userSessions).where(eq(userSessions.userId, id));
    }

    res.status(200).json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: newStatus },
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
