// Entry Point & Express Setup

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import 'dotenv/config';

import routes from './routes/index.js';
import { connectMongo } from './services/ai-cache.service.js';
import { initBlockchain } from './services/blockchain.service.js';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Global rate limiting — 200 requests per 15-minute window per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
}));

// Strict rate limiting on auth endpoints — 15 attempts per 15 minutes
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
}));

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