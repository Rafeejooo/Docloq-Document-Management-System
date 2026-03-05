import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { useDebounce } from "@/hooks/useDebounce";
import documentService from "@/services/document.service";
import folderService from "@/services/folder.service";
import OnlyOfficeEditor from "@/components/onlyoffice/OnlyOfficeEditor";

// ── Helpers ──
function getFileTypeFromMime(mimeType) {
  if (!mimeType) return "document";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "docx";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "xlsx";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "pptx";
  if (mimeType.includes("image")) return "image";
  if (mimeType.includes("text")) return "txt";
  return "document";
}

const FILE_ICONS = { pdf: "📕", docx: "📘", xlsx: "📗", pptx: "📙", image: "🖼️" };
const getFileIcon = (type) => FILE_ICONS[type] || "📄";

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatTimeAgo(dateString) {
  if (!dateString) return "Unknown";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diffMs / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(diffMs / 86400000);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const FOLDER_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16"];
const FILE_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word" },
  { value: "xlsx", label: "Excel" },
  { value: "pptx", label: "PowerPoint" },
  { value: "image", label: "Image" },
];

// ── SVG Icon Components ──
const IconDoc = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconUpload = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);
const IconFolder = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);
const IconSearch = () => (
  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconChevDown = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const IconChevRight = () => (
  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const IconX = ({ className = "w-4 h-4 text-slate-500" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconCheck = ({ className = "w-5 h-5 text-white" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const IconEye = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconDownload = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconFolderSolid = ({ color = "#6366f1" }) => (
  <svg className="w-6 h-6" style={{ color }} fill="currentColor" viewBox="0 0 24 24">
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
);
const IconHome = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
  </svg>
);
const IconGrid = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
const IconList = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconShield = () => (
  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const IconLock = () => (
  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const IconCloud = () => (
  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);
const IconFolderMove = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);
const IconFolderOutline = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ──
  const [view, setView] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterType, setFilterType] = useState("all");
  const [openDropdown, setOpenDropdown] = useState(null);

  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);

  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  const [uploadStep, setUploadStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [realFiles, setRealFiles] = useState([]);
  const [isUploadingReal, setIsUploadingReal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState([]);

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#6366f1");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [showOnlyOffice, setShowOnlyOffice] = useState(false);
  const [onlyOfficeConfig, setOnlyOfficeConfig] = useState(null);
  const [onlyOfficeDoc, setOnlyOfficeDoc] = useState(null);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingDocument, setMovingDocument] = useState(null);

  // ── Rename Folder ──
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameFolderName, setRenameFolderName] = useState("");

  // ── Data Fetching ──
  useEffect(() => { fetchFolders(); fetchDocuments(); }, []);

  // ── Handle URL query param for folder navigation ──
  useEffect(() => {
    const folderId = searchParams.get("folder");
    if (folderId && folders.length > 0) {
      navigateToFolder(folderId);
      // Clear the query param after navigating
      setSearchParams({}, { replace: true });
    }
  }, [folders, searchParams]);

  const fetchFolders = async () => {
    try {
      setIsLoadingFolders(true);
      const res = await folderService.getAllFolders();
      if (res.success) setFolders(res.data);
    } catch (err) { console.error("Failed to fetch folders:", err); }
    finally { setIsLoadingFolders(false); }
  };

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const res = await documentService.getAllDocuments();
      if (res.success && res.data) setDocuments(res.data);
    } catch (err) { console.error("Failed to fetch documents:", err); }
    finally { setIsLoadingDocs(false); }
  };

  const refreshAll = () => Promise.all([fetchFolders(), fetchDocuments()]);

  // ── Folder Tree ──
  const folderTree = useMemo(() => {
    const map = {};
    folders.forEach((f) => { map[f.id] = { ...f, children: [] }; });
    const roots = [];
    folders.forEach((f) => {
      if (f.parentId && map[f.parentId]) map[f.parentId].children.push(map[f.id]);
      else roots.push(map[f.id]);
    });
    return { map, roots };
  }, [folders]);

  const currentFolders = useMemo(() => {
    if (!currentFolderId) return folderTree.roots;
    return folderTree.map[currentFolderId]?.children || [];
  }, [currentFolderId, folderTree]);

  const currentDocuments = useMemo(() =>
    documents.filter((d) => currentFolderId ? d.folderId === currentFolderId : !d.folderId),
  [documents, currentFolderId]);

  const filteredDocuments = useMemo(() =>
    currentDocuments.filter((doc) => {
      const name = (doc.originalFilename || "").toLowerCase();
      const type = getFileTypeFromMime(doc.mimeType);
      return name.includes(debouncedSearch.toLowerCase()) && (filterType === "all" || type === filterType);
    }),
  [currentDocuments, debouncedSearch, filterType]);

  const getFolderName = (fid) => folderTree.map[fid]?.name || "Unfiled";

  const navigateToFolder = (folderId) => {
    if (folderId === null) { setCurrentFolderId(null); setFolderPath([]); return; }
    const path = [];
    let cur = folderTree.map[folderId];
    while (cur) { path.unshift({ id: cur.id, name: cur.name }); cur = cur.parentId ? folderTree.map[cur.parentId] : null; }
    setCurrentFolderId(folderId);
    setFolderPath(path);
  };

  // ── Upload Handlers ──
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setRealFiles((p) => [...p, ...files]);
    setUploadedFiles((p) => [...p, ...files.map((file, i) => ({
      id: Date.now() + i, name: file.name, size: formatFileSize(file.size),
      type: file.name.split(".").pop().toLowerCase(), file,
    }))]);
  };

  const removeUploadFile = (fileId) => {
    const f = uploadedFiles.find((u) => u.id === fileId);
    if (f) setRealFiles((p) => p.filter((r) => r.name !== f.name));
    setUploadedFiles((p) => p.filter((u) => u.id !== fileId));
  };

  const handleUploadFiles = async () => {
    if (!uploadedFiles.length) return;
    setUploadStep(1); setIsUploadingReal(true); setUploadResults([]);
    const results = [];
    for (const uf of uploadedFiles) {
      try {
        const res = await documentService.uploadDocument(uf.file, (p) => setUploadProgress(p), currentFolderId);
        results.push({ name: uf.name, success: true, data: res.data });
      } catch (err) {
        results.push({ name: uf.name, success: false, error: err.message });
      }
    }
    setUploadResults(results); setUploadStep(2); setIsUploadingReal(false); setUploadProgress(0);
    await refreshAll();
  };

  const resetUploadModal = () => {
    setShowUploadModal(false); setUploadedFiles([]); setRealFiles([]);
    setUploadStep(0); setUploadResults([]); setIsUploadingReal(false); setUploadProgress(0);
  };

  // ── Folder Handlers ──
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const res = await folderService.createFolder({ name: newFolderName.trim(), parentId: currentFolderId, color: newFolderColor });
      if (res.success) { await fetchFolders(); setShowCreateFolderModal(false); setNewFolderName(""); setNewFolderColor("#6366f1"); }
    } catch { alert("Failed to create folder"); }
    finally { setIsCreatingFolder(false); }
  };

  const handleDeleteFolder = async (folderId, e) => {
    e?.stopPropagation();
    const f = folderTree.map[folderId];
    if (!confirm(`Delete folder "${f?.name || ""}"? Documents inside will be moved to root.`)) return;
    try { await folderService.deleteFolder(folderId); await refreshAll(); if (currentFolderId === folderId) navigateToFolder(null); }
    catch { /* ignore */ }
  };

  const openRenameFolderModal = (folderId, e) => {
    e?.stopPropagation();
    const f = folderTree.map[folderId];
    if (!f) return;
    setRenamingFolder(f);
    setRenameFolderName(f.name);
    setShowRenameFolderModal(true);
  };

  const handleRenameFolder = async () => {
    if (!renameFolderName.trim() || !renamingFolder) return;
    try {
      await folderService.updateFolder(renamingFolder.id, { name: renameFolderName.trim() });
      setShowRenameFolderModal(false);
      setRenamingFolder(null);
      setRenameFolderName("");
      await refreshAll();
    } catch { alert("Failed to rename folder"); }
  };

  // ── OnlyOffice ──
  const handleViewInOnlyOffice = async (doc) => {
    try {
      const res = await documentService.getOnlyOfficeConfig(doc.id, "view");
      if (res.success) { setOnlyOfficeConfig(res.data.config); setOnlyOfficeDoc(doc); setShowOnlyOffice(true); }
    } catch { alert("Failed to open document"); }
  };

  const handleEditInOnlyOffice = async (doc) => {
    try {
      const res = await documentService.getOnlyOfficeConfig(doc.id, "edit");
      if (res.success) { setOnlyOfficeConfig(res.data.config); setOnlyOfficeDoc(doc); setShowOnlyOffice(true); }
    } catch { alert("Failed to open editor"); }
  };

  const closeOnlyOffice = () => { setShowOnlyOffice(false); setOnlyOfficeConfig(null); setOnlyOfficeDoc(null); refreshAll(); };

  // ── Download / Delete / Move ──
  const handleDownloadDocument = async (doc) => {
    try { await documentService.downloadDocument(doc.id, doc.originalFilename); }
    catch { alert("Download failed"); }
  };

  const handleDeleteDocument = async (doc) => {
    if (!confirm(`Delete "${doc.originalFilename}"?`)) return;
    try { await documentService.deleteDocument(doc.id); await refreshAll(); setShowDocumentModal(false); }
    catch { alert("Delete failed"); }
  };

  const handleMoveDocument = async (targetFolderId) => {
    if (!movingDocument) return;
    try { await folderService.moveDocument(movingDocument.id, targetFolderId); await refreshAll(); setShowMoveModal(false); setMovingDocument(null); }
    catch { alert("Failed to move document"); }
  };

  const openDocument = (doc) => { setSelectedDocument(doc); setShowSecurityDetails(false); setShowDocumentModal(true); };

  // Lock scroll when modals open
  useEffect(() => {
    const open = showUploadModal || showCreateFolderModal || showDocumentModal || showOnlyOffice || showMoveModal || showRenameFolderModal;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showUploadModal, showCreateFolderModal, showDocumentModal, showOnlyOffice, showMoveModal]);

  // ── Custom Select ──
  const CustomSelect = ({ value, options, onChange, dropdownId }) => {
    const isOpen = openDropdown === dropdownId;
    const sel = options.find((o) => o.value === value);
    return (
      <div className="relative">
        <button type="button" onClick={() => setOpenDropdown(isOpen ? null : dropdownId)}
          className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 transition-all min-w-[140px] ${isOpen ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
          <span className="text-sm text-slate-700 dark:text-slate-200">{sel?.label}</span>
          <IconChevDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-2 w-full min-w-[160px] py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20">
                {options.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpenDropdown(null); }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${value === opt.value ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium" : "text-slate-600 dark:text-slate-300"}`}>
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white"><IconDoc /></div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Documents</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage, organize, and edit your files securely</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreateFolderModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm">
              <IconFolder /> New Folder
            </button>
            <button onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm">
              <IconUpload /> Upload
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm flex-wrap">
          <button onClick={() => navigateToFolder(null)} className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${!currentFolderId ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium" : "text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"}`}>
            <IconHome /> Root
          </button>
          {folderPath.map((fp, i) => (
            <span key={fp.id} className="flex items-center gap-1">
              <IconChevRight />
              <button onClick={() => navigateToFolder(fp.id)}
                className={`px-2 py-1 rounded-lg transition-colors ${i === folderPath.length - 1 ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium" : "text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"}`}>
                {fp.name}
              </button>
            </span>
          ))}
        </div>

        {/* Search & Filter */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <IconSearch />
              <input type="text" placeholder="Search documents in this folder..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" />
            </div>
            <div className="flex gap-3">
              <CustomSelect value={filterType} options={FILE_TYPE_OPTIONS} onChange={setFilterType} dropdownId="type-filter" />
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button onClick={() => setView("grid")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "grid" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
                  <IconGrid />
                </button>
                <button onClick={() => setView("list")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === "list" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
                  <IconList />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Folders Grid */}
        {currentFolders.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <IconFolderOutline />
              Folders
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">{currentFolders.length}</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentFolders.map((folder, index) => (
                <motion.div key={folder.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <div className="relative group">
                    <button onClick={() => navigateToFolder(folder.id)}
                      className="w-full p-4 rounded-2xl border text-left transition-all hover:shadow-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10"
                          style={{ backgroundColor: folder.color ? `${folder.color}15` : undefined }}>
                          <IconFolderSolid color={folder.color || "#6366f1"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{folder.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{folder.documentCount || 0} files</p>
                        </div>
                      </div>
                    </button>
                    <button onClick={(e) => handleDeleteFolder(folder.id, e)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20">
                      <IconTrash />
                    </button>
                    <button onClick={(e) => openRenameFolderModal(folder.id, e)}
                      className="absolute top-2 right-10 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-amber-50 dark:bg-amber-500/10 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                      title="Rename folder">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <IconDoc />
            Documents
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">{filteredDocuments.length}</span>
          </h2>

          {isLoadingDocs ? (
            <Card className="p-16 text-center">
              <div className="w-10 h-10 mx-auto mb-4 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading documents...</p>
            </Card>
          ) : filteredDocuments.length === 0 ? (
            <Card className="p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No documents here</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Upload files or move documents into this folder</p>
              <button onClick={() => setShowUploadModal(true)} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all">
                Upload Documents
              </button>
            </Card>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc, index) => {
                const type = getFileTypeFromMime(doc.mimeType);
                return (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                    <Card className="p-5 hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => openDocument(doc)}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {getFileIcon(type)}
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${doc.status === "active" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                          {doc.status === "active" ? "Active" : doc.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {doc.originalFilename}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>·</span>
                        <span>{formatTimeAgo(doc.updatedAt || doc.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400">{type.toUpperCase()}</span>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleViewInOnlyOffice(doc); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 transition-colors" title="View"><IconEye /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleEditInOnlyOffice(doc); }} className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><IconEdit /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors" title="Download"><IconDownload /></button>
                          <button onClick={(e) => { e.stopPropagation(); setMovingDocument(doc); setShowMoveModal(true); }} className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-400 hover:text-amber-600 transition-colors" title="Move"><IconFolderMove /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc); }} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 transition-colors" title="Delete"><IconTrash /></button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Modified</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDocuments.map((doc) => {
                      const type = getFileTypeFromMime(doc.mimeType);
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => openDocument(doc)}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">{getFileIcon(type)}</div>
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{doc.originalFilename}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500">{formatFileSize(doc.fileSize)}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{formatTimeAgo(doc.updatedAt || doc.createdAt)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${doc.status === "active" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>
                              {doc.status === "active" ? "Active" : doc.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handleViewInOnlyOffice(doc); }} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="View"><IconEye /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleEditInOnlyOffice(doc); }} className="p-2 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><IconEdit /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Download"><IconDownload /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc); }} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete"><IconTrash /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ══════════════ DOCUMENT DETAIL MODAL ══════════════ */}
      <AnimatePresence>
        {showDocumentModal && selectedDocument && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowDocumentModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl shrink-0">
                      {getFileIcon(getFileTypeFromMime(selectedDocument.mimeType))}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{selectedDocument.originalFilename}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-slate-500">{formatFileSize(selectedDocument.fileSize)}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-sm text-slate-500">{selectedDocument.folderId ? getFolderName(selectedDocument.folderId) : "Root"}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowDocumentModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                    <IconX />
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="px-6 py-5 flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium ${selectedDocument.status === "active" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600" : "bg-slate-200 text-slate-600"}`}>
                      {selectedDocument.status === "active" ? "✓ Active" : selectedDocument.status}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Size</p>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatFileSize(selectedDocument.fileSize)}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1">Last Modified</p>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatTimeAgo(selectedDocument.updatedAt || selectedDocument.createdAt)}</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600"><IconUpload /></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Uploaded</p>
                      <p className="text-xs text-slate-500">
                        {selectedDocument.createdAt ? new Date(selectedDocument.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}{" "}
                        at {selectedDocument.createdAt ? new Date(selectedDocument.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Details (expandable) */}
                <div>
                  <button onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-2">
                      <IconShield />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Security Details</span>
                    </div>
                    <IconChevDown className={`w-4 h-4 text-slate-400 transition-transform ${showSecurityDetails ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {showSecurityDetails && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-3 space-y-3 px-1">
                          {selectedDocument.contentHash && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-slate-400 mb-1">Content Hash (SHA-256)</p>
                              <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{selectedDocument.contentHash}</code>
                            </div>
                          )}
                          {selectedDocument.ssdeepHash && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-slate-400 mb-1">SSDEEP Hash (Fuzzy)</p>
                              <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{selectedDocument.ssdeepHash}</code>
                            </div>
                          )}
                          {selectedDocument.simHash && (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-slate-400 mb-1">SimHash (Similarity)</p>
                              <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{selectedDocument.simHash}</code>
                            </div>
                          )}
                          {!selectedDocument.contentHash && !selectedDocument.ssdeepHash && (
                            <p className="text-xs text-slate-400 text-center py-2">No hash data available (legacy upload)</p>
                          )}
                          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                            <div className="flex items-center gap-2">
                              <IconLock />
                              <span className="text-xs text-indigo-700 dark:text-indigo-300">End-to-end encrypted with AES-256-GCM</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Close</button>
                <button onClick={() => { handleEditInOnlyOffice(selectedDocument); setShowDocumentModal(false); }}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2">
                  <IconEdit /> Edit in OnlyOffice
                </button>
                <button onClick={() => handleDownloadDocument(selectedDocument)}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <IconDownload /> Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ UPLOAD MODAL ══════════════ */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => uploadStep === 0 && resetUploadModal()}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${uploadStep === 2 ? "bg-emerald-500" : "bg-indigo-600"}`}>
                      {uploadStep === 2 ? <IconCheck /> : <IconUpload />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {uploadStep === 0 && "Upload Documents"}
                        {uploadStep === 1 && "Uploading..."}
                        {uploadStep === 2 && "Upload Complete"}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {uploadStep === 0 && (currentFolderId ? `Into: ${getFolderName(currentFolderId)}` : "Into: Root")}
                        {uploadStep === 1 && "Encrypting and processing your files"}
                        {uploadStep === 2 && `${uploadResults.filter((r) => r.success).length} of ${uploadResults.length} files uploaded`}
                      </p>
                    </div>
                  </div>
                  {uploadStep !== 1 && (
                    <button onClick={resetUploadModal} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <IconX />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {uploadStep === 0 && (
                    <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <label className="block border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer group">
                        <input type="file" multiple className="hidden" onChange={handleFileSelect} accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.txt,.csv" />
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <IconCloud />
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Click to select files</p>
                        <p className="text-xs text-slate-400">PDF, DOCX, XLSX, PPTX, Images (Max 50MB)</p>
                      </label>
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Files ({uploadedFiles.length})</p>
                            <button onClick={() => { setUploadedFiles([]); setRealFiles([]); }} className="text-xs text-slate-400 hover:text-red-500">Clear all</button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {uploadedFiles.map((f) => (
                              <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 group">
                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg">
                                  {getFileIcon(f.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{f.name}</p>
                                  <p className="text-xs text-slate-400">{f.size}</p>
                                </div>
                                <button onClick={() => removeUploadFile(f.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                  <IconX className="w-4 h-4 text-current" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                  {uploadStep === 1 && (
                    <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                      <div className="w-20 h-20 mx-auto mb-6 relative">
                        <svg className="w-20 h-20 animate-spin text-indigo-200" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center"><IconLock /></div>
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white mb-2">Processing securely...</p>
                      <p className="text-sm text-slate-500 mb-4">Encrypting, hashing, and storing your documents</p>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.max(uploadProgress, 10)}%` }} />
                      </div>
                    </motion.div>
                  )}
                  {uploadStep === 2 && (
                    <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center"><IconCheck /></div>
                          <div>
                            <p className="font-semibold text-emerald-700 dark:text-emerald-400">Documents Secured</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400/70">All files encrypted and stored safely</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {uploadResults.map((r, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${r.success ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${r.success ? "bg-emerald-500" : "bg-red-500"}`}>
                              {r.success ? <IconCheck className="w-3.5 h-3.5 text-white" /> : <IconX className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={`text-sm font-medium ${r.success ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>{r.name}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                {uploadStep === 0 && (
                  <>
                    <button onClick={resetUploadModal} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={handleUploadFiles} disabled={!uploadedFiles.length}
                      className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      <IconUpload /> Upload {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ""}
                    </button>
                  </>
                )}
                {uploadStep === 1 && (
                  <div className="flex-1 flex items-center justify-center gap-3 py-2">
                    <svg className="w-5 h-5 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm text-slate-600 font-medium">Processing...</span>
                  </div>
                )}
                {uploadStep === 2 && (
                  <button onClick={resetUploadModal} className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2">
                    <IconCheck /> Done
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ CREATE FOLDER MODAL ══════════════ */}
      <AnimatePresence>
        {showCreateFolderModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowCreateFolderModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><IconFolder /></div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Folder</h2>
                      <p className="text-xs text-slate-500">{currentFolderId ? `Inside: ${getFolderName(currentFolderId)}` : "At root level"}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateFolderModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <IconX />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Folder Name</label>
                  <input type="text" placeholder="Enter folder name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
                  <div className="flex gap-2">
                    {FOLDER_COLORS.map((c) => (
                      <button key={c} onClick={() => setNewFolderColor(c)}
                        className={`w-8 h-8 rounded-lg transition-all ${newFolderColor === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-105"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button onClick={() => setShowCreateFolderModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleCreateFolder} disabled={!newFolderName.trim() || isCreatingFolder}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50">
                  {isCreatingFolder ? "Creating..." : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ MOVE DOCUMENT MODAL ══════════════ */}
      <AnimatePresence>
        {showMoveModal && movingDocument && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowMoveModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Move Document</h2>
                <p className="text-sm text-slate-500 truncate mt-1">{movingDocument.originalFilename}</p>
              </div>
              <div className="p-6 max-h-64 overflow-y-auto space-y-2">
                <button onClick={() => handleMoveDocument(null)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${!movingDocument.folderId ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"}`}>
                  <IconHome />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Root (Unfiled)</span>
                </button>
                {folders.map((f) => (
                  <button key={f.id} onClick={() => handleMoveDocument(f.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${movingDocument.folderId === f.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"}`}>
                    <IconFolderSolid color={f.color || "#6366f1"} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{f.path || f.name}</span>
                  </button>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => setShowMoveModal(false)} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ ONLYOFFICE ══════════════ */}
      {showOnlyOffice && onlyOfficeConfig && (
        <OnlyOfficeEditor config={onlyOfficeConfig} onClose={closeOnlyOffice} documentName={onlyOfficeDoc?.originalFilename} />
      )}

      {/* ══════════════ RENAME FOLDER ══════════════ */}
      <AnimatePresence>
        {showRenameFolderModal && renamingFolder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Rename Folder</h2>
                <button onClick={() => { setShowRenameFolderModal(false); setRenamingFolder(null); }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <IconX className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Name</label>
                  <input type="text" value={renameFolderName} onChange={(e) => setRenameFolderName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowRenameFolderModal(false); setRenamingFolder(null); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm">
                    Cancel
                  </button>
                  <button onClick={handleRenameFolder}
                    disabled={!renameFolderName.trim() || renameFolderName.trim() === renamingFolder.name}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Rename
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
