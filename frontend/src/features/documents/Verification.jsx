import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function Verification() {
  const [step, setStep] = useState(0); // 0: choose type, 1: input, 2: result
  const [verificationType, setVerificationType] = useState(null); // "soft" or "hard"
  const [hardFileMethod, setHardFileMethod] = useState("qr"); // "qr" or "upload"
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
    if (step === 1) {
      setStep(0);
      setVerificationType(null);
      setHashInput("");
      setUploadedFile(null);
    } else if (step === 2) {
      setStep(1);
      setVerificationResult(null);
    }
  };

  const handleReset = () => {
    setStep(0);
    setVerificationType(null);
    setHardFileMethod("qr");
    setVerificationResult(null);
    setHashInput("");
    setUploadedFile(null);
  };

  const handleFileUpload = (file) => {
    if (file) {
      setUploadedFile({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        type: file.type || "Unknown"
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSoftVerify = () => {
    if (!hashInput.trim()) return;
    setIsVerifying(true);
    
    // Simulate hash verification
    setTimeout(() => {
      const isFound = Math.random() > 0.3; // 70% chance found
      setVerificationResult({
        type: "soft",
        status: isFound ? "verified" : "not_found",
        inputHash: hashInput,
        document: isFound ? "Contract_Agreement_2025.pdf" : null,
        uploadedBy: isFound ? "John Doe" : null,
        uploadDate: isFound ? "Dec 15, 2025" : null,
        blockchainVerified: isFound,
        blockchainNetwork: "Ethereum Sepolia",
        blockchainTxHash: isFound ? `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("")}` : null,
        blockNumber: isFound ? 5000000 + Math.floor(Math.random() * 100000) : null,
      });
      setIsVerifying(false);
      setStep(2);
    }, 2500);
  };

  const handleHardVerify = () => {
    setIsVerifying(true);
    
    // Simulate document/QR verification with fuzzy hashing
    setTimeout(() => {
      const similarity = 85 + Math.random() * 15; // 85-100% similarity
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
        blockchainNetwork: "Ethereum Sepolia",
      });
      setIsVerifying(false);
      setStep(2);
    }, 3000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold text-slate-900 dark:text-white"
            >
              Document Verification
            </motion.h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {step === 0 && "Choose a verification method to validate document authenticity"}
            {step === 1 && verificationType === "soft" && "Enter the document hash to verify against blockchain"}
            {step === 1 && verificationType === "hard" && "Scan QR code or upload document for fuzzy hash comparison"}
            {step === 2 && "Verification complete"}
          </p>
        </div>

        {/* Step 0: Choose Verification Type */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Soft File Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectType("soft")}
                  className="group p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 text-left transition-all duration-200"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Soft File</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Verify using document hash. Best for digital documents with known hash values.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    <span>Hash Verification</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>

                {/* Hard File Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectType("hard")}
                  className="group p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 text-left transition-all duration-200"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Hard File</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Verify physical or scanned documents using QR code or fuzzy hash matching.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    <span>QR / Upload</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
              </div>

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Which method should I use?</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <strong>Soft File:</strong> Use when you have the document's SHA-256 hash and want to verify it's registered on blockchain.<br />
                      <strong>Hard File:</strong> Use for physical documents or scanned copies - we'll use fuzzy hashing to find matches.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Step 1: Input */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Soft File - Hash Input */}
              {verificationType === "soft" && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Hash Verification</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Enter the document's SHA-256 hash</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Document Hash (SHA-256)
                      </label>
                      <input
                        type="text"
                        value={hashInput}
                        onChange={(e) => setHashInput(e.target.value)}
                        placeholder="e.g., a3d5f8e9c2b1a7f4e8d9c3b2a1e5f7d4..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 font-mono text-sm placeholder:text-slate-400"
                      />
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Enter the 64-character hexadecimal hash of the document
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">How it works:</strong> We'll check if this hash exists on the blockchain. If found, it confirms the document was registered and hasn't been tampered with.
                      </p>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={handleSoftVerify}
                      disabled={!hashInput.trim() || isVerifying}
                    >
                      {isVerifying ? "Verifying..." : "Verify Hash"}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Hard File - QR or Upload */}
              {verificationType === "hard" && (
                <div className="space-y-4">
                  {/* Method Toggle */}
                  <Card className="p-2">
                    <div className="flex gap-1">
                      {[
                        { id: "qr", label: "Scan QR Code", icon: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        )},
                        { id: "upload", label: "Upload Document", icon: (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        )},
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setHardFileMethod(method.id)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                            hardFileMethod === method.id
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {method.icon}
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* QR Scanner */}
                  {hardFileMethod === "qr" && (
                    <Card className="p-6">
                      <div className="text-center">
                        <div className="w-64 h-64 mx-auto mb-5 rounded-2xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                          {/* Simulated camera view */}
                          <div className="absolute inset-4 border-2 border-white/30 rounded-xl"></div>
                          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-indigo-400"></div>
                          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-indigo-400"></div>
                          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-indigo-400"></div>
                          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-indigo-400"></div>
                          
                          {/* Scanning line */}
                          <motion.div
                            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                            initial={{ top: "16px" }}
                            animate={{ top: ["16px", "calc(100% - 16px)", "16px"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          
                          <div className="text-center z-10">
                            <div className="text-4xl mb-3">📱</div>
                            <p className="text-sm text-white/80">Position QR code here</p>
                          </div>
                        </div>
                        
                        <Button onClick={handleHardVerify} disabled={isVerifying}>
                          {isVerifying ? "Scanning..." : "Start Scanning"}
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* File Upload */}
                  {hardFileMethod === "upload" && (
                    <Card className="p-6">
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                          isDragging 
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" 
                            : uploadedFile
                            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e.target.files[0])}
                          className="hidden"
                        />
                        
                        {uploadedFile ? (
                          <div>
                            <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                              <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{uploadedFile.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{uploadedFile.size}</p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                              className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Remove and choose another
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                              <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Drag & drop your document</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">PDF, DOCX, or scanned images (JPG, PNG)</p>
                            <Button variant="outline" size="sm">Choose File</Button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-700 dark:text-slate-300">Fuzzy Hashing:</strong> For scanned or photographed documents, we use SSDEEP fuzzy hashing to find similarity with the original, even with minor differences from scanning.
                        </p>
                      </div>

                      <Button 
                        className="w-full mt-4" 
                        onClick={handleHardVerify}
                        disabled={!uploadedFile || isVerifying}
                      >
                        {isVerifying ? "Analyzing Document..." : "Verify Document"}
                      </Button>
                    </Card>
                  )}
                </div>
              )}

              {/* Verifying Progress */}
              {isVerifying && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Card className="p-6">
                    <div className="space-y-3">
                      {(verificationType === "soft" 
                        ? ["Searching blockchain records...", "Checking hash registry...", "Validating authenticity..."]
                        : ["Extracting document features...", "Computing fuzzy hash (SSDEEP)...", "Comparing with database...", "Calculating similarity score..."]
                      ).map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.5 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                        >
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                            <svg className="w-3 h-3 text-indigo-600 dark:text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Result */}
          {step === 2 && verificationResult && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6">
                {/* Result Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    verificationResult.status === "verified"
                      ? "bg-emerald-100 dark:bg-emerald-500/20"
                      : verificationResult.status === "partial"
                      ? "bg-amber-100 dark:bg-amber-500/20"
                      : "bg-red-100 dark:bg-red-500/20"
                  }`}>
                    {verificationResult.status === "verified" ? (
                      <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : verificationResult.status === "partial" ? (
                      <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <h2 className={`text-xl font-semibold mb-1 ${
                    verificationResult.status === "verified" 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : verificationResult.status === "partial"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {verificationResult.status === "verified" 
                      ? "Document Verified" 
                      : verificationResult.status === "partial"
                      ? "Partial Match Found"
                      : "Document Not Found"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {verificationResult.status === "verified"
                      ? "This document is authentic and registered on blockchain"
                      : verificationResult.status === "partial"
                      ? "Document found with some differences from original"
                      : "No matching document found in our records"}
                  </p>
                </div>

                {/* Soft File Result */}
                {verificationResult.type === "soft" && verificationResult.status === "verified" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Document</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{verificationResult.document}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Uploaded By</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{verificationResult.uploadedBy}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Verified Hash</p>
                      <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{verificationResult.inputHash}</code>
                    </div>

                    {verificationResult.blockchainVerified && (
                      <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">⛓️</span>
                          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Blockchain Record</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-indigo-600/70 dark:text-indigo-300/70">Network</span>
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{verificationResult.blockchainNetwork}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-indigo-600/70 dark:text-indigo-300/70">Block</span>
                            <span className="font-mono font-medium text-indigo-700 dark:text-indigo-300">#{verificationResult.blockNumber?.toLocaleString()}</span>
                          </div>
                          <div className="pt-2 border-t border-indigo-200 dark:border-indigo-500/30">
                            <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70 mb-1">TX Hash</p>
                            <code className="text-xs font-mono text-indigo-700 dark:text-indigo-300 break-all">{verificationResult.blockchainTxHash}</code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Hard File Result */}
                {verificationResult.type === "hard" && (
                  <div className="space-y-4">
                    {/* Similarity Score */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Similarity Score</span>
                        <span className={`text-2xl font-bold ${
                          parseFloat(verificationResult.similarity) >= 95
                            ? "text-emerald-600 dark:text-emerald-400"
                            : parseFloat(verificationResult.similarity) >= 90
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>{verificationResult.similarity}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${verificationResult.similarity}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            parseFloat(verificationResult.similarity) >= 95
                              ? "bg-emerald-500"
                              : parseFloat(verificationResult.similarity) >= 90
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {parseFloat(verificationResult.similarity) >= 95 
                          ? "Excellent match - document appears authentic"
                          : parseFloat(verificationResult.similarity) >= 90
                          ? "Good match - minor differences detected (may be from scanning)"
                          : "Low match - document may have been modified"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Matched Document</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{verificationResult.document}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Your File</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{verificationResult.scannedFile}</p>
                      </div>
                    </div>

                    {/* Fuzzy Hash Info */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Fuzzy Hash Comparison (SSDEEP)</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Original Document</p>
                          <code className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">{verificationResult.fuzzyHash.original}</code>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Your Document</p>
                          <code className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">{verificationResult.fuzzyHash.scanned}</code>
                        </div>
                      </div>
                    </div>

                    {verificationResult.blockchainVerified && (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">⛓️</span>
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Original Hash on Blockchain</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">{verificationResult.blockchainNetwork}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Not Found Result */}
                {verificationResult.status === "not_found" && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                      The hash <code className="text-xs font-mono bg-white dark:bg-slate-700 px-1 py-0.5 rounded">{verificationResult.inputHash?.substring(0, 20)}...</code> was not found in our blockchain records. This document may not have been registered.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={handleReset}>
                    Verify Another
                  </Button>
                  {verificationResult.status !== "not_found" && (
                    <Button className="flex-1" onClick={() => alert("Report downloaded!")}>
                      Download Report
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
