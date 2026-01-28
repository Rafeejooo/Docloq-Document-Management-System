// Auth Configuration

import 'dotenv/config';

export const authConfig = {
  // JWT Settings
  jwt: {
    secret: process.env.JWT_SECRET || 'docloq-super-secret-key-change-in-production',
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },
  
  // Password Settings
  password: {
    saltRounds: 12,
    minLength: 8,
  },
  
  // Session Settings
  session: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari dalam ms
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
