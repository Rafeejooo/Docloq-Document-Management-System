// Database Schema Definitions

import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  boolean, 
  uuid, 
  integer, 
  jsonb, 
  varchar,
  bigint,
  index,
  uniqueIndex,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'manager', 'user', 'auditor', 'viewer']);
export const permissionTypeEnum = pgEnum('permission_type', ['read', 'read_edit', 'full_access']);
export const documentStatusEnum = pgEnum('document_status', ['active', 'archived', 'revoked', 'expired', 'deleted']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'verified', 'failed', 'revoked', 'expired']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'read', 'update', 'delete', 'download', 'share', 'verify', 'restore', 'archive']);
export const shareTypeEnum = pgEnum('share_type', ['view_only', 'can_edit']);
export const archiveStatusEnum = pgEnum('archive_status', ['active', 'glacier', 'deep_archive', 'deleted']);

// Organizations
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  
  // Subscription & Compliance
  subscriptionTier: text('subscription_tier').default('basic'), // basic, professional, enterprise
  hasBlockchainFeature: boolean('has_blockchain_feature').default(false),
  
  // AWS Configuration (region Indonesia untuk compliance UU PDP)
  awsRegion: text('aws_region').default('ap-southeast-3'), // Jakarta region
  s3Bucket: text('s3_bucket'),
  kmsKeyArn: text('kms_key_arn'), // Reference ke AWS KMS, bukan key-nya sendiri
  
  // GDPR & Compliance Settings
  dataRetentionDays: integer('data_retention_days').default(2555), // ~7 tahun default
  archiveAfterDays: integer('archive_after_days').default(365), // Pindah ke deep archive setelah 1 tahun
  gdprCompliant: boolean('gdpr_compliant').default(true),
  pdpCompliant: boolean('pdp_compliant').default(true), // UU PDP Indonesia
  
  settings: jsonb('settings').default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('org_slug_idx').on(table.slug),
}));


// Users & Authentication
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  
  // Profile
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  
  // Role & Status
  role: userRoleEnum('role').default('user'),
  isActive: boolean('is_active').default(true),
  isEmailVerified: boolean('is_email_verified').default(false),
  
  // Security
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: text('last_login_ip'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('user_email_idx').on(table.email),
  orgIdx: index('user_org_idx').on(table.organizationId),
}));


export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  token: text('token').notNull().unique(),
  refreshToken: text('refresh_token'),
  
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tokenIdx: uniqueIndex('session_token_idx').on(table.token),
  userIdx: index('session_user_idx').on(table.userId),
}));


export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});


export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Teams & Role-Based Access Control
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  
  name: text('name').notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color untuk UI
  
  createdBy: uuid('created_by').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orgIdx: index('team_org_idx').on(table.organizationId),
}));


export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  isTeamLead: boolean('is_team_lead').default(false),
  
  addedBy: uuid('added_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  teamUserIdx: uniqueIndex('team_user_unique_idx').on(table.teamId, table.userId),
}));

// FOLDERS & HIERARCHY
export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  
  name: text('name').notNull(),
  parentId: uuid('parent_id'), // Self-reference untuk hierarchy
  path: text('path').notNull(), // Materialized path: /root/subfolder1/subfolder2
  depth: integer('depth').default(0),
  
  // Ordering untuk drag & drop
  sortOrder: integer('sort_order').default(0),
  
  // Metadata
  color: varchar('color', { length: 7 }),
  icon: text('icon'),
  description: text('description'),
  
  createdBy: uuid('created_by').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orgIdx: index('folder_org_idx').on(table.organizationId),
  parentIdx: index('folder_parent_idx').on(table.parentId),
  pathIdx: index('folder_path_idx').on(table.path),
}));


export const folderTags = pgTable('folder_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }).notNull(),
  
  tag: text('tag').notNull(), // confidential, finance, legal, hr, custom, etc.
  color: varchar('color', { length: 7 }),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  folderTagIdx: uniqueIndex('folder_tag_unique_idx').on(table.folderId, table.tag),
}));

// PERMISSIONS (Folder & File Level)
export const folderPermissions = pgTable('folder_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }).notNull(),
  
  // Permission bisa untuk team atau individual user
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  permissionType: permissionTypeEnum('permission_type').notNull(),
  
  // Inherit ke subfolder?
  inheritToSubfolders: boolean('inherit_to_subfolders').default(true),
  
  grantedBy: uuid('granted_by').references(() => users.id),
  expiresAt: timestamp('expires_at'), // Optional: temporary permission
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  folderIdx: index('folder_perm_folder_idx').on(table.folderId),
  teamIdx: index('folder_perm_team_idx').on(table.teamId),
  userIdx: index('folder_perm_user_idx').on(table.userId),
}));

// DOCUMENTS & VERSIONING
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  
  // Basic Info
  filename: text('filename').notNull(),
  originalFilename: text('original_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(), // Dalam bytes
  
  // Current Version Reference
  currentVersionId: uuid('current_version_id'), // Reference ke document_versions
  versionCount: integer('version_count').default(1),
  
  // Status
  status: documentStatusEnum('status').default('active'),
  
  // Ownership & Access
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  isPublic: boolean('is_public').default(false),
  
  // Document DNA (untuk duplicate detection)
  contentHash: text('content_hash'), // SHA-256 dari normalized content
  ssdeepHash: text('ssdeep_hash'), // Fuzzy hash
  simHash: text('sim_hash'), // SimHash untuk similarity
  
  // Expiration
  expiresAt: timestamp('expires_at'),
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by').references(() => users.id),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orgIdx: index('doc_org_idx').on(table.organizationId),
  folderIdx: index('doc_folder_idx').on(table.folderId),
  ownerIdx: index('doc_owner_idx').on(table.ownerId),
  hashIdx: index('doc_hash_idx').on(table.contentHash),
  statusIdx: index('doc_status_idx').on(table.status),
}));


export const documentVersions = pgTable('document_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  
  versionNumber: integer('version_number').notNull(),
  
  // Storage Info (AWS S3)
  s3Key: text('s3_key').notNull(), // Path di S3
  s3Bucket: text('s3_bucket').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  
  // Encryption (AES-256)
  encryptionKeyId: text('encryption_key_id').notNull(), // Reference ke AWS KMS key ID
  encryptionIv: text('encryption_iv').notNull(), // IV untuk dekripsi
  encryptionSalt: text('encryption_salt').notNull(), // Salt untuk key derivation
  
  // Hashing
  sha256Hash: text('sha256_hash').notNull(), // Hash sebelum enkripsi
  bodyHash: text('body_hash'), // Hash dari body content saja (tanpa metadata)
  
  // Archive Status (untuk GDPR compliance)
  archiveStatus: archiveStatusEnum('archive_status').default('active'),
  archivedAt: timestamp('archived_at'),
  archiveJobId: text('archive_job_id'), // Reference ke AWS Glacier job
  
  // Tracking
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  changeNote: text('change_note'), // Catatan perubahan
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  docVersionIdx: uniqueIndex('doc_version_unique_idx').on(table.documentId, table.versionNumber),
  s3KeyIdx: index('doc_version_s3_idx').on(table.s3Key),
  archiveIdx: index('doc_version_archive_idx').on(table.archiveStatus),
}));


// File-level permissions (override folder permissions)
export const documentPermissions = pgTable('document_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  permissionType: permissionTypeEnum('permission_type').notNull(),
  
  grantedBy: uuid('granted_by').references(() => users.id),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  docIdx: index('doc_perm_doc_idx').on(table.documentId),
}));

// WATERMARKS & HONEYTOKENS (Anti-leak tracking)
export const documentWatermarks = pgTable('document_watermarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  versionId: uuid('version_id').references(() => documentVersions.id, { onDelete: 'cascade' }).notNull(),
  
  // Watermark type: steganography (invisible image watermark)
  watermarkType: text('watermark_type').default('lsb_steganography'),
  
  // Encrypted payload info (tidak simpan payload asli di DB)
  payloadHash: text('payload_hash').notNull(), // Hash dari payload untuk validasi
  embeddingPositions: jsonb('embedding_positions'), // Posisi embedding di image
  redundancyLevel: integer('redundancy_level').default(3), // 3-5x redundancy
  
  // Target images
  imageCount: integer('image_count').default(0),
  imageDetails: jsonb('image_details'), // Info gambar yang di-watermark
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  docIdx: index('watermark_doc_idx').on(table.documentId),
}));


export const documentHoneytokens = pgTable('document_honeytokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  versionId: uuid('version_id').references(() => documentVersions.id, { onDelete: 'cascade' }).notNull(),
  
  // Multiple honeytoken methods
  zwcToken: text('zwc_token'), // Zero-Width Character encoded token
  zwcPositions: jsonb('zwc_positions'), // Posisi ZWC di dokumen
  
  homoglyphToken: text('homoglyph_token'), // Homoglyph substitution token
  homoglyphPositions: jsonb('homoglyph_positions'),
  
  whitespaceToken: text('whitespace_token'), // Whitespace encoding token
  whitespacePositions: jsonb('whitespace_positions'),
  
  // Combined payload hash untuk validasi
  combinedPayloadHash: text('combined_payload_hash').notNull(),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  docIdx: index('honeytoken_doc_idx').on(table.documentId),
}));

// QR CODE (Document Verification)
export const documentQrCodes = pgTable('document_qr_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  versionId: uuid('version_id').references(() => documentVersions.id, { onDelete: 'cascade' }).notNull(),
  
  // QR Payload (signed)
  payloadHash: text('payload_hash').notNull(), // Hash dari payload
  signatureHash: text('signature_hash').notNull(), // HMAC-SHA256 signature
  
  // Verification URL
  verificationUrl: text('verification_url').notNull(),
  shortCode: varchar('short_code', { length: 20 }).notNull().unique(), // Short code untuk URL
  
  // QR Image
  qrImageS3Key: text('qr_image_s3_key'),
  
  // Blockchain proof (jika ada)
  hasBlockchainProof: boolean('has_blockchain_proof').default(false),
  
  scanCount: integer('scan_count').default(0),
  lastScannedAt: timestamp('last_scanned_at'),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  docIdx: index('qr_doc_idx').on(table.documentId),
  shortCodeIdx: uniqueIndex('qr_short_code_idx').on(table.shortCode),
}));

// BLOCKCHAIN ANCHORING (Pseudonymized)
export const blockchainAnchors = pgTable('blockchain_anchors', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  versionId: uuid('version_id').references(() => documentVersions.id, { onDelete: 'cascade' }).notNull(),
  
  // Blockchain Info
  blockchainNetwork: text('blockchain_network').default('polygon'), // polygon, ethereum, etc.
  transactionHash: text('transaction_hash').notNull().unique(),
  blockNumber: bigint('block_number', { mode: 'number' }),
  blockTimestamp: timestamp('block_timestamp'),
  
  // Pseudonymized data yang di-anchor (TIDAK ada PII)
  anchoredHash: text('anchored_hash').notNull(), // Hash dari dokumen
  pseudonymizedOrgId: text('pseudonymized_org_id').notNull(), // Pseudonymized org identifier
  
  // Merkle proof (jika batch anchoring)
  merkleRoot: text('merkle_root'),
  merkleProof: jsonb('merkle_proof'),
  
  // Status
  status: text('status').default('pending'), // pending, confirmed, failed
  confirmations: integer('confirmations').default(0),
  
  // Gas info
  gasUsed: bigint('gas_used', { mode: 'number' }),
  gasCost: text('gas_cost'),
  
  createdAt: timestamp('created_at').defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
}, (table) => ({
  txHashIdx: uniqueIndex('bc_tx_hash_idx').on(table.transactionHash),
  docIdx: index('bc_doc_idx').on(table.documentId),
}));

// DOCUMENT SHARING
export const documentShares = pgTable('document_shares', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  
  shareType: shareTypeEnum('share_type').notNull(),
  shareToken: text('share_token').notNull().unique(),
  shareUrl: text('share_url').notNull(),
  
  // Share restrictions
  allowedEmails: jsonb('allowed_emails'), // Array of allowed emails (same company)
  requireAuth: boolean('require_auth').default(true),
  
  // Limits
  maxViews: integer('max_views'),
  viewCount: integer('view_count').default(0),
  
  // Expiration
  expiresAt: timestamp('expires_at'),
  
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tokenIdx: uniqueIndex('share_token_idx').on(table.shareToken),
  docIdx: index('share_doc_idx').on(table.documentId),
}));


export const documentShareAccess = pgTable('document_share_access', {
  id: uuid('id').defaultRandom().primaryKey(),
  shareId: uuid('share_id').references(() => documentShares.id, { onDelete: 'cascade' }).notNull(),
  
  accessedBy: uuid('accessed_by').references(() => users.id),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  accessedAt: timestamp('accessed_at').defaultNow(),
});

// DOCUMENT VERIFICATION
export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Input method
  inputMethod: text('input_method').notNull(), // qr_scan, upload_softcopy, upload_hardcopy, manual_hash
  
  // Input data
  inputHash: text('input_hash'),
  inputQrCode: text('input_qr_code'),
  uploadedFileS3Key: text('uploaded_file_s3_key'),
  
  // Result
  status: verificationStatusEnum('status').default('pending'),
  matchedDocumentId: uuid('matched_document_id').references(() => documents.id),
  matchedVersionId: uuid('matched_version_id').references(() => documentVersions.id),
  
  // Hardcopy comparison results
  isHardcopyScan: boolean('is_hardcopy_scan').default(false),
  ssdeepSimilarity: integer('ssdeep_similarity'), // Persentase
  simHashDistance: integer('sim_hash_distance'), // Hamming distance
  
  // Chunk analysis (untuk medium similarity)
  chunkAnalysis: jsonb('chunk_analysis'),
  differingChunks: jsonb('differing_chunks'),
  
  // Blockchain verification
  blockchainVerified: boolean('blockchain_verified'),
  blockchainAnchorId: uuid('blockchain_anchor_id').references(() => blockchainAnchors.id),
  
  // Requester info
  requestedBy: uuid('requested_by').references(() => users.id),
  ipAddress: text('ip_address'),
  
  // Result message
  resultMessage: text('result_message'),
  resultDetails: jsonb('result_details'),
  
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  statusIdx: index('verify_status_idx').on(table.status),
}));

// TRASH (Soft Delete dengan 30 hari retention)
export const trashItems = pgTable('trash_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  
  // Reference to deleted item
  itemType: text('item_type').notNull(), // document, folder
  itemId: uuid('item_id').notNull(),
  
  // Original location untuk restore
  originalFolderId: uuid('original_folder_id'),
  originalPath: text('original_path'),
  
  // Metadata snapshot
  itemMetadata: jsonb('item_metadata').notNull(),
  
  // Auto-delete date (30 hari dari deleted_at)
  autoDeleteAt: timestamp('auto_delete_at').notNull(),
  
  deletedBy: uuid('deleted_by').references(() => users.id).notNull(),
  deletedAt: timestamp('deleted_at').defaultNow(),
}, (table) => ({
  orgIdx: index('trash_org_idx').on(table.organizationId),
  autoDeleteIdx: index('trash_auto_delete_idx').on(table.autoDeleteAt),
}));

// CRYPTO SHREDDING (GDPR Art 17 Compliance)
export const cryptoShredding = pgTable('crypto_shredding', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  // Target
  targetType: text('target_type').notNull(), // user, document, organization
  targetId: uuid('target_id').notNull(),
  
  // Keys yang dihapus
  kmsKeyIds: jsonb('kms_key_ids').notNull(), // Array of KMS key IDs yang dihapus
  
  // Status
  status: text('status').default('pending'), // pending, completed, failed
  
  // Audit info
  reason: text('reason').notNull(), // gdpr_request, user_request, etc.
  requestedBy: uuid('requested_by').references(() => users.id),
  
  // Affected items count
  affectedDocuments: integer('affected_documents').default(0),
  affectedVersions: integer('affected_versions').default(0),
  
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  statusIdx: index('shred_status_idx').on(table.status),
}));

// TEMPLATES
export const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'), // contract, invoice, letter, report, etc.
  
  // Template file
  s3Key: text('s3_key'),
  mimeType: text('mime_type'),
  thumbnailUrl: text('thumbnail_url'),
  
  // Template type
  isSystemTemplate: boolean('is_system_template').default(false),
  isPublic: boolean('is_public').default(false),
  
  // Usage tracking
  usageCount: integer('usage_count').default(0),
  
  createdBy: uuid('created_by').references(() => users.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orgIdx: index('template_org_idx').on(table.organizationId),
  categoryIdx: index('template_category_idx').on(table.category),
}));

// FORMS
export const forms = pgTable('forms', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  
  title: text('title').notNull(),
  description: text('description'),
  
  // Form schema (JSON Schema format)
  schema: jsonb('schema').notNull(),
  uiSchema: jsonb('ui_schema'), // UI customization
  
  // Settings
  isPublic: boolean('is_public').default(false),
  requireAuth: boolean('require_auth').default(true),
  allowAnonymous: boolean('allow_anonymous').default(false),
  
  // Limits
  maxSubmissions: integer('max_submissions'),
  submissionCount: integer('submission_count').default(0),
  
  // Linked template (optional - generate document from form)
  linkedTemplateId: uuid('linked_template_id').references(() => templates.id),
  
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orgIdx: index('form_org_idx').on(table.organizationId),
}));


export const formSubmissions = pgTable('form_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  formId: uuid('form_id').references(() => forms.id, { onDelete: 'cascade' }).notNull(),
  
  // Submission data (encrypted)
  encryptedData: text('encrypted_data').notNull(),
  dataHash: text('data_hash').notNull(),
  
  // Generated document (if linked template)
  generatedDocumentId: uuid('generated_document_id').references(() => documents.id),
  
  // Submitter info
  submittedBy: uuid('submitted_by').references(() => users.id),
  submitterEmail: text('submitter_email'),
  ipAddress: text('ip_address'),
  
  status: text('status').default('submitted'), // submitted, processed, rejected
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  formIdx: index('submission_form_idx').on(table.formId),
}));

// TASKS
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  
  title: text('title').notNull(),
  description: text('description'),
  
  // Assignment
  assignedTo: uuid('assigned_to').references(() => users.id),
  assignedTeam: uuid('assigned_team').references(() => teams.id),
  
  // Related entities
  relatedDocumentId: uuid('related_document_id').references(() => documents.id),
  relatedFolderId: uuid('related_folder_id').references(() => folders.id),
  
  // Status & Priority
  status: taskStatusEnum('status').default('pending'),
  priority: taskPriorityEnum('priority').default('medium'),
  
  // Dates
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  // Checklist
  checklist: jsonb('checklist'), // Array of checklist items
  
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orgIdx: index('task_org_idx').on(table.organizationId),
  assigneeIdx: index('task_assignee_idx').on(table.assignedTo),
  statusIdx: index('task_status_idx').on(table.status),
}));


export const taskComments = pgTable('task_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  
  content: text('content').notNull(),
  
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// AI CHATBOT
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  
  title: text('title'),
  
  // Context documents
  contextDocumentIds: jsonb('context_document_ids'), // Array of document IDs
  
  messageCount: integer('message_count').default(0),
  
  isActive: boolean('is_active').default(true),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('chat_user_idx').on(table.userId),
}));


export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => chatSessions.id, { onDelete: 'cascade' }).notNull(),
  
  role: text('role').notNull(), // user, assistant, system
  content: text('content').notNull(),
  
  // Metadata
  metadata: jsonb('metadata'), // Tokens used, model, etc.
  
  // Document analysis result
  analyzedDocuments: jsonb('analyzed_documents'), // Documents yang dianalisis
  
  // Embedding reference (stored in Qdrant)
  qdrantPointId: text('qdrant_point_id'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  sessionIdx: index('message_session_idx').on(table.sessionId),
}));


export const chatCache = pgTable('chat_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  queryHash: text('query_hash').notNull().unique(), // Hash dari query untuk caching
  query: text('query').notNull(),
  response: text('response').notNull(),
  
  // Context
  organizationId: uuid('organization_id').references(() => organizations.id),
  documentIds: jsonb('document_ids'),
  
  hitCount: integer('hit_count').default(0),
  lastHitAt: timestamp('last_hit_at'),
  
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  hashIdx: uniqueIndex('cache_hash_idx').on(table.queryHash),
}));

// OSINT / LEAK CHECKER
export const leakScans = pgTable('leak_scans', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  documentId: uuid('document_id').references(() => documents.id),
  
  scanType: text('scan_type').notNull(), // manual, scheduled, honeytoken_triggered
  
  // Search parameters
  searchQueries: jsonb('search_queries'), // Keywords, hashes searched
  sourcesSearched: jsonb('sources_searched'), // paste sites, forums, etc.
  
  // Results
  leaksFound: integer('leaks_found').default(0),
  status: text('status').default('pending'), // pending, running, completed, failed
  
  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orgIdx: index('leak_scan_org_idx').on(table.organizationId),
}));


export const leakReports = pgTable('leak_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  scanId: uuid('scan_id').references(() => leakScans.id, { onDelete: 'cascade' }).notNull(),
  documentId: uuid('document_id').references(() => documents.id),
  
  // Leak source info
  sourceUrl: text('source_url'),
  sourceName: text('source_name'),
  sourceType: text('source_type'), // paste_site, forum, dark_web, public_web
  
  // Match info
  matchType: text('match_type'), // exact, partial, honeytoken
  matchConfidence: integer('match_confidence'), // Persentase
  
  // Honeytoken trace (jika ada)
  honeytokenId: uuid('honeytoken_id').references(() => documentHoneytokens.id),
  watermarkId: uuid('watermark_id').references(() => documentWatermarks.id),
  tracedToUserId: uuid('traced_to_user_id').references(() => users.id), // Leaker
  
  // Evidence
  evidenceSnapshot: text('evidence_snapshot'), // Screenshot/content snapshot
  evidenceS3Key: text('evidence_s3_key'),
  
  // Discovery time
  discoveredAt: timestamp('discovered_at').defaultNow(),
  
  // Response
  isAcknowledged: boolean('is_acknowledged').default(false),
  acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  scanIdx: index('leak_report_scan_idx').on(table.scanId),
  docIdx: index('leak_report_doc_idx').on(table.documentId),
}));


export const honeytokenTriggers = pgTable('honeytoken_triggers', {
  id: uuid('id').defaultRandom().primaryKey(),
  honeytokenId: uuid('honeytoken_id').references(() => documentHoneytokens.id).notNull(),
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  
  // Trigger info
  triggerSource: text('trigger_source'), // URL dimana ditemukan
  triggerIp: text('trigger_ip'),
  triggerUserAgent: text('trigger_user_agent'),
  
  // Decoded payload
  decodedPayload: jsonb('decoded_payload'),
  
  // Investigation
  investigationStatus: text('investigation_status').default('new'), // new, investigating, confirmed, false_positive
  investigationNotes: text('investigation_notes'),
  
  triggeredAt: timestamp('triggered_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  honeytokenIdx: index('trigger_honeytoken_idx').on(table.honeytokenId),
}));

// TEMPORARY UPLOAD (Malware Scan)
export const temporaryUploads = pgTable('temporary_uploads', {
  id: uuid('id').defaultRandom().primaryKey(),
  uploadSessionId: text('upload_session_id').notNull().unique(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  // File info
  originalFilename: text('original_filename').notNull(),
  tempFilePath: text('temp_file_path').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: text('mime_type'),
  
  // Processing status
  status: text('status').default('uploaded'), // uploaded, scanning, processing, completed, failed, rejected
  
  // Malware scan
  malwareScanStatus: text('malware_scan_status'), // pending, clean, infected
  malwareScanResult: jsonb('malware_scan_result'),
  
  // Processing progress
  processingStage: text('processing_stage'), // extraction, normalization, hashing, watermarking, honeytoken, qr, encryption
  processingProgress: integer('processing_progress').default(0), // Persentase
  
  // Result
  resultDocumentId: uuid('result_document_id').references(() => documents.id),
  errorMessage: text('error_message'),
  
  // Temp file akan di-overwrite dengan 0 setelah selesai
  isSecureDeleted: boolean('is_secure_deleted').default(false),
  
  expiresAt: timestamp('expires_at').notNull(), // Auto-delete jika tidak selesai
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  sessionIdx: uniqueIndex('temp_upload_session_idx').on(table.uploadSessionId),
  statusIdx: index('temp_upload_status_idx').on(table.status),
}));

// AUDIT LOGS & SECURITY
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  userId: uuid('user_id').references(() => users.id),
  
  // Action
  action: auditActionEnum('action').notNull(),
  resourceType: text('resource_type').notNull(), // document, folder, user, team, etc.
  resourceId: uuid('resource_id'),
  
  // Details
  details: jsonb('details'),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  
  // Request info
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orgIdx: index('audit_org_idx').on(table.organizationId),
  userIdx: index('audit_user_idx').on(table.userId),
  actionIdx: index('audit_action_idx').on(table.action),
  createdAtIdx: index('audit_created_idx').on(table.createdAt),
}));


export const securityEvents = pgTable('security_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  userId: uuid('user_id').references(() => users.id),
  
  eventType: text('event_type').notNull(), // malware_detected, unauthorized_access, brute_force, honeytoken_triggered, etc.
  severity: text('severity').notNull(), // low, medium, high, critical
  
  description: text('description').notNull(),
  details: jsonb('details'),
  
  // Related entities
  relatedDocumentId: uuid('related_document_id').references(() => documents.id),
  
  // Response
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  resolution: text('resolution'),
  
  ipAddress: text('ip_address'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  severityIdx: index('security_severity_idx').on(table.severity),
  eventTypeIdx: index('security_event_type_idx').on(table.eventType),
}));

// ARCHIVE JOBS (AWS Glacier/Deep Archive)
export const archiveJobs = pgTable('archive_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  
  jobType: text('job_type').notNull(), // archive, restore, delete
  
  // Target
  versionIds: jsonb('version_ids').notNull(), // Array of version IDs
  
  // AWS Job Info
  awsJobId: text('aws_job_id'),
  glacierVaultArn: text('glacier_vault_arn'),
  
  // Status
  status: text('status').default('pending'), // pending, processing, completed, failed
  
  // Progress
  totalItems: integer('total_items').default(0),
  processedItems: integer('processed_items').default(0),
  
  errorMessage: text('error_message'),
  
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  statusIdx: index('archive_job_status_idx').on(table.status),
}));

// NOTIFICATIONS
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  type: text('type').notNull(), // task_assigned, document_shared, security_alert, etc.
  title: text('title').notNull(),
  message: text('message').notNull(),
  
  // Related entity
  relatedType: text('related_type'), // document, task, etc.
  relatedId: uuid('related_id'),
  
  // Status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('notif_user_idx').on(table.userId),
  isReadIdx: index('notif_read_idx').on(table.isRead),
}));

// CONTACT/SUPPORT
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  category: text('category'), // technical, billing, security, feature_request
  
  status: text('status').default('open'), // open, in_progress, resolved, closed
  priority: text('priority').default('medium'),
  
  assignedTo: text('assigned_to'), // Support staff email
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});


export const supportMessages = pgTable('support_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').references(() => supportTickets.id, { onDelete: 'cascade' }).notNull(),
  
  senderType: text('sender_type').notNull(), // user, support
  senderId: uuid('sender_id'),
  
  message: text('message').notNull(),
  attachments: jsonb('attachments'), // Array of S3 keys
  
  createdAt: timestamp('created_at').defaultNow(),
});

// RELATIONS (Drizzle ORM Relations)
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  teams: many(teams),
  folders: many(folders),
  documents: many(documents),
}));


export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  sessions: many(userSessions),
  teamMemberships: many(teamMembers),
  ownedDocuments: many(documents),
  tasks: many(tasks),
  chatSessions: many(chatSessions),
  notifications: many(notifications),
}));


export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  members: many(teamMembers),
  folderPermissions: many(folderPermissions),
  documentPermissions: many(documentPermissions),
}));


export const foldersRelations = relations(folders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [folders.organizationId],
    references: [organizations.id],
  }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
  }),
  children: many(folders),
  documents: many(documents),
  tags: many(folderTags),
  permissions: many(folderPermissions),
}));


export const documentsRelations = relations(documents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  folder: one(folders, {
    fields: [documents.folderId],
    references: [folders.id],
  }),
  owner: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
  }),
  versions: many(documentVersions),
  watermarks: many(documentWatermarks),
  honeytokens: many(documentHoneytokens),
  qrCodes: many(documentQrCodes),
  blockchainAnchors: many(blockchainAnchors),
  shares: many(documentShares),
  permissions: many(documentPermissions),
}));


export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
  createdBy: one(users, {
    fields: [documentVersions.createdBy],
    references: [users.id],
  }),
}));


export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));


export const tasksRelations = relations(tasks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  document: one(documents, {
    fields: [tasks.relatedDocumentId],
    references: [documents.id],
  }),
  comments: many(taskComments),
}));
