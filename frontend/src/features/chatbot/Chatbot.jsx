import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import chatbotService from "@/services/chatbot.service";
import useAuthStore from "@/app/store/auth.store";
import { ShiningText } from "@/components/ui/ShiningText";

// ── Markdown-lite renderer (bold, bullets, headers, code) ──
function renderMarkdown(text) {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    // Headers
    if (line.startsWith("### ")) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{renderInline(line.slice(4))}</h4>;
    if (line.startsWith("## ")) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{renderInline(line.slice(3))}</h3>;
    // Numbered list
    if (/^\d+\.\s/.test(line)) return <p key={i} className="ml-2 my-0.5">{renderInline(line)}</p>;
    // Bullet
    if (line.startsWith("- ")) return <p key={i} className="ml-2 my-0.5">• {renderInline(line.slice(2))}</p>;
    // Empty
    if (line.trim() === "") return <br key={i} />;
    // Normal
    return <p key={i} className="my-0.5">{renderInline(line)}</p>;
  });
}

function renderInline(text) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Inline code `text`
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith("`") && cp.endsWith("`")) {
        return <code key={`${i}-${j}`} className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-xs">{cp.slice(1, -1)}</code>;
      }
      return cp;
    });
  });
}

// ── Document card for structured data ──
function DocumentCard({ doc }) {
  const sizeKB = Math.round(doc.fileSize / 1024);
  const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
  const ext = doc.originalFilename?.split('.').pop()?.toUpperCase() || '?';

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
        {ext}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.originalFilename}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{sizeStr} • {doc.status}</p>
      </div>
    </div>
  );
}

// ── User card for structured data ──
function UserCard({ user }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const roleBadgeColors = {
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    user: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    auditor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    viewer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
      <div className="w-9 h-9 rounded-full bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${roleBadgeColors[user.role] || roleBadgeColors.user}`}>
        {user.role}
      </span>
    </div>
  );
}

// ── Main Chatbot Component ──
export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuthStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load history + suggestions on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [historyRes, suggestionsRes] = await Promise.all([
          chatbotService.getHistory(),
          chatbotService.getSuggestions(),
        ]);

        if (historyRes?.data?.messages?.length > 0) {
          setMessages(historyRes.data.messages.map(m => ({
            id: m.id,
            type: m.role === 'user' ? 'user' : 'bot',
            content: m.content,
            timestamp: new Date(m.createdAt),
          })));
        }

        if (suggestionsRes?.data) {
          setSuggestions(suggestionsRes.data);
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
        // Set default suggestions even if API fails
        setSuggestions([
          { label: 'Lihat dokumen saya', message: 'Tampilkan daftar dokumen saya' },
          { label: 'Fitur DocLoq', message: 'Apa saja fitur-fitur DocLoq?' },
          { label: 'Info keamanan', message: 'Bagaimana keamanan dokumen di DocLoq?' },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    init();
  }, []);

  const handleSend = async (messageText = null) => {
    const text = (messageText || input).trim();
    if (!text || isTyping) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      type: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await chatbotService.sendMessage(text);

      if (res?.success && res.data) {
        const botId = `b-${Date.now()}`;
        const botMessage = {
          id: botId,
          type: "bot",
          content: res.data.reply,
          timestamp: new Date(),
          data: res.data.data,
          suggestions: res.data.suggestions,
        };
        setMessages(prev => [...prev, botMessage]);

        if (res.data.suggestions?.length > 0) {
          setSuggestions(res.data.suggestions.map(s => ({
            label: s,
            message: s,
          })));
        }
      } else {
        addErrorMessage();
      }
    } catch (err) {
      console.error('DoKi error:', err);
      addErrorMessage();
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const addErrorMessage = () => {
    setMessages(prev => [...prev, {
      id: `e-${Date.now()}`,
      type: "bot",
      content: "Maaf, saya mengalami gangguan. Silakan coba lagi.",
      timestamp: new Date(),
    }]);
  };

  const handleClearHistory = async () => {
    try {
      await chatbotService.clearHistory();
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const text = typeof suggestion === 'string' ? suggestion : suggestion.message;
    handleSend(text);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-100px)] flex flex-col fixed inset-0 md:static md:inset-auto bg-slate-50 dark:bg-slate-950 z-40 md:z-auto pt-16 md:pt-0">
        {/* Header */}
        <div className="px-4 md:px-0 py-3 md:mb-4 bg-white dark:bg-slate-900 md:bg-transparent border-b border-slate-200 dark:border-slate-800 md:border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">
                D
              </div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white"
                >
                  DoKi
                </motion.h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Document Knowledge Intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-0 pb-4">
          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingHistory ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <span className="text-white font-bold text-sm">D</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Memuat DoKi...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                      <span className="text-white font-extrabold text-2xl">D</span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      Hai{user?.firstName ? `, ${user.firstName}` : ''}!
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Saya <strong>DoKi</strong> (Document Knowledge Intelligence), asisten DocLoq kamu. Tanya apa saja seputar fitur dan dokumen!
                    </p>
                    {/* Suggestion chips */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.map((s, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => handleSuggestionClick(s)}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 transition-all active:scale-95"
                        >
                          {typeof s === 'string' ? s : s.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[85%] md:max-w-[75%] ${
                        message.type === "user"
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                      } rounded-2xl px-4 py-3 text-sm`}>
                        {message.type === "bot" && (
                          <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="w-5 h-5 rounded-md bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">D</span>
                            <span className="font-medium">DoKi</span>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {message.type === "bot" ? (
                            renderMarkdown(message.content)
                          ) : message.content}
                        </div>

                        {/* Structured data: document list */}
                        {message.data?.type === 'document_list' && message.data.items?.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {message.data.items.slice(0, 10).map(doc => (
                              <DocumentCard key={doc.id} doc={doc} />
                            ))}
                            {message.data.items.length > 10 && (
                              <p className="text-xs text-slate-400 mt-2">...dan {message.data.items.length - 10} dokumen lainnya</p>
                            )}
                          </div>
                        )}

                        {/* Structured data: user list */}
                        {message.data?.type === 'user_list' && message.data.items?.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {message.data.items.slice(0, 10).map(u => (
                              <UserCard key={u.id} user={u} />
                            ))}
                            {message.data.items.length > 10 && (
                              <p className="text-xs text-slate-400 mt-2">...dan {message.data.items.length - 10} user lainnya</p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Inline suggestions after last bot message */}
                  {messages.length > 0 && messages[messages.length - 1]?.type === 'bot' && !isTyping && (
                    <div className="flex flex-wrap gap-1.5 ml-1">
                      {(messages[messages.length - 1].suggestions || suggestions.slice(0, 3)).map((s, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSuggestionClick(s)}
                          className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
                        >
                          {typeof s === 'string' ? s : s.label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">D</span>
                      <ShiningText text="DoKi is thinking..." />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanya DoKi sesuatu..."
                  disabled={isTyping}
                  maxLength={2000}
                  className="flex-1 px-4 py-3 md:py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="px-4 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
                >
                  <span className="hidden md:inline">Kirim</span>
                  <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                DoKi hanya menjawab seputar DocLoq • Powered by AI
              </p>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
