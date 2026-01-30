// Admin Authentication Middleware

import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { adminSessions, adminUsers } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import authConfig from '../config/auth.config.js';

export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, authConfig.jwt.secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Check if it's an admin token
    if (!decoded.isAdmin || !decoded.adminId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as admin',
      });
    }

    // Verify session exists and is valid
    const [session] = await db
      .select()
      .from(adminSessions)
      .where(
        and(
          eq(adminSessions.token, token),
          gt(adminSessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid',
      });
    }

    // Verify admin is still active
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, decoded.adminId))
      .limit(1);

    if (!admin || !admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated',
      });
    }

    // Attach admin info to request
    req.admin = {
      adminId: decoded.adminId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Super Admin Only Middleware
export const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required',
    });
  }
  next();
};
