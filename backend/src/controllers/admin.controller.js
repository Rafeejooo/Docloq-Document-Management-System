// Admin Authentication Controller

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { 
  adminUsers, 
  adminSessions, 
  users, 
  organizations, 
  documents,
  apiRequestLogs,
  paymentHistory,
  adminAuditLogs,
} from '../db/schema.js';
import { eq, and, sql, desc, gte, lte, count, sum } from 'drizzle-orm';
import authConfig from '../config/auth.config.js';
import { generateOTP, sendOTPEmail, OTP_EXPIRY_MINUTES } from '../services/email.service.js';

// In-memory store for admin email OTPs (in production, use Redis)
const adminEmailOTPs = new Map();

// Generate JWT Tokens for Admin
const generateAdminTokens = (admin) => {
  const payload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    isAdmin: true,
  };

  const accessToken = jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn,
  });

  const refreshToken = jwt.sign(
    { adminId: admin.id, type: 'admin_refresh' },
    authConfig.jwt.secret,
    { expiresIn: authConfig.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

// Admin Login - Step 1: Verify credentials and send OTP
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find admin by email
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase()))
      .limit(1);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      const remainingTime = Math.ceil((new Date(admin.lockedUntil) - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${remainingTime} minutes`,
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newAttempts = (admin.failedLoginAttempts || 0) + 1;
      const updateData = { failedLoginAttempts: newAttempts };

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await db.update(adminUsers).set(updateData).where(eq(adminUsers.id, admin.id));

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        attemptsRemaining: Math.max(0, 5 - newAttempts),
      });
    }

    // Generate OTP and send via email
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in memory
    adminEmailOTPs.set(admin.email, {
      otp,
      expiresAt,
      adminId: admin.id,
      attempts: 0,
    });

    // Send OTP email
    const userName = admin.firstName || 'Admin';
    const result = await sendOTPEmail(admin.email, otp, userName);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
      });
    }

    // Mask email for display
    const emailParts = admin.email.split('@');
    const maskedLocal = emailParts[0].substring(0, 2) + '***';
    const maskedEmail = `${maskedLocal}@${emailParts[1]}`;

    return res.status(200).json({
      success: true,
      message: 'Password verified. OTP sent to your email.',
      data: {
        requires2FA: true,
        adminId: admin.id,
        email: maskedEmail,
        expiresIn: OTP_EXPIRY_MINUTES * 60,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Admin Login - Step 2: Verify OTP and complete login
export const adminVerifyOTP = async (req, res) => {
  try {
    const { adminId, code } = req.body;

    if (!adminId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID and verification code are required',
      });
    }

    // Get admin
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, adminId))
      .limit(1);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Get stored OTP
    const storedOTP = adminEmailOTPs.get(admin.email);

    // For testing: accept 123456
    let isValid = false;
    if (code === '123456') {
      isValid = true;
    } else if (storedOTP) {
      // Check expiry
      if (new Date() > storedOTP.expiresAt) {
        adminEmailOTPs.delete(admin.email);
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired. Please login again.',
        });
      }

      // Check attempts
      if (storedOTP.attempts >= 5) {
        adminEmailOTPs.delete(admin.email);
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please login again.',
        });
      }

      // Verify code
      if (storedOTP.otp === code) {
        isValid = true;
      } else {
        storedOTP.attempts += 1;
      }
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Clear OTP
    adminEmailOTPs.delete(admin.email);

    // Reset failed attempts on successful login
    await db.update(adminUsers).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: req.ip || req.connection.remoteAddress,
    }).where(eq(adminUsers.id, admin.id));

    // Generate tokens
    const { accessToken, refreshToken } = generateAdminTokens(admin);

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(adminSessions).values({
      adminId: admin.id,
      token: accessToken,
      refreshToken: refreshToken,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      expiresAt: expiresAt,
    });

    // Log admin login
    await db.insert(adminAuditLogs).values({
      adminId: admin.id,
      action: 'admin_login',
      targetType: 'admin',
      targetId: admin.id,
      details: { ipAddress: req.ip },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    console.error('Admin verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Resend Admin OTP
export const adminResendOTP = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID is required',
      });
    }

    // Get admin
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, adminId))
      .limit(1);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP
    adminEmailOTPs.set(admin.email, {
      otp,
      expiresAt,
      adminId: admin.id,
      attempts: 0,
    });

    // Send email
    const userName = admin.firstName || 'Admin';
    const result = await sendOTPEmail(admin.email, otp, userName);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
      });
    }

    // Mask email
    const emailParts = admin.email.split('@');
    const maskedLocal = emailParts[0].substring(0, 2) + '***';
    const maskedEmail = `${maskedLocal}@${emailParts[1]}`;

    return res.status(200).json({
      success: true,
      message: 'New verification code sent',
      data: {
        email: maskedEmail,
        expiresIn: OTP_EXPIRY_MINUTES * 60,
      },
    });
  } catch (error) {
    console.error('Admin resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Admin Logout
export const adminLogout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      await db.delete(adminSessions).where(eq(adminSessions.token, token));
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Admin Profile
export const getAdminMe = async (req, res) => {
  try {
    const [admin] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        firstName: adminUsers.firstName,
        lastName: adminUsers.lastName,
        role: adminUsers.role,
        lastLoginAt: adminUsers.lastLoginAt,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, req.admin.adminId))
      .limit(1);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('Get admin me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const [userCount] = await db
      .select({ count: count() })
      .from(users);

    // Get total organizations count
    const [orgCount] = await db
      .select({ count: count() })
      .from(organizations);

    // Get total documents count
    const [docCount] = await db
      .select({ count: count() })
      .from(documents);

    // Get total storage used (sum of file sizes)
    const [storageUsed] = await db
      .select({ 
        total: sql`COALESCE(SUM(${documents.fileSize}), 0)` 
      })
      .from(documents);

    // Get today's new users
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, today));

    // Get this week's new users
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const [weekUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, weekStart));

    // Get this month's new users
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [monthUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, monthStart));

    // Get total API requests (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [requestCount] = await db
      .select({ count: count() })
      .from(apiRequestLogs)
      .where(gte(apiRequestLogs.createdAt, thirtyDaysAgo));

    // Get total revenue (all time)
    const [revenue] = await db
      .select({ 
        total: sql`COALESCE(SUM(${paymentHistory.amount}), 0)` 
      })
      .from(paymentHistory)
      .where(eq(paymentHistory.status, 'completed'));

    // Get today's requests
    const [todayRequests] = await db
      .select({ count: count() })
      .from(apiRequestLogs)
      .where(gte(apiRequestLogs.createdAt, today));

    // Get clients/organizations list with stats
    const clientsList = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        plan: organizations.subscriptionTier,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .orderBy(organizations.createdAt)
      .limit(50);

    // Get user counts per organization
    const orgUserCounts = await db
      .select({
        organizationId: users.organizationId,
        count: count(),
      })
      .from(users)
      .groupBy(users.organizationId);

    // Get document counts per organization
    const orgDocCounts = await db
      .select({
        organizationId: documents.organizationId,
        count: count(),
        totalSize: sql`COALESCE(SUM(${documents.fileSize}), 0)`,
      })
      .from(documents)
      .groupBy(documents.organizationId);

    // Merge stats into clients
    const userCountMap = Object.fromEntries(
      orgUserCounts.map(o => [o.organizationId, o.count])
    );
    const docCountMap = Object.fromEntries(
      orgDocCounts.map(o => [o.organizationId, { count: o.count, size: o.totalSize }])
    );

    const clientsWithStats = clientsList.map(client => ({
      ...client,
      totalUsers: userCountMap[client.id] || 0,
      totalDocuments: docCountMap[client.id]?.count || 0,
      storageUsed: formatBytes(Number(docCountMap[client.id]?.size) || 0),
    }));

    // Format total storage
    const totalStorageFormatted = formatBytes(Number(storageUsed?.total) || 0);
    const totalFiles = docCount?.count || 0;

    // Mock data for AI and Blockchain usage (will be replaced with real data later)
    const aiUsageStats = {
      totalCalls: 15420,
      tokensUsed: 2548000,
      costEstimate: 127.40, // USD
      modelsUsed: {
        'gpt-4': 3200,
        'gpt-3.5-turbo': 12220,
      }
    };

    const blockchainStats = {
      totalTransactions: 1256,
      documentsHashed: 892,
      pendingTransactions: 3,
      polygonBalance: '245.78',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8b3E1',
      gasUsed: 0.0234, // MATIC
      lastTransactionAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: userCount?.count || 0,
        totalOrganizations: orgCount?.count || 0,
        totalDocuments: docCount?.count || 0,
        totalStorageBytes: Number(storageUsed?.total) || 0,
        newUsersToday: todayUsers?.count || 0,
        newUsersThisWeek: weekUsers?.count || 0,
        newUsersThisMonth: monthUsers?.count || 0,
        totalRequests: requestCount?.count || 0,
        totalRevenue: Number(revenue?.total) || 0,
        todayRequests: todayRequests?.count || 0,
        aiUsage: aiUsageStats,
        blockchainUsage: blockchainStats,
        storageUsage: {
          totalUsed: totalStorageFormatted,
          totalFiles: totalFiles,
        },
        clients: clientsWithStats,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get All Users (for admin)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        organizationId: users.organizationId,
      })
      .from(users);

    if (search) {
      query = query.where(
        sql`${users.email} ILIKE ${`%${search}%`} OR ${users.firstName} ILIKE ${`%${search}%`} OR ${users.lastName} ILIKE ${`%${search}%`}`
      );
    }

    const usersList = await query
      .orderBy(sortOrder === 'desc' ? desc(users[sortBy]) : users[sortBy])
      .limit(Number(limit))
      .offset(Number(offset));

    const [totalCount] = await db
      .select({ count: count() })
      .from(users);

    return res.status(200).json({
      success: true,
      data: {
        users: usersList,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get All Organizations
export const getAllOrganizations = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = db
      .select()
      .from(organizations);

    if (search) {
      query = query.where(
        sql`${organizations.name} ILIKE ${`%${search}%`} OR ${organizations.slug} ILIKE ${`%${search}%`}`
      );
    }

    const orgList = await query
      .orderBy(desc(organizations.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const [totalCount] = await db
      .select({ count: count() })
      .from(organizations);

    return res.status(200).json({
      success: true,
      data: {
        organizations: orgList,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get all organizations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Payment History
export const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: paymentHistory.id,
        amount: paymentHistory.amount,
        currency: paymentHistory.currency,
        paymentMethod: paymentHistory.paymentMethod,
        paymentProvider: paymentHistory.paymentProvider,
        transactionId: paymentHistory.transactionId,
        status: paymentHistory.status,
        description: paymentHistory.description,
        paidAt: paymentHistory.paidAt,
        createdAt: paymentHistory.createdAt,
        organizationId: paymentHistory.organizationId,
      })
      .from(paymentHistory);

    if (status) {
      query = query.where(eq(paymentHistory.status, status));
    }

    const payments = await query
      .orderBy(desc(paymentHistory.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const [totalCount] = await db
      .select({ count: count() })
      .from(paymentHistory);

    // Get total revenue
    const [revenue] = await db
      .select({ 
        total: sql`COALESCE(SUM(${paymentHistory.amount}), 0)` 
      })
      .from(paymentHistory)
      .where(eq(paymentHistory.status, 'completed'));

    return res.status(200).json({
      success: true,
      data: {
        payments,
        totalRevenue: Number(revenue?.total) || 0,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Recent Activity (API Logs)
export const getRecentActivity = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const logs = await db
      .select({
        id: apiRequestLogs.id,
        endpoint: apiRequestLogs.endpoint,
        method: apiRequestLogs.method,
        statusCode: apiRequestLogs.statusCode,
        ipAddress: apiRequestLogs.ipAddress,
        requestDuration: apiRequestLogs.requestDuration,
        createdAt: apiRequestLogs.createdAt,
      })
      .from(apiRequestLogs)
      .orderBy(desc(apiRequestLogs.createdAt))
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update User Status
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    await db.update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Log the action
    await db.insert(adminAuditLogs).values({
      adminId: req.admin.adminId,
      action: isActive ? 'user_activated' : 'user_deactivated',
      targetType: 'user',
      targetId: userId,
      details: { isActive },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Admin Audit Logs
export const getAdminAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const logs = await db
      .select({
        id: adminAuditLogs.id,
        adminId: adminAuditLogs.adminId,
        action: adminAuditLogs.action,
        targetType: adminAuditLogs.targetType,
        targetId: adminAuditLogs.targetId,
        details: adminAuditLogs.details,
        ipAddress: adminAuditLogs.ipAddress,
        createdAt: adminAuditLogs.createdAt,
      })
      .from(adminAuditLogs)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const [totalCount] = await db
      .select({ count: count() })
      .from(adminAuditLogs);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get admin audit logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
