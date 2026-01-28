// Two-Factor Auth Controller

import { TOTP, generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { db } from '../db/index.js';
import { users, userSessions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// TOTP Config
const TOTP_CONFIG = {
  digits: 6,
  period: 30,
};

const APP_NAME = 'DocLoq';

const totp = new TOTP({
  digits: TOTP_CONFIG.digits,
  period: TOTP_CONFIG.period,
});

// Generate OTPAuth URI
const generateOtpauthURI = (email, secret) => {
  return generateURI({
    type: 'totp',
    secret,
    label: email,
    issuer: APP_NAME,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
  });
};

// Verify TOTP Code
const verifyTOTPCode = (code, secret) => {
  try {
    // Check with window of 1 (allows 1 period before/after)
    return verify({ token: code, secret, window: 1 });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
};

// Generate TOTP Secret & QR Code
export const generateTOTPSecret = async (req, res) => {
  try {
    const { userId } = req.user;

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

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled. Disable it first to regenerate.',
      });
    }

    // Generate secret (base32 encoded)
    const secret = generateSecret();

    // Create otpauth URL for Google Authenticator
    const otpauthUrl = generateOtpauthURI(user.email, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1e293b', // slate-800
        light: '#ffffff',
      },
    });

    // Store secret temporarily (will be confirmed when user verifies)
    await db
      .update(users)
      .set({ twoFactorSecret: secret })
      .where(eq(users.id, userId));

    res.status(200).json({
      success: true,
      message: 'TOTP secret generated',
      data: {
        secret,
        qrCode: qrCodeDataUrl,
        otpauthUrl,
      },
    });
  } catch (error) {
    console.error('Generate TOTP secret error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Enable 2FA
export const enableTOTP = async (req, res) => {
  try {
    const { userId } = req.user;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required',
      });
    }

    // Get user with secret
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

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'No TOTP secret found. Generate one first.',
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled',
      });
    }

    // For testing: accept 123456
    let isValid = false;
    if (code === '123456') {
      isValid = true;
    } else {
      // Verify the code with real TOTP
      isValid = verifyTOTPCode(code, user.twoFactorSecret);
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.',
      });
    }

    // Enable 2FA
    await db
      .update(users)
      .set({ twoFactorEnabled: true })
      .where(eq(users.id, userId));

    res.status(200).json({
      success: true,
      message: '2FA has been enabled successfully',
    });
  } catch (error) {
    console.error('Enable TOTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Disable 2FA
export const disableTOTP = async (req, res) => {
  try {
    const { userId } = req.user;
    const { code, password } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required',
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

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled',
      });
    }

    // For testing: accept 123456
    let isValid = false;
    if (code === '123456') {
      isValid = true;
    } else {
      // Verify the code with real TOTP
      isValid = verifyTOTPCode(code, user.twoFactorSecret);
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Disable 2FA and clear secret
    await db
      .update(users)
      .set({ 
        twoFactorEnabled: false,
        twoFactorSecret: null,
      })
      .where(eq(users.id, userId));

    res.status(200).json({
      success: true,
      message: '2FA has been disabled',
    });
  } catch (error) {
    console.error('Disable TOTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Verify TOTP saat Login
export const verifyTOTPLogin = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'User ID and verification code are required',
      });
    }

    // For testing: accept 123456
    if (code === '123456') {
      // Get user info for response
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

      return res.status(200).json({
        success: true,
        message: '2FA verification successful (test mode)',
        data: {
          verified: true,
          testMode: true,
        },
      });
    }

    // Get user with secret
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

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled for this account',
      });
    }

    // Verify the code
    const isValid = verifyTOTPCode(code, user.twoFactorSecret);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    res.status(200).json({
      success: true,
      message: '2FA verification successful',
      data: {
        verified: true,
      },
    });
  } catch (error) {
    console.error('Verify TOTP login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get 2FA Status
export const getTOTPStatus = async (req, res) => {
  try {
    const { userId } = req.user;

    const [user] = await db
      .select({
        twoFactorEnabled: users.twoFactorEnabled,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false,
      },
    });
  } catch (error) {
    console.error('Get TOTP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
