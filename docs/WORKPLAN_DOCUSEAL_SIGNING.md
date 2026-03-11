# Workplan: Integrasi DocuSeal E-Signing ke Workflow Task

## Overview

Mengintegrasikan **DocuSeal** sebagai e-signing provider ke dalam workflow task yang sudah ada di DocLoq. Saat ini, task type `sign` hanya membuka dokumen di OnlyOffice tanpa proses tanda tangan digital yang proper. Dengan integrasi DocuSeal, proses signing akan menggunakan form tanda tangan yang legally binding, embedded langsung di UI DocLoq.

### Arsitektur Integrasi

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SIGNING WORKFLOW FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Admin/Manager buat Form Instance dengan step "sign"             │
│         ↓                                                            │
│  2. Task "sign" dibuat & di-assign ke user                          │
│         ↓                                                            │
│  3. Backend: Upload dokumen ke DocuSeal → Create Submission         │
│         ↓                                                            │
│  4. Frontend: Embed DocuSeal signing form di halaman task           │
│         ↓                                                            │
│  5. User tanda tangan di embedded form                              │
│         ↓                                                            │
│  6. Webhook dari DocuSeal: form.completed                           │
│         ↓                                                            │
│  7. Backend: Download signed PDF, simpan sebagai document version   │
│         ↓                                                            │
│  8. Auto-complete task → activate next workflow step                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## DocuSeal API Reference (Ringkasan)

**Base URL:** `https://api.docuseal.com`  
**Auth Header:** `X-Auth-Token: <API_KEY>`

### Endpoint yang Digunakan

| # | Method | Endpoint | Deskripsi |
|---|--------|----------|-----------|
| 1 | `POST` | `/submissions/pdf` | Buat submission langsung dari PDF (one-off, tanpa perlu template) |
| 2 | `GET` | `/submissions/{id}` | Cek status submission |
| 3 | `GET` | `/submissions/{id}/documents` | Download signed documents |
| 4 | `GET` | `/submitters` | List submitters & status |
| 5 | `GET` | `/submitters/{id}` | Detail submitter + signed docs |
| 6 | `POST` | `/templates/pdf` | (Opsional) Buat reusable template dari PDF |
| 7 | `POST` | `/submissions` | Buat submission dari existing template |
| 8 | Webhook | `form.completed` | Notifikasi saat signing selesai |
| 9 | Webhook | `form.declined` | Notifikasi saat signer menolak |

### Key Concepts

- **Template**: Dokumen yang reusable dengan field yang sudah didefinisikan
- **Submission**: Satu instance signing request (bisa multi-party)
- **Submitter**: Signer individual dalam sebuah submission
- **`embed_src`**: URL yang bisa di-embed via iframe untuk signing form di app kita

---

## Phase 1: Backend — DocuSeal Service & Database Schema

### 1.1 Environment Variables

```env
# .env
DOCUSEAL_API_KEY=XANKurCF2Rh2Ja5zrxvgHJ26SqsFKqCakSpd9EmdMM4
DOCUSEAL_API_URL=https://api.docuseal.com
DOCUSEAL_WEBHOOK_SECRET=<generate-random-secret>
APP_URL=https://your-domain.com  # untuk webhook & redirect
```

### 1.2 Database Migration — Tabel `document_signatures`

Buat tabel baru untuk tracking signing status:

```sql
CREATE TABLE document_signatures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Relasi ke entities DocLoq
  task_id               UUID REFERENCES tasks(id) ON DELETE SET NULL,
  document_id           UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  form_instance_id      UUID,  -- optional, jika dari workflow form
  
  -- DocuSeal IDs
  docuseal_submission_id  INTEGER NOT NULL,         -- ID submission di DocuSeal
  docuseal_template_id    INTEGER,                  -- ID template jika pakai template
  docuseal_submitter_id   INTEGER,                  -- ID submitter di DocuSeal
  docuseal_slug           VARCHAR(50),              -- Slug untuk embed URL
  
  -- Signer Info
  signer_user_id        UUID REFERENCES users(id),  -- User DocLoq yang sign
  signer_email          TEXT NOT NULL,
  signer_name           TEXT,
  signer_role           TEXT DEFAULT 'First Party',
  
  -- Status Tracking
  status                TEXT DEFAULT 'pending',      -- pending, sent, opened, completed, declined, expired
  
  -- Timestamps dari DocuSeal
  sent_at               TIMESTAMP,
  opened_at             TIMESTAMP,
  completed_at          TIMESTAMP,
  declined_at           TIMESTAMP,
  decline_reason        TEXT,
  
  -- Signed Document
  signed_document_url   TEXT,                        -- URL signed PDF dari DocuSeal
  signed_document_path  TEXT,                        -- Path lokal setelah download
  audit_log_url         TEXT,                        -- URL audit log dari DocuSeal
  
  -- Embed
  embed_src             TEXT,                        -- URL untuk iframe embed
  
  -- Metadata
  metadata              JSONB DEFAULT '{}',
  
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_doc_sig_org ON document_signatures(organization_id);
CREATE INDEX idx_doc_sig_task ON document_signatures(task_id);
CREATE INDEX idx_doc_sig_doc ON document_signatures(document_id);
CREATE INDEX idx_doc_sig_submission ON document_signatures(docuseal_submission_id);
CREATE INDEX idx_doc_sig_status ON document_signatures(status);
```

### 1.3 Drizzle Schema — `schema.js`

Tambahkan di `backend/src/db/schema.js`:

```javascript
// DOCUMENT SIGNATURES (DocuSeal Integration)
export const documentSignatures = pgTable('document_signatures', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  
  // Relasi ke entities DocLoq
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  formInstanceId: uuid('form_instance_id'),
  
  // DocuSeal IDs
  docusealSubmissionId: integer('docuseal_submission_id').notNull(),
  docusealTemplateId: integer('docuseal_template_id'),
  docusealSubmitterId: integer('docuseal_submitter_id'),
  docusealSlug: varchar('docuseal_slug', { length: 50 }),
  
  // Signer Info
  signerUserId: uuid('signer_user_id').references(() => users.id),
  signerEmail: text('signer_email').notNull(),
  signerName: text('signer_name'),
  signerRole: text('signer_role').default('First Party'),
  
  // Status
  status: text('status').default('pending'), // pending, sent, opened, completed, declined, expired
  
  // DocuSeal Timestamps
  sentAt: timestamp('sent_at'),
  openedAt: timestamp('opened_at'),
  completedAt: timestamp('completed_at'),
  declinedAt: timestamp('declined_at'),
  declineReason: text('decline_reason'),
  
  // Signed Document
  signedDocumentUrl: text('signed_document_url'),
  signedDocumentPath: text('signed_document_path'),
  auditLogUrl: text('audit_log_url'),
  
  // Embed
  embedSrc: text('embed_src'),
  
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orgIdx: index('doc_sig_org_idx').on(table.organizationId),
  taskIdx: index('doc_sig_task_idx').on(table.taskId),
  docIdx: index('doc_sig_doc_idx').on(table.documentId),
  submissionIdx: index('doc_sig_submission_idx').on(table.docusealSubmissionId),
  statusIdx: index('doc_sig_status_idx').on(table.status),
}));
```

### 1.4 DocuSeal Service — `backend/src/services/docuseal.service.js`

```javascript
// Service functions yang perlu dibuat:

// 1. createSubmissionFromPDF(documentPath, signerEmail, signerName, options)
//    - Baca file PDF dari storage
//    - Convert ke base64
//    - POST /submissions/pdf ke DocuSeal
//    - Return: submission data + embed_src
//
// 2. createSubmissionFromTemplate(templateId, signerEmail, signerName, options)
//    - POST /submissions ke DocuSeal  
//    - Return: submission data + embed_src
//
// 3. getSubmission(submissionId)
//    - GET /submissions/{id}
//    - Return: status, documents, submitters
//
// 4. getSubmissionDocuments(submissionId)
//    - GET /submissions/{id}/documents
//    - Return: signed document URLs
//
// 5. getSubmitter(submitterId)
//    - GET /submitters/{id}
//    - Return: submitter details + signed docs
//
// 6. downloadSignedDocument(url, savePath)
//    - Download signed PDF dari DocuSeal URL
//    - Simpan ke local storage
//    - Return: local file path
//
// 7. handleWebhook(eventType, data)
//    - Process form.completed → update status, download doc, complete task
//    - Process form.declined → update status, cancel task
```

### 1.5 Signing Controller — `backend/src/controllers/signing.controller.js`

```javascript
// Endpoints yang perlu dibuat:

// 1. POST /api/signing/request
//    - Body: { taskId, documentId, signerEmail?, signerName? }
//    - Buat DocuSeal submission dari dokumen yang terkait dengan task
//    - Simpan record di document_signatures
//    - Return: embed_src untuk frontend
//
// 2. GET /api/signing/:taskId/status
//    - Cek status signing untuk task tertentu
//    - Return: signing status + embed_src
//
// 3. GET /api/signing/:taskId/embed
//    - Return embed URL untuk iframe
//
// 4. GET /api/signing/:signatureId/documents
//    - Return signed document info & download links
//
// 5. POST /api/signing/webhook
//    - Endpoint untuk DocuSeal webhook callback
//    - Verify webhook (optional: signature verification)
//    - Process event: update status, auto-complete task
//
// 6. POST /api/signing/:taskId/manual-check
//    - Manual polling: cek status di DocuSeal jika webhook gagal
//    - Fallback mechanism
```

### 1.6 Routes — `backend/src/routes/signing.routes.js`

```javascript
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Public webhook endpoint (no auth, verified by webhook secret)
router.post('/webhook', handleWebhook);

// Authenticated routes
router.use(authenticate);
router.post('/request', createSigningRequest);
router.get('/:taskId/status', getSigningStatus);
router.get('/:taskId/embed', getSigningEmbed);
router.get('/:signatureId/documents', getSignedDocuments);
router.post('/:taskId/manual-check', manualCheckStatus);

export default router;
```

---

## Phase 2: Backend — Workflow Integration

### 2.1 Modifikasi Task Controller (`submitTaskAction`)

Saat task type `sign` di-submit:

```
1. Cek apakah sudah ada signing request untuk task ini
2. Jika belum → return error "Please initiate signing first"
3. Jika sudah → cek status di DocuSeal:
   a. completed → mark task complete, activate next step
   b. pending/sent → return "Signing still in progress"
   c. declined → mark task cancelled, cancel workflow
```

### 2.2 Modifikasi Task Controller (`completeTask`)

Untuk sign tasks, completion hanya boleh dari webhook atau manual-check, bukan dari user langsung.

### 2.3 Webhook Handler Flow

```
form.completed →
  1. Cari document_signature by docuseal_submission_id
  2. Update status = 'completed'
  3. Download signed PDF → simpan ke storage
  4. Buat document version baru (signed version)
  5. Update task status = 'completed'
  6. Update workflow step status = 'completed'
  7. Activate next workflow step
  8. (Optional) Kirim email notifikasi

form.declined →
  1. Cari document_signature by docuseal_submission_id  
  2. Update status = 'declined', save reason
  3. Update task status = 'cancelled'
  4. Cancel workflow (skip remaining steps)
  5. Kirim notifikasi ke admin/creator
```

---

## Phase 3: Frontend — Signing UI

### 3.1 Signing Service — `frontend/src/services/signing.service.js`

```javascript
// API calls:
// - requestSigning(taskId, documentId)  → POST /api/signing/request
// - getSigningStatus(taskId)            → GET /api/signing/:taskId/status
// - getSigningEmbed(taskId)             → GET /api/signing/:taskId/embed
// - getSignedDocuments(signatureId)     → GET /api/signing/:signatureId/documents
// - manualCheckStatus(taskId)           → POST /api/signing/:taskId/manual-check
```

### 3.2 Modifikasi Tasks.jsx — Sign Task Panel

Ganti behavior saat ini (OnlyOffice editor untuk sign) dengan embedded DocuSeal form:

**State Flow untuk Sign Task:**

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  INITIATE SIGN   │────→│  SIGNING FORM    │────→│  COMPLETED       │
│                  │     │  (Embedded)      │     │                  │
│  Button: "Start  │     │  DocuSeal iframe │     │  Show signed doc │
│  Signing Process"│     │  in full panel   │     │  Download link   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                │
                                ↓ (decline)
                         ┌──────────────────┐
                         │  DECLINED        │
                         │  Show reason     │
                         └──────────────────┘
```

**UI Components:**

1. **SigningInitiatePanel** — Tombol untuk mulai proses signing + preview dokumen
2. **SigningEmbedPanel** — Iframe DocuSeal signing form (full width/height)
3. **SigningCompletePanel** — Tampilkan signed document + audit log + download
4. **SigningStatusBadge** — Badge status signing (pending, sent, opened, completed, declined)

### 3.3 Embedded Signing Form

DocuSeal menyediakan `embed_src` URL yang bisa di-embed via iframe:

```jsx
<iframe
  src={embedSrc}
  style={{ width: '100%', height: '80vh', border: 'none' }}
  allow="camera"  // Untuk capture signature
/>
```

**Alternatif (lebih baik)**: Gunakan DocuSeal React component:
```bash
npm install @docuseal/react
```

```jsx
import { DocusealForm } from '@docuseal/react';

<DocusealForm
  src={embedSrc}
  onComplete={(data) => handleSigningComplete(data)}
  onDecline={(data) => handleSigningDecline(data)}
  style={{ width: '100%', height: '80vh' }}
/>
```

> **Keuntungan @docuseal/react**: Event callbacks (`onComplete`, `onDecline`) langsung di frontend, tidak perlu tunggu webhook.

### 3.4 Polling Fallback

Jika webhook belum datang tapi user sudah selesai sign (via `onComplete` callback):

```javascript
// Setelah onComplete callback dari DocuSeal React component:
// 1. Panggil POST /api/signing/:taskId/manual-check
// 2. Backend akan verify di DocuSeal API
// 3. Jika confirmed complete → auto-complete task
```

---

## Phase 4: Multi-Signer Support (Optional Enhancement)

Untuk dokumen yang perlu ditandatangani oleh beberapa pihak (e.g., kontrak antara 2 perusahaan):

### 4.1 Multi-Step Signing dalam Workflow

```
Step 1: fill    → User A isi dokumen
Step 2: review  → Manager B review
Step 3: sign    → User A tanda tangan
Step 4: sign    → Manager B tanda tangan (DocuSeal submitter order = preserved)
Step 5: approve → Director C final approval
```

### 4.2 DocuSeal Multi-Submitter

```javascript
// POST /submissions
{
  template_id: 1000001,
  order: "preserved",  // Sequential signing
  submitters: [
    { role: "First Party", email: "user-a@company.com", order: 0 },
    { role: "Second Party", email: "manager-b@company.com", order: 1 }
  ]
}
```

---

## Checklist Implementasi

### Backend

- [ ] **B1**: Install dependency (`node-fetch` jika belum ada, atau gunakan native `fetch`)
- [ ] **B2**: Tambah environment variables (`.env`)
- [ ] **B3**: Buat Drizzle migration untuk tabel `document_signatures`
- [ ] **B4**: Tambah schema `documentSignatures` di `schema.js`
- [ ] **B5**: Buat `docuseal.service.js` — API wrapper untuk DocuSeal
- [ ] **B6**: Buat `signing.controller.js` — request, status, embed, webhook handler
- [ ] **B7**: Buat `signing.routes.js` — routing
- [ ] **B8**: Register routes di `routes/index.js`
- [ ] **B9**: Modifikasi `task.controller.js` — handle sign tasks differently
- [ ] **B10**: Webhook handler — process `form.completed` dan `form.declined`
- [ ] **B11**: Download signed PDF & simpan sebagai document version baru
- [ ] **B12**: Test API endpoints dengan Postman/curl

### Frontend

- [ ] **F1**: Install `@docuseal/react`
- [ ] **F2**: Buat `signing.service.js` — API calls ke backend
- [ ] **F3**: Modifikasi `Tasks.jsx` — ganti sign panel dengan DocuSeal embed
- [ ] **F4**: Komponen `SigningPanel` — initiate, embed form, status, completed view
- [ ] **F5**: Handle `onComplete` dan `onDecline` callbacks dari DocuSeal component
- [ ] **F6**: Polling/manual-check fallback
- [ ] **F7**: UI untuk lihat signed document + download
- [ ] **F8**: Status badges & progress indicators untuk signing

### DevOps / Config

- [ ] **D1**: Set up DocuSeal webhook URL di DocuSeal dashboard → `{APP_URL}/api/signing/webhook`
- [ ] **D2**: Test webhook delivery (gunakan ngrok untuk local development)
- [ ] **D3**: Pastikan CORS & CSP headers allow DocuSeal iframe embed

---

## Estimasi Timeline

| Phase | Task | Estimasi |
|-------|------|----------|
| Phase 1 | Backend: Schema + Service + Controller + Routes | 2-3 hari |
| Phase 2 | Backend: Workflow integration + Webhook | 1-2 hari |
| Phase 3 | Frontend: Signing UI + Embed + Callbacks | 2-3 hari |
| Phase 4 | Testing & Bug Fixes | 1-2 hari |
| **Total** | | **6-10 hari** |

---

## Catatan Keamanan

1. **API Key**: Simpan di environment variable, JANGAN hardcode di source code
2. **Webhook Verification**: Verify bahwa webhook berasal dari DocuSeal (IP whitelist atau signature)
3. **Signed Document Storage**: Signed PDF harus di-encrypt sama seperti dokumen lain (AES-256)
4. **Audit Trail**: Log semua signing activity di audit_logs table
5. **GDPR/UU PDP**: Signed documents mengandung PII (tanda tangan) → harus di-encrypt dan comply dengan retention policy

---

## Diagram Arsitektur

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   Tasks Page     │  │  DocuSeal Embed  │  │ Signed Doc    │  │
│  │   (Tasks.jsx)    │──│  (@docuseal/react│──│ Viewer        │  │
│  │   Sign Panel     │  │   DocusealForm)  │  │               │  │
│  └────────┬─────────┘  └────────┬─────────┘  └───────────────┘  │
│           │                     │ onComplete/onDecline           │
└───────────┼─────────────────────┼────────────────────────────────┘
            │ API calls           │
            ↓                     ↓
┌──────────────────────────────────────────────────────────────────┐
│                       BACKEND (Express.js)                       │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ signing.routes   │  │ signing.ctrl     │  │ docuseal.svc  │  │
│  │                  │──│                  │──│               │──│──→ DocuSeal API
│  │ /api/signing/*   │  │ request/status/  │  │ createSub/    │  │
│  │                  │  │ webhook          │  │ getSub/etc    │  │
│  └──────────────────┘  └────────┬─────────┘  └───────────────┘  │
│                                 │                                │
│  ┌─────────────────┐  ┌────────┴─────────┐                     │
│  │ task.controller  │  │ document_        │                     │
│  │ (modified)       │──│ signatures (DB)  │                     │
│  └─────────────────┘  └──────────────────┘                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
            ↑
            │ Webhook POST
┌───────────┴──────────┐
│    DocuSeal Cloud    │
│  api.docuseal.com    │
│  form.completed      │
│  form.declined       │
└──────────────────────┘
```
