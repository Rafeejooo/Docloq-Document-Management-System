import { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const recentDocuments = [
    { id: 1, name: "Contract_2025.pdf", type: "PDF", size: "2.4 MB", uploaded: "2 hours ago", status: "verified", user: "John Doe" },
    { id: 2, name: "Invoice_001.pdf", type: "PDF", size: "1.2 MB", uploaded: "1 day ago", status: "verified", user: "Jane Smith" },
    { id: 3, name: "Report_Q4.docx", type: "DOCX", size: "5.8 MB", uploaded: "3 days ago", status: "pending", user: "Mike Johnson" },
    { id: 4, name: "NDA_Template.pdf", type: "PDF", size: "890 KB", uploaded: "1 week ago", status: "verified", user: "Sarah Williams" },
  ];

  const stats = [
    { label: "Total Documents", value: "1,234", change: "+12%", positive: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { label: "Verified Today", value: "56", change: "+8%", positive: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { label: "Active Users", value: "89", change: "+3%", positive: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { label: "Storage Used", value: "45 GB", change: "75%", positive: null, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    )},
  ];

  const quickActions = [
    { name: "Upload Document", desc: "Add new files to your library", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ), href: "/documents", color: "from-blue-500 to-indigo-600" },
    { name: "Verify Document", desc: "Check document authenticity", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ), href: "/verification", color: "from-emerald-500 to-teal-600" },
    { name: "AI Assistant", desc: "Ask questions about documents", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ), href: "/chatbot", color: "from-purple-500 to-pink-600" },
    { name: "OSINT Tracker", desc: "Monitor document leaks", icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ), href: "/osint-tracker", color: "from-amber-500 to-orange-600" },
  ];

  const tasks = [
    { id: 1, title: "Review pending contracts", priority: "high", dueDate: "Today", status: "in-progress", assignee: "JD" },
    { id: 2, title: "Verify Q4 financial reports", priority: "medium", dueDate: "Tomorrow", status: "pending", assignee: "JS" },
    { id: 3, title: "Update NDA templates", priority: "low", dueDate: "Dec 31", status: "pending", assignee: "MJ" },
    { id: 4, title: "Archive 2024 documents", priority: "medium", dueDate: "Jan 5", status: "completed", assignee: "SW" },
    { id: 5, title: "Set up new team permissions", priority: "high", dueDate: "Today", status: "pending", assignee: "JD" },
  ];

  const docStats = [
    { label: "PDF Files", value: 856, percent: 69, color: "bg-red-500" },
    { label: "DOCX Files", value: 234, percent: 19, color: "bg-blue-500" },
    { label: "XLSX Files", value: 98, percent: 8, color: "bg-emerald-500" },
    { label: "Others", value: 46, percent: 4, color: "bg-slate-500" },
  ];

  const filteredDocs = useMemo(() => 
    recentDocuments.filter(doc => 
      doc.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      doc.user.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ), [debouncedSearchQuery]
  );

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleNavigate = useCallback((href) => {
    navigate(href);
  }, [navigate]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-1">
          Welcome back 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Here's what's happening with your documents today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Card className="p-4 sm:p-5" hover>
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  {stat.icon}
                </div>
                {stat.positive !== null && (
                  <span className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${
                    stat.positive 
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                      : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{stat.label}</p>
            </Card>
          </div>
        ))}
      </div>

      {/* Quick Actions - Full Width Grid */}
      <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, index) => (
            <button
              key={action.name}
              onClick={() => handleNavigate(action.href)}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center text-white mb-3 sm:mb-4">
                  {action.icon}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-0.5 sm:mb-1">{action.name}</h3>
                <p className="text-xs sm:text-sm text-white/70 line-clamp-2">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Tasks & Doc Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Tasks Table */}
        <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Card className="overflow-hidden h-full">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Pending Tasks</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tasks.filter(t => t.status !== "completed").length} tasks remaining</p>
              </div>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Task</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Priority</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Due</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Assignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className={`text-sm font-medium ${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"}`}>
                          {task.title}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          task.priority === "high" 
                            ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : task.priority === "medium"
                            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400">{task.dueDate}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                          task.status === "completed"
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                            : task.status === "in-progress"
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            task.status === "completed" ? "bg-emerald-500" : task.status === "in-progress" ? "bg-blue-500" : "bg-slate-400"
                          }`}></span>
                          {task.status === "in-progress" ? "In Progress" : task.status === "completed" ? "Done" : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                          {task.assignee}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((task) => (
                <div key={task.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className={`text-sm font-medium flex-1 ${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"}`}>
                      {task.title}
                    </p>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {task.assignee}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      task.priority === "high" 
                        ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : task.priority === "medium"
                        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">• {task.dueDate}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      task.status === "completed"
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : task.status === "in-progress"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        task.status === "completed" ? "bg-emerald-500" : task.status === "in-progress" ? "bg-blue-500" : "bg-slate-400"
                      }`}></span>
                      {task.status === "in-progress" ? "In Progress" : task.status === "completed" ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Document Stats */}
        <div className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <Card className="p-4 sm:p-5 h-full">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Document Types</h2>
            <div className="space-y-4">
              {docStats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{stat.label}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{stat.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className={`${stat.color} h-2 rounded-full transition-all`} style={{ width: `${stat.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Files</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">1,234</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <Card className="overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Documents</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest uploads and changes</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
                  />
                </div>
                <Link to="/documents">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </div>
          </div>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Document</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{doc.uploaded}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{doc.type}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.size}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">{doc.user}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        doc.status === "verified"
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          doc.status === "verified" ? "bg-emerald-500" : "bg-amber-500"
                        }`}></span>
                        {doc.status === "verified" ? "Verified" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDocs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500 dark:text-slate-400">No documents found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{doc.user} • {doc.uploaded}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    doc.status === "verified"
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      doc.status === "verified" ? "bg-emerald-500" : "bg-amber-500"
                    }`}></span>
                    {doc.status === "verified" ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-12">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{doc.type}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{doc.size}</span>
                </div>
              </div>
            ))}
            {filteredDocs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500 dark:text-slate-400">No documents found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
