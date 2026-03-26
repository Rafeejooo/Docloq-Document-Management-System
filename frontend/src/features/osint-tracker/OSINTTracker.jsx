import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import watermarkScannerService from "@/services/watermark-scanner.service";

export default function OSINTTracker() {
  const [activeTab, setActiveTab] = useState("monitor");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelectDocModal, setShowSelectDocModal] = useState(false);
  const [selectedDocToCheck, setSelectedDocToCheck] = useState(null);

  // Watermark Scanner state
  const [scanFile, setScanFile] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleScanFile = useCallback(async () => {
    if (!scanFile) return;
    setScanLoading(true);
    setScanResult(null);
    setScanHistory([]);
    try {
      const { data } = await watermarkScannerService.scanDocument(scanFile);
      const result = data?.data || data;
      setScanResult(result);
      // If a document was identified, load download history
      const docId = result?.downloadWatermark?.document?.id || result?.uploadHoneytoken?.documentId;
      if (docId) {
        try {
          const { data: histData } = await watermarkScannerService.getHistory(docId);
          setScanHistory(histData?.data || []);
        } catch { /* non-critical */ }
      }
    } catch (err) {
      setScanResult({ found: false, message: err?.response?.data?.message || 'Scan failed. Please try again.' });
    } finally {
      setScanLoading(false);
    }
  }, [scanFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) setScanFile(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const formatScanDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return dateStr; }
  };

  // Documents from user's uploads (would come from API)
  const userDocuments = [
    { id: 1, name: "Contract_2025.pdf", size: "2.4 MB", uploadedOn: "Dec 20, 2025", status: "verified" },
    { id: 2, name: "Invoice_001.pdf", size: "1.2 MB", uploadedOn: "Dec 18, 2025", status: "verified" },
    { id: 3, name: "Report_Q4.docx", size: "5.8 MB", uploadedOn: "Dec 15, 2025", status: "pending" },
    { id: 4, name: "NDA_Template.pdf", size: "890 KB", uploadedOn: "Dec 10, 2025", status: "verified" },
    { id: 5, name: "Financial_Statement.xlsx", size: "3.1 MB", uploadedOn: "Dec 5, 2025", status: "verified" },
  ];

  const trackedDocuments = [
    { id: 1, name: "Confidential_Report.pdf", status: "safe", honeytokens: 3, lastChecked: "5 minutes ago", uploadedOn: "Dec 20, 2025" },
    { id: 2, name: "Strategic_Plan_2025.docx", status: "safe", honeytokens: 3, lastChecked: "15 minutes ago", uploadedOn: "Dec 18, 2025" },
  ];

  const detectedLeaks = [
    { id: 1, document: "Internal_Memo.pdf", source: "Pastebin", detectedOn: "Dec 25, 2025", honeytoken: "ZWC-A3F8", leakedBy: "user@external.com", severity: "high" },
  ];

  const monitoredSources = [
    { name: "Pastebin", status: "active", lastScan: "2 hours ago", icon: "paste" },
    { name: "GitHub", status: "active", lastScan: "1 hour ago", icon: "github" },
    { name: "Dark Web Forums", status: "active", lastScan: "30 minutes ago", icon: "dark" },
    { name: "Cloud Storage", status: "active", lastScan: "45 minutes ago", icon: "cloud" },
  ];

  const stats = [
    { label: "Tracked Documents", value: trackedDocuments.length, icon: "document", color: "indigo" },
    { label: "Active Leaks", value: detectedLeaks.length, icon: "alert", color: "red", alert: detectedLeaks.length > 0 },
    { label: "Total Honeytokens", value: trackedDocuments.reduce((sum, doc) => sum + doc.honeytokens, 0), icon: "token", color: "amber" },
    { label: "Safe Documents", value: trackedDocuments.filter(d => d.status === "safe").length, icon: "shield", color: "emerald" },
  ];

  // Icon helper functions
  const getStatIcon = (icon) => {
    const icons = {
      document: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      alert: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      token: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
      shield: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    };
    return icons[icon] || null;
  };

  const getSourceIcon = (icon) => {
    const icons = {
      paste: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
      github: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
      dark: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
      cloud: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
    };
    return icons[icon] || null;
  };

  const getColorClasses = (color) => {
    const colors = {
      indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
      red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
      amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
      emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    };
    return colors[color] || colors.indigo;
  };

  const filteredTrackedDocs = trackedDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserDocs = userDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToTracking = (doc) => {
    setSelectedDocToCheck(doc);
    setShowSelectDocModal(false);
    // In real app, would add to tracked documents via API
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">OSINT Tracker</h1>
              <p className="text-slate-400 text-sm">Monitor document leaks with honeytoken technology</p>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-xl border ${colors.border} bg-white dark:bg-slate-900/50 backdrop-blur-sm p-4 sm:p-5 shadow-xl`}
              >
                <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${colors.bg} blur-2xl`} />
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-3 ${colors.text}`}>
                    {getStatIcon(stat.icon)}
                  </div>
                  <p className="text-xs font-medium text-slate-400 mb-1 truncate">{stat.label}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${stat.alert ? "text-red-400" : "text-white"}`}>
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1.5 bg-slate-100 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 w-fit mb-6">
          {[
            { id: "monitor", label: "Monitor", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
            { id: "leaks", label: `Leaks (${detectedLeaks.length})`, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
            { id: "check", label: "Check Document", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
            { id: "scan_watermark", label: "Scan Watermark", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Monitor Tab */}
        {activeTab === "monitor" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Tracked Documents Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tracked Documents</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:flex-none">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => setShowSelectDocModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/25"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      <span className="hidden sm:inline">Add Document</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Document</th>
                      <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Honeytokens</th>
                      <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Checked</th>
                      <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredTrackedDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.name}</p>
                              <p className="text-xs text-slate-500">Uploaded {doc.uploadedOn}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Safe
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{doc.honeytokens}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-400">{doc.lastChecked}</td>
                        <td className="px-5 py-4">
                          <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-slate-700/50">
                {filteredTrackedDocs.map((doc) => (
                  <div key={doc.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500">Uploaded {doc.uploadedOn}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Safe
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{doc.honeytokens} honeytokens • Checked {doc.lastChecked}</span>
                      <button className="text-indigo-400 hover:text-indigo-300 font-medium">Details</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monitored Sources */}
            <div>
              <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                Monitored Sources
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {monitoredSources.map((source, index) => (
                  <motion.div
                    key={source.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-4 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                        {getSourceIcon(source.icon)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs text-emerald-400 font-medium">Active</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{source.name}</p>
                    <p className="text-xs text-slate-500">Last: {source.lastScan}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaks Tab */}
        {activeTab === "leaks" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {detectedLeaks.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Leaks Detected</h3>
                <p className="text-sm text-slate-400">All your documents are secure. We continuously monitor for any potential leaks.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                {/* Alert Banner */}
                <div className="px-5 py-4 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-400">{detectedLeaks.length} Leak{detectedLeaks.length > 1 ? 's' : ''} Detected</p>
                    <p className="text-xs text-red-400/70">Immediate attention required</p>
                  </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Document</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detected</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Honeytoken</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Leaked By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Severity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {detectedLeaks.map((leak) => (
                        <tr key={leak.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              </div>
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{leak.document}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-400">{leak.source}</td>
                          <td className="px-4 py-4 text-sm text-slate-400">{leak.detectedOn}</td>
                          <td className="px-4 py-4">
                            <code className="text-xs px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">{leak.honeytoken}</code>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-400">{leak.leakedBy}</td>
                          <td className="px-4 py-4">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              {leak.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                              View Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-700/50">
                  {detectedLeaks.map((leak) => (
                    <div key={leak.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{leak.document}</p>
                            <p className="text-xs text-slate-500">via {leak.source}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex-shrink-0">
                          {leak.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div>
                          <p className="text-slate-500 mb-0.5">Detected</p>
                          <p className="text-slate-300">{leak.detectedOn}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-0.5">Leaked By</p>
                          <p className="text-slate-300 truncate">{leak.leakedBy}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <code className="text-xs px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">{leak.honeytoken}</code>
                        <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                          View Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Check Document Tab */}
        {activeTab === "check" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Check Document for Leaks</h2>
                  <p className="text-sm text-slate-400">Verify document security status</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-400 mb-5">
                Select a document from your uploads to check if it has been leaked or add it to tracking.
              </p>

              {selectedDocToCheck ? (
                <div className="border border-indigo-500/30 bg-indigo-500/5 rounded-xl p-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedDocToCheck.name}</p>
                        <p className="text-xs text-slate-500">{selectedDocToCheck.size}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedDocToCheck(null)}
                      className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSelectDocModal(true)}
                  className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 rounded-xl p-8 text-center mb-5 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 flex items-center justify-center mx-auto mb-3 transition-colors">
                    <svg className="w-7 h-7 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Select a document</p>
                  <p className="text-xs text-slate-500">Choose from your uploaded documents</p>
                </button>
              )}

              <div className="flex gap-3">
                <button 
                  disabled={!selectedDocToCheck}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-white hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Check for Leaks
                </button>
                <button 
                  disabled={!selectedDocToCheck}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-colors"
                >
                  Add to Tracking
                </button>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">How it works</p>
                </div>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-medium">1</span>
                    Select a document from your uploads
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-medium">2</span>
                    We'll check if it contains any honeytokens
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-medium">3</span>
                    If found, we identify the original uploader and leaker
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-medium">4</span>
                    A detailed report is generated with evidence
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Scan Watermark Tab */}
        {activeTab === "scan_watermark" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Upload Zone */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Scan for Invisible Watermarks</h2>
                  <p className="text-sm text-slate-400">Upload a suspected leaked document to identify the source</p>
                </div>
              </div>

              {/* Drag-and-drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? "border-indigo-500 bg-indigo-500/10"
                    : scanFile
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-slate-200 dark:border-slate-700 hover:border-indigo-500/50"
                }`}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.docx,.doc,.txt,.xlsx,.xls,.pptx,.png,.jpg,.jpeg';
                  input.onchange = (e) => {
                    const file = e.target.files?.[0];
                    if (file) setScanFile(file);
                  };
                  input.click();
                }}
              >
                {scanFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{scanFile.name}</p>
                      <p className="text-xs text-slate-500">{(scanFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setScanFile(null); setScanResult(null); setScanHistory([]); }}
                      className="ml-4 w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Drop a suspected leaked document here</p>
                    <p className="text-xs text-slate-500">PDF, DOCX, TXT, XLSX, PNG, JPG supported</p>
                  </>
                )}
              </div>

              {/* Scan button */}
              <button
                onClick={handleScanFile}
                disabled={!scanFile || scanLoading}
                className="mt-4 w-full px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                {scanLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Scanning document...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Scan for Watermarks
                  </>
                )}
              </button>
            </div>

            {/* Scan Results */}
            {scanResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Download Watermark Found */}
                {scanResult.downloadWatermark && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-emerald-400">Leak Source Identified</h3>
                        <p className="text-xs text-emerald-400/70">Per-download watermark detected</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">Downloader</p>
                        <p className="text-sm font-medium text-white">{scanResult.downloadWatermark.downloader?.name || 'Unknown'}</p>
                        {scanResult.downloadWatermark.downloader?.email && (
                          <p className="text-xs text-slate-400">{scanResult.downloadWatermark.downloader.email}</p>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">Downloaded On</p>
                        <p className="text-sm font-medium text-white">{formatScanDate(scanResult.downloadWatermark.downloadedAt)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">Document</p>
                        <p className="text-sm font-medium text-white">{scanResult.downloadWatermark.document?.name || 'Unknown'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">Confidence</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-700">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.round((scanResult.downloadWatermark.confidence || 0) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-emerald-400">{Math.round((scanResult.downloadWatermark.confidence || 0) * 100)}%</span>
                        </div>
                      </div>
                      {scanResult.downloadWatermark.ipAddress && (
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                          <p className="text-xs text-slate-500 mb-1">IP Address</p>
                          <p className="text-sm font-medium text-white font-mono">{scanResult.downloadWatermark.ipAddress}</p>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">Method</p>
                        <p className="text-sm font-medium text-white">Unicode Invisible Characters</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Honeytoken Found (but no download watermark) */}
                {scanResult.uploadHoneytoken && !scanResult.downloadWatermark && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-amber-400">Upload Honeytoken Detected</h3>
                        <p className="text-xs text-amber-400/70">Uploader identified, but per-download watermark not found</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">Uploader</p>
                        <p className="text-sm font-medium text-white">{scanResult.uploadHoneytoken.uploader?.name || 'Unknown'}</p>
                        {scanResult.uploadHoneytoken.uploader?.email && (
                          <p className="text-xs text-slate-400">{scanResult.uploadHoneytoken.uploader.email}</p>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="text-xs text-slate-500 mb-1">Detection Method</p>
                        <p className="text-sm font-medium text-white capitalize">{scanResult.uploadHoneytoken.method}</p>
                      </div>
                    </div>
                    <p className="text-xs text-amber-400/70 mt-3">
                      Note: Per-download watermark not found — document may pre-date the watermark system or was sanitized.
                    </p>
                  </div>
                )}

                {/* Both found — show honeytoken as supplementary info */}
                {scanResult.uploadHoneytoken && scanResult.downloadWatermark && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      <p className="text-sm font-medium text-amber-400">Upload Honeytoken Also Detected</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Original uploader: <span className="text-white">{scanResult.uploadHoneytoken.uploader?.name || 'Unknown'}</span>
                      {scanResult.uploadHoneytoken.uploader?.email && <span className="text-slate-500"> ({scanResult.uploadHoneytoken.uploader.email})</span>}
                    </p>
                  </div>
                )}

                {/* Nothing found */}
                {!scanResult.found && (
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 text-center">
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-300 mb-1">No Markers Detected</h3>
                    <p className="text-sm text-slate-500">{scanResult.message || 'Document may have been sanitized or is not from this system.'}</p>
                  </div>
                )}

                {/* Download History Table */}
                {scanHistory.length > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700/50">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        All Watermarked Downloads for This Document
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-100 dark:bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Downloaded At</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Watermark ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {scanHistory.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{record.user}</td>
                              <td className="px-4 py-3 text-sm text-slate-400">{record.email || 'N/A'}</td>
                              <td className="px-4 py-3 text-sm text-slate-400">{formatScanDate(record.downloadedAt)}</td>
                              <td className="px-4 py-3 text-sm text-slate-400 font-mono">{record.ipAddress || 'N/A'}</td>
                              <td className="px-4 py-3">
                                <code className="text-xs px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono">
                                  {record.watermarkId?.substring(0, 8)}...
                                </code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* How it works info card */}
            {!scanResult && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">How Watermark Scanning Works</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { step: 1, title: "Upload Document", desc: "Upload the suspected leaked document" },
                    { step: 2, title: "Extract Text", desc: "System extracts text content from the file" },
                    { step: 3, title: "Detect Watermarks", desc: "Scans for invisible Unicode character patterns" },
                    { step: 4, title: "Identify Leaker", desc: "Decodes watermark to identify the downloader" },
                  ].map((item) => (
                    <div key={item.step} className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-medium mb-2">{item.step}</div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white mb-0.5">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Select Document Modal */}
        <AnimatePresence>
          {showSelectDocModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select Document</h2>
                  </div>
                  <button 
                    onClick={() => setShowSelectDocModal(false)}
                    className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="relative mb-4">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredUserDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleAddToTracking(doc)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-slate-600/50 transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-700/50 border border-slate-600/50 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 flex items-center justify-center transition-colors">
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.size} • Uploaded {doc.uploadedOn}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        doc.status === "verified"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {doc.status === "verified" ? "Verified" : "Pending"}
                      </span>
                    </button>
                  ))}
                  {filteredUserDocs.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <p className="text-sm text-slate-400">No documents found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
