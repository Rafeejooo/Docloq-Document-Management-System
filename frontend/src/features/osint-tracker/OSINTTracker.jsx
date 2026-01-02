import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function OSINTTracker() {
  const [activeTab, setActiveTab] = useState("monitor");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSelectDocModal, setShowSelectDocModal] = useState(false);
  const [selectedDocToCheck, setSelectedDocToCheck] = useState(null);
  const adContainerRef = useRef(null);

  // Load Adsterra script when component mounts
  useEffect(() => {
    if (activeTab === "monitor") {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://pl28384019.effectivegatecpm.com/c3/ed/77/c3ed7700ba74c1a03b27dbefee2499e3.js"]');
      
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://pl28384019.effectivegatecpm.com/c3/ed/77/c3ed7700ba74c1a03b27dbefee2499e3.js";
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        
        // Try appending to both head and container
        document.head.appendChild(script);
        
        // Also create invoke script if needed
        const invokeScript = document.createElement("script");
        invokeScript.type = "text/javascript";
        invokeScript.innerHTML = `
          atOptions = {
            'key' : 'c3ed7700ba74c1a03b27dbefee2499e3',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        `;
        
        if (adContainerRef.current) {
          adContainerRef.current.appendChild(invokeScript);
        }
      }
    }
  }, [activeTab]);

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
    { name: "Pastebin", status: "active", lastScan: "2 hours ago" },
    { name: "GitHub", status: "active", lastScan: "1 hour ago" },
    { name: "Dark Web Forums", status: "active", lastScan: "30 minutes ago" },
    { name: "Cloud Storage", status: "active", lastScan: "45 minutes ago" },
  ];

  const stats = [
    { label: "Tracked Documents", value: trackedDocuments.length },
    { label: "Active Leaks", value: detectedLeaks.length, alert: detectedLeaks.length > 0 },
    { label: "Total Honeytokens", value: trackedDocuments.reduce((sum, doc) => sum + doc.honeytokens, 0) },
    { label: "Safe Documents", value: trackedDocuments.filter(d => d.status === "safe").length },
  ];

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
      {/* Header */}
      <div className="mb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-1"
        >
          OSINT Tracker
        </motion.h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Monitor document leaks with honeytoken technology</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-3 sm:p-4" hover>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 truncate">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-semibold ${stat.alert ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                {stat.value}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit mb-6">
        {[
          { id: "monitor", label: "Monitor" },
          { id: "leaks", label: `Leaks (${detectedLeaks.length})` },
          { id: "check", label: "Check Document" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
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
          {/* Tracked Documents */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-sm font-medium text-slate-900 dark:text-white">Tracked Documents</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white w-48"
                    />
                  </div>
                  <Button size="sm" onClick={() => setShowSelectDocModal(true)}>+ Add Document</Button>
                </div>
              </div>
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Honeytokens</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Last Checked</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTrackedDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">📄</div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded {doc.uploadedOn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Safe
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{doc.honeytokens}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{doc.lastChecked}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm">Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTrackedDocs.map((doc) => (
                <div key={doc.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded {doc.uploadedOn}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Safe
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{doc.honeytokens} honeytokens • Checked {doc.lastChecked}</span>
                    <Button variant="ghost" size="sm">Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Monitored Sources */}
          <div>
            <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Monitored Sources</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {monitoredSources.map((source, index) => (
                <motion.div
                  key={source.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">🌐</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{source.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Last: {source.lastScan}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* ==================== AD SECTION - EASY TO REMOVE ==================== */}
            <div className="mt-6">
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sponsored</span>
                    <div className="h-3 w-px bg-slate-300 dark:bg-slate-600"></div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Advertisement</span>
                  </div>
                </div>
                <div 
                  ref={adContainerRef}
                  className="p-6 bg-white dark:bg-slate-900 flex items-center justify-center min-h-[120px]"
                >
                  {/* Adsterra script will be loaded here dynamically */}
                </div>
              </Card>
            </div>
            {/* ==================== END AD SECTION ==================== */}
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
            <Card className="p-12 text-center">
              <div className="text-4xl mb-3">✓</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No Leaks Detected</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">All your documents are secure</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-red-50 dark:bg-red-900/20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Detected</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Honeytoken</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Leaked By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detectedLeaks.map((leak) => (
                    <tr key={leak.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{leak.document}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{leak.source}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{leak.detectedOn}</td>
                      <td className="px-4 py-3">
                        <code className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">{leak.honeytoken}</code>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{leak.leakedBy}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          {leak.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="danger" size="sm">View Report</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
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
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Check Document for Leaks</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Select a document from your uploads to check if it has been leaked or add it to tracking.
            </p>

            {selectedDocToCheck ? (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">📄</div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedDocToCheck.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedDocToCheck.size}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDocToCheck(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSelectDocModal(true)}
                className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center mb-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Select a document</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Choose from your uploaded documents</p>
              </button>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" disabled={!selectedDocToCheck}>
                Check for Leaks
              </Button>
              <Button className="flex-1" disabled={!selectedDocToCheck}>
                Add to Tracking
              </Button>
            </div>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">How it works</p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <li>• Select a document from your uploads</li>
                <li>• We'll check if it contains any honeytokens</li>
                <li>• If found, we identify the original uploader and leaker</li>
                <li>• A detailed report is generated with evidence</li>
              </ul>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Select Document Modal */}
      <AnimatePresence>
        {showSelectDocModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Select Document</h2>
                <button 
                  onClick={() => setShowSelectDocModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredUserDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleAddToTracking(doc)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{doc.size} • Uploaded {doc.uploadedOn}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      doc.status === "verified"
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    }`}>
                      {doc.status === "verified" ? "Verified" : "Pending"}
                    </span>
                  </button>
                ))}
                {filteredUserDocs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No documents found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
