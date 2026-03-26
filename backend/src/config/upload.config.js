// Upload & Processing Configuration

import 'dotenv/config';
import path from 'path';

const MB = 1024 * 1024;

export const uploadConfig = {
  // === File Upload Limits ===
  maxFileSize: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50) * MB,

  // === Allowed MIME Types ===
  allowedMimeTypes: [
    // PDF
    'application/pdf',
    // Word
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    // Excel
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    // PowerPoint
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint', // .ppt
    // Images
    'image/png',
    'image/jpeg',
    // Plain text
    'text/plain',
  ],

  // Map MIME type to file type category
  mimeToCategory: {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'office',
    'application/msword': 'office',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'office',
    'application/vnd.ms-excel': 'office',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'office',
    'application/vnd.ms-powerpoint': 'office',
    'image/png': 'image',
    'image/jpeg': 'image',
    'text/plain': 'text',
  },

  // === Directory Paths ===
  storagePath: process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'storage'),
  tempDir: path.join(process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'storage'), 'temp'),
  documentsDir: path.join(process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'storage'), 'documents'),
  qrCodesDir: path.join(process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'storage'), 'qr-codes'),
  thumbnailsDir: path.join(process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'storage'), 'thumbnails'),

  // === Storage Provider ===
  storageProvider: process.env.STORAGE_PROVIDER || 'local', // local | minio

  // === S3 / MinIO Settings ===
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
    documentsBucket: process.env.S3_DOCUMENTS_BUCKET || 'docloq-documents',
    archiveBucket: process.env.S3_ARCHIVE_BUCKET || 'docloq-archive',
    qrBucket: process.env.S3_QR_BUCKET || 'docloq-qrcodes',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false', // true for MinIO
  },

  // === Key Management Provider ===
  keyProvider: process.env.KEY_PROVIDER || 'local', // local | vault

  // === Vault Settings ===
  vault: {
    addr: process.env.VAULT_ADDR || 'http://localhost:8200',
    token: process.env.VAULT_TOKEN || '',
    transitKey: process.env.VAULT_TRANSIT_KEY || 'docloq-master',
  },

  // === Qdrant Settings ===
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    collection: process.env.QDRANT_COLLECTION || 'docloq_documents',
    vectorSize: 1536, // OpenAI text-embedding-3-small dimension
  },

  // === Encryption Settings ===
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 16, // 128 bits for GCM
    saltLength: 32,
    authTagLength: 16,
    masterKey: process.env.ENCRYPTION_MASTER_KEY || null, // 64-char hex string → 32 bytes
  },

  // === Honeytoken Settings ===
  honeytoken: {
    // Zero-Width Characters to use
    zwcChars: ['\u200B', '\u200C', '\u200D', '\uFEFF'],
    // Number of insertion positions for ZWC
    zwcPositionCount: 8,
    // Homoglyph substitution mapping (Latin → Cyrillic look-alikes)
    homoglyphMap: {
      'a': '\u0430', // Cyrillic а
      'e': '\u0435', // Cyrillic е
      'o': '\u043E', // Cyrillic о
      'p': '\u0440', // Cyrillic р
      'c': '\u0441', // Cyrillic с
      'x': '\u0445', // Cyrillic х
      'y': '\u0443', // Cyrillic у
      'i': '\u0456', // Cyrillic і (Ukrainian)
      's': '\u0455', // Cyrillic ѕ (Macedonian)
      'h': '\u04BB', // Cyrillic һ
    },
    // Number of homoglyph substitution positions
    homoglyphPositionCount: 15,
    // Whitespace encoding line count
    whitespaceLineCount: 20,
  },

  // === QR Code Settings ===
  qrCode: {
    signingSecret: process.env.QR_SIGNING_SECRET || 'default-qr-secret-change-me',
    verificationBaseUrl: process.env.QR_VERIFICATION_BASE_URL || 'http://localhost:5173/verify',
    shortCodeLength: 8,
    width: 300,
    errorCorrectionLevel: 'H', // L, M, Q, H (highest)
  },

  // === Scanner Settings ===
  scanner: {
    enabled: process.env.SCANNER_ENABLED === 'true',
    clamavHost: process.env.CLAMAV_HOST || 'localhost',
    clamavPort: parseInt(process.env.CLAMAV_PORT, 10) || 3310,
  },

  // === Temporary Upload Settings ===
  tempUpload: {
    expirationMinutes: 30, // Auto-delete temp files after 30 min
  },

  // === Download Watermark Settings ===
  downloadWatermark: {
    enabled: process.env.DOWNLOAD_WATERMARK_ENABLED !== 'false',
    // Invisible Unicode characters (non-overlapping with honeytoken ZWC chars)
    chars: ['\u2060', '\u2061', '\u2062', '\u2063'], // Word Joiner, Function Application, Invisible Times, Invisible Separator
    positionCount: 12, // Number of injection points spread across text
    supportedCategories: ['pdf', 'office', 'text'],
  },

  // === Blockchain Anchoring Settings ===
  blockchain: {
    enabled: process.env.BLOCKCHAIN_ENABLED === 'true', // Default OFF until wallet configured
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: parseInt(process.env.POLYGON_CHAIN_ID, 10) || 137, // 137 = Polygon Mainnet, 80002 = Amoy Testnet
    privateKey: process.env.POLYGON_PRIVATE_KEY || '',
    contractAddress: process.env.POLYGON_CONTRACT_ADDRESS || '',
    confirmations: parseInt(process.env.BLOCKCHAIN_CONFIRMATIONS, 10) || 2, // Wait for N block confirmations
    gasLimitSingle: 100000, // Gas limit for single anchor tx
    gasLimitBatch: 150000,  // Gas limit for batch anchor tx
  },
};

export default uploadConfig;
