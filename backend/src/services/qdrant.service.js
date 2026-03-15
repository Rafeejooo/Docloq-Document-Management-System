// Qdrant Vector Database Service — AI Document Indexing & Semantic Search
// Stores document embeddings for semantic search, RAG, and similarity detection.
// Only vectors and metadata are stored — never the document content itself.

import { QdrantClient } from '@qdrant/js-client-rest';
import uploadConfig from '../config/upload.config.js';

let client = null;
let collectionReady = false;

/**
 * Get or create the Qdrant client singleton.
 */
const getClient = () => {
  if (client) return client;

  client = new QdrantClient({
    url: uploadConfig.qdrant.url,
  });

  console.log(`[Qdrant] Client initialized → ${uploadConfig.qdrant.url}`);
  return client;
};

/**
 * Ensure the document collection exists with the correct schema.
 * Safe to call multiple times — creates only if not exists.
 */
const ensureCollection = async () => {
  if (collectionReady) return;

  const qdrant = getClient();
  const collectionName = uploadConfig.qdrant.collection;

  try {
    await qdrant.getCollection(collectionName);
    collectionReady = true;
  } catch {
    // Collection doesn't exist — create it
    await qdrant.createCollection(collectionName, {
      vectors: {
        size: uploadConfig.qdrant.vectorSize,
        distance: 'Cosine',
      },
      // Optimized for filtered search by organization
      optimizers_config: {
        indexing_threshold: 100,
      },
    });

    // Create payload index for organization filtering
    await qdrant.createPayloadIndex(collectionName, {
      field_name: 'organizationId',
      field_schema: 'keyword',
    });

    await qdrant.createPayloadIndex(collectionName, {
      field_name: 'folderId',
      field_schema: 'keyword',
    });

    collectionReady = true;
    console.log(`[Qdrant] Collection "${collectionName}" created with Cosine distance`);
  }
};

/**
 * Generate an embedding vector from text content.
 * Uses OpenAI text-embedding-3-small (1536 dimensions).
 * Falls back gracefully if OpenAI is unavailable.
 *
 * @param {string} text — document text content
 * @returns {number[]|null} — embedding vector or null if unavailable
 */
export const generateEmbedding = async (text) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[Qdrant] OPENAI_API_KEY not set — skipping embedding generation');
    return null;
  }

  try {
    // Truncate to ~8000 tokens (~32000 chars) to stay within model limits
    const truncated = text.length > 32000 ? text.substring(0, 32000) : text;

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: truncated,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Qdrant] OpenAI embedding error:', err);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (err) {
    console.error('[Qdrant] Embedding generation failed:', err.message);
    return null;
  }
};

/**
 * Index a document in Qdrant for semantic search.
 * Called asynchronously after document upload (non-blocking).
 *
 * @param {string} documentId — UUID of the document
 * @param {string} textContent — extracted text content
 * @param {string} organizationId — for multi-tenant filtering
 * @param {object} metadata — additional payload metadata
 */
export const indexDocument = async (documentId, textContent, organizationId, metadata = {}) => {
  const embedding = await generateEmbedding(textContent);
  if (!embedding) return; // Skip if embedding unavailable

  await ensureCollection();
  const qdrant = getClient();

  await qdrant.upsert(uploadConfig.qdrant.collection, {
    points: [
      {
        id: documentId,
        vector: embedding,
        payload: {
          organizationId,
          folderId: metadata.folderId || null,
          filename: metadata.filename || '',
          mimeType: metadata.mimeType || '',
          indexedAt: new Date().toISOString(),
        },
      },
    ],
  });

  console.log(`[Qdrant] Indexed document: ${documentId}`);
};

/**
 * Semantic search for documents similar to a query.
 * Results are filtered by organization for multi-tenant isolation.
 *
 * @param {string} query — search query text
 * @param {string} organizationId — filter to this organization
 * @param {number} limit — max results (default 10)
 * @returns {Array<{ id: string, score: number, payload: object }>}
 */
export const searchDocuments = async (query, organizationId, limit = 10) => {
  const queryVector = await generateEmbedding(query);
  if (!queryVector) return [];

  await ensureCollection();
  const qdrant = getClient();

  const results = await qdrant.search(uploadConfig.qdrant.collection, {
    vector: queryVector,
    filter: {
      must: [
        { key: 'organizationId', match: { value: organizationId } },
      ],
    },
    limit,
    with_payload: true,
  });

  return results.map((r) => ({
    id: r.id,
    score: r.score,
    payload: r.payload,
  }));
};

/**
 * Find documents similar to a given document.
 * Uses the existing document's vector for similarity search.
 *
 * @param {string} documentId — source document UUID
 * @param {string} organizationId — filter to this organization
 * @param {number} limit — max results
 * @returns {Array<{ id: string, score: number, payload: object }>}
 */
export const findSimilarDocuments = async (documentId, organizationId, limit = 5) => {
  await ensureCollection();
  const qdrant = getClient();

  try {
    const results = await qdrant.recommend(uploadConfig.qdrant.collection, {
      positive: [documentId],
      filter: {
        must: [
          { key: 'organizationId', match: { value: organizationId } },
        ],
        must_not: [
          { has_id: [documentId] }, // Exclude the source document
        ],
      },
      limit,
      with_payload: true,
    });

    return results.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload,
    }));
  } catch {
    return [];
  }
};

/**
 * Delete a document's vector from Qdrant.
 * Called during crypto shredding (GDPR Art 17) — ensures no trace remains.
 *
 * @param {string} documentId — UUID of the document to remove
 */
export const deleteDocumentVector = async (documentId) => {
  try {
    await ensureCollection();
    const qdrant = getClient();

    await qdrant.delete(uploadConfig.qdrant.collection, {
      points: [documentId],
    });

    console.log(`[Qdrant] Deleted vector: ${documentId}`);
  } catch (err) {
    console.warn(`[Qdrant] Failed to delete vector ${documentId}:`, err.message);
  }
};

/**
 * Health check for Qdrant connectivity.
 * @returns {{ available: boolean, collectionsCount: number }}
 */
export const healthCheck = async () => {
  try {
    const qdrant = getClient();
    const collections = await qdrant.getCollections();
    return {
      available: true,
      collectionsCount: collections.collections.length,
    };
  } catch {
    return { available: false, collectionsCount: 0 };
  }
};
