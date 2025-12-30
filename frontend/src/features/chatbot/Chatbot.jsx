import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function Chatbot() {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  const documents = [
    { id: 1, name: "Contract_2025.pdf", type: "PDF", size: "2.4 MB", status: "verified", date: "Dec 20, 2025" },
    { id: 2, name: "Invoice_001.pdf", type: "PDF", size: "1.2 MB", status: "verified", date: "Dec 19, 2025" },
    { id: 3, name: "Report_Q4.docx", type: "DOCX", size: "5.8 MB", status: "pending", date: "Dec 18, 2025" },
    { id: 4, name: "NDA_Template.pdf", type: "PDF", size: "890 KB", status: "verified", date: "Dec 15, 2025" },
    { id: 5, name: "Financial_Summary.xlsx", type: "XLSX", size: "3.2 MB", status: "verified", date: "Dec 14, 2025" },
    { id: 6, name: "Meeting_Notes.docx", type: "DOCX", size: "456 KB", status: "verified", date: "Dec 12, 2025" },
  ];

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectDocument = (doc) => {
    setSelectedDocument(doc);
    setAnalysisResult(null);
    setMessages([
      {
        id: 1,
        type: "bot",
        content: `${doc.name} selected. You can now ask me questions about this document or click "Analyze" to get a summary.`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleAnalyze = () => {
    if (!selectedDocument) return;
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setAnalysisResult({
        summary: `This ${selectedDocument.type} document contains important information related to ${selectedDocument.name.includes("Contract") ? "legal agreements and terms" : selectedDocument.name.includes("Invoice") ? "financial transactions and billing" : selectedDocument.name.includes("Report") ? "quarterly business analytics" : "organizational documentation"}.`,
        keyPoints: [
          "Document hash verified on blockchain",
          "No modifications detected since upload",
          "Last accessed by authorized personnel",
          "Compliant with data retention policies",
        ],
        entities: ["John Doe", "ABC Corporation", "2025 Terms"],
        sentiment: "Neutral",
        language: "English",
        wordCount: 2847,
        pages: 12,
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedDocument) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        content: `Based on my analysis of ${selectedDocument.name}, I found the following relevant information:\n\n${input.toLowerCase().includes("summary") ? "The document provides a comprehensive overview of the subject matter with detailed sections covering key aspects." : input.toLowerCase().includes("date") ? "The document mentions several important dates including deadlines and milestones." : "I've analyzed the relevant sections and found pertinent information matching your query."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold text-slate-900 dark:text-white mb-1"
          >
            AI Document Analyzer
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Select a document to analyze and ask questions
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Left Panel - Document List */}
          <div className="col-span-3 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Documents</h2>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredDocuments.map((doc, index) => (
                  <motion.button
                    key={doc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectDocument(doc)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      selectedDocument?.id === doc.id
                        ? "bg-slate-900 dark:bg-white"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
                        selectedDocument?.id === doc.id
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          : "bg-slate-100 dark:bg-slate-800"
                      }`}>
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate text-sm ${
                          selectedDocument?.id === doc.id
                            ? "text-white dark:text-slate-900"
                            : "text-slate-900 dark:text-white"
                        }`}>
                          {doc.name}
                        </p>
                        <p className={`text-xs ${
                          selectedDocument?.id === doc.id
                            ? "text-slate-300 dark:text-slate-600"
                            : "text-slate-500 dark:text-slate-400"
                        }`}>{doc.size} • {doc.date}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
                {filteredDocuments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No documents found</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Center Panel - Analysis & Chat */}
          <div className="col-span-9 flex flex-col min-h-0 gap-4">
            {/* Analysis Result */}
            <Card className="flex-1 flex flex-col overflow-hidden min-h-[200px]">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium text-slate-900 dark:text-white">Document Analysis</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedDocument ? selectedDocument.name : "Select a document to analyze"}
                  </p>
                </div>
                {selectedDocument && (
                  <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? "Analyzing..." : "Analyze"}
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!selectedDocument ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-xl">📄</div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Select a document from the left panel</p>
                    </div>
                  </div>
                ) : isAnalyzing ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <svg className="w-6 h-6 text-white dark:text-slate-900 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">Analyzing document...</p>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Summary</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{analysisResult.summary}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                        <p className="text-xl font-semibold text-slate-900 dark:text-white">{analysisResult.pages}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pages</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                        <p className="text-xl font-semibold text-slate-900 dark:text-white">{analysisResult.wordCount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Words</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{analysisResult.language}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Language</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{analysisResult.sentiment}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tone</p>
                      </div>
                    </div>

                    {/* Key Points */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Key Points</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {analysisResult.keyPoints.map((point, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <span className="text-emerald-500 text-xs">✓</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-xl">🔍</div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Click "Analyze" to get insights</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Chat */}
            <Card className="h-[280px] flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-medium text-slate-900 dark:text-white">Ask AI Assistant</h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && selectedDocument && (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ask me anything about {selectedDocument.name}</p>
                  </div>
                )}
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        message.type === "user"
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      } rounded-2xl px-4 py-2 text-sm`}
                    >
                      {message.type === "bot" && (
                        <div className="flex items-center gap-1 mb-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>AI</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={selectedDocument ? `Ask about ${selectedDocument.name}...` : "Select a document first..."}
                    disabled={!selectedDocument}
                    className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <Button type="submit" disabled={!selectedDocument || !input.trim()}>
                    Send
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
