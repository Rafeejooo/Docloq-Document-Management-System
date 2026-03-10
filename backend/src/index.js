// Entry Point & Express Setup

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import 'dotenv/config';

import routes from './routes/index.js';

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
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
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

// Request Logger (Development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api', routes);

// Serve uploaded files (needed for OnlyOffice to access documents & temp files for conversion)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
const server = await app.listen(PORT, '0.0.0.0');
console.log(`[DocLoq] Server running on http://0.0.0.0:${PORT}`);
console.log(`[DocLoq] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[DocLoq] hCaptcha: ${process.env.HCAPTCHA_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);

export default app;