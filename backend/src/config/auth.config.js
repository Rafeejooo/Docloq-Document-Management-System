// Auth Configuration

import 'dotenv/config';

export const authConfig = {
  // JWT Settings
  jwt: {
    secret: process.env.JWT_SECRET || 'docloq-super-secret-key-change-in-production',
    expiresIn: '12h',                    // Absolute expiry: 12 jam
    refreshExpiresIn: '12h',              // Refresh juga 12 jam (same session)
    idleTimeout: 3 * 60 * 60 * 1000,     // Idle timeout: 3 jam dalam ms
  },
  
  // Password Settings
  password: {
    saltRounds: 12,
    minLength: 8,
  },
  
  // Session Settings
  session: {
    maxAge: 12 * 60 * 60 * 1000, // 12 jam dalam ms (absolute)
    idleTimeout: 3 * 60 * 60 * 1000, // 3 jam idle timeout
  },
  
  // hCaptcha Settings
  hcaptcha: {
    enabled: process.env.HCAPTCHA_ENABLED === 'true',
    secret: process.env.HCAPTCHA_SECRET,
    verifyUrl: 'https://hcaptcha.com/siteverify',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 menit
    maxAttempts: 5,
  },
};

export default authConfig;
