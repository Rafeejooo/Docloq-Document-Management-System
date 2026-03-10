# Workplan: Soft File Hash Verification

**Project:** DocLoq — Document Verification by Hash Comparison  
**Scope:** Soft file verification — user uploads a file, selects an existing document from a list, and the system compares their hashes to verify authenticity.  
**Date:** 9 Maret 2026

---

## 1. Objective

Implement a fully functional **soft file hash verification** feature where:

1. User selects an existing document from the DocLoq system (as the "reference" document)
2. User uploads a new file (the file they want to verify)
3. The system computes the SHA-256 hash of the uploaded file and compares it against the stored hash of the selected reference document
4. The system returns a verification result: **match** (identical), **similar** (via SimHash), or **no match**

---

## 2. Current State Analysis

### What Exists

| Component | Status | Notes |
|---|---|---|
| `hash.service.js` | Ready | `generateSHA256()`, `generateSimHash()`, `hammingDistance()`, `generateDocumentDNA()`, `checkDuplicate()` |
| Document schema | Ready | `contentHash` (SHA-256 normalized text), `simHash` (64-bit SimHash) on `documents` table; `sha256Hash` (raw file hash) on `documentVersions` table |
| `POST /documents/:id/verify` | Exists (buggy) | Method 3 (file upload) compares raw file SHA-256 against `contentHash` — **mismatch because `contentHash` is the hash of normalized text, not raw file bytes** |
| `Verification.jsx` (frontend) | Exists (mock) | Soft file verification uses `setTimeout` + `Math.random()` — not connected to real API |
| `upload-pipeline.service.js` | Ready | Contains `extractText()`, `normalizeText()`, `generateDocumentDNA()` pipeline used during upload |

### Critical Bug to Fix

The current `verifyDocument` controller (Method 3) does:

```js
const uploadHash = generateSHA256(req.file.buffer);     // SHA-256 of raw file bytes
const hashMatch = doc.contentHash === uploadHash;        // contentHash = SHA-256 of NORMALIZED TEXT
```

This will **always fail** for text/PDF files because `contentHash` was computed from normalized text extraction, not from raw file bytes. The correct approach is to compare against `documentVersions.sha256Hash` (the raw file hash stored during upload).

---

## 3. Implementation Plan

### Phase 1: Backend — Fix & Enhance Verification Endpoint

#### Task 1.1: Fix hash comparison logic

**File:** `backend/src/controllers/document.controller.js`

- When verifying via file upload (Method 3), compare uploaded file hash against `documentVersions.sha256Hash` (raw file hash) instead of `documents.contentHash`
- Also add a **secondary check** using document DNA (normalized text → SHA-256) against `documents.contentHash` for text-based files
- Add a **SimHash similarity check** — compute SimHash of uploaded file's normalized text and compare with `documents.simHash` using `hammingDistance()`

**Implementation:**

```js
// Method 3: File upload comparison
if (req.file) {
  const uploadRawHash = generateSHA256(req.file.buffer);

  // Check 1: Raw file hash match (exact byte-for-byte copy)
  const [version] = await db.select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, id))
    .orderBy(desc(documentVersions.versionNumber))
    .limit(1);

  const rawMatch = version?.sha256Hash === uploadRawHash;

  // Check 2: Content DNA match (text content equivalence)
  let contentMatch = false;
  let similarity = null;
  const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
  if (text) {
    const normalized = normalizeText(text);
    const dna = generateDocumentDNA(normalized);
    contentMatch = dna.sha256 === doc.contentHash;
    
    // Check 3: SimHash similarity
    if (doc.simHash && dna.simhash) {
      const distance = hammingDistance(doc.simHash, dna.simhash);
      similarity = ((64 - distance) / 64 * 100).toFixed(1);
    }
  }

  result.methods.push({
    method: 'file_comparison',
    rawHashMatch: rawMatch,
    contentHashMatch: contentMatch,
    similarity: similarity ? `${similarity}%` : null,
    uploadedRawHash: uploadRawHash,
    expectedRawHash: version?.sha256Hash,
  });

  if (rawMatch || contentMatch) {
    result.verified = true;
  }
}
```

#### Task 1.2: New endpoint — List documents for verification selector

**File:** `backend/src/controllers/document.controller.js`  
**Route:** `GET /documents/verify/list`

Returns a lightweight list of documents the user has access to (for the document selector dropdown in the frontend). Only returns `id`, `originalFilename`, `mimeType`, `fileSize`, `contentHash`, `createdAt`.

```js
export const getDocumentsForVerification = async (req, res) => {
  const { organizationId, id: userId, role } = req.user;
  
  const conditions = [
    eq(documents.organizationId, organizationId),
    isNull(documents.deletedAt),
  ];

  // Non-admin users only see their own documents
  if (['user', 'viewer'].includes(role)) {
    conditions.push(eq(documents.ownerId, userId));
  }

  const docs = await db.select({
    id: documents.id,
    originalFilename: documents.originalFilename,
    mimeType: documents.mimeType,
    fileSize: documents.fileSize,
    contentHash: documents.contentHash,
    createdAt: documents.createdAt,
  })
  .from(documents)
  .where(and(...conditions))
  .orderBy(desc(documents.createdAt));

  res.json({ success: true, data: docs });
};
```

**Route registration** in `document.routes.js`:
```js
router.get('/verify/list', authenticate, getDocumentsForVerification);
```

#### Task 1.3: Add text extraction utility for verification

**File:** `backend/src/services/hash.service.js` or new `verification.service.js`

Extract the text extraction + normalization logic from `upload-pipeline.service.js` into a reusable function:

```js
export const extractTextFromBuffer = async (buffer, mimeType) => {
  if (mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }
  return null; // Non-text files — use raw hash only
};
```

---

### Phase 2: Frontend — Redesign Soft File Verification UI

#### Task 2.1: Update Verification.jsx soft file flow

**File:** `frontend/src/features/documents/Verification.jsx`

Replace the current mock soft file verification with a real 3-step flow:

**Step 1: Select Reference Document**
- Fetch document list from `GET /documents/verify/list`
- Show searchable dropdown/list with document name, type, size, date
- User selects which document to compare against

**Step 2: Upload File to Verify**
- Drag & drop or click-to-browse file upload zone
- Show file preview (name, size, type) after selection
- "Verify" button triggers the comparison

**Step 3: Show Results**
- Call `POST /documents/:id/verify` with the uploaded file
- Display result: verified (exact match), similar (with similarity %), or no match
- Show hash details: expected hash, uploaded hash, match status

#### Task 2.2: Add document service API call

**File:** `frontend/src/services/document.service.js`

Add methods:

```js
export const getDocumentsForVerification = async () => {
  const res = await api.get('/documents/verify/list');
  return res.data;
};

export const verifyDocumentByFile = async (documentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/documents/${documentId}/verify`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
```

#### Task 2.3: Frontend UI state flow

```
┌─────────────────────────────────────────┐
│  Step 0: Choose Verification Type       │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Soft File   │  │   Hard File     │   │
│  │  (Selected)  │  │                 │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Step 1: Select Reference Document      │
│  ┌─────────────────────────────────┐    │
│  │ 🔍 Search documents...          │    │
│  ├─────────────────────────────────┤    │
│  │ ☐ Contract_2025.pdf   12 KB     │    │
│  │ ☑ Report_Q4.pdf       45 KB     │ ← │
│  │ ☐ Invoice_001.xlsx    8 KB      │    │
│  └─────────────────────────────────┘    │
│  [Next →]                               │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Step 2: Upload File to Compare         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   Drag & drop file here         │    │
│  │   or click to browse            │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│  Selected: Report_Q4.pdf (reference)    │
│  Uploaded: Report_Q4_copy.pdf           │
│  [Verify Document]                      │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Step 3: Verification Result            │
│  ┌─────────────────────────────────┐    │
│  │ ✓ VERIFIED — Exact Match        │    │
│  │                                 │    │
│  │ Raw Hash:    Match ✓            │    │
│  │ Content Hash: Match ✓           │    │
│  │ Similarity:  100%               │    │
│  │                                 │    │
│  │ Reference: Report_Q4.pdf        │    │
│  │ Uploaded:  Report_Q4_copy.pdf   │    │
│  │ Hash: a3d5f8e9c2b1...          │    │
│  └─────────────────────────────────┘    │
│  [Verify Another] [Back to Documents]   │
└─────────────────────────────────────────┘
```

---

### Phase 3: Testing & Edge Cases

#### Task 3.1: Test scenarios

| Scenario | Expected Result |
|---|---|
| Upload exact same file as reference | `verified: true`, raw hash matches, 100% similarity |
| Upload file with minor text edits | `verified: false` for raw hash, but SimHash shows high similarity (e.g. 95%) |
| Upload completely different file | `verified: false`, low similarity |
| Upload non-text file (image/binary) | Raw hash comparison only (no text extraction) |
| User without access to target document | 403 Forbidden |
| User uploads file exceeding size limit | 413 / validation error |
| Corrupted/empty file upload | Graceful error handling |

#### Task 3.2: Security considerations

- Rate-limit verification endpoint to prevent brute-force hash probing
- Never expose other users' file content — only verify hash match (boolean)
- Audit log every verification attempt
- File uploaded for verification should be held in memory only, not persisted to disk
- Maximum upload size: same as document upload limit (configurable via `UPLOAD_MAX_SIZE`)

---

## 4. File Change Summary

| File | Action | Description |
|---|---|---|
| `backend/src/controllers/document.controller.js` | Modify | Fix `verifyDocument` hash comparison bug; add `getDocumentsForVerification` controller |
| `backend/src/routes/document.routes.js` | Modify | Add `GET /documents/verify/list` route |
| `backend/src/services/hash.service.js` | Modify | Export `extractTextFromBuffer()` utility function |
| `frontend/src/features/documents/Verification.jsx` | Modify | Replace mock soft file verification with real 3-step flow (select doc → upload file → show result) |
| `frontend/src/services/document.service.js` | Modify | Add `getDocumentsForVerification()` and `verifyDocumentByFile()` API calls |

---

## 5. Dependencies

- No new packages required
- Uses existing: `pdf-parse`, `crypto`, `multer`, `drizzle-orm`

---

## 6. Estimated Effort

| Phase | Estimated Time |
|---|---|
| Phase 1: Backend fixes & new endpoint | 2–3 hours |
| Phase 2: Frontend UI redesign | 3–4 hours |
| Phase 3: Testing & edge cases | 1–2 hours |
| **Total** | **6–9 hours** |

---

## 7. Priority Order

1. **Fix the hash comparison bug** (Task 1.1) — critical, current verification always fails
2. **Add document list endpoint** (Task 1.2) — needed for the frontend selector
3. **Extract text utility** (Task 1.3) — needed for multi-hash comparison
4. **Redesign frontend soft verification flow** (Task 2.1–2.3)
5. **Testing & security review** (Task 3.1–3.2)
