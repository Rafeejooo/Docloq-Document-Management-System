import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import aiAnalysisService from "@/services/ai-analysis.service";
import { useTheme } from "@/app/providers/ThemeProvider";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie, Doughnut, Radar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend
);

export default function AIDocumentAnalysis() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [promptHistory, setPromptHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantTarget, setGrantTarget] = useState(null);
  // New: page selection, quota, processing steps
  const [pageInfo, setPageInfo] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [processingStep, setProcessingStep] = useState(0); // 0=idle, 1-5=steps

  // Fetch quota on mount
  useEffect(() => {
    aiAnalysisService.getQuota().then(res => {
      setQuotaInfo(res.data?.data || null);
    }).catch(() => {});
  }, []);

  // Fetch documents on mount
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await aiAnalysisService.getDocuments(searchQuery);
      setDocuments(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchDocuments]);

  const getFileType = (mimeType) => {
    if (mimeType?.includes("pdf")) return "PDF";
    if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) return "Excel";
    if (mimeType?.includes("wordprocessing") || mimeType?.includes("msword")) return "Word";
    if (mimeType?.includes("presentation") || mimeType?.includes("powerpoint")) return "PowerPoint";
    if (mimeType?.includes("text/plain")) return "Text";
    if (mimeType?.includes("image")) return "Image";
    return "File";
  };

  const getFileIcon = (type) => {
    const icons = {
      PDF: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      Excel: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      Word: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      PowerPoint: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    };
    return icons[type] || icons.PDF;
  };

  const getFileColor = (type) => {
    const colors = {
      PDF: "text-red-500 bg-red-100 dark:bg-red-500/20",
      Excel: "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20",
      Word: "text-blue-500 bg-blue-100 dark:bg-blue-500/20",
      PowerPoint: "text-orange-500 bg-orange-100 dark:bg-orange-500/20",
      Text: "text-slate-500 bg-slate-100 dark:bg-slate-500/20",
      Image: "text-purple-500 bg-purple-100 dark:bg-purple-500/20",
    };
    return colors[type] || colors.PDF;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSelectDocument = async (doc) => {
    if (!doc.aiAccessGranted) {
      setGrantTarget(doc);
      setShowGrantModal(true);
    } else {
      setSelectedDocument(doc);
      setAnalysisResult(null);
      setPromptHistory([]);
      setPageInfo(null);
      setSelectedPages([]);
      // Fetch page info for page selector
      try {
        const res = await aiAnalysisService.getPageInfo(doc.id);
        const info = res.data?.data;
        setPageInfo(info);
        // Default: select all pages
        if (info?.pageCount) {
          setSelectedPages(Array.from({ length: info.pageCount }, (_, i) => i + 1));
        }
      } catch {
        // Non-critical — page selector won't show
      }
    }
  };

  const handleGrantAccess = async () => {
    if (!grantTarget) return;
    setIsGranting(true);
    setError(null);
    try {
      await aiAnalysisService.grantAccess(grantTarget.id);
      const res = await aiAnalysisService.getDocuments(searchQuery);
      const updatedDocs = res.data?.data || [];
      setDocuments(updatedDocs);
      const granted = updatedDocs.find(d => d.id === grantTarget.id);
      if (granted) {
        setSelectedDocument(granted);
        setAnalysisResult(null);
        setPromptHistory([]);
        // Fetch page info
        try {
          const piRes = await aiAnalysisService.getPageInfo(granted.id);
          const info = piRes.data?.data;
          setPageInfo(info);
          if (info?.pageCount) setSelectedPages(Array.from({ length: info.pageCount }, (_, i) => i + 1));
        } catch {}
      }
      setShowGrantModal(false);
      setGrantTarget(null);
      toast.success("AI access granted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to grant AI access");
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokeAccess = async (docId) => {
    setIsRevoking(true);
    try {
      await aiAnalysisService.revokeAccess(docId);
      await fetchDocuments();
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
        setAnalysisResult(null);
        setPageInfo(null);
        setSelectedPages([]);
      }
      toast.success("AI access revoked");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke AI access");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedDocument || !prompt.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setProcessingStep(1);
    setPromptHistory(prev => [...prev, { content: prompt, timestamp: new Date() }]);

    try {
      // Simulate step progression (actual processing is server-side)
      const stepTimer = setInterval(() => {
        setProcessingStep(prev => prev < 5 ? prev + 1 : prev);
      }, 2000);

      const pageRange = selectedPages.length > 0 && pageInfo?.pageCount && selectedPages.length < pageInfo.pageCount
        ? selectedPages
        : null;

      const res = await aiAnalysisService.analyzeDocument(selectedDocument.id, prompt, pageRange);
      clearInterval(stepTimer);
      setProcessingStep(0);
      setAnalysisResult(res.data?.data);
      setPrompt("");
      // Refresh quota
      aiAnalysisService.getQuota().then(r => setQuotaInfo(r.data?.data || null)).catch(() => {});
      if (res.data?.data?.fromCache) toast.info("Result loaded from cache");
    } catch (err) {
      const msg = err.response?.data?.message || "Analysis failed";
      if (msg.includes("quota")) toast.error(msg);
      else toast.error(msg);
    } finally {
      setIsAnalyzing(false);
      setProcessingStep(0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleClear = () => {
    setAnalysisResult(null);
    setPromptHistory([]);
  };

  // Dynamic chart renderer
  const { theme } = useTheme();
  const DynamicChart = ({ chart }) => {
    const isDark = theme === "dark";
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor, font: { size: 11 } } },
        tooltip: { backgroundColor: isDark ? "#1e293b" : "#fff", titleColor: isDark ? "#f1f5f9" : "#1e293b", bodyColor: isDark ? "#cbd5e1" : "#475569", borderColor: isDark ? "#334155" : "#e2e8f0", borderWidth: 1 },
      },
      scales: ["bar", "line", "area", "horizontalBar"].includes(chart.type)
        ? {
            x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
          }
        : undefined,
    };

    const horizontalOptions = {
      ...commonOptions,
      indexAxis: "y",
    };

    const chartData = {
      labels: chart.data?.labels || [],
      datasets: (chart.data?.datasets || []).map((ds) => ({
        ...ds,
        borderWidth: ds.borderWidth || (["pie", "doughnut"].includes(chart.type) ? 2 : 2),
        tension: ds.tension || 0.3,
      })),
    };

    const chartMap = {
      bar: <Bar data={chartData} options={commonOptions} />,
      horizontalBar: <Bar data={chartData} options={horizontalOptions} />,
      line: <Line data={chartData} options={commonOptions} />,
      area: <Line data={chartData} options={{ ...commonOptions, elements: { line: { fill: true } } }} />,
      pie: <Pie data={chartData} options={commonOptions} />,
      doughnut: <Doughnut data={chartData} options={commonOptions} />,
      radar: <Radar data={chartData} options={commonOptions} />,
    };

    return chartMap[chart.type] || chartMap.bar;
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-1"
          >
            AI Document Analysis
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Grant AI access to documents for intelligent analysis powered by Qdrant + OpenAI
          </p>
        </div>

        {/* Quota Widget */}
        {quotaInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex flex-wrap gap-3">
            {[
              { label: "Analyses", used: quotaInfo.analysisUsed, limit: quotaInfo.analysisLimit },
              { label: "Pages", used: quotaInfo.pagesUsed, limit: quotaInfo.pagesLimit },
            ].map((q) => {
              const pct = q.limit > 0 ? (q.used / q.limit) * 100 : 0;
              const color = pct < 70 ? "bg-emerald-500" : pct < 90 ? "bg-amber-500" : "bg-red-500";
              return (
                <div key={q.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{q.label}:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{q.used}/{q.limit}</span>
                  <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
            {quotaInfo.periodEnd && (
              <span className="text-[10px] text-slate-400 self-center">Resets {new Date(quotaInfo.periodEnd).toLocaleDateString()}</span>
            )}
          </motion.div>
        )}

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center justify-between"
            >
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Left Panel - Document List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-72 flex-shrink-0"
          >
            <Card className="h-full flex flex-col max-h-[280px] lg:max-h-full">
              <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Select Document</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Grant AI access to analyze
                </p>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No documents found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Upload documents first</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {documents.map((doc) => {
                      const fileType = getFileType(doc.mimeType);
                      return (
                        <button
                          key={doc.id}
                          onClick={() => handleSelectDocument(doc)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                            selectedDocument?.id === doc.id
                              ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center relative ${getFileColor(fileType)}`}>
                            {getFileIcon(fileType)}
                            {/* AI Access Badge */}
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                              doc.aiAccessGranted
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-400 text-white"
                            }`}>
                              {doc.aiAccessGranted ? (
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              selectedDocument?.id === doc.id
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-slate-900 dark:text-white"
                            }`}>
                              {doc.originalFilename}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatFileSize(doc.fileSize)} {doc.aiAccessGranted ? (
                                <span className="text-emerald-500">AI Enabled</span>
                              ) : (
                                <span className="text-slate-400">Blocked</span>
                              )}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Center Panel - Analysis Result & Prompt */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 flex flex-col min-w-0"
          >
            {/* Analysis Result Area */}
            <Card className="flex-1 flex flex-col mb-4 min-h-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">Analysis Result</h2>
                  {selectedDocument && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedDocument.originalFilename}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedDocument?.aiAccessGranted && (
                    <button
                      onClick={() => handleRevokeAccess(selectedDocument.id)}
                      disabled={isRevoking}
                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {isRevoking ? "Revoking..." : "Revoke Access"}
                    </button>
                  )}
                  {analysisResult && (
                    <button
                      onClick={handleClear}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Result Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {!selectedDocument ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No Document Selected</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                      Select a document and grant AI access to begin analysis
                    </p>
                  </div>
                ) : isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-full max-w-sm space-y-3">
                      {[
                        { step: 1, label: "Checking cache..." },
                        { step: 2, label: "Verifying quota..." },
                        { step: 3, label: "Detecting content type..." },
                        { step: 4, label: pageInfo?.contentType === 'image-only' || pageInfo?.contentType === 'mixed' ? "Running OCR on image pages..." : "Extracting text..." },
                        { step: 5, label: "Analyzing with AI..." },
                      ].map(({ step, label }) => (
                        <div key={step} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            processingStep > step ? "bg-emerald-500 text-white" :
                            processingStep === step ? "bg-indigo-500 text-white animate-pulse" :
                            "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          }`}>
                            {processingStep > step ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : processingStep === step ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="text-[10px] font-bold">{step}</span>
                            )}
                          </div>
                          <span className={`text-sm ${
                            processingStep >= step ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"
                          }`}>{label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">This may take a moment for large or scanned documents</p>
                  </div>
                ) : !analysisResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Ready to Analyze</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 max-w-sm">
                      Enter a prompt below to analyze <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedDocument.originalFilename}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* OCR Badge + Export Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* OCR Badge */}
                        {analysisResult.ocrPages?.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-xs text-purple-700 dark:text-purple-300">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            OCR: page{analysisResult.ocrPages.length > 1 ? 's' : ''} {analysisResult.ocrPages.join(', ')}
                            {analysisResult.avgOCRConfidence != null && (
                              <span className="text-[10px] opacity-75">({Math.round(analysisResult.avgOCRConfidence)}% conf)</span>
                            )}
                          </span>
                        )}
                        {/* Page info badge */}
                        {analysisResult.analyzedPages && analysisResult.totalPages && (
                          <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {analysisResult.analyzedPages}/{analysisResult.totalPages} pages analyzed
                          </span>
                        )}
                        {analysisResult.fromCache && (
                          <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Cached
                          </span>
                        )}
                      </div>
                      {/* Export Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(analysisResult, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `analysis-${selectedDocument?.originalFilename || 'result'}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast.success('JSON exported');
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export JSON
                        </button>
                        <button
                          onClick={() => {
                            const text = analysisResult.summary || JSON.stringify(analysisResult, null, 2);
                            navigator.clipboard.writeText(text).then(() => toast.success('Summary copied to clipboard'));
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy Summary
                        </button>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-100 dark:border-indigo-500/20">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Summary
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{analysisResult.summary}</p>
                    </div>

                    {/* Key Metrics */}
                    {analysisResult.keyMetrics && (
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Key Metrics</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          {analysisResult.keyMetrics.map((metric, idx) => (
                            <div key={idx} className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                              <span className="text-xl sm:text-2xl mb-1 block">{metric.icon}</span>
                              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
                              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sentiment & Readability */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {analysisResult.sentimentData && (
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Sentiment Analysis</h3>
                          <div className="space-y-2">
                            {[
                              { label: "Positive", value: analysisResult.sentimentData.positive, color: "bg-emerald-500" },
                              { label: "Neutral", value: analysisResult.sentimentData.neutral, color: "bg-slate-400" },
                              { label: "Negative", value: analysisResult.sentimentData.negative, color: "bg-red-500" },
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 w-16">{item.label}</span>
                                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }}></div>
                                </div>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-10">{item.value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisResult.readabilityScore !== undefined && (
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Readability Score</h3>
                          <div className="flex items-center justify-center">
                            <div className="relative w-24 h-24">
                              <svg className="w-24 h-24 transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100 dark:text-slate-700" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-indigo-600" strokeDasharray={`${analysisResult.readabilityScore * 2.51} 251`} strokeLinecap="round" />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{analysisResult.readabilityScore}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-center text-xs text-slate-500 mt-2">
                            {analysisResult.readabilityScore >= 70 ? "Good readability" : "Moderate readability"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Charts */}
                    {analysisResult.charts?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Generated Charts
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {analysisResult.charts.map((chart, idx) => (
                            <motion.div
                              key={chart.id || idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            >
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{chart.title}</h4>
                              {chart.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{chart.description}</p>
                              )}
                              <div className="h-52">
                                <DynamicChart chart={chart} />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Topics */}
                    {analysisResult.keyTopics && (
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Key Topics</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.keyTopics.map((topic, idx) => (
                            <span key={idx} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Word Frequency */}
                    {analysisResult.wordFrequency && (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Word Frequency</h3>
                        <div className="space-y-2">
                          {analysisResult.wordFrequency.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-sm text-slate-700 dark:text-slate-300 w-24">{item.word}</span>
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(item.count / analysisResult.wordFrequency[0].count) * 100}%` }}
                                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-500 w-8">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Insights */}
                    {analysisResult.insights && (
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Insights</h3>
                        <div className="space-y-2">
                          {analysisResult.insights.map((insight, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl flex items-start gap-3 ${
                                insight.type === "success"
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30"
                                  : insight.type === "warning"
                                  ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30"
                                  : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <span className="text-lg">
                                {insight.type === "success" ? "\u2713" : insight.type === "warning" ? "\u26A0" : "\u2139"}
                              </span>
                              <p className={`text-sm ${
                                insight.type === "success"
                                  ? "text-emerald-700 dark:text-emerald-300"
                                  : insight.type === "warning"
                                  ? "text-amber-700 dark:text-amber-300"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}>
                                {insight.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance Status */}
                    {analysisResult.complianceStatus && (
                      <div className={`p-4 rounded-xl flex items-center justify-between ${
                        analysisResult.complianceStatus === "Verified"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30"
                          : analysisResult.complianceStatus === "Needs Review"
                          ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30"
                          : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30"
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            analysisResult.complianceStatus === "Verified" ? "bg-emerald-500" :
                            analysisResult.complianceStatus === "Needs Review" ? "bg-amber-500" : "bg-red-500"
                          }`}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {analysisResult.complianceStatus === "Verified" ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              )}
                            </svg>
                          </div>
                          <div>
                            <p className={`font-semibold ${
                              analysisResult.complianceStatus === "Verified" ? "text-emerald-700 dark:text-emerald-300" :
                              analysisResult.complianceStatus === "Needs Review" ? "text-amber-700 dark:text-amber-300" :
                              "text-red-700 dark:text-red-300"
                            }`}>Compliance Status</p>
                            <p className={`text-sm ${
                              analysisResult.complianceStatus === "Verified" ? "text-emerald-600 dark:text-emerald-400" :
                              analysisResult.complianceStatus === "Needs Review" ? "text-amber-600 dark:text-amber-400" :
                              "text-red-600 dark:text-red-400"
                            }`}>{analysisResult.complianceStatus}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                          analysisResult.complianceStatus === "Verified" ? "bg-emerald-500" :
                          analysisResult.complianceStatus === "Needs Review" ? "bg-amber-500" : "bg-red-500"
                        }`}>
                          {analysisResult.complianceStatus === "Verified" ? "Passed" : analysisResult.complianceStatus}
                        </span>
                      </div>
                    )}

                    {/* Similar Documents */}
                    {analysisResult.similarDocuments?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Similar Documents (Qdrant)</h3>
                        <div className="space-y-2">
                          {analysisResult.similarDocuments.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{doc.filename}</span>
                              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 ml-2 shrink-0">
                                {Math.round(doc.score * 100)}% match
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Page Selector Panel */}
            {selectedDocument?.aiAccessGranted && pageInfo?.pageCount > 0 && !isAnalyzing && (
              <Card className="p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {pageInfo.pageCount} {pageInfo.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                    {pageInfo.contentType && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        pageInfo.contentType === 'full-text'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : pageInfo.contentType === 'image-only'
                          ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        {pageInfo.contentType === 'full-text' ? 'Text' : pageInfo.contentType === 'image-only' ? 'Image' : 'Mixed'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedPages(Array.from({ length: pageInfo.pageCount }, (_, i) => i + 1))}
                      className="text-[10px] px-2 py-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-medium"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedPages([])}
                      className="text-[10px] px-2 py-1 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pageInfo.pageCount <= 30 ? (
                    Array.from({ length: pageInfo.pageCount }, (_, i) => i + 1).map((page) => {
                      const isSelected = selectedPages.includes(page);
                      const detail = pageInfo.pageDetails?.find(p => p.page === page);
                      const isImage = detail?.type === 'image';
                      return (
                        <button
                          key={page}
                          onClick={() => setSelectedPages(prev =>
                            isSelected ? prev.filter(p => p !== page) : [...prev, page].sort((a, b) => a - b)
                          )}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-all relative ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title={`Page ${page}${isImage ? ' (image)' : ' (text)'}`}
                        >
                          {page}
                          {isImage && (
                            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isSelected ? 'bg-purple-300' : 'bg-purple-500'}`} />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        placeholder="e.g. 1-5, 8, 12-15"
                        onChange={(e) => {
                          const val = e.target.value;
                          const pages = [];
                          val.split(',').forEach(part => {
                            const trimmed = part.trim();
                            if (trimmed.includes('-')) {
                              const [start, end] = trimmed.split('-').map(Number);
                              if (start && end) for (let i = start; i <= Math.min(end, pageInfo.pageCount); i++) pages.push(i);
                            } else {
                              const n = Number(trimmed);
                              if (n >= 1 && n <= pageInfo.pageCount) pages.push(n);
                            }
                          });
                          setSelectedPages([...new Set(pages)].sort((a, b) => a - b));
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400">
                        {selectedPages.length}/{pageInfo.pageCount} selected
                      </span>
                    </div>
                  )}
                </div>
                {selectedPages.length > 0 && pageInfo.pageCount > 1 && (
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {selectedPages.length === pageInfo.pageCount
                      ? 'All pages selected'
                      : `${selectedPages.length} of ${pageInfo.pageCount} pages selected`}
                  </p>
                )}
              </Card>
            )}

            {/* Prompt Input Section */}
            <Card className="p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedDocument ? `Ask about ${selectedDocument.originalFilename}...` : "Select a document first..."}
                    disabled={!selectedDocument || isAnalyzing || !selectedDocument?.aiAccessGranted}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedDocument || !prompt.trim() || isAnalyzing || !selectedDocument?.aiAccessGranted}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold shadow-lg shadow-indigo-500/25 disabled:shadow-none transition-all flex items-center gap-2 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  <span>{isAnalyzing ? "Analyzing..." : "Analyze"}</span>
                </button>
              </div>

              {/* Recent Prompts / Suggestions */}
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {promptHistory.length > 0 ? (
                  <>
                    {promptHistory.slice(-5).map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(item.content)}
                        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-[180px] truncate"
                      >
                        {item.content}
                      </button>
                    ))}
                    <button
                      onClick={() => setPromptHistory([])}
                      className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                      title="Clear history"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : selectedDocument && !analysisResult ? (
                  <>
                    {["Summarize this document", "Key insights", "Check compliance", "Extract important terms"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setPrompt(suggestion)}
                        className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </>
                ) : null}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Grant Access Modal */}
      <AnimatePresence>
        {showGrantModal && grantTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !isGranting && setShowGrantModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Grant AI Access</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{grantTarget.originalFilename}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This will enable AI analysis for this document. The following will happen:
                </p>
                <div className="space-y-2">
                  {[
                    { icon: "1", text: "Document will be decrypted server-side" },
                    { icon: "2", text: "Text content will be extracted" },
                    { icon: "3", text: "Vector embedding will be generated and stored in Qdrant Cloud" },
                    { icon: "4", text: "You can then ask AI questions about this document" },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step.icon}
                      </span>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{step.text}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Security note:</strong> Only vector embeddings are stored externally. The original document content is never stored outside your encrypted storage.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowGrantModal(false); setGrantTarget(null); }}
                  disabled={isGranting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrantAccess}
                  disabled={isGranting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGranting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Grant Access"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
