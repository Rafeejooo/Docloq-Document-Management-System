// Blockchain Anchoring Service — Polygon document authenticity proofs
// Uses ethers.js v6 to interact with the DocLoqAnchor smart contract.

import { ethers } from 'ethers';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { blockchainAnchors, documents, documentVersions } from '../db/schema.js';
import { eq, desc, count, sql } from 'drizzle-orm';
import uploadConfig from '../config/upload.config.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contractABI = JSON.parse(readFileSync(path.join(__dirname, '../../contracts/DocLoqAnchor.json'), 'utf-8'));

const { blockchain: bcConfig } = uploadConfig;

let provider = null;
let wallet = null;
let contract = null;
let initialized = false;

// ============================================================
// Initialization
// ============================================================

/**
 * Initialize blockchain connection. Gracefully no-ops if not configured.
 */
export const initBlockchain = () => {
  if (!bcConfig.enabled) {
    console.log('[Blockchain] Disabled (BLOCKCHAIN_ENABLED !== true)');
    return false;
  }

  if (!bcConfig.privateKey || !bcConfig.contractAddress) {
    console.warn('[Blockchain] Enabled but missing POLYGON_PRIVATE_KEY or POLYGON_CONTRACT_ADDRESS');
    return false;
  }

  try {
    provider = new ethers.JsonRpcProvider(bcConfig.rpcUrl, bcConfig.chainId);
    wallet = new ethers.Wallet(bcConfig.privateKey, provider);
    contract = new ethers.Contract(bcConfig.contractAddress, contractABI.abi, wallet);
    initialized = true;
    console.log(`[Blockchain] Connected to chain ${bcConfig.chainId}, wallet: ${wallet.address}`);
    return true;
  } catch (error) {
    console.error('[Blockchain] Initialization failed:', error.message);
    return false;
  }
};

/**
 * Check if blockchain is ready for operations.
 */
export const isReady = () => initialized && contract !== null;

// ============================================================
// Helpers
// ============================================================

/**
 * Generate deterministic anchorId from document UUID.
 * @param {string} documentId — UUID string
 * @returns {string} bytes32 hex string
 */
const toAnchorId = (documentId) => {
  return ethers.keccak256(ethers.toUtf8Bytes(documentId));
};

/**
 * Pseudonymize organization ID for on-chain storage (no PII).
 * @param {string} organizationId — UUID string
 * @returns {string} bytes32 hex string
 */
const pseudonymizeOrgId = (organizationId) => {
  return ethers.keccak256(ethers.toUtf8Bytes(organizationId));
};

/**
 * Convert a SHA-256 hex string to bytes32.
 * @param {string} sha256Hex — 64-char hex string (from contentHash)
 * @returns {string} 0x-prefixed bytes32
 */
const hashToBytes32 = (sha256Hex) => {
  const clean = sha256Hex.startsWith('0x') ? sha256Hex : `0x${sha256Hex}`;
  return ethers.zeroPadValue(clean, 32);
};

// ============================================================
// Single Document Anchoring
// ============================================================

/**
 * Anchor a document to the blockchain.
 * @param {string} documentId
 * @param {string} versionId
 * @param {string} contentHash — SHA-256 hex string
 * @param {string} organizationId
 * @param {number} versionNumber
 * @returns {{ success: boolean, txHash?: string, blockNumber?: number, gasUsed?: string, anchorId?: string }}
 */
export const anchorDocument = async (documentId, versionId, contentHash, organizationId, versionNumber = 1) => {
  if (!isReady()) {
    return { success: false, message: 'Blockchain not initialized' };
  }

  const anchorId = toAnchorId(documentId);
  const docHash = hashToBytes32(contentHash);
  const pseudoOrg = pseudonymizeOrgId(organizationId);

  try {
    const tx = await contract.anchorDocument(anchorId, docHash, pseudoOrg, versionNumber, {
      gasLimit: bcConfig.gasLimitSingle,
    });

    console.log(`[Blockchain] Anchoring tx submitted: ${tx.hash}`);

    // Insert pending record
    const [anchorRecord] = await db.insert(blockchainAnchors).values({
      documentId,
      versionId,
      blockchainNetwork: bcConfig.chainId === 137 ? 'polygon' : 'polygon-amoy',
      transactionHash: tx.hash,
      anchoredHash: contentHash,
      pseudonymizedOrgId: pseudoOrg,
      status: 'pending',
    }).returning();

    // Update document
    await db.update(documents).set({
      blockchainAnchored: true,
      blockchainAnchorId: anchorRecord.id,
    }).where(eq(documents.id, documentId));

    // Wait for confirmation in background
    confirmTransaction(tx, anchorRecord.id).catch(err =>
      console.error('[Blockchain] Confirmation tracking failed:', err.message)
    );

    return {
      success: true,
      txHash: tx.hash,
      anchorRecordId: anchorRecord.id,
      anchorId,
      status: 'pending',
    };
  } catch (error) {
    console.error('[Blockchain] Anchor failed:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Update an existing anchor (for auto-anchor on edit).
 */
export const updateAnchor = async (documentId, newContentHash, newVersionNumber) => {
  if (!isReady()) {
    return { success: false, message: 'Blockchain not initialized' };
  }

  const anchorId = toAnchorId(documentId);
  const docHash = hashToBytes32(newContentHash);

  try {
    // Get the document to find existing anchor
    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
    if (!doc || !doc.blockchainAnchored) {
      return { success: false, message: 'Document not anchored yet' };
    }

    const tx = await contract.updateAnchor(anchorId, docHash, newVersionNumber, {
      gasLimit: bcConfig.gasLimitSingle,
    });

    console.log(`[Blockchain] Update anchor tx submitted: ${tx.hash}`);

    // Insert new anchor record (update = new tx)
    const [anchorRecord] = await db.insert(blockchainAnchors).values({
      documentId,
      versionId: doc.currentVersionId,
      blockchainNetwork: bcConfig.chainId === 137 ? 'polygon' : 'polygon-amoy',
      transactionHash: tx.hash,
      anchoredHash: newContentHash,
      pseudonymizedOrgId: pseudonymizeOrgId(doc.organizationId),
      status: 'pending',
    }).returning();

    // Update document anchor reference
    await db.update(documents).set({
      blockchainAnchorId: anchorRecord.id,
    }).where(eq(documents.id, documentId));

    confirmTransaction(tx, anchorRecord.id).catch(err =>
      console.error('[Blockchain] Confirmation tracking failed:', err.message)
    );

    return {
      success: true,
      txHash: tx.hash,
      anchorRecordId: anchorRecord.id,
      status: 'pending',
    };
  } catch (error) {
    console.error('[Blockchain] Update anchor failed:', error.message);
    return { success: false, message: error.message };
  }
};

// ============================================================
// Verification (view call — no gas cost)
// ============================================================

/**
 * Verify a document's hash against the on-chain anchor.
 */
export const verifyDocument = async (documentId, contentHash) => {
  if (!isReady()) {
    return { verified: false, message: 'Blockchain not initialized' };
  }

  const anchorId = toAnchorId(documentId);
  const docHash = hashToBytes32(contentHash);

  try {
    const [isValid, timestamp] = await contract.verifyDocument(anchorId, docHash);
    const anchoredAt = timestamp > 0n ? new Date(Number(timestamp) * 1000).toISOString() : null;

    // Get on-chain anchor details
    const [onChainHash, , versionNumber, , exists] = await contract.getAnchor(anchorId);

    return {
      verified: isValid,
      exists,
      onChainHash: exists ? onChainHash : null,
      currentHash: `0x${contentHash}`,
      hashMatch: isValid,
      anchoredAt,
      versionNumber: exists ? Number(versionNumber) : null,
    };
  } catch (error) {
    console.error('[Blockchain] Verify failed:', error.message);
    return { verified: false, message: error.message };
  }
};

// ============================================================
// Batch Anchoring (Merkle Root)
// ============================================================

/**
 * Anchor multiple documents in a single transaction via Merkle root.
 * @param {Array<{documentId: string, versionId: string, contentHash: string, organizationId: string}>} docs
 */
export const anchorBatch = async (docs) => {
  if (!isReady()) {
    return { success: false, message: 'Blockchain not initialized' };
  }

  if (!docs || docs.length === 0) {
    return { success: false, message: 'No documents to anchor' };
  }

  try {
    // Build Merkle tree
    const leaves = docs.map(d => hashToBytes32(d.contentHash));
    const merkleRoot = computeMerkleRoot(leaves);

    const tx = await contract.anchorBatch(merkleRoot, docs.length, {
      gasLimit: bcConfig.gasLimitBatch,
    });

    console.log(`[Blockchain] Batch anchor tx submitted: ${tx.hash} (${docs.length} docs)`);

    // Build individual Merkle proofs and insert records
    for (let i = 0; i < docs.length; i++) {
      const proof = computeMerkleProof(leaves, i);
      const [anchorRecord] = await db.insert(blockchainAnchors).values({
        documentId: docs[i].documentId,
        versionId: docs[i].versionId,
        blockchainNetwork: bcConfig.chainId === 137 ? 'polygon' : 'polygon-amoy',
        transactionHash: tx.hash,
        anchoredHash: docs[i].contentHash,
        pseudonymizedOrgId: pseudonymizeOrgId(docs[i].organizationId),
        merkleRoot,
        merkleProof: proof,
        status: 'pending',
      }).returning();

      await db.update(documents).set({
        blockchainAnchored: true,
        blockchainAnchorId: anchorRecord.id,
      }).where(eq(documents.id, docs[i].documentId));
    }

    confirmTransaction(tx, null).catch(err =>
      console.error('[Blockchain] Batch confirmation failed:', err.message)
    );

    return {
      success: true,
      txHash: tx.hash,
      merkleRoot,
      documentCount: docs.length,
      status: 'pending',
    };
  } catch (error) {
    console.error('[Blockchain] Batch anchor failed:', error.message);
    return { success: false, message: error.message };
  }
};

// ============================================================
// Merkle Tree Helpers
// ============================================================

function computeMerkleRoot(leaves) {
  if (leaves.length === 0) return ethers.ZeroHash;
  if (leaves.length === 1) return leaves[0];

  let layer = [...leaves];
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = i + 1 < layer.length ? layer[i + 1] : left; // Duplicate last if odd
      // Sort pair for deterministic ordering
      const [a, b] = left < right ? [left, right] : [right, left];
      next.push(ethers.keccak256(ethers.concat([a, b])));
    }
    layer = next;
  }
  return layer[0];
}

function computeMerkleProof(leaves, index) {
  const proof = [];
  let layer = [...leaves];
  let idx = index;

  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = i + 1 < layer.length ? layer[i + 1] : left;
      const [a, b] = left < right ? [left, right] : [right, left];
      next.push(ethers.keccak256(ethers.concat([a, b])));

      if (i === idx || i + 1 === idx) {
        proof.push(i === idx ? (i + 1 < layer.length ? right : left) : left);
      }
    }
    idx = Math.floor(idx / 2);
    layer = next;
  }
  return proof;
}

// ============================================================
// Transaction Confirmation Tracking
// ============================================================

async function confirmTransaction(tx, anchorRecordId) {
  try {
    const receipt = await tx.wait(bcConfig.confirmations);

    const updateData = {
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber,
      blockTimestamp: new Date(),
      confirmations: bcConfig.confirmations,
      gasUsed: receipt.gasUsed.toString(),
      gasCost: ethers.formatEther(receipt.gasUsed * receipt.gasPrice) + ' MATIC',
      confirmedAt: new Date(),
    };

    if (anchorRecordId) {
      await db.update(blockchainAnchors).set(updateData).where(eq(blockchainAnchors.id, anchorRecordId));
    } else {
      // Batch — update all records with this txHash
      await db.update(blockchainAnchors).set(updateData).where(eq(blockchainAnchors.transactionHash, tx.hash));
    }

    console.log(`[Blockchain] TX ${tx.hash} confirmed in block ${receipt.blockNumber}`);
  } catch (error) {
    console.error(`[Blockchain] TX ${tx.hash} confirmation failed:`, error.message);
    if (anchorRecordId) {
      await db.update(blockchainAnchors).set({ status: 'failed' }).where(eq(blockchainAnchors.id, anchorRecordId));
    }
  }
}

// ============================================================
// Stats & History (DB queries)
// ============================================================

/**
 * Get blockchain dashboard statistics.
 */
export const getBlockchainStats = async () => {
  const [totalResult] = await db.select({ count: count() }).from(blockchainAnchors);
  const [confirmedResult] = await db.select({ count: count() }).from(blockchainAnchors).where(eq(blockchainAnchors.status, 'confirmed'));
  const [pendingResult] = await db.select({ count: count() }).from(blockchainAnchors).where(eq(blockchainAnchors.status, 'pending'));

  let walletBalance = '0';
  let walletAddress = '';
  if (isReady()) {
    try {
      const balance = await provider.getBalance(wallet.address);
      walletBalance = ethers.formatEther(balance);
      walletAddress = wallet.address;
    } catch { /* non-critical */ }
  }

  // Sum gas cost
  const gasResult = await db.select({
    totalGas: sql`COALESCE(SUM(CAST(gas_used AS BIGINT)), 0)`,
  }).from(blockchainAnchors).where(eq(blockchainAnchors.status, 'confirmed'));

  // Last transaction
  const [lastTx] = await db.select().from(blockchainAnchors).orderBy(desc(blockchainAnchors.createdAt)).limit(1);

  return {
    totalTransactions: totalResult.count,
    documentsHashed: confirmedResult.count,
    pendingTransactions: pendingResult.count,
    polygonBalance: walletBalance,
    walletAddress,
    gasUsed: Number(gasResult[0]?.totalGas || 0),
    lastTransactionAt: lastTx?.createdAt?.toISOString() || null,
    chainId: bcConfig.chainId,
    network: bcConfig.chainId === 137 ? 'Polygon Mainnet' : 'Polygon Amoy Testnet',
    contractAddress: bcConfig.contractAddress || null,
    enabled: bcConfig.enabled && isReady(),
  };
};

/**
 * Get paginated transaction history.
 */
export const getTransactionHistory = async (limit = 20, offset = 0) => {
  const records = await db
    .select({
      id: blockchainAnchors.id,
      documentId: blockchainAnchors.documentId,
      transactionHash: blockchainAnchors.transactionHash,
      blockNumber: blockchainAnchors.blockNumber,
      anchoredHash: blockchainAnchors.anchoredHash,
      status: blockchainAnchors.status,
      gasUsed: blockchainAnchors.gasUsed,
      gasCost: blockchainAnchors.gasCost,
      merkleRoot: blockchainAnchors.merkleRoot,
      createdAt: blockchainAnchors.createdAt,
      confirmedAt: blockchainAnchors.confirmedAt,
      docName: documents.originalFilename,
    })
    .from(blockchainAnchors)
    .leftJoin(documents, eq(blockchainAnchors.documentId, documents.id))
    .orderBy(desc(blockchainAnchors.createdAt))
    .limit(limit)
    .offset(offset);

  return records;
};

/**
 * Get anchor details for a specific document.
 */
export const getDocumentAnchorDetails = async (documentId) => {
  const records = await db
    .select()
    .from(blockchainAnchors)
    .where(eq(blockchainAnchors.documentId, documentId))
    .orderBy(desc(blockchainAnchors.createdAt));

  return records;
};
