/**
 * SigningPanel — DocuSeal e-signing integration panel for sign tasks.
 *
 * Features:
 *  1. Initiate signing → sends document to DocuSeal
 *  2. Document preview with click-and-drag to place signature area
 *  3. Embedded DocuSeal signing form (DocusealForm component)
 *  4. Status polling + signed document download
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DocusealForm } from "@docuseal/react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import signingService from "@/services/signing.service";
import useAuthStore from "@/app/store/auth.store";

// Configure pdf.js worker — use Vite ?url import for reliable bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

// ── Step flow ──
// idle → initiating → signing (embed) → completed | declined | error

export default function SigningPanel({ task, onComplete }) {
  // ── State ──
  const [step, setStep] = useState("idle");           // idle | initiating | signing | completed | declined | error
  const [sigData, setSigData] = useState(null);        // signature record from backend
  const [formUrl, setFormUrl] = useState(null);        // DocuSeal form URL (/s/slug)
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  // Signature input state — removed (DocuSeal handles signature drawing)

  // Document preview + signature placement state
  const [pdfPages, setPdfPages] = useState([]);        // array of { pageNum, canvas } data URLs
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);   // 0-indexed
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);       // PDF loading error message
  const [sigArea, setSigArea] = useState(null);         // { x, y, w, h } as fractions 0-1
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);     // { x, y } pixel coords
  const previewRef = useRef(null);                      // ref to the preview container

  // ── On mount: check if signing already started ──
  useEffect(() => {
    checkExistingStatus();
  }, [task?.id]);

  // ── Load PDF preview when idle ──
  useEffect(() => {
    if (step === "idle" && task?.relatedDocumentId) {
      loadPdfPreview();
    }
  }, [step, task?.relatedDocumentId]);

  const loadPdfPreview = async () => {
    if (!task?.relatedDocumentId) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const token = useAuthStore.getState().accessToken;

      // Try direct file first (if it's already a PDF)
      let pdfArrayBuffer;
      const directUrl = `${apiUrl}/documents/${task.relatedDocumentId}/file`;

      console.log("[SigningPanel] Trying direct PDF load:", directUrl);
      const directRes = await fetch(directUrl, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (directRes.ok) {
        const contentType = directRes.headers.get("content-type") || "";
        const buf = await directRes.arrayBuffer();

        // Check if response starts with %PDF (valid PDF)
        const firstBytes = new Uint8Array(buf.slice(0, 5));
        const isPdf = firstBytes[0] === 0x25 && firstBytes[1] === 0x50 &&
                      firstBytes[2] === 0x44 && firstBytes[3] === 0x46;

        if (isPdf) {
          pdfArrayBuffer = buf;
          console.log("[SigningPanel] Direct file is PDF, using it");
        } else {
          // Not a PDF — convert via OnlyOffice endpoint
          console.log("[SigningPanel] Not a PDF (type:", contentType, "), converting via OnlyOffice...");
          const convertUrl = `${apiUrl}/documents/${task.relatedDocumentId}/download-as?format=pdf`;
          const convertRes = await fetch(convertUrl, {
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (!convertRes.ok) {
            throw new Error(`Conversion failed (${convertRes.status})`);
          }
          pdfArrayBuffer = await convertRes.arrayBuffer();
          console.log("[SigningPanel] Conversion successful, got", pdfArrayBuffer.byteLength, "bytes");
        }
      } else {
        throw new Error(`Failed to load document (${directRes.status})`);
      }

      // Render PDF with pdf.js
      const pdf = await pdfjsLib.getDocument({ data: pdfArrayBuffer, verbosity: 0 }).promise;
      console.log("[SigningPanel] PDF loaded, pages:", pdf.numPages);
      setTotalPages(pdf.numPages);

      const maxPages = Math.min(pdf.numPages, 20);
      const pages = [];
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
        pages.push({
          pageNum: i,
          dataUrl: canvas.toDataURL("image/jpeg", 0.85),
          width: viewport.width,
          height: viewport.height,
          aspectRatio: viewport.width / viewport.height,
        });
      }
      setPdfPages(pages);
      setCurrentPage(pages.length - 1);
      console.log("[SigningPanel] PDF preview ready,", pages.length, "pages rendered");
    } catch (err) {
      console.error("[SigningPanel] PDF preview error:", err);
      setPdfError(err.message || "Failed to load document preview");
      setPdfPages([]);
    } finally {
      setPdfLoading(false);
    }
  };

  const checkExistingStatus = async () => {
    if (!task?.id) return;
    try {
      const res = await signingService.getSigningStatus(task.id);
      if (res.success && res.data) {
        setSigData(res.data);
        if (res.data.status === "completed") {
          setStep("completed");
        } else if (res.data.status === "declined") {
          setStep("declined");
        } else if (res.data.formUrl) {
          setFormUrl(res.data.formUrl);
          setStep("signing");
        } else if (res.data.embedSrc) {
          // Fallback to embedSrc if formUrl not available
          setFormUrl(res.data.embedSrc);
          setStep("signing");
        }
      }
    } catch {
      // No existing signing — stay idle
    }
  };

  // ══════════════════════════════════════════════
  //  INITIATE SIGNING
  // ══════════════════════════════════════════════

  const handleInitiateSigning = async () => {
    if (!task?.relatedDocumentId) {
      setError("This task has no associated document.");
      return;
    }

    setStep("initiating");
    setError(null);

    // Build signatureAreas from the user-drawn rectangle on the document preview
    let signatureAreas;
    if (sigArea) {
      // sigArea is in fractions (0-1), currentPage is 0-indexed in our UI.
      // DocuSeal /submissions/pdf uses 1-indexed pages, so add 1.
      signatureAreas = [{
        x: sigArea.x,
        y: sigArea.y,
        w: sigArea.w,
        h: sigArea.h,
        page: currentPage + 1,
      }];
    } else {
      // Fallback: bottom-left of last page
      signatureAreas = [{ x: 0.05, y: 0.82, w: 0.35, h: 0.08, page: -1 }];
    }

    try {
      const res = await signingService.requestSigning(task.id, task.relatedDocumentId, { signatureAreas });
      if (res.success) {
        setSigData(res.data);
        const url = res.data.formUrl || res.data.embedSrc;
        if (url) {
          setFormUrl(url);
          setStep("signing");
        } else {
          setError("No form URL from DocuSeal.");
          setStep("error");
        }
      } else {
        setError(res.message || "Failed to initiate signing process.");
        setStep("error");
      }
    } catch (err) {
      console.error("Initiate signing error:", err);
      setError(err.response?.data?.message || "Failed to contact server.");
      setStep("error");
    }
  };

  // ══════════════════════════════════════════════
  //  POLL STATUS
  // ══════════════════════════════════════════════

  const handleCheckStatus = async () => {
    if (!task?.id) return;
    setPolling(true);
    try {
      const res = await signingService.checkSigningStatus(task.id);
      if (res.success && res.data) {
        setSigData(res.data);
        if (res.data.status === "completed") {
          setStep("completed");
          onComplete?.();
        } else if (res.data.status === "declined") {
          setStep("declined");
        }
      }
    } catch (err) {
      console.error("Check status error:", err);
    } finally {
      setPolling(false);
    }
  };

  // ── DocuSeal form event handlers ──
  const handleDocusealComplete = useCallback((data) => {
    console.log("[SigningPanel] DocuSeal form completed:", data);
    handleCheckStatus();
  }, [task?.id]);

  const handleDocusealDecline = useCallback((data) => {
    console.log("[SigningPanel] DocuSeal form declined:", data);
    setStep("declined");
    setSigData((prev) => ({ ...prev, declineReason: data?.reason || "Declined by user" }));
  }, []);

  // ══════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════

  // ── Completed State ──
  if (step === "completed") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Document Has Been Signed</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">
              {sigData?.completedAt ? `Completed: ${new Date(sigData.completedAt).toLocaleString("en-US")}` : "Signature successful."}
            </p>
          </div>
        </div>

        {sigData?.signedDocumentUrl && (
          <a href={sigData.signedDocumentUrl} target="_blank" rel="noopener noreferrer"
            className="w-full px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Signed Document
          </a>
        )}
      </div>
    );
  }

  // ── Declined State ──
  if (step === "declined") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Signature Declined</p>
            {sigData?.declineReason && (
              <p className="text-xs text-rose-600 dark:text-rose-500">Reason: {sigData.declineReason}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Signing Embed (DocuSeal Form Component) ──
  if (step === "signing" && formUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Sign the document below:
          </p>
          <button onClick={handleCheckStatus} disabled={polling}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5">
            {polling ? (
              <div className="w-3.5 h-3.5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Check Status
          </button>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" style={{ minHeight: "500px" }}>
          <DocusealForm
            src={formUrl}
            host="cdn.docuseal.com"
            onComplete={handleDocusealComplete}
            onDecline={handleDocusealDecline}
            withDownloadButton={false}
            withSendCopyButton={false}
            sendCopyEmail={false}
          />
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          After signing, the status will be updated automatically.
        </p>
      </div>
    );
  }

  // ── Idle / Initiating / Error — Main Panel ──
  return (
    <div className="space-y-4">
      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20"
          >
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Select a signature position on the document, then start the signing process.
      </p>

      {/* Document Preview — Signature Placement */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Signature Position
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Click and drag on the document below to mark the signature area.
        </p>

        {pdfLoading && (
          <div className="flex items-center justify-center py-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading document preview...</p>
            </div>
          </div>
        )}

        {!pdfLoading && pdfPages.length > 0 && (
          <div className="space-y-2">
            {/* Page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
                >
                  ← Previous
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pdfPages.length - 1, p + 1))}
                  disabled={currentPage >= pdfPages.length - 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Document preview with overlay */}
            <div
              ref={previewRef}
              className="relative rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white overflow-hidden cursor-crosshair select-none"
              onMouseDown={(e) => {
                const rect = previewRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                setDragStart({ x, y });
                setIsDragging(true);
                setSigArea(null);
              }}
              onMouseMove={(e) => {
                if (!isDragging || !dragStart) return;
                const rect = previewRef.current.getBoundingClientRect();
                const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                const area = {
                  x: Math.min(dragStart.x, x),
                  y: Math.min(dragStart.y, y),
                  w: Math.abs(x - dragStart.x),
                  h: Math.abs(y - dragStart.y),
                };
                // Enforce minimum size
                if (area.w > 0.03 && area.h > 0.02) {
                  setSigArea(area);
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const rect = previewRef.current.getBoundingClientRect();
                const x = (touch.clientX - rect.left) / rect.width;
                const y = (touch.clientY - rect.top) / rect.height;
                setDragStart({ x, y });
                setIsDragging(true);
                setSigArea(null);
              }}
              onTouchMove={(e) => {
                if (!isDragging || !dragStart) return;
                e.preventDefault();
                const touch = e.touches[0];
                const rect = previewRef.current.getBoundingClientRect();
                const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
                const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
                const area = {
                  x: Math.min(dragStart.x, x),
                  y: Math.min(dragStart.y, y),
                  w: Math.abs(x - dragStart.x),
                  h: Math.abs(y - dragStart.y),
                };
                if (area.w > 0.03 && area.h > 0.02) {
                  setSigArea(area);
                }
              }}
              onTouchEnd={() => setIsDragging(false)}
            >
              {/* PDF page image */}
              <img
                src={pdfPages[currentPage]?.dataUrl}
                alt={`Page ${currentPage + 1}`}
                className="w-full h-auto pointer-events-none"
                draggable={false}
              />

              {/* Signature area rectangle overlay */}
              {sigArea && (
                <div
                  className="absolute border-2 border-violet-500 bg-violet-500/15 rounded-sm pointer-events-none flex items-center justify-center"
                  style={{
                    left: `${sigArea.x * 100}%`,
                    top: `${sigArea.y * 100}%`,
                    width: `${sigArea.w * 100}%`,
                    height: `${sigArea.h * 100}%`,
                  }}
                >
                  <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Signature
                  </div>
                </div>
              )}

              {/* Crosshair overlay when dragging */}
              {isDragging && (
                <div className="absolute inset-0 bg-violet-500/5 pointer-events-none" />
              )}
            </div>

            {/* Area info */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {sigArea ? (
                  <span className="text-violet-500 dark:text-violet-400 font-medium">
                    ✓ Signature area selected — Page {currentPage + 1}
                  </span>
                ) : (
                  "Drag on the document to select the signature area"
                )}
              </p>
              {sigArea && (
                <button
                  onClick={() => setSigArea(null)}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Clear area
                </button>
              )}
            </div>
          </div>
        )}

        {/* Fallback when no PDF preview available */}
        {!pdfLoading && pdfPages.length === 0 && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-1">Preview Not Available</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mb-2">
              {pdfError
                ? `Failed to load document: ${pdfError}`
                : "This document is not a PDF or is not yet available."
              }
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mb-3">
              The signature will be placed in the bottom-left corner of the last page automatically.
            </p>
            {pdfError && (
              <button
                onClick={loadPdfPreview}
                className="text-xs font-medium text-amber-700 dark:text-amber-400 underline hover:no-underline"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      {/* Initiate Button */}
      <button
        onClick={handleInitiateSigning}
        disabled={step === "initiating"}
        className="w-full px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
      >
        {step === "initiating" ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )}
        {step === "initiating" ? "Processing..." : "Start Signing"}
      </button>
    </div>
  );
}
