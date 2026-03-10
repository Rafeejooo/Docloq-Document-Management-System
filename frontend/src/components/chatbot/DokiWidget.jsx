// DoKi Widget — Floating chat assistant (modern, larger, interactive)
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import chatbotService from "@/services/chatbot.service";
import useAuthStore from "@/app/store/auth.store";
import { ShiningText } from "@/components/ui/ShiningText";

/* ───────── helpers ───────── */

const MIME_ICONS = {
  pdf: { bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", label: "PDF" },
  docx: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", label: "DOCX" },
  doc: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", label: "DOC" },
  xlsx: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", label: "XLSX" },
  xls: { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", label: "XLS" },
  pptx: { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", label: "PPTX" },
  png: { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-600 dark:text-violet-400", label: "PNG" },
  jpg: { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-600 dark:text-violet-400", label: "JPG" },
};

function getFileStyle(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  return (
    MIME_ICONS[ext] || {
      bg: "bg-slate-100 dark:bg-slate-700",
      text: "text-slate-500 dark:text-slate-400",
      label: ext.toUpperCase() || "FILE",
    }
  );
}

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ROLE_COLORS = {
  super_admin:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  admin:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  manager:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  user: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  auditor:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  viewer:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const PRIORITY_STYLES = {
  urgent: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", label: "Urgent" },
  high: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", label: "High" },
  medium: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", label: "Medium" },
  low: { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-500 dark:text-slate-400", label: "Low" },
};

const STATUS_STYLES = {
  pending: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Pending" },
  in_progress: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "In Progress" },
  completed: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Selesai" },
  cancelled: { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-500 dark:text-slate-400", label: "Dibatalkan" },
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ───────── markdown renderer (skip table syntax) ───────── */

function MdBlock({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-[13px] leading-relaxed">
      {lines.map((line, i) => {
        // skip markdown table rows
        if (line.startsWith("|") || /^[\s-:|]+$/.test(line)) return null;
        if (line.startsWith("### "))
          return (
            <h4 key={i} className="font-semibold text-sm mt-2">
              {inlineMd(line.slice(4))}
            </h4>
          );
        if (line.startsWith("## "))
          return (
            <h3 key={i} className="font-bold text-sm mt-2">
              {inlineMd(line.slice(3))}
            </h3>
          );
        if (/^\d+\.\s/.test(line))
          return (
            <p key={i} className="ml-3">
              {inlineMd(line)}
            </p>
          );
        if (line.startsWith("- "))
          return (
            <p
              key={i}
              className="ml-3 before:content-['•'] before:mr-1.5 before:text-blue-400"
            >
              {inlineMd(line.slice(2))}
            </p>
          );
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{inlineMd(line)}</p>;
      })}
    </div>
  );
}

function inlineMd(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      p
    )
  );
}

/* ───────── structured data cards ───────── */

function DocumentList({ items }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 5);
  return (
    <div className="mt-3 space-y-1.5">
      {visible.map((doc, idx) => {
        const style = getFileStyle(doc.originalFilename);
        return (
          <motion.div
            key={doc.id || idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group cursor-default"
          >
            <div
              className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}
            >
              <span className={`text-[10px] font-bold ${style.text}`}>
                {style.label}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 truncate">
                {doc.originalFilename}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10.5px] text-slate-400">
                  {formatSize(doc.fileSize)}
                </span>
                <span className="text-[10.5px] text-slate-300 dark:text-slate-600">
                  •
                </span>
                <span className="text-[10.5px] text-slate-400">
                  {formatDate(doc.createdAt)}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                doc.status === "active"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {doc.status === "active" ? "Aktif" : doc.status}
            </span>
          </motion.div>
        );
      })}
      {items.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium cursor-pointer"
        >
          {expanded
            ? "Tampilkan lebih sedikit ▲"
            : `Tampilkan ${items.length - 5} lainnya ▼`}
        </button>
      )}
    </div>
  );
}

function UserList({ items }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 5);
  return (
    <div className="mt-3 space-y-1.5">
      {visible.map((u, idx) => {
        const name =
          [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
        const initials = name.charAt(0).toUpperCase();
        const roleColor = ROLE_COLORS[u.role] || ROLE_COLORS.user;
        return (
          <motion.div
            key={u.id || idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-default"
          >
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 truncate">
                {name}
              </p>
              <p className="text-[10.5px] text-slate-400 truncate">
                {u.email}
              </p>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${roleColor}`}
            >
              {u.role?.replace("_", " ")}
            </span>
          </motion.div>
        );
      })}
      {items.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium cursor-pointer"
        >
          {expanded
            ? "Tampilkan lebih sedikit ▲"
            : `Tampilkan ${items.length - 5} lainnya ▼`}
        </button>
      )}
    </div>
  );
}

function TaskList({ items }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 5);
  return (
    <div className="mt-3 space-y-1.5">
      {visible.map((task, idx) => {
        const prio = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
        const stat = STATUS_STYLES[task.status] || STATUS_STYLES.pending;
        const days = daysUntil(task.dueDate);
        const isOverdue = days !== null && days < 0;
        const isNearDeadline = days !== null && days >= 0 && days <= 3;
        return (
          <motion.div
            key={task.id || idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className={`p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border transition-colors cursor-default ${
              isOverdue
                ? "border-red-200 dark:border-red-800/60"
                : isNearDeadline
                  ? "border-amber-200 dark:border-amber-800/60"
                  : "border-slate-100 dark:border-slate-700/60 hover:border-blue-200 dark:hover:border-blue-800"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {/* Priority indicator */}
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                task.priority === "urgent" ? "bg-red-500" :
                task.priority === "high" ? "bg-orange-500" :
                task.priority === "medium" ? "bg-blue-500" : "bg-slate-400"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 leading-snug">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${prio.bg} ${prio.text}`}>
                    {prio.label}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${stat.bg} ${stat.text}`}>
                    {stat.label}
                  </span>
                  {task.dueDate && (
                    <span className={`text-[10px] font-medium flex items-center gap-1 ${
                      isOverdue
                        ? "text-red-500 dark:text-red-400"
                        : isNearDeadline
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-400"
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {isOverdue
                        ? `Terlambat ${Math.abs(days)} hari`
                        : days === 0
                          ? "Hari ini"
                          : days === 1
                            ? "Besok"
                            : `${days} hari lagi`}
                    </span>
                  )}
                </div>
                {task.assignee && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    → {task.assignee}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
      {items.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium cursor-pointer"
        >
          {expanded
            ? "Tampilkan lebih sedikit ▲"
            : `Tampilkan ${items.length - 5} lainnya ▼`}
        </button>
      )}
    </div>
  );
}

/* ───────── main widget ───────── */

export default function DokiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Init on first open
  useEffect(() => {
    if (!isOpen || initialized) return;
    (async () => {
      try {
        const [hRes, sRes] = await Promise.all([
          chatbotService.getHistory(),
          chatbotService.getSuggestions(),
        ]);
        if (hRes?.data?.messages?.length > 0)
          setMessages(
            hRes.data.messages.map((m) => ({
              id: m.id,
              type: m.role === "user" ? "user" : "bot",
              content: m.content,
              timestamp: new Date(m.createdAt),
            }))
          );
        if (sRes?.data) setSuggestions(sRes.data);
        else setDefaults();
      } catch {
        setDefaults();
      }
      setInitialized(true);
    })();
  }, [isOpen, initialized]);

  const setDefaults = () =>
    setSuggestions([
      { label: "Dokumen saya", message: "Tampilkan daftar dokumen saya" },
      { label: "Tugas saya", message: "Tampilkan daftar tugas saya" },
      { label: "Fitur DocLoq", message: "Apa saja fitur-fitur DocLoq?" },
      {
        label: "Info keamanan",
        message: "Bagaimana keamanan dokumen di DocLoq?",
      },
    ]);

  /* ── send message ── */
  const handleSend = async (txt = null) => {
    const text = (txt || input).trim();
    if (!text || isTyping) return;

    setMessages((p) => [
      ...p,
      {
        id: `u-${Date.now()}`,
        type: "user",
        content: text,
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await chatbotService.sendMessage(text);
      if (res?.success && res.data) {
        const botId = `b-${Date.now()}`;
        setMessages((p) => [
          ...p,
          {
            id: botId,
            type: "bot",
            content: res.data.reply,
            timestamp: new Date(),
            data: res.data.data,
          },
        ]);
        if (res.data.suggestions?.length) {
          setSuggestions(
            res.data.suggestions.map((s) =>
              typeof s === "string" ? { label: s, message: s } : s
            )
          );
        }
      } else {
        addErr();
      }
    } catch {
      addErr();
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const addErr = () =>
    setMessages((p) => [
      ...p,
      {
        id: `e-${Date.now()}`,
        type: "bot",
        content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
        timestamp: new Date(),
      },
    ]);

  const handleClear = async () => {
    try {
      await chatbotService.clearHistory();
    } catch {
      /* ignore */
    }
    setMessages([]);
  };

  /* ── render ── */
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-50 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
          isOpen
            ? "bottom-4 right-4 w-12 h-12 md:bottom-6 md:right-6 md:w-12 md:h-12 bg-slate-700/90 hover:bg-slate-600"
            : "bottom-6 right-6 w-14 h-14 bg-linear-to-br from-blue-500 via-indigo-500 to-violet-600 hover:scale-110 shadow-indigo-500/40 hover:shadow-indigo-500/60"
        }`}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </motion.svg>
          ) : (
            <motion.span
              key="d"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-white font-extrabold text-xl tracking-tight select-none"
            >
              D
            </motion.span>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-linear-to-br from-blue-500 via-indigo-500 to-violet-600 animate-ping opacity-20 pointer-events-none" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed z-50 inset-0 md:inset-auto md:bottom-22 md:right-6 md:w-115 md:h-155 bg-white dark:bg-slate-900 md:rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 md:border md:border-slate-200/80 dark:md:border-slate-700/60 flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="relative bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-4 shrink-0">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
              <div className="relative flex items-center gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-1.5 -ml-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white font-extrabold text-lg ring-2 ring-white/20">
                  D
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-[15px] tracking-tight">
                    DoKi
                  </h3>
                  <p className="text-white/60 text-[11px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Document Knowledge Intelligence
                  </p>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    title="Hapus riwayat"
                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-4.5 h-4.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/80 dark:bg-slate-950/80 scroll-smooth">
              {/* Empty state */}
              {messages.length === 0 && !isTyping && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center px-4 max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/25 text-white font-extrabold text-2xl">
                      D
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                      Hai{user?.firstName ? `, ${user.firstName}` : ""}!
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                      Saya DoKi, asisten pintar DocLoq.
                      <br />
                      Tanya apa saja seputar dokumen dan fitur DocLoq.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s.message)}
                          className="text-left text-[12px] px-3.5 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm hover:shadow-md font-medium leading-snug cursor-pointer"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message list */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2 ${
                    msg.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.type === "bot" && (
                    <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold shadow-sm">
                      D
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] ${
                      msg.type === "user"
                        ? "bg-linear-to-br from-blue-500 via-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-sm shadow-lg shadow-indigo-500/20"
                        : "bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-700/60"
                    } px-4 py-3`}
                  >
                    {/* Text content */}
                    {msg.type === "bot" ? (
                      <MdBlock text={msg.content} />
                    ) : (
                      <p className="text-[13.5px] leading-relaxed">
                        {msg.content}
                      </p>
                    )}

                    {/* Structured document list */}
                    {msg.data?.type === "document_list" &&
                      msg.data.items?.length > 0 && (
                        <DocumentList items={msg.data.items} />
                      )}

                    {/* Structured user list */}
                    {msg.data?.type === "user_list" &&
                      msg.data.items?.length > 0 && (
                        <UserList items={msg.data.items} />
                      )}

                    {/* Structured task list */}
                    {msg.data?.type === "task_list" &&
                      msg.data.items?.length > 0 && (
                        <TaskList items={msg.data.items} />
                      )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 text-white text-[10px] font-bold shadow-sm">
                    D
                  </div>
                  <div className="bg-white dark:bg-slate-800/90 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm border border-slate-100 dark:border-slate-700/60">
                    <ShiningText text="DoKi is thinking..." />
                  </div>
                </motion.div>
              )}

              {/* Suggestion chips (after messages) */}
              {messages.length > 0 && !isTyping && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestions.slice(0, 4).map((s, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        handleSend(s.message || s.label || s)
                      }
                      className="text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-all font-medium shadow-sm cursor-pointer"
                    >
                      {s.label || s}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input ── */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0"
            >
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanya DoKi seputar DocLoq..."
                  disabled={isTyping}
                  maxLength={2000}
                  className="flex-1 pl-4 pr-4 py-3 text-[13.5px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-700 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-11 h-11 rounded-xl bg-linear-to-br from-blue-500 via-indigo-500 to-violet-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
