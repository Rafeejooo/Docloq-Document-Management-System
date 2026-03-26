// AI Analysis Cache Service — MongoDB
//
// Caches AI analysis results to avoid redundant OpenAI calls.
// Cache key: hash(documentId + prompt)
// TTL: configurable, default 24 hours
// Also stores analysis history per document for audit trail.

import mongoose from 'mongoose';
import crypto from 'crypto';

let connected = false;

// ──────────────────────────────────────────────
// Connection
// ──────────────────────────────────────────────

export const connectMongo = async () => {
  if (connected) return;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[AI Cache] MONGO_URI not set — cache disabled');
    return;
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
    console.log('[AI Cache] MongoDB connected');
  } catch (err) {
    console.warn('[AI Cache] MongoDB connection failed (cache disabled):', err.message);
  }
};

// ──────────────────────────────────────────────
// Schema
// ──────────────────────────────────────────────

const analysisResultSchema = new mongoose.Schema({
  // Cache key = hash(documentId + prompt)
  cacheKey: { type: String, required: true, index: true, unique: true },

  // Reference data
  documentId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true },
  userId: { type: String, required: true },
  prompt: { type: String, required: true },

  // AI Response
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  model: { type: String },
  tokensUsed: { type: Number, default: 0 },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  hitCount: { type: Number, default: 0 },
  lastHitAt: { type: Date },
}, { collection: 'analysis_results' });

const AnalysisResult = mongoose.model('AnalysisResult', analysisResultSchema);

// Document analysis history — keeps all analyses per document
const analysisHistorySchema = new mongoose.Schema({
  documentId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true },
  userId: { type: String, required: true },
  prompt: { type: String, required: true },
  resultSummary: { type: String },
  model: { type: String },
  tokensUsed: { type: Number, default: 0 },
  cached: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'analysis_history' });

const AnalysisHistory = mongoose.model('AnalysisHistory', analysisHistorySchema);

// ──────────────────────────────────────────────
// Cache Operations
// ──────────────────────────────────────────────

const generateCacheKey = (documentId, prompt) => {
  const normalized = prompt.toLowerCase().trim();
  return crypto.createHash('sha256').update(`${documentId}:${normalized}`).digest('hex');
};

/**
 * Get cached analysis result.
 * @returns {object|null} cached result or null
 */
export const getCachedResult = async (documentId, prompt) => {
  if (!connected) return null;

  try {
    const cacheKey = generateCacheKey(documentId, prompt);
    const cached = await AnalysisResult.findOneAndUpdate(
      { cacheKey, expiresAt: { $gt: new Date() } },
      { $inc: { hitCount: 1 }, $set: { lastHitAt: new Date() } },
      { new: true },
    ).lean();

    if (cached) {
      console.log(`[AI Cache] HIT for document ${documentId} (hits: ${cached.hitCount})`);
      return cached.result;
    }

    return null;
  } catch (err) {
    console.warn('[AI Cache] Get error:', err.message);
    return null;
  }
};

/**
 * Store analysis result in cache.
 * @param {number} ttlHours — cache TTL in hours (default 24)
 */
export const setCachedResult = async (documentId, prompt, result, metadata = {}, ttlHours = 24) => {
  if (!connected) return;

  try {
    const cacheKey = generateCacheKey(documentId, prompt);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await AnalysisResult.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        documentId,
        organizationId: metadata.organizationId || '',
        userId: metadata.userId || '',
        prompt,
        result,
        model: metadata.model || '',
        tokensUsed: metadata.tokensUsed || 0,
        expiresAt,
        hitCount: 0,
        lastHitAt: null,
        createdAt: new Date(),
      },
      { upsert: true, new: true },
    );

    console.log(`[AI Cache] STORED for document ${documentId} (TTL: ${ttlHours}h)`);
  } catch (err) {
    console.warn('[AI Cache] Set error:', err.message);
  }
};

/**
 * Record analysis in history (permanent, not cached).
 */
export const recordAnalysisHistory = async (documentId, prompt, metadata = {}) => {
  if (!connected) return;

  try {
    await AnalysisHistory.create({
      documentId,
      organizationId: metadata.organizationId || '',
      userId: metadata.userId || '',
      prompt,
      resultSummary: metadata.resultSummary || '',
      model: metadata.model || '',
      tokensUsed: metadata.tokensUsed || 0,
      cached: metadata.cached || false,
    });
  } catch (err) {
    console.warn('[AI Cache] History record error:', err.message);
  }
};

/**
 * Get analysis history for a document.
 */
export const getAnalysisHistory = async (documentId, limit = 20) => {
  if (!connected) return [];

  try {
    return await AnalysisHistory
      .find({ documentId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch {
    return [];
  }
};

/**
 * Invalidate cache for a document (e.g., when AI access is revoked).
 */
export const invalidateDocumentCache = async (documentId) => {
  if (!connected) return;

  try {
    const result = await AnalysisResult.deleteMany({ documentId });
    if (result.deletedCount > 0) {
      console.log(`[AI Cache] Invalidated ${result.deletedCount} entries for document ${documentId}`);
    }
  } catch (err) {
    console.warn('[AI Cache] Invalidation error:', err.message);
  }
};

/**
 * Health check.
 */
export const cacheHealthCheck = () => {
  return {
    connected,
    readyState: mongoose.connection.readyState, // 0=disconnected, 1=connected, 2=connecting
  };
};
