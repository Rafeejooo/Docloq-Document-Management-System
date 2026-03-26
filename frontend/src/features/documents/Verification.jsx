import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";

// ── SVG Icons ──
const IconHash = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);
const IconDocument = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconQR = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);
const IconUpload = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);
const IconCheck = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const IconShield = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const IconX = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconWarning = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconArrowLeft = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const IconArrowRight = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const IconInfo = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconChain = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);
const IconDownload = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const IconFile = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);
const IconClock = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconUser = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IconRefresh = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ── Spinner ──
const Spinner = ({ className = "w-5 h-5" }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ── Step Indicator ──
function StepIndicator({ current, total = 3 }) {
  const labels = ["Method", "Input", "Result"];
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            i < current ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            : i === current ? "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500/20"
            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
          }`}>
            {i < current ? (
              <IconCheck className="w-3 h-3" />
            ) : (
              <span className="w-4 text-center">{i + 1}</span>
            )}
            <span className="hidden sm:inline">{labels[i]}</span>
          </div>
          {i < total - 1 && (
            <div className={`w-8 h-px transition-colors ${i < current ? "bg-emerald-300 dark:bg-emerald-500/40" : "bg-slate-200 dark:bg-slate-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Verification Progress Steps ──
function VerificationProgress({ steps }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
            <Spinner className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Verifying document...</span>
        </div>
        <div className="space-y-2">
          {steps.map((label, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.6 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60"
            >
              <Spinner className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Status Badge ──
function StatusBadge({ status }) {
  const config = {
    verified: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/25", text: "text-emerald-700 dark:text-emerald-400", icon: <IconShield className="w-4 h-4" />, label: "Verified" },
    partial: { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/25", text: "text-amber-700 dark:text-amber-400", icon: <IconWarning className="w-4 h-4" />, label: "Partial Match" },
    not_found: { bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/25", text: "text-red-700 dark:text-red-400", icon: <IconX className="w-4 h-4" />, label: "Not Found" },
  };
  const c = config[status] || config.not_found;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.border} ${c.text}`}>
      {c.icon} {c.label}
    </span>
  );
}

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════

export default function Verification() {
  const [step, setStep] = useState(0);
  const [verificationType, setVerificationType] = useState(null);
  const [hardFileMethod, setHardFileMethod] = useState("qr");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hashInput, setHashInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleSelectType = (type) => {
    setVerificationType(type);
    setStep(1);
    setVerificationResult(null);
  };

  const handleBack = () => {
    if (step === 1) { setStep(0); setVerificationType(null); setHashInput(""); setUploadedFile(null); }
    else if (step === 2) { setStep(1); setVerificationResult(null); }
  };

  const handleReset = () => {
    setStep(0); setVerificationType(null); setHardFileMethod("qr");
    setVerificationResult(null); setHashInput(""); setUploadedFile(null);
  };

  const handleFileUpload = useCallback((file) => {
    if (file) {
      setUploadedFile({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + " MB", type: file.type || "Unknown" });
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleSoftVerify = () => {
    if (!hashInput.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      const isFound = Math.random() > 0.3;
      setVerificationResult({
        type: "soft",
        status: isFound ? "verified" : "not_found",
        inputHash: hashInput,
        document: isFound ? "Contract_Agreement_2025.pdf" : null,
        uploadedBy: isFound ? "John Doe" : null,
        uploadDate: isFound ? "Dec 15, 2025" : null,
        blockchainVerified: isFound,
        blockchainNetwork: "Polygon",
        blockchainTxHash: isFound ? `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("")}` : null,
        blockNumber: isFound ? 5000000 + Math.floor(Math.random() * 100000) : null,
      });
      setIsVerifying(false);
      setStep(2);
    }, 2500);
  };

  const handleHardVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const similarity = 85 + Math.random() * 15;
      const isAuthentic = similarity >= 90;
      setVerificationResult({
        type: "hard",
        method: hardFileMethod,
        status: isAuthentic ? "verified" : "partial",
        similarity: similarity.toFixed(1),
        document: "Contract_Agreement_2025.pdf",
        uploadedBy: "John Doe",
        uploadDate: "Dec 15, 2025",
        scannedFile: uploadedFile?.name || "QR Scan Result",
        fuzzyHash: {
          original: `3:${Array(20).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("")}`,
          scanned: `3:${Array(20).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("")}`,
        },
        blockchainVerified: true,
        blockchainNetwork: "Polygon",
      });
      setIsVerifying(false);
      setStep(2);
    }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-2">
          <div className="flex items-center gap-3 mb-1">
            {step > 0 && (
              <button onClick={handleBack} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <IconArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                Document Verification
              </motion.h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                {step === 0 && "Validate document authenticity with blockchain-backed verification"}
                {step === 1 && verificationType === "soft" && "Enter the document hash to verify against blockchain"}
                {step === 1 && verificationType === "hard" && "Scan QR code or upload document for fuzzy hash comparison"}
                {step === 2 && "Verification complete"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Step Indicator ── */}
        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* ══════════════ Step 0: Choose Verification Type ══════════════ */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Soft File */}
                <motion.button
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectType("soft")}
                  className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-300 dark:hover:border-indigo-500/40"
                >
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/15 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
                    <IconArrowRight />
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                    <IconHash className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Soft File Verification</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Verify digital documents using their SHA-256 content hash against blockchain records.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">SHA-256</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Blockchain</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Exact Match</span>
                  </div>
                </motion.button>

                {/* Hard File */}
                <motion.button
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectType("hard")}
                  className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-300 dark:hover:border-violet-500/40"
                >
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/15 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-all">
                    <IconArrowRight />
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/20">
                    <IconDocument className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">Hard File Verification</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Verify physical or scanned documents using QR code scanning or fuzzy hash comparison.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-[11px] font-medium text-violet-600 dark:text-violet-400">SSDEEP</span>
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-[11px] font-medium text-violet-600 dark:text-violet-400">QR Code</span>
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-[11px] font-medium text-violet-600 dark:text-violet-400">Fuzzy Match</span>
                  </div>
                </motion.button>
              </div>

              {/* Help Card */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="mt-6 flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                  <IconInfo className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="text-sm leading-relaxed">
                  <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Which method should I use?</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-600 dark:text-slate-300">Soft File</span> &mdash; Use when you have the document's SHA-256 hash and want to verify it against blockchain.
                    <br />
                    <span className="font-medium text-slate-600 dark:text-slate-300">Hard File</span> &mdash; Use for printed or scanned copies. Fuzzy hashing detects matches even with scanning artifacts.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ══════════════ Step 1: Input ══════════════ */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>

              {/* ── Soft File: Hash Input ── */}
              {verificationType === "soft" && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/15">
                        <IconHash className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Hash Verification</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Enter the document's SHA-256 content hash</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Document Hash (SHA-256)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={hashInput}
                          onChange={(e) => setHashInput(e.target.value)}
                          placeholder="e.g., a3d5f8e9c2b1a7f4e8d9c3b2a1e5f7d4..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 font-mono text-sm placeholder:text-slate-400 transition-all"
                        />
                        <IconHash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">Enter the 64-character hexadecimal hash of the document</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
                      <div className="flex items-start gap-2.5">
                        <IconChain className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          <span className="font-medium text-slate-600 dark:text-slate-300">Blockchain verification</span> &mdash; We check if this hash exists on the Polygon blockchain. A match confirms the document was registered and has not been tampered with since anchoring.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSoftVerify}
                      disabled={!hashInput.trim() || isVerifying}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                    >
                      {isVerifying ? <><Spinner className="w-4 h-4" /> Verifying...</> : <><IconShield className="w-4 h-4" /> Verify Hash</>}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Hard File: QR or Upload ── */}
              {verificationType === "hard" && (
                <div className="space-y-5">
                  {/* Method Toggle */}
                  <div className="p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex gap-1">
                      {[
                        { id: "qr", label: "Scan QR Code", icon: <IconQR className="w-4 h-4" /> },
                        { id: "upload", label: "Upload Document", icon: <IconUpload className="w-4 h-4" /> },
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setHardFileMethod(method.id)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            hardFileMethod === method.id
                              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                        >
                          {method.icon}
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QR Scanner */}
                  {hardFileMethod === "qr" && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                      <div className="p-6">
                        <div className="text-center">
                          <div className="w-64 h-64 mx-auto mb-6 rounded-2xl bg-slate-950 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden shadow-inner">
                            {/* Scanner Frame */}
                            <div className="absolute inset-4 border border-white/10 rounded-xl" />
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-violet-400 rounded-tl-md" />
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-violet-400 rounded-tr-md" />
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-violet-400 rounded-bl-md" />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-violet-400 rounded-br-md" />

                            {/* Scanning Line */}
                            <motion.div
                              className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-lg shadow-violet-500/50"
                              initial={{ top: "16px" }}
                              animate={{ top: ["16px", "calc(100% - 16px)", "16px"] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                            />

                            <div className="text-center z-10">
                              <IconQR className="w-10 h-10 text-white/60 mx-auto mb-3" />
                              <p className="text-xs text-white/50 font-medium">Position QR code in frame</p>
                            </div>
                          </div>

                          <button
                            onClick={handleHardVerify}
                            disabled={isVerifying}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 transition-all"
                          >
                            {isVerifying ? <><Spinner className="w-4 h-4" /> Scanning...</> : <><IconQR className="w-4 h-4" /> Start Scanning</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  {hardFileMethod === "upload" && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                      <div className="p-6 space-y-5">
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                            isDragging
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-500/5 scale-[1.01]"
                              : uploadedFile
                              ? "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5"
                              : "border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />

                          {uploadedFile ? (
                            <div>
                              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                                <IconCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">{uploadedFile.name}</p>
                              <p className="text-xs text-slate-400 mb-3">{uploadedFile.size}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                                className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                              >
                                Remove and choose another
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center mx-auto mb-4">
                                <IconUpload className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                              </div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Drag & drop your document</p>
                              <p className="text-xs text-slate-400 mb-4">PDF, DOCX, or scanned images (JPG, PNG)</p>
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                Browse files
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
                          <IconInfo className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Fuzzy Hashing (SSDEEP)</span> &mdash; For scanned or photographed documents, we use fuzzy hashing to find similarity with the original, even with minor differences from scanning artifacts.
                          </p>
                        </div>

                        <button
                          onClick={handleHardVerify}
                          disabled={!uploadedFile || isVerifying}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 transition-all"
                        >
                          {isVerifying ? <><Spinner className="w-4 h-4" /> Analyzing Document...</> : <><IconShield className="w-4 h-4" /> Verify Document</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verification Progress */}
              {isVerifying && (
                <VerificationProgress
                  steps={
                    verificationType === "soft"
                      ? ["Searching blockchain records...", "Checking hash registry...", "Validating authenticity..."]
                      : ["Extracting document features...", "Computing fuzzy hash (SSDEEP)...", "Comparing with database...", "Calculating similarity score..."]
                  }
                />
              )}
            </motion.div>
          )}

          {/* ══════════════ Step 2: Result ══════════════ */}
          {step === 2 && verificationResult && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">

                {/* ── Result Banner ── */}
                <div className={`px-6 py-8 text-center border-b ${
                  verificationResult.status === "verified"
                    ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 border-emerald-100 dark:border-emerald-500/15"
                    : verificationResult.status === "partial"
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border-amber-100 dark:border-amber-500/15"
                    : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-500/5 dark:to-rose-500/5 border-red-100 dark:border-red-500/15"
                }`}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
                      verificationResult.status === "verified"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/25"
                        : verificationResult.status === "partial"
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25"
                        : "bg-gradient-to-br from-red-500 to-rose-500 shadow-red-500/25"
                    }`}>
                      {verificationResult.status === "verified" ? (
                        <IconShield className="w-8 h-8 text-white" />
                      ) : verificationResult.status === "partial" ? (
                        <IconWarning className="w-8 h-8 text-white" />
                      ) : (
                        <IconX className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </motion.div>

                  <h2 className={`text-xl font-bold mb-1 ${
                    verificationResult.status === "verified"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : verificationResult.status === "partial"
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-red-700 dark:text-red-400"
                  }`}>
                    {verificationResult.status === "verified" ? "Document Verified" : verificationResult.status === "partial" ? "Partial Match Found" : "Document Not Found"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {verificationResult.status === "verified"
                      ? "This document is authentic and its integrity is confirmed on blockchain"
                      : verificationResult.status === "partial"
                      ? "A similar document was found, but differences were detected"
                      : "No matching document was found in our blockchain records"}
                  </p>
                </div>

                {/* ── Result Details ── */}
                <div className="p-6 space-y-5">

                  {/* Soft File: Verified Result */}
                  {verificationResult.type === "soft" && verificationResult.status === "verified" && (
                    <>
                      {/* Document Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <IconFile className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Document</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{verificationResult.document}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <IconUser className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Uploaded By</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{verificationResult.uploadedBy}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <IconClock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Upload Date</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{verificationResult.uploadDate}</p>
                          </div>
                        </div>
                      </div>

                      {/* Hash Info */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Verified Hash (SHA-256)</p>
                        <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all leading-relaxed">{verificationResult.inputHash}</code>
                      </div>

                      {/* Blockchain Record */}
                      {verificationResult.blockchainVerified && (
                        <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-500/20 overflow-hidden">
                          <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-500/5 border-b border-indigo-200/60 dark:border-indigo-500/20 flex items-center gap-2">
                            <IconChain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">Blockchain Record</span>
                            <StatusBadge status="verified" />
                          </div>
                          <div className="p-4 bg-white dark:bg-slate-900 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Network</span>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">{verificationResult.blockchainNetwork}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Block Number</span>
                              <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">#{verificationResult.blockNumber?.toLocaleString()}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Transaction Hash</p>
                              <code className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 break-all leading-relaxed">{verificationResult.blockchainTxHash}</code>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Hard File Result */}
                  {verificationResult.type === "hard" && (
                    <>
                      {/* Similarity Score */}
                      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Similarity Score</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {parseFloat(verificationResult.similarity) >= 95
                                ? "Excellent match - document appears authentic"
                                : parseFloat(verificationResult.similarity) >= 90
                                ? "Good match - minor differences detected"
                                : "Low match - document may have been modified"}
                            </p>
                          </div>
                          <div className={`text-3xl font-bold tabular-nums ${
                            parseFloat(verificationResult.similarity) >= 95 ? "text-emerald-600 dark:text-emerald-400"
                            : parseFloat(verificationResult.similarity) >= 90 ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                          }`}>
                            {verificationResult.similarity}%
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${verificationResult.similarity}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              parseFloat(verificationResult.similarity) >= 95 ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : parseFloat(verificationResult.similarity) >= 90 ? "bg-gradient-to-r from-amber-500 to-orange-500"
                              : "bg-gradient-to-r from-red-500 to-rose-500"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Document Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <IconFile className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Matched Document</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{verificationResult.document}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <IconDocument className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Your File</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{verificationResult.scannedFile}</p>
                          </div>
                        </div>
                      </div>

                      {/* Fuzzy Hash Comparison */}
                      <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden">
                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-700/50">
                          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fuzzy Hash Comparison (SSDEEP)</p>
                        </div>
                        <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Original Document</p>
                            </div>
                            <code className="text-[11px] font-mono text-slate-600 dark:text-slate-400 break-all">{verificationResult.fuzzyHash.original}</code>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Your Document</p>
                            </div>
                            <code className="text-[11px] font-mono text-slate-600 dark:text-slate-400 break-all">{verificationResult.fuzzyHash.scanned}</code>
                          </div>
                        </div>
                      </div>

                      {/* Blockchain Badge */}
                      {verificationResult.blockchainVerified && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200/60 dark:border-emerald-500/15">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/15 flex-shrink-0">
                            <IconChain className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Original Anchored on Blockchain</p>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{verificationResult.blockchainNetwork} Network</p>
                          </div>
                          <StatusBadge status="verified" />
                        </div>
                      )}
                    </>
                  )}

                  {/* Not Found Details */}
                  {verificationResult.status === "not_found" && (
                    <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        The provided hash was not found in our blockchain records.
                      </p>
                      <div className="inline-block p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <code className="text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all">{verificationResult.inputHash?.substring(0, 32)}...</code>
                      </div>
                      <p className="text-xs text-slate-400 mt-3">
                        This document may not have been registered, or the hash may not match.
                      </p>
                    </div>
                  )}

                  {/* ── Action Buttons ── */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleReset} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <IconRefresh className="w-4 h-4" />
                      Verify Another
                    </button>
                    {verificationResult.status !== "not_found" && (
                      <button onClick={() => alert("Report downloaded!")} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                        <IconDownload className="w-4 h-4" />
                        Download Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
