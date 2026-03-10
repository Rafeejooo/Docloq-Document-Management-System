// Authentication Controller

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users, userSessions, organizations } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import authConfig from '../config/auth.config.js';

// Generate JWT Tokens
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };

  const accessToken = jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn,
  });

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    authConfig.jwt.secret,
    { expiresIn: authConfig.jwt.refreshExpiresIn }
  );

  return { accessToken, refreshToken };
};

// Verify hCaptcha Token
const verifyHcaptcha = async (token) => {
  if (!authConfig.hcaptcha.enabled) {
    return true; // Skip verification if disabled
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch(authConfig.hcaptcha.verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${authConfig.hcaptcha.secret}&response=${token}`,
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('hCaptcha verification error:', error);
    return false;
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password, hcaptchaToken, rememberMe } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Verify hCaptcha (if enabled)
    if (authConfig.hcaptcha.enabled) {
      const captchaValid = await verifyHcaptcha(hcaptchaToken);
      if (!captchaValid) {
        return res.status(400).json({
          success: false,
          message: 'Captcha verification failed',
        });
      }
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${remainingTime} minutes`,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData = { failedLoginAttempts: newAttempts };

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await db.update(users).set(updateData).where(eq(users.id, user.id));

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        attemptsRemaining: Math.max(0, 5 - newAttempts),
      });
    }

    // Always require 2FA verification for all users
    // If user doesn't have 2FA secret yet, generate one temporarily for this login
    if (!user.twoFactorSecret) {
      const { generateSecret } = await import('otplib');
      const tempSecret = generateSecret();
      await db.update(users).set({ twoFactorSecret: tempSecret }).where(eq(users.id, user.id));
    }

    // Return response requiring 2FA verification
    return res.status(200).json({
      success: true,
      message: 'Password verified. 2FA verification required.',
      data: {
        requires2FA: true,
        userId: user.id,
        email: user.email,
      },
    });

    // Note: The code below is only reached if 2FA is disabled (not used anymore)
    // Reset failed attempts on successful login
    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: req.ip || req.connection.remoteAddress,
    }).where(eq(users.id, user.id));

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    // Create session
    await db.insert(userSessions).values({
      id: uuidv4(),
      userId: user.id,
      token: accessToken,
      refreshToken: refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      expiresAt: expiresAt,
    });

    // Get organization info if exists
    let organization = null;
    if (user.organizationId) {
      [organization] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        })
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1);
    }

    // Remove sensitive data
    const { passwordHash, twoFactorSecret, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          ...safeUser,
          organization,
        },
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Complete Login setelah 2FA
export const completeLogin = async (req, res) => {
  try {
    const { userId, rememberMe } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Reset failed attempts on successful login
    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: req.ip || req.connection.remoteAddress,
    }).where(eq(users.id, user.id));

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Calculate expiry — absolute 12 hours
    const expiresAt = new Date(Date.now() + authConfig.session.maxAge);

    // Create session
    await db.insert(userSessions).values({
      id: uuidv4(),
      userId: user.id,
      token: accessToken,
      refreshToken: refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      lastActivityAt: new Date(),
      expiresAt: expiresAt,
    });

    // Get organization info if exists
    let organization = null;
    if (user.organizationId) {
      [organization] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        })
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1);
    }

    // Remove sensitive data
    const { passwordHash, twoFactorSecret, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          ...safeUser,
          organization,
        },
        accessToken,
        refreshToken,
        expiresAt,
        idleTimeout: authConfig.session.idleTimeout,
      },
    });
  } catch (error) {
    console.error('Complete login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Register
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, hcaptchaToken } = req.body;

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

    // Verify hCaptcha (if enabled)
    if (authConfig.hcaptcha.enabled) {
      const captchaValid = await verifyHcaptcha(hcaptchaToken);
      if (!captchaValid) {
        return res.status(400).json({
          success: false,
          message: 'Captcha verification failed',
        });
      }
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, authConfig.password.saltRounds);

    // Create organization if company name provided
    let organizationId = null;
    if (companyName) {
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const [newOrg] = await db.insert(organizations).values({
        id: uuidv4(),
        name: companyName,
        slug: `${slug}-${Date.now()}`,
      }).returning();

      organizationId = newOrg.id;
    }

    // Create user
    const [newUser] = await db.insert(users).values({
      id: uuidv4(),
      organizationId,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: organizationId ? 'admin' : 'user', // First user of org is admin
      isActive: true,
      isEmailVerified: false, // Will need email verification in production
    }).returning();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(userSessions).values({
      id: uuidv4(),
      userId: newUser.id,
      token: accessToken,
      refreshToken: refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      expiresAt: expiresAt,
    });

    // Remove sensitive data
    const { passwordHash: _, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Delete session
      await db.delete(userSessions).where(eq(userSessions.token, token));
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Current User
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get organization
    let organization = null;
    if (user.organizationId) {
      [organization] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          subscriptionTier: organizations.subscriptionTier,
        })
        .from(organizations)
        .where(eq(organizations.id, user.organizationId))
        .limit(1);
    }

    const { passwordHash, twoFactorSecret, ...safeUser } = user;

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...safeUser,
          organization,
        },
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Refresh Token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, authConfig.jwt.secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Find session with this refresh token
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.refreshToken, token))
      .limit(1);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.update(userSessions)
      .set({
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: expiresAt,
      })
      .where(eq(userSessions.id, session.id));

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default {
  login,
  register,
  logout,
  getMe,
  refreshToken,
};
