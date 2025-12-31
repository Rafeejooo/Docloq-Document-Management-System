import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState("all");
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Sign Employment Contract",
      description: "Review and digitally sign the new employment contract for 2026",
      type: "sign",
      priority: "high",
      status: "pending",
      dueDate: "2026-01-02",
      assignedBy: { name: "John Doe", avatar: "JD" },
      document: "Employment_Contract_2026.pdf",
      formId: 5,
      createdAt: "Dec 28, 2025",
    },
    {
      id: 2,
      title: "Complete Onboarding Form",
      description: "Fill out the new employee onboarding form with your personal details",
      type: "fill",
      priority: "high",
      status: "pending",
      dueDate: "2026-01-03",
      assignedBy: { name: "Jane Smith", avatar: "JS" },
      document: null,
      formId: 1,
      createdAt: "Dec 27, 2025",
    },
    {
      id: 3,
      title: "Confirm Document Receipt",
      description: "Confirm that you have received and reviewed the quarterly report",
      type: "confirm",
      priority: "medium",
      status: "pending",
      dueDate: "2026-01-05",
      assignedBy: { name: "Mike Johnson", avatar: "MJ" },
      document: "Q4_Report_2025.pdf",
      formId: null,
      createdAt: "Dec 26, 2025",
    },
    {
      id: 4,
      title: "Submit Expense Report",
      description: "Fill out the expense report form for December 2025",
      type: "fill",
      priority: "medium",
      status: "pending",
      dueDate: "2026-01-10",
      assignedBy: { name: "Sarah Wilson", avatar: "SW" },
      document: null,
      formId: 3,
      createdAt: "Dec 25, 2025",
    },
    {
      id: 5,
      title: "Sign NDA Agreement",
      description: "Review and sign the Non-Disclosure Agreement for the new project",
      type: "sign",
      priority: "high",
      status: "completed",
      dueDate: "2025-12-28",
      assignedBy: { name: "Tom Brown", avatar: "TB" },
      document: "NDA_Project_X.pdf",
      formId: null,
      completedAt: "Dec 27, 2025",
      createdAt: "Dec 20, 2025",
    },
    {
      id: 6,
      title: "Confirm Training Completion",
      description: "Confirm that you have completed the mandatory security training",
      type: "confirm",
      priority: "low",
      status: "completed",
      dueDate: "2025-12-25",
      assignedBy: { name: "Jane Smith", avatar: "JS" },
      document: "Security_Training_Certificate.pdf",
      formId: null,
      completedAt: "Dec 24, 2025",
      createdAt: "Dec 15, 2025",
    },
  ]);

  const taskTypeConfig = {
    sign: { 
      label: "Signature", 
      action: "Sign",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    fill: { 
      label: "Form", 
      action: "Fill Out",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    confirm: { 
      label: "Confirm", 
      action: "Confirm",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const priorityConfig = {
    high: { label: "High", color: "bg-rose-500", ring: "ring-rose-500/20" },
    medium: { label: "Medium", color: "bg-amber-500", ring: "ring-amber-500/20" },
    low: { label: "Low", color: "bg-slate-400", ring: "ring-slate-400/20" },
  };

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "high", label: "High Priority", dot: "bg-rose-500" },
    { value: "medium", label: "Medium Priority", dot: "bg-amber-500" },
    { value: "low", label: "Low Priority", dot: "bg-slate-400" },
  ];

  const filteredTasks = tasks.filter((task) => {
    const matchesTab = task.status === activeTab;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesDate = !selectedCalendarDate || task.dueDate === selectedCalendarDate;
    return matchesTab && matchesPriority && matchesDate;
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const handleCompleteTask = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: "completed", completedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }
          : task
      )
    );
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const getDaysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Calendar logic
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Previous month padding
    for (let i = 0; i < startPadding; i++) {
      days.push({ day: null, date: null });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr && t.status === "pending");
      days.push({
        day: i,
        date: dateStr,
        tasks: dayTasks,
        isToday: new Date().toDateString() === new Date(dateStr).toDateString(),
      });
    }
    
    return days;
  }, [currentMonth, tasks]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">My Tasks</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage your assigned tasks, signatures, and form submissions
            </p>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-3">
            <div className="flex-1 sm:flex-none px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending</p>
            </div>
            <div className="flex-1 sm:flex-none px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
              <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{completedCount}</p>
              <p className="text-xs font-medium text-indigo-600/70 dark:text-indigo-400/70">Completed</p>
            </div>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
          {/* Tasks List Column */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Tabs */}
              <div className="inline-flex p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800/50 shadow-inner w-full sm:w-auto">
                {[
                  { key: "pending", label: "Pending", count: pendingCount },
                  { key: "completed", label: "Completed", count: completedCount },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 sm:flex-none relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.key
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.key
                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                        : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Date Filter Indicator */}
                {selectedCalendarDate && (
                  <button
                    onClick={() => setSelectedCalendarDate(null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    <span className="text-xs sm:text-sm">{formatDisplayDate(selectedCalendarDate)}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Priority Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                  >
                    <span className="text-sm text-slate-500 dark:text-slate-400">Priority:</span>
                    <div className="flex items-center gap-2">
                      {filterPriority !== "all" && (
                        <span className={`w-2 h-2 rounded-full ${priorityConfig[filterPriority]?.color}`}></span>
                      )}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {priorityOptions.find(p => p.value === filterPriority)?.label}
                      </span>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${showPriorityDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {showPriorityDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowPriorityDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20"
                        >
                          {priorityOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setFilterPriority(option.value);
                                setShowPriorityDropdown(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                                filterPriority === option.value ? "bg-indigo-50 dark:bg-indigo-500/10" : ""
                              }`}
                            >
                              {option.dot && <span className={`w-2 h-2 rounded-full ${option.dot}`}></span>}
                              {!option.dot && <span className="w-2"></span>}
                              <span className={`text-sm ${filterPriority === option.value ? "font-medium text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300"}`}>
                                {option.label}
                              </span>
                              {filterPriority === option.value && (
                                <svg className="w-4 h-4 ml-auto text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <Card className="p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {selectedCalendarDate ? "No tasks for this date" : activeTab === "pending" ? "All caught up! 🎉" : "No completed tasks yet"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedCalendarDate 
                      ? "Try selecting another date or clear the filter"
                      : activeTab === "pending"
                      ? "You have no pending tasks. Time to relax!"
                      : "Completed tasks will appear here."}
                  </p>
                </Card>
              ) : (
                filteredTasks.map((task, index) => {
                  const config = taskTypeConfig[task.type];
                  const daysUntilDue = getDaysUntilDue(task.dueDate);
                  const isOverdue = task.status === "pending" && daysUntilDue < 0;
                  const isDueSoon = task.status === "pending" && daysUntilDue >= 0 && daysUntilDue <= 2;

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => openTaskModal(task)}
                      className="cursor-pointer group"
                    >
                      <Card className={`p-5 hover:shadow-xl transition-all duration-300 border-l-4 ${
                        isOverdue 
                          ? "border-l-rose-500 bg-rose-50/30 dark:bg-rose-500/5" 
                          : isDueSoon 
                          ? "border-l-amber-500 bg-amber-50/30 dark:bg-amber-500/5" 
                          : "border-l-transparent hover:border-l-indigo-500"
                      }`}>
                        <div className="flex items-start gap-5">
                          {/* Task Type Icon */}
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                            {config.icon}
                          </div>

                          {/* Task Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {task.title}
                                </h3>
                                <span className={`w-2.5 h-2.5 rounded-full ring-4 ${priorityConfig[task.priority].color} ${priorityConfig[task.priority].ring}`}></span>
                              </div>
                              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {config.label}
                              </span>
                            </div>
                            
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">{task.description}</p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {/* Assigned By */}
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                      {task.assignedBy.avatar}
                                    </span>
                                  </div>
                                  <span className="text-sm text-slate-500 dark:text-slate-400">{task.assignedBy.name}</span>
                                </div>
                                
                                {/* Due Date */}
                                <div className={`flex items-center gap-1.5 text-sm ${isOverdue ? "text-rose-600 dark:text-rose-400" : isDueSoon ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-medium">
                                    {task.status === "completed" ? task.completedAt : formatDisplayDate(task.dueDate)}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Action Button */}
                              {task.status === "pending" ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteTask(task.id);
                                  }}
                                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                >
                                  {config.action}
                                </button>
                              ) : (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                                  <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Done</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Calendar Column */}
          <div className="xl:col-span-1">
            <Card className="p-5 sticky top-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Calendar</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextMonth}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Month/Year */}
              <p className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </p>

              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-slate-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarData.map((dayData, index) => (
                  <button
                    key={index}
                    disabled={!dayData.day}
                    onClick={() => {
                      if (dayData.date) {
                        setSelectedCalendarDate(selectedCalendarDate === dayData.date ? null : dayData.date);
                      }
                    }}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                      !dayData.day
                        ? "cursor-default"
                        : dayData.isToday
                        ? "bg-indigo-600 text-white font-bold"
                        : selectedCalendarDate === dayData.date
                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : dayData.tasks?.length > 0
                        ? "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {dayData.day}
                    {dayData.tasks?.length > 0 && (
                      <div className={`absolute bottom-1 flex gap-0.5 ${dayData.isToday ? "" : ""}`}>
                        {dayData.tasks.slice(0, 3).map((t, i) => (
                          <span
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              dayData.isToday ? "bg-white/70" : priorityConfig[t.priority]?.color || "bg-indigo-500"
                            }`}
                          ></span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Upcoming Tasks */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Upcoming Due Dates</h4>
                <div className="space-y-2">
                  {tasks
                    .filter((t) => t.status === "pending")
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .slice(0, 4)
                    .map((task) => (
                      <div
                        key={task.id}
                        onClick={() => openTaskModal(task)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <span className={`w-2 h-2 rounded-full ${priorityConfig[task.priority].color}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{task.title}</p>
                          <p className="text-xs text-slate-400">{formatDisplayDate(task.dueDate)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskModal && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative px-6 pt-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    {taskTypeConfig[selectedTask.type].icon}
                  </div>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ring-4 ${priorityConfig[selectedTask.priority].color} ${priorityConfig[selectedTask.priority].ring}`}></span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {priorityConfig[selectedTask.priority].label} Priority
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTask.title}</h2>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-6 pb-6 space-y-5">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedTask.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1.5">Assigned by</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {selectedTask.assignedBy.avatar}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedTask.assignedBy.name}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-1.5">Due date</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDisplayDate(selectedTask.dueDate)}</p>
                  </div>
                </div>

                {selectedTask.document && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{selectedTask.document}</p>
                      <p className="text-xs text-slate-400">Attached document</p>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                )}

                {selectedTask.status === "completed" && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Completed</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-500">{selectedTask.completedAt}</p>
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                {selectedTask.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowTaskModal(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCompleteTask(selectedTask.id)}
                      className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"
                    >
                      {taskTypeConfig[selectedTask.type].action}
                    </button>
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
