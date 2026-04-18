// Entry Point & Express Setup

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import path from 'path';
import 'dotenv/config';

import routes from './routes/index.js';
import { connectMongo } from './services/ai-cache.service.js';
import { initBlockchain } from './services/blockchain.service.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy when behind Cloudflare / reverse proxy (needed for correct req.ip in rate limiter)
if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Requests with no Origin header (server-to-server, curl in dev).
    // In production this should be restricted; in dev we allow it for tooling.
    if (!origin) {
      return callback(null, process.env.NODE_ENV !== 'production');
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiters: Redis-backed (fallback to in-memory if Redis unreachable) ──
let rateLimiterStore;
try {
  const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    lazyConnect: false,
  });
  redisClient.on('error', (err) => {
    // Swallow — rate limiter will degrade gracefully via insuranceLimiter
    if (err.code !== 'ECONNREFUSED') console.warn('[Redis]', err.message);
  });
  rateLimiterStore = redisClient;
  console.log('[DocLoq] Rate limiter backed by Redis');
} catch (err) {
  console.warn('[DocLoq] Redis unavailable, rate limiter falling back to in-memory:', err.message);
}

const insuranceLimiter = new RateLimiterMemory({ points: 200, duration: 900 });

const globalLimiter = rateLimiterStore
  ? new RateLimiterRedis({ storeClient: rateLimiterStore, keyPrefix: 'rl_global', points: 200, duration: 15 * 60, insuranceLimiter })
  : new RateLimiterMemory({ keyPrefix: 'rl_global', points: 200, duration: 15 * 60 });

const authLimiter = rateLimiterStore
  ? new RateLimiterRedis({ storeClient: rateLimiterStore, keyPrefix: 'rl_auth', points: 15, duration: 15 * 60, insuranceLimiter })
  : new RateLimiterMemory({ keyPrefix: 'rl_auth', points: 15, duration: 15 * 60 });

const limiterMiddleware = (limiter, message) => (req, res, next) => {
  limiter.consume(req.ip)
    .then(() => next())
    .catch(() => res.status(429).json({ success: false, message }));
};

// Global rate limiting — 200 requests per 15 minutes per IP
app.use(limiterMiddleware(globalLimiter, 'Too many requests, please try again later'));

// Strict auth rate limiting — 15 requests per 15 minutes per IP
app.use('/api/auth', limiterMiddleware(authLimiter, 'Too many authentication attempts, please try again later'));

// Request Logger (Development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api', routes);

// NOTE: /uploads static serving removed (SEC-B-011). OnlyOffice accesses documents
// via the /api/documents/:id/file endpoint instead. If legacy files still exist in
// uploads/, they are served through the serveDocument controller's fallback path.

// Health Check
app.get('/', (req, res) => {
  res.json({ 
    project: 'DocLoq Backend', 
    status: 'Secure & Running', 
    timestamp: new Date(),
    version: '1.0.0',
  });
});

// Error Handlers
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// Start Server - Listen on 0.0.0.0 to allow Docker container access via host.docker.internal
// Connect MongoDB for AI analysis cache (non-blocking)
connectMongo().catch(err => console.warn('[DocLoq] MongoDB cache init skipped:', err.message));

// Initialize blockchain connection (non-blocking)
try { initBlockchain(); } catch (err) { console.warn('[DocLoq] Blockchain init skipped:', err.message); }

const server = await app.listen(PORT, '0.0.0.0');
console.log(`[DocLoq] Server running on http://0.0.0.0:${PORT}`);
console.log(`[DocLoq] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[DocLoq] hCaptcha: ${process.env.HCAPTCHA_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);

export default app;