import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";

export default function AIDocumentAnalysis() {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [promptHistory, setPromptHistory] = useState([]);

  // Mock documents
  const documents = [
    { id: 1, name: "Contract_Agreement_2025.pdf", type: "PDF", size: "2.4 MB", date: "Dec 15, 2025" },
    { id: 2, name: "Financial_Report_Q4.xlsx", type: "Excel", size: "1.8 MB", date: "Dec 20, 2025" },
    { id: 3, name: "Employee_Handbook.docx", type: "Word", size: "856 KB", date: "Dec 10, 2025" },
    { id: 4, name: "Project_Proposal.pdf", type: "PDF", size: "3.2 MB", date: "Dec 22, 2025" },
    { id: 5, name: "Meeting_Notes_Dec.docx", type: "Word", size: "124 KB", date: "Dec 28, 2025" },
    { id: 6, name: "Budget_2026.xlsx", type: "Excel", size: "2.1 MB", date: "Dec 30, 2025" },
    { id: 7, name: "Legal_Terms.pdf", type: "PDF", size: "1.5 MB", date: "Dec 18, 2025" },
    { id: 8, name: "Marketing_Strategy.pptx", type: "PowerPoint", size: "5.4 MB", date: "Dec 25, 2025" },
  ];

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
    };
    return colors[type] || colors.PDF;
  };

  const handleAnalyze = () => {
    if (!selectedDocument || !prompt.trim()) return;

    setIsAnalyzing(true);
    
    // Add to prompt history
    setPromptHistory(prev => [...prev, { content: prompt, timestamp: new Date() }]);

    // Simulate AI analysis with rich content
    setTimeout(() => {
      const mockResults = [
        {
          summary: "This contract document outlines a formal agreement between two parties with clearly defined terms and conditions.",
          keyMetrics: [
            { label: "Total Pages", value: "12", icon: "📄" },
            { label: "Clauses", value: "24", icon: "📋" },
            { label: "Signatures", value: "3", icon: "✍️" },
            { label: "Attachments", value: "2", icon: "📎" },
          ],
          sentimentData: { positive: 45, neutral: 50, negative: 5 },
          keyTopics: ["Contract Terms", "Payment Schedule", "Liability", "Termination", "Confidentiality"],
          insights: [
            { type: "info", text: "Document follows standard legal formatting guidelines" },
            { type: "success", text: "All required signatures are present and verified" },
            { type: "warning", text: "Section 4.2 contains ambiguous language that may need clarification" },
          ],
          wordFrequency: [
            { word: "Agreement", count: 47 },
            { word: "Party", count: 38 },
            { word: "Payment", count: 29 },
            { word: "Terms", count: 24 },
            { word: "Confidential", count: 18 },
          ],
          readabilityScore: 72,
          complianceStatus: "Verified",
        },
        {
          summary: "Financial report containing quarterly performance data with detailed breakdowns by department and category.",
          keyMetrics: [
            { label: "Data Points", value: "1,247", icon: "📊" },
            { label: "Charts", value: "8", icon: "📈" },
            { label: "Tables", value: "15", icon: "🗃️" },
            { label: "Period", value: "Q4 2025", icon: "📅" },
          ],
          sentimentData: { positive: 65, neutral: 30, negative: 5 },
          keyTopics: ["Revenue", "Expenses", "Growth", "Projections", "KPIs"],
          insights: [
            { type: "success", text: "Revenue increased by 23% compared to Q3" },
            { type: "info", text: "Operating costs remain within budget constraints" },
            { type: "warning", text: "Marketing expenses exceeded projections by 12%" },
          ],
          wordFrequency: [
            { word: "Revenue", count: 89 },
            { word: "Quarter", count: 56 },
            { word: "Growth", count: 43 },
            { word: "Budget", count: 37 },
            { word: "Target", count: 29 },
          ],
          readabilityScore: 68,
          complianceStatus: "Verified",
        },
      ];

      setAnalysisResult(mockResults[Math.floor(Math.random() * mockResults.length)]);
      setIsAnalyzing(false);
      setPrompt("");
    }, 2500);
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
            Select a document and ask AI to analyze its contents
          </p>
        </div>

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
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Choose a document to analyze</p>
              </div>
              
              {/* Search */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search documents..."
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocument(doc);
                        setAnalysisResult(null);
                        setPromptHistory([]);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        selectedDocument?.id === doc.id
                          ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileColor(doc.type)}`}>
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          selectedDocument?.id === doc.id
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-900 dark:text-white"
                        }`}>
                          {doc.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {doc.size} • {doc.date}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
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
            {/* Analysis Result Area (Top) */}
            <Card className="flex-1 flex flex-col mb-4 min-h-0 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">Analysis Result</h2>
                  {selectedDocument && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedDocument.name}
                    </p>
                  )}
                </div>
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
                      Select a document from the left panel to begin
                    </p>
                  </div>
                ) : isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-indigo-100 dark:border-indigo-500/20"></div>
                      <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Analyzing Document...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Extracting insights and generating report</p>
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
                      Enter a prompt below to analyze <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedDocument.name}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
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

                    {/* Sentiment & Readability */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Sentiment Chart */}
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Sentiment Analysis</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 w-16">Positive</span>
                            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analysisResult.sentimentData.positive}%` }}></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-10">{analysisResult.sentimentData.positive}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 w-16">Neutral</span>
                            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-400 rounded-full" style={{ width: `${analysisResult.sentimentData.neutral}%` }}></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-10">{analysisResult.sentimentData.neutral}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 w-16">Negative</span>
                            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${analysisResult.sentimentData.negative}%` }}></div>
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-10">{analysisResult.sentimentData.negative}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Readability Score */}
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
                    </div>

                    {/* Key Topics */}
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

                    {/* Word Frequency */}
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

                    {/* Insights */}
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
                              {insight.type === "success" ? "✓" : insight.type === "warning" ? "⚠" : "ℹ"}
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

                    {/* Compliance Status */}
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-700 dark:text-emerald-300">Compliance Status</p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">{analysisResult.complianceStatus}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-medium">Passed</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Prompt Input Section */}
            <Card className="p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedDocument ? `Ask about ${selectedDocument.name}...` : "Select a document first..."}
                    disabled={!selectedDocument || isAnalyzing}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedDocument || !prompt.trim() || isAnalyzing}
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
                    {["Summarize", "Key insights", "Check compliance", "Extract terms"].map((suggestion) => (
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
    </DashboardLayout>
  );
}
