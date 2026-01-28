import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { useDebounce } from "@/hooks/useDebounce";

export default function Documents() {
  const [view, setView] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingDocument, setSharingDocument] = useState(null);
  const [shareMode, setShareMode] = useState("user"); // "user" or "link"
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Upload processing states
  const [uploadStep, setUploadStep] = useState(0); // 0: select files, 1: processing, 2: complete
  const [processingSteps, setProcessingSteps] = useState([
    { id: 1, name: "Document Extraction", description: "Extracting document content and metadata", status: "pending", icon: "extract" },
    { id: 2, name: "Body Hash Generation", description: "Creating SHA-256 hash from document content", status: "pending", icon: "bodyHash" },
    { id: 3, name: "Head Hash Generation", description: "Generating header hash (ID, user, timestamp)", status: "pending", icon: "headHash" },
    { id: 4, name: "Steganography Watermark", description: "Embedding invisible watermark using LSB", status: "pending", icon: "watermark" },
    { id: 5, name: "Honey Token Injection", description: "Adding invisible tracker ID for OSINT", status: "pending", icon: "honeyToken" },
  ]);
  const [processedDocData, setProcessedDocData] = useState(null);
  const [saveToBlockchain, setSaveToBlockchain] = useState(true);
  const [blockchainSaving, setBlockchainSaving] = useState(false);
  const [blockchainSaved, setBlockchainSaved] = useState(false);

  // Owner verification states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingDocument, setVerifyingDocument] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isModalOpen = showUploadModal || showCreateFolderModal || showDocumentModal || showEditModal || showShareModal || showVerifyModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showUploadModal, showCreateFolderModal, showDocumentModal, showEditModal, showShareModal, showVerifyModal]);

  // Mock users for sharing
  const availableUsers = [
    { id: 1, name: "John Doe", email: "john@docloq.com", avatar: "JD" },
    { id: 2, name: "Jane Smith", email: "jane@docloq.com", avatar: "JS" },
    { id: 3, name: "Mike Johnson", email: "mike@docloq.com", avatar: "MJ" },
    { id: 4, name: "Sarah Wilson", email: "sarah@docloq.com", avatar: "SW" },
    { id: 5, name: "Tom Brown", email: "tom@docloq.com", avatar: "TB" },
  ];

  const folders = [
    { id: 1, name: "Contracts", count: 24, icon: "📋" },
    { id: 2, name: "Invoices", count: 156, icon: "💰" },
    { id: 3, name: "Reports", count: 48, icon: "📊" },
    { id: 4, name: "Confidential", count: 12, icon: "🔒" },
  ];

  const [documents, setDocuments] = useState([
    { 
      id: 1, 
      name: "Contract_2025.pdf", 
      type: "pdf",
      size: "2.4 MB", 
      modified: "2 hours ago", 
      status: "verified", 
      folder: "Contracts",
      hash: "a1b2c3d4e5f6789",
      uploadedBy: { name: "John Doe", avatar: "JD", date: "Dec 15, 2025" },
      history: [
        { id: 1, action: "uploaded", user: { name: "John Doe", avatar: "JD" }, date: "Dec 15, 2025", time: "10:30 AM", hash: "a1b2c3d4e5f6789" },
      ]
    },
    { 
      id: 2, 
      name: "Invoice_001.pdf", 
      type: "pdf",
      size: "1.2 MB", 
      modified: "1 day ago", 
      status: "verified", 
      folder: "Invoices",
      hash: "b2c3d4e5f6g7890",
      uploadedBy: { name: "Jane Smith", avatar: "JS", date: "Dec 20, 2025" },
      history: [
        { id: 1, action: "uploaded", user: { name: "Jane Smith", avatar: "JS" }, date: "Dec 20, 2025", time: "09:15 AM", hash: "x1y2z3a4b5c6789" },
        { id: 2, action: "edited", user: { name: "Mike Johnson", avatar: "MJ" }, date: "Dec 22, 2025", time: "02:45 PM", hash: "b2c3d4e5f6g7890", changes: "Updated payment terms" },
      ]
    },
    { 
      id: 3, 
      name: "Report_Q4.docx", 
      type: "docx",
      size: "5.8 MB", 
      modified: "3 days ago", 
      status: "pending", 
      folder: "Reports",
      hash: "c3d4e5f6g7h8901",
      uploadedBy: { name: "Sarah Wilson", avatar: "SW", date: "Dec 18, 2025" },
      history: [
        { id: 1, action: "uploaded", user: { name: "Sarah Wilson", avatar: "SW" }, date: "Dec 18, 2025", time: "11:00 AM", hash: "m1n2o3p4q5r6789" },
        { id: 2, action: "edited", user: { name: "Sarah Wilson", avatar: "SW" }, date: "Dec 20, 2025", time: "04:30 PM", hash: "s1t2u3v4w5x6789", changes: "Added Q4 financial summary" },
        { id: 3, action: "edited", user: { name: "Tom Brown", avatar: "TB" }, date: "Dec 22, 2025", time: "10:15 AM", hash: "c3d4e5f6g7h8901", changes: "Reviewed and added comments" },
      ]
    },
    { 
      id: 4, 
      name: "NDA_Template.pdf", 
      type: "pdf",
      size: "890 KB", 
      modified: "1 week ago", 
      status: "verified", 
      folder: "Confidential",
      hash: "d4e5f6g7h8i9012",
      uploadedBy: { name: "John Doe", avatar: "JD", date: "Dec 10, 2025" },
      history: [
        { id: 1, action: "uploaded", user: { name: "John Doe", avatar: "JD" }, date: "Dec 10, 2025", time: "03:00 PM", hash: "d4e5f6g7h8i9012" },
      ]
    },
    { 
      id: 5, 
      name: "Financial_Statement.xlsx", 
      type: "xlsx",
      size: "3.1 MB", 
      modified: "5 days ago", 
      status: "verified", 
      folder: "Invoices",
      hash: "e5f6g7h8i9j0123",
      uploadedBy: { name: "Jane Smith", avatar: "JS", date: "Dec 12, 2025" },
      history: [
        { id: 1, action: "uploaded", user: { name: "Jane Smith", avatar: "JS" }, date: "Dec 12, 2025", time: "09:00 AM", hash: "a1a2a3a4a5a6789" },
        { id: 2, action: "edited", user: { name: "Jane Smith", avatar: "JS" }, date: "Dec 15, 2025", time: "11:30 AM", hash: "e5f6g7h8i9j0123", changes: "Updated December figures" },
      ]
    },
    { 
      id: 6, 
      name: "Meeting_Notes.docx", 
      type: "docx",
      size: "456 KB", 
      modified: "1 hour ago", 
      status: "pending", 
      folder: "Reports",
      hash: "f6g7h8i9j0k1234",
      uploadedBy: { name: "Mike Johnson", avatar: "MJ", date: "Dec 28, 2025" },
      history: [
        { id: 1, action: "uploaded", user: { name: "Mike Johnson", avatar: "MJ" }, date: "Dec 28, 2025", time: "02:00 PM", hash: "f6g7h8i9j0k1234" },
      ]
    },
  ]);

  const fileTypes = [
    { value: "all", label: "All Types" },
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "Word" },
    { value: "xlsx", label: "Excel" },
    { value: "image", label: "Image" },
  ];

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf": return "📕";
      case "docx": return "📘";
      case "xlsx": return "📗";
      case "image": return "🖼️";
      default: return "📄";
    }
  };

  const filteredDocuments = useMemo(() => documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                          doc.folder.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || doc.folder === selectedFolder;
    const matchesType = filterType === "all" || doc.type === filterType;
    return matchesSearch && matchesFolder && matchesType;
  }), [documents, debouncedSearchQuery, selectedFolder, filterType]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const openDocument = useCallback((doc) => {
    setSelectedDocument(doc);
    setShowDocumentModal(true);
  }, []);

  // Generate a random hash for demo purposes
  const generateHash = () => {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 16; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  };

  const handleEditDocument = (doc) => {
    setEditingDocument(doc);
    setEditContent(`[Content of ${doc.name}]\n\nThis is a simulated document content.\nYou can edit this text and save to simulate OnlyOffice editing.\n\nCurrent hash: ${doc.hash}`);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingDocument) return;
    
    setIsEditing(true);
    
    // Simulate saving delay
    setTimeout(() => {
      const newHash = generateHash();
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      setDocuments(prev => prev.map(doc => {
        if (doc.id === editingDocument.id) {
          return {
            ...doc,
            hash: newHash,
            modified: 'Just now',
            history: [
              ...doc.history,
              {
                id: doc.history.length + 1,
                action: 'edited',
                user: { name: 'Current User', avatar: 'CU' },
                date: dateStr,
                time: timeStr,
                hash: newHash,
                changes: 'Document content updated'
              }
            ]
          };
        }
        return doc;
      }));
      
      setIsEditing(false);
      setShowEditModal(false);
      setEditingDocument(null);
      setEditContent('');
    }, 1500);
  };

  const handleShareDocument = (doc) => {
    setSharingDocument(doc);
    setShareMode("user");
    setSelectedUsers([]);
    setLinkCopied(false);
    setShowShareModal(true);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCopyLink = () => {
    // Simulate copying link
    const shareLink = `https://docloq.app/share/${sharingDocument?.id}/${generateHash().slice(0, 8)}`;
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.name.split('.').pop().toLowerCase(),
      status: 'ready'
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeUploadFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUploadFiles = () => {
    if (uploadedFiles.length === 0) return;
    
    // Start processing
    setUploadStep(1);
    
    // Reset processing steps
    setProcessingSteps(prev => prev.map(step => ({ ...step, status: "pending" })));
    
    // Simulate processing each step with delays
    const processSteps = async () => {
      const stepDelays = [800, 1000, 900, 1200, 1000];
      
      for (let i = 0; i < 5; i++) {
        // Set current step to processing
        setProcessingSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx === i ? "processing" : idx < i ? "completed" : "pending"
        })));
        
        await new Promise(resolve => setTimeout(resolve, stepDelays[i]));
        
        // Mark step as completed
        setProcessingSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx <= i ? "completed" : "pending"
        })));
      }
      
      // Generate fake processed data
      const bodyHash = generateHash() + generateHash();
      const headHash = generateHash();
      const honeyTokenId = `HT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      setProcessedDocData({
        files: uploadedFiles.map(f => f.name),
        bodyHash,
        headHash,
        headDetails: {
          documentId: `DOC-${Date.now().toString(36).toUpperCase()}`,
          userId: "USR-JOHNDOE-001",
          timestamp: new Date().toISOString(),
          version: "1.0"
        },
        watermarkId: `WM-${generateHash().slice(0, 12).toUpperCase()}`,
        honeyTokenId,
        osintTrackingEnabled: true,
        blockchainStatus: saveToBlockchain ? "pending" : "skipped"
      });
      
      setUploadStep(2);
    };
    
    processSteps();
  };

  const resetUploadModal = () => {
    setShowUploadModal(false);
    setUploadedFiles([]);
    setUploadStep(0);
    setProcessingSteps(prev => prev.map(step => ({ ...step, status: "pending" })));
    setProcessedDocData(null);
    setBlockchainSaving(false);
    setBlockchainSaved(false);
  };

  // Save hash to blockchain
  const handleSaveToBlockchain = async () => {
    setBlockchainSaving(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setBlockchainSaving(false);
    setBlockchainSaved(true);
    setProcessedDocData(prev => ({
      ...prev,
      blockchainStatus: "confirmed",
      blockchainTxHash: `0x${generateHash()}${generateHash()}${generateHash()}${generateHash()}`.slice(0, 66)
    }));
  };

  // Owner verification - verify document hash on blockchain
  const handleOwnerVerify = async (doc) => {
    setVerifyingDocument(doc);
    setShowVerifyModal(true);
    setIsVerifying(true);
    setVerificationResult(null);

    // Simulate blockchain verification process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock verification result - blockchain only stores hash
    const isOnBlockchain = doc.status === "verified";
    setVerificationResult({
      isAuthentic: isOnBlockchain,
      blockchainVerified: isOnBlockchain,
      storedHash: doc.hash,
      currentHash: doc.hash,
      hashMatch: true,
      lastVerified: new Date().toISOString(),
      blockchainTxHash: isOnBlockchain ? `0x${generateHash()}${generateHash()}${generateHash()}`.slice(0, 66) : null,
      blockchainNetwork: "Ethereum Sepolia",
      blockNumber: isOnBlockchain ? Math.floor(Math.random() * 1000000) + 5000000 : null
    });

    setIsVerifying(false);
  };

  // Custom Select Component
  const CustomSelect = ({ value, options, onChange, placeholder, dropdownId }) => {
    const isOpen = openDropdown === dropdownId;
    const selectedOption = options.find(o => o.value === value);

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownId)}
          className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 transition-all min-w-[140px] ${
            isOpen
              ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <span className="text-sm text-slate-700 dark:text-slate-200">
            {selectedOption?.label || placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-2 w-full min-w-[160px] py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20"
              >
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      value === option.value
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {option.label}
                    {value === option.value && (
                      <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Documents</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage, organize, and edit your files securely
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">New Folder</span>
              <span className="sm:hidden">Folder</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              />
            </div>

            <div className="flex gap-3">
              {/* Type Filter */}
              <CustomSelect
                value={filterType}
                options={fileTypes}
                onChange={setFilterType}
                placeholder="All Types"
                dropdownId="type-filter"
              />

              {/* View Toggle */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  onClick={() => setView("grid")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === "grid"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === "list"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Folders Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Folders
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {folders.map((folder, index) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setSelectedFolder(selectedFolder === folder.name ? null : folder.name)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all hover:shadow-lg group ${
                    selectedFolder === folder.name
                      ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/25"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                      selectedFolder === folder.name
                        ? "bg-white/20"
                        : "bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10"
                    }`}>
                      {folder.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        selectedFolder === folder.name
                          ? "text-white"
                          : "text-slate-900 dark:text-white"
                      }`}>{folder.name}</p>
                      <p className={`text-xs ${
                        selectedFolder === folder.name
                          ? "text-indigo-200"
                          : "text-slate-500 dark:text-slate-400"
                      }`}>{folder.count} files</p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Documents Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {selectedFolder ? `${selectedFolder}` : "All Documents"}
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                {filteredDocuments.length}
              </span>
            </h2>
            {selectedFolder && (
              <button
                onClick={() => setSelectedFolder(null)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filter
              </button>
            )}
          </div>

          {filteredDocuments.length === 0 ? (
            <Card className="p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No documents found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Try adjusting your search or filters
              </p>
            </Card>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-5 hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => openDocument(doc)}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.history.length > 1 && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {doc.history.length - 1} edit{doc.history.length > 2 ? "s" : ""}
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          doc.status === "verified"
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                          {doc.status === "verified" ? "✓ Verified" : "Pending"}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {doc.name}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.modified}</span>
                    </div>

                    {/* Uploader Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {doc.uploadedBy.avatar}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{doc.uploadedBy.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDocument(doc);
                          }}
                          className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Edit in OnlyOffice"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareDocument(doc);
                          }}
                          className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Share"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Folder</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Modified</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDocuments.map((doc) => (
                      <tr 
                        key={doc.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => openDocument(doc)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                              {getFileIcon(doc.type)}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-900 dark:text-white block">{doc.name}</span>
                              {doc.history.length > 1 && (
                                <span className="text-xs text-indigo-600 dark:text-indigo-400">{doc.history.length - 1} edit{doc.history.length > 2 ? "s" : ""}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.folder}</td>
                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.size}</td>
                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.modified}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                            doc.status === "verified"
                              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            {doc.status === "verified" ? "✓ Verified" : "Pending"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDocument(doc);
                              }}
                              className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareDocument(doc);
                              }}
                              className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title="Share"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              title="Download"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {showDocumentModal && selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50"
            onClick={() => setShowDocumentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl sm:text-3xl shrink-0">
                      {getFileIcon(selectedDocument.type)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">{selectedDocument.name}</h2>
                      <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{selectedDocument.size}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{selectedDocument.folder}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDocumentModal(false)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="px-4 sm:px-6 py-4 sm:py-5 flex-1 overflow-y-auto space-y-4 sm:space-y-6">
                {/* Document Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium ${
                      selectedDocument.status === "verified"
                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}>
                      {selectedDocument.status === "verified" ? "✓ Verified" : "⏳ Pending"}
                    </span>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Size</p>
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      {selectedDocument.size}
                    </span>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 col-span-2 sm:col-span-1">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Last Modified</p>
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      {selectedDocument.modified}
                    </span>
                  </div>
                </div>

                {/* Document History Timeline */}
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 sm:mb-4 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Document History
                  </h3>
                  
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {selectedDocument.history.map((entry, index) => (
                        <div key={entry.id} className="relative flex gap-3 sm:gap-4">
                          {/* Timeline Dot */}
                          <div className={`relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                            entry.action === "uploaded" 
                              ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}>
                            {entry.action === "uploaded" ? (
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            )}
                          </div>

                          {/* Timeline Content */}
                          <div className={`flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
                            index === 0 
                              ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20" 
                              : "bg-slate-50 dark:bg-slate-800/50"
                          }`}>
                            <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                    {entry.user.avatar}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">{entry.user.name}</span>
                                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 ml-1 sm:ml-2">
                                    {entry.action === "uploaded" ? "uploaded the document" : "edited the document"}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] sm:text-xs text-slate-400 shrink-0">{index === 0 ? "Latest" : ""}</span>
                            </div>
                            
                            {entry.changes && (
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-1.5 sm:mb-2 italic">"{entry.changes}"</p>
                            )}
                            
                            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                              <span>{entry.date} at {entry.time}</span>
                            </div>
                          </div>
                        </div>
                      )).reverse()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Fixed at bottom */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 sm:flex-row sm:gap-3 shrink-0">
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleOwnerVerify(selectedDocument);
                    setShowDocumentModal(false);
                  }}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verify This Document
                </button>
                <button
                  onClick={() => {
                    handleEditDocument(selectedDocument);
                    setShowDocumentModal(false);
                  }}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal - Document Security Processing Pipeline */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50"
            onClick={() => uploadStep === 0 && resetUploadModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed at top */}
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${
                      uploadStep === 2 ? "bg-emerald-500" : "bg-indigo-600"
                    }`}>
                      {uploadStep === 2 ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {uploadStep === 0 && "Upload Document"}
                        {uploadStep === 1 && "Processing Document"}
                        {uploadStep === 2 && "Document Secured"}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {uploadStep === 0 && "Add files to your workspace"}
                        {uploadStep === 1 && "Applying security measures..."}
                        {uploadStep === 2 && "Document ready for storage"}
                      </p>
                    </div>
                  </div>
                  {uploadStep !== 1 && (
                    <button
                      onClick={resetUploadModal}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  {[0, 1, 2].map((step) => (
                    <div key={step} className="flex-1 flex items-center gap-2">
                      <div className={`h-1 sm:h-1.5 flex-1 rounded-full transition-colors ${
                        step <= uploadStep ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                      }`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Step 0: File Selection */}
                  {uploadStep === 0 && (
                    <motion.div
                      key="select"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* Dropzone */}
                      <label className="block border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer group">
                        <input 
                          type="file" 
                          multiple 
                          className="hidden" 
                          onChange={handleFileSelect}
                          accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.gif"
                        />
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Click to select files</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">or drag & drop files here</p>
                        <p className="text-xs text-slate-400">PDF, DOCX, XLSX, Images (Max 50MB)</p>
                      </label>

                      {/* Selected Files List */}
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Selected Files ({uploadedFiles.length})
                            </p>
                            <button 
                              onClick={() => setUploadedFiles([])}
                              className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-2">
                            {uploadedFiles.map((file) => (
                              <div 
                                key={file.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg">
                                  {file.type === 'pdf' ? '📕' : file.type === 'docx' || file.type === 'doc' ? '📘' : file.type === 'xlsx' || file.type === 'xls' ? '📗' : '🖼️'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                                  <p className="text-xs text-slate-400">{file.size}</p>
                                </div>
                                <button
                                  onClick={() => removeUploadFile(file.id)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Security Process Info */}
                      <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">DocLoq Security Pipeline</p>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                              Your document will be processed through extraction, hash generation, invisible watermarking, and honey token injection for OSINT tracking.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 1: Processing Pipeline */}
                  {uploadStep === 1 && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-3"
                    >
                      {processingSteps.map((step, index) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-xl border transition-all ${
                            step.status === "completed"
                              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                              : step.status === "processing"
                              ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30"
                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Step Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              step.status === "completed"
                                ? "bg-emerald-500"
                                : step.status === "processing"
                                ? "bg-indigo-500"
                                : "bg-slate-200 dark:bg-slate-700"
                            }`}>
                              {step.status === "completed" ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : step.status === "processing" ? (
                                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 font-bold">{step.id}</span>
                              )}
                            </div>

                            {/* Step Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`font-semibold ${
                                  step.status === "completed"
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : step.status === "processing"
                                    ? "text-indigo-700 dark:text-indigo-400"
                                    : "text-slate-500 dark:text-slate-400"
                                }`}>
                                  {step.name}
                                </p>
                                {step.status === "processing" && (
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                    In Progress
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm mt-0.5 ${
                                step.status === "completed"
                                  ? "text-emerald-600 dark:text-emerald-400/70"
                                  : step.status === "processing"
                                  ? "text-indigo-600 dark:text-indigo-400/70"
                                  : "text-slate-400"
                              }`}>
                                {step.description}
                              </p>
                            </div>

                            {/* Step-specific icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              step.status !== "pending" ? "bg-white dark:bg-slate-800" : "bg-slate-100 dark:bg-slate-800"
                            }`}>
                              {step.icon === "extract" && (
                                <svg className={`w-5 h-5 ${step.status === "pending" ? "text-slate-400" : "text-indigo-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                              {step.icon === "bodyHash" && (
                                <svg className={`w-5 h-5 ${step.status === "pending" ? "text-slate-400" : "text-indigo-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                              )}
                              {step.icon === "headHash" && (
                                <svg className={`w-5 h-5 ${step.status === "pending" ? "text-slate-400" : "text-indigo-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                              )}
                              {step.icon === "watermark" && (
                                <svg className={`w-5 h-5 ${step.status === "pending" ? "text-slate-400" : "text-indigo-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                              {step.icon === "honeyToken" && (
                                <svg className={`w-5 h-5 ${step.status === "pending" ? "text-slate-400" : "text-amber-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Step 2: Completion Summary */}
                  {uploadStep === 2 && processedDocData && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      {/* Success Banner */}
                      <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-sm sm:text-base text-emerald-700 dark:text-emerald-400">Document Secured</p>
                            <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400/70">Document ready for storage</p>
                          </div>
                        </div>
                      </div>

                      {/* Files Processed */}
                      <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 sm:mb-2">Files Processed</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {processedDocData.files.map((file, idx) => (
                            <span key={idx} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white dark:bg-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 truncate max-w-[150px] sm:max-w-none">
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Hash Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                        {/* Body Hash */}
                        <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Body Hash (SHA-256)</p>
                          </div>
                          <code className="text-[10px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-slate-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded block">
                            {processedDocData.bodyHash}
                          </code>
                        </div>

                        {/* Head Hash */}
                        <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                            </svg>
                            <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Head Hash</p>
                          </div>
                          <code className="text-[10px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 break-all bg-white dark:bg-slate-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded block">
                            {processedDocData.headHash}
                          </code>
                        </div>
                      </div>

                      {/* Head Hash Details */}
                      <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 sm:mb-3">Head Hash Contents</p>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-700">
                            <span className="text-slate-500 text-[10px] sm:text-xs">Document ID</span>
                            <span className="font-mono text-[10px] sm:text-xs text-slate-900 dark:text-white truncate">{processedDocData.headDetails.documentId}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-700">
                            <span className="text-slate-500 text-[10px] sm:text-xs">User ID</span>
                            <span className="font-mono text-[10px] sm:text-xs text-slate-900 dark:text-white truncate">{processedDocData.headDetails.userId}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-700">
                            <span className="text-slate-500 text-[10px] sm:text-xs">Timestamp</span>
                            <span className="font-mono text-[10px] sm:text-xs text-slate-900 dark:text-white">{new Date(processedDocData.headDetails.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-700">
                            <span className="text-slate-500 text-[10px] sm:text-xs">Version</span>
                            <span className="font-mono text-[10px] sm:text-xs text-slate-900 dark:text-white">{processedDocData.headDetails.version}</span>
                          </div>
                        </div>
                      </div>

                      {/* Watermark & Honey Token */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {/* Steganography Watermark */}
                        <div className="p-2.5 sm:p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <p className="text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Invisible Watermark</p>
                          </div>
                          <code className="text-[9px] sm:text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-white dark:bg-indigo-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded block break-all">
                            {processedDocData.watermarkId}
                          </code>
                          <p className="text-[9px] sm:text-xs text-indigo-600 dark:text-indigo-400/70 mt-1.5 sm:mt-2">LSB Steganography Applied</p>
                        </div>

                        {/* Honey Token */}
                        <div className="p-2.5 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                            <p className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Honey Token (OSINT)</p>
                          </div>
                          <code className="text-[9px] sm:text-xs font-mono text-amber-700 dark:text-amber-300 bg-white dark:bg-amber-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded block break-all">
                            {processedDocData.honeyTokenId}
                          </code>
                          <p className="text-[9px] sm:text-xs text-amber-600 dark:text-amber-400/70 mt-1.5 sm:mt-2">Trackable via OSINT</p>
                        </div>
                      </div>

                      {/* Blockchain Save Option */}
                      <div className={`p-3 sm:p-4 rounded-xl border transition-all ${
                        blockchainSaved 
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                              blockchainSaved 
                                ? "bg-emerald-500" 
                                : blockchainSaving 
                                ? "bg-indigo-500" 
                                : "bg-slate-200 dark:bg-slate-700"
                            }`}>
                              {blockchainSaved ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : blockchainSaving ? (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className={`text-sm sm:text-base font-semibold ${
                                blockchainSaved 
                                  ? "text-emerald-700 dark:text-emerald-400" 
                                  : "text-slate-700 dark:text-slate-300"
                              }`}>
                                {blockchainSaved ? "Saved to Blockchain" : "Save to Blockchain"}
                              </p>
                              <p className={`text-xs sm:text-sm ${
                                blockchainSaved 
                                  ? "text-emerald-600 dark:text-emerald-400/70" 
                                  : "text-slate-500 dark:text-slate-400"
                              }`}>
                                {blockchainSaved 
                                  ? "Immutable verification" 
                                  : "Tamper-proof verification"}
                              </p>
                            </div>
                          </div>
                          {!blockchainSaved && (
                            <button
                              onClick={handleSaveToBlockchain}
                              disabled={blockchainSaving}
                              className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                            >
                              {blockchainSaving ? (
                                <>Saving...</>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Save Now
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        {blockchainSaved && processedDocData.blockchainTxHash && (
                          <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-emerald-200 dark:border-emerald-500/30">
                            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 mb-1">Transaction Hash</p>
                            <code className="text-[10px] sm:text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded block break-all">
                              {processedDocData.blockchainTxHash}
                            </code>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-slate-100 dark:border-slate-800 flex gap-2 sm:gap-3 shrink-0">
                {uploadStep === 0 && (
                  <>
                    <button
                      onClick={resetUploadModal}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUploadFiles}
                      disabled={uploadedFiles.length === 0}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="hidden sm:inline">Process & Upload</span>
                      <span className="sm:hidden">Upload</span>
                      {uploadedFiles.length > 0 ? ` (${uploadedFiles.length})` : ''}
                    </button>
                  </>
                )}
                {uploadStep === 1 && (
                  <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 py-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">Processing...</span>
                  </div>
                )}
                {uploadStep === 2 && (
                  <button
                    onClick={resetUploadModal}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm sm:text-base font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Done
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {showCreateFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateFolderModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Folder</h2>
                  </div>
                  <button
                    onClick={() => setShowCreateFolderModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  placeholder="Enter folder name..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                />
              </div>

              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all">
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Document Modal (OnlyOffice Simulation) */}
      <AnimatePresence>
        {showEditModal && editingDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50"
            onClick={() => !isEditing && setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Editor Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Edit Document</h2>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{editingDocument.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">OnlyOffice Connected</span>
                    </div>
                    <div className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 dark:bg-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span className="text-[10px] font-medium text-green-700 dark:text-green-400">Connected</span>
                    </div>
                    <button
                      onClick={() => !isEditing && setShowEditModal(false)}
                      disabled={isEditing}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor Toolbar - Hidden on very small screens */}
              <div className="px-3 sm:px-6 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 sm:gap-2 shrink-0 overflow-x-auto">
                <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </button>
                <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold text-sm">B</button>
                <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 italic text-sm">I</button>
                <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 underline text-sm">U</button>
                <div className="w-px h-5 sm:h-6 bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1"></div>
                <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                </button>
              </div>

              {/* Editor Content - Scrollable */}
              <div className="p-3 sm:p-6 flex-1 overflow-y-auto">
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Current Hash:</span>
                    <code className="text-[10px] sm:text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 sm:px-2 py-0.5 rounded truncate max-w-[120px] sm:max-w-none">
                      {editingDocument.hash}
                    </code>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400">Hash will change after saving</span>
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={isEditing}
                  className="w-full h-48 sm:h-64 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none disabled:opacity-50"
                  placeholder="Document content..."
                />
              </div>

              {/* Editor Footer - Fixed at bottom */}
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Saving will generate a new document hash
                    </span>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowEditModal(false)}
                      disabled={isEditing}
                      className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      disabled={isEditing}
                      className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50"
                    >
                      {isEditing ? (
                        <>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="hidden sm:inline">Save Changes</span>
                          <span className="sm:hidden">Save</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Document Modal */}
      <AnimatePresence>
        {showShareModal && sharingDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Share Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share Document</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{sharingDocument.name}</p>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Share Mode Tabs */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    onClick={() => setShareMode("user")}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      shareMode === "user"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    Share to User
                  </button>
                  <button
                    onClick={() => setShareMode("link")}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      shareMode === "link"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Copy Link
                  </button>
                </div>
              </div>

              {/* Share Content */}
              <div className="px-6 py-4 max-h-80 overflow-y-auto">
                {shareMode === "user" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Select users to share with:</p>
                    {availableUsers.map((user) => (
                      <motion.button
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          selectedUsers.includes(user.id)
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                          selectedUsers.includes(user.id)
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}>
                          {user.avatar}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          selectedUsers.includes(user.id)
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}>
                          {selectedUsers.includes(user.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Anyone with this link can view the document:</p>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-mono truncate">
                          https://docloq.com/share/{sharingDocument.id}
                        </p>
                      </div>
                      <motion.button
                        onClick={handleCopyLink}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                          linkCopied
                            ? "bg-emerald-500 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {linkCopied ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/30">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs text-amber-700 dark:text-amber-400">Link expires in 7 days for security</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Share Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                {shareMode === "user" && (
                  <button
                    onClick={() => {
                      alert(`Shared with ${selectedUsers.length} user(s)`);
                      setShowShareModal(false);
                      setSelectedUsers([]);
                    }}
                    disabled={selectedUsers.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share ({selectedUsers.length})
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Owner Verification Modal */}
      <AnimatePresence>
        {showVerifyModal && verifyingDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => !isVerifying && setShowVerifyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                      verificationResult?.isAuthentic ? "bg-emerald-500" : isVerifying ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                    }`}>
                      {isVerifying ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : verificationResult?.isAuthentic ? (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                        {isVerifying ? "Verifying..." : verificationResult?.isAuthentic ? "Document Verified" : "Owner Verification"}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{verifyingDocument.name}</p>
                    </div>
                  </div>
                  {!isVerifying && (
                    <button
                      onClick={() => setShowVerifyModal(false)}
                      className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
                {isVerifying ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="space-y-3 sm:space-y-4">
                      {["Retrieving stored hash...", "Connecting to blockchain...", "Verifying hash on chain..."].map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.6 }}
                          className="flex items-center gap-2.5 sm:gap-3 text-left p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800/50"
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-600 dark:text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : verificationResult && (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Success/Failure Banner */}
                    <div className={`p-3 sm:p-4 rounded-xl ${
                      verificationResult.isAuthentic 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30"
                        : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30"
                    }`}>
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                          verificationResult.isAuthentic ? "bg-emerald-500" : "bg-red-500"
                        }`}>
                          {verificationResult.isAuthentic ? (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm sm:text-base font-semibold ${
                            verificationResult.isAuthentic ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                          }`}>
                            {verificationResult.isAuthentic ? "Hash Verified on Blockchain" : "Not Found on Blockchain"}
                          </p>
                          <p className={`text-xs sm:text-sm ${
                            verificationResult.isAuthentic ? "text-emerald-600 dark:text-emerald-400/70" : "text-red-600 dark:text-red-400/70"
                          }`}>
                            {verificationResult.isAuthentic 
                              ? "Document hash is anchored on blockchain" 
                              : "This document hash was not saved to blockchain"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Blockchain Status */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-base sm:text-lg">⛓️</span>
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Blockchain Status</span>
                      </div>
                      <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium ${
                        verificationResult.blockchainVerified 
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                      }`}>
                        {verificationResult.blockchainVerified ? (
                          <>
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Verified
                          </>
                        ) : (
                          <>
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Not Found
                          </>
                        )}
                      </div>
                    </div>

                    {/* Hash Comparison */}
                    <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 sm:mb-3">Document Hash</p>
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Stored Hash (SHA-256)</p>
                          <code className="text-[10px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded block break-all">
                            {verificationResult.storedHash}
                          </code>
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Current Hash</p>
                          <code className="text-[10px] sm:text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded block break-all">
                            {verificationResult.currentHash}
                          </code>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
                          <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center ${
                            verificationResult.hashMatch ? "bg-emerald-500" : "bg-red-500"
                          }`}>
                            {verificationResult.hashMatch ? (
                              <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-[10px] sm:text-xs font-medium ${
                            verificationResult.hashMatch ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {verificationResult.hashMatch ? "Hashes match" : "Hash mismatch detected"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Blockchain Details */}
                    {verificationResult.blockchainVerified && (
                      <div className="p-3 sm:p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <span className="text-base sm:text-lg">⛓️</span>
                          <p className="text-[10px] sm:text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Blockchain Record</p>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-indigo-600/70 dark:text-indigo-300/70">Network</span>
                            <span className="font-medium text-indigo-700 dark:text-indigo-300">{verificationResult.blockchainNetwork}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-indigo-600/70 dark:text-indigo-300/70">Block Number</span>
                            <span className="font-mono font-medium text-indigo-700 dark:text-indigo-300">#{verificationResult.blockNumber?.toLocaleString()}</span>
                          </div>
                          <div className="pt-1.5 sm:pt-2 border-t border-indigo-200 dark:border-indigo-500/30">
                            <p className="text-[10px] sm:text-xs text-indigo-600/70 dark:text-indigo-300/70 mb-1">Transaction Hash</p>
                            <code className="text-[9px] sm:text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-white dark:bg-indigo-500/20 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded block break-all">
                              {verificationResult.blockchainTxHash}
                            </code>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Verified At */}
                    <p className="text-[10px] sm:text-xs text-center text-slate-400">
                      Verified at {new Date(verificationResult.lastVerified).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer - Fixed at bottom */}
              {!isVerifying && (
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 sm:gap-3 shrink-0">
                  <button
                    onClick={() => setShowVerifyModal(false)}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => alert("Verification report downloaded!")}
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Download Report</span>
                    <span className="sm:hidden">Download</span>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
