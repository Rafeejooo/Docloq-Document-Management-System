import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";

export default function Forms() {
  const [activeSection, setActiveSection] = useState("templates");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Custom Select Dropdown State
  const [openDropdown, setOpenDropdown] = useState(null);

  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Employee Onboarding",
      description: "New employee onboarding form with personal details and emergency contacts",
      fields: 12,
      icon: "user",
      createdAt: "Dec 15, 2025",
      usageCount: 45,
    },
    {
      id: 2,
      name: "Leave Request",
      description: "Standard leave request form for vacation, sick leave, or personal days",
      fields: 6,
      icon: "calendar",
      createdAt: "Dec 10, 2025",
      usageCount: 120,
    },
    {
      id: 3,
      name: "Expense Report",
      description: "Monthly expense report with receipt attachments and category breakdown",
      fields: 8,
      icon: "receipt",
      createdAt: "Dec 5, 2025",
      usageCount: 89,
    },
    {
      id: 4,
      name: "Performance Review",
      description: "Quarterly performance review form with goals and feedback sections",
      fields: 15,
      icon: "star",
      createdAt: "Nov 28, 2025",
      usageCount: 34,
    },
  ]);

  const [createdForms, setCreatedForms] = useState([
    {
      id: 1,
      name: "Q1 Performance Review - Marketing Team",
      templateId: 4,
      templateName: "Performance Review",
      status: "active",
      createdAt: "Dec 20, 2025",
      dueDate: "Jan 15, 2026",
      responses: 8,
      totalAssigned: 12,
      workflow: [
        { step: 1, user: "John Doe", action: "fill", status: "completed" },
        { step: 2, user: "Jane Smith", action: "review", status: "in-progress" },
        { step: 3, user: "Mike Johnson", action: "approve", status: "pending" },
      ],
    },
    {
      id: 2,
      name: "December 2025 Expense Reports",
      templateId: 3,
      templateName: "Expense Report",
      status: "active",
      createdAt: "Dec 15, 2025",
      dueDate: "Jan 5, 2026",
      responses: 15,
      totalAssigned: 20,
      workflow: [
        { step: 1, user: "All Employees", action: "fill", status: "in-progress" },
        { step: 2, user: "Finance Team", action: "approve", status: "pending" },
      ],
    },
    {
      id: 3,
      name: "New Hire Onboarding - January 2026",
      templateId: 1,
      templateName: "Employee Onboarding",
      status: "draft",
      createdAt: "Dec 28, 2025",
      dueDate: "Jan 10, 2026",
      responses: 0,
      totalAssigned: 5,
      workflow: [
        { step: 1, user: "New Hires", action: "fill", status: "pending" },
        { step: 2, user: "HR Team", action: "review", status: "pending" },
        { step: 3, user: "Department Head", action: "sign", status: "pending" },
      ],
    },
  ]);

  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", avatar: "JD", role: "Manager" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", avatar: "JS", role: "HR Lead" },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", avatar: "MJ", role: "Director" },
    { id: 4, name: "Sarah Wilson", email: "sarah@example.com", avatar: "SW", role: "Finance" },
    { id: 5, name: "Tom Brown", email: "tom@example.com", avatar: "TB", role: "Developer" },
    { id: 6, name: "All Employees", email: "all@example.com", avatar: "AE", role: "Group" },
  ];

  const workflowActions = [
    { value: "fill", label: "Fill Form" },
    { value: "review", label: "Review" },
    { value: "approve", label: "Approve" },
    { value: "sign", label: "Sign" },
  ];

  const templateIcons = {
    user: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    calendar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    receipt: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
    star: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  };

  const [newForm, setNewForm] = useState({
    name: "",
    templateId: null,
    dueDate: "",
    workflowSteps: [{ id: 1, user: null, action: null }],
  });

  const statusConfig = {
    active: { label: "Active", bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
    draft: { label: "Draft", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
    completed: { label: "Completed", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500" },
  };

  const stepStatusConfig = {
    completed: { 
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ), 
      badge: "bg-emerald-500 text-white",
      ring: "ring-2 ring-emerald-500/30",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/30",
      text: "text-emerald-600 dark:text-emerald-400"
    },
    "in-progress": { 
      icon: (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ), 
      badge: "bg-indigo-500 text-white",
      ring: "ring-2 ring-indigo-500/30",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      border: "border-indigo-200 dark:border-indigo-500/30",
      text: "text-indigo-600 dark:text-indigo-400"
    },
    pending: { 
      icon: null, 
      badge: "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400",
      ring: "",
      bg: "bg-slate-50 dark:bg-slate-800/50",
      border: "border-slate-200 dark:border-slate-700",
      text: "text-slate-400 dark:text-slate-500"
    },
  };

  const workflowIcons = {
    fill: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    review: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    approve: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    sign: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  };

  const addWorkflowStep = () => {
    setNewForm((prev) => ({
      ...prev,
      workflowSteps: [
        ...prev.workflowSteps,
        { id: prev.workflowSteps.length + 1, user: null, action: null },
      ],
    }));
  };

  const removeWorkflowStep = (stepId) => {
    if (newForm.workflowSteps.length > 1) {
      setNewForm((prev) => ({
        ...prev,
        workflowSteps: prev.workflowSteps.filter((s) => s.id !== stepId),
      }));
    }
  };

  const updateWorkflowStep = (stepId, field, value) => {
    setNewForm((prev) => ({
      ...prev,
      workflowSteps: prev.workflowSteps.map((s) =>
        s.id === stepId ? { ...s, [field]: value } : s
      ),
    }));
    setOpenDropdown(null);
  };

  const handleCreateForm = () => {
    const template = templates.find((t) => t.id === newForm.templateId);
    const form = {
      id: createdForms.length + 1,
      name: newForm.name,
      templateId: newForm.templateId,
      templateName: template?.name || "Custom",
      status: "draft",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      dueDate: newForm.dueDate,
      responses: 0,
      totalAssigned: newForm.workflowSteps.length,
      workflow: newForm.workflowSteps.map((s, i) => ({
        step: i + 1,
        user: s.user?.name || "",
        action: s.action?.value || "",
        status: "pending",
      })),
    };
    setCreatedForms((prev) => [form, ...prev]);
    setShowCreateModal(false);
    setNewForm({ name: "", templateId: null, dueDate: "", workflowSteps: [{ id: 1, user: null, action: null }] });
    setActiveSection("created");
  };

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setNewForm({ ...newForm, templateId: template.id, name: `${template.name} - ${new Date().toLocaleDateString()}` });
    setShowCreateModal(true);
  };

  // Custom Select Component
  const CustomSelect = ({ value, options, onChange, placeholder, dropdownId, renderOption, renderValue }) => {
    const isOpen = openDropdown === dropdownId;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenDropdown(isOpen ? null : dropdownId)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 transition-all ${
            isOpen
              ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <span className={value ? "text-slate-900 dark:text-white" : "text-slate-400"}>
            {value ? renderValue(value) : placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20"
              >
                {options.map((option, index) => (
                  <button
                    key={option.id || option.value || index}
                    type="button"
                    onClick={() => onChange(option)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      value && (value.id === option.id || value.value === option.value)
                        ? "bg-indigo-50 dark:bg-indigo-500/10"
                        : ""
                    }`}
                  >
                    {renderOption(option)}
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
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Forms</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create reusable form templates and manage form workflows
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Form
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {[
            { key: "templates", label: "Templates", count: templates.length },
            { key: "created", label: "Created", count: createdForms.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                activeSection === tab.key
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeSection === tab.key
                  ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Templates Section */}
        {activeSection === "templates" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Top Border Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {templateIcons[template.icon]}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{template.fields} fields</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-xs text-slate-400">
                        Used <span className="font-semibold text-slate-600 dark:text-slate-300">{template.usageCount}</span> times
                      </div>
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Add New Template Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: templates.length * 0.05 }}
            >
              <Card className="h-full min-h-[240px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer group transition-all">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                    <svg className="w-7 h-7 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Create New Template
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Created Forms Section */}
        {activeSection === "created" && (
          <div className="space-y-4">
            {createdForms.length === 0 ? (
              <Card className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No forms created yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Start by selecting a template and creating a new form
                </p>
                <button
                  onClick={() => setActiveSection("templates")}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Browse Templates
                </button>
              </Card>
            ) : (
              createdForms.map((form, index) => {
                const status = statusConfig[form.status];
                return (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Form Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                              {status.label}
                            </span>
                            <span className="text-xs text-slate-400">Based on {form.templateName}</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{form.name}</h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Due: {form.dueDate}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              {form.responses}/{form.totalAssigned} responses
                            </div>
                          </div>
                        </div>

                        {/* Workflow Steps */}
                        <div className="flex items-center gap-1">
                          {form.workflow.map((step, i) => {
                            const stepStatus = stepStatusConfig[step.status];
                            const stepIcon = workflowIcons[step.action] || workflowIcons.fill;
                            return (
                              <div key={i} className="flex items-center">
                                <div className="relative group">
                                  {/* Step bubble */}
                                  <div className={`w-10 h-10 rounded-full ${stepStatus.bg} ${stepStatus.ring} border ${stepStatus.border} flex items-center justify-center transition-all duration-200 hover:scale-110`}>
                                    <span className={stepStatus.text}>
                                      {stepIcon}
                                    </span>
                                  </div>
                                  
                                  {/* Status indicator */}
                                  {step.status !== "pending" && (
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${stepStatus.badge} flex items-center justify-center shadow-sm`}>
                                      {stepStatus.icon}
                                    </div>
                                  )}
                                  
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 shadow-xl">
                                    <div className="font-semibold">{step.user}</div>
                                    <div className="text-slate-400 capitalize flex items-center gap-1.5 mt-0.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${step.status === 'completed' ? 'bg-emerald-400' : step.status === 'in-progress' ? 'bg-indigo-400' : 'bg-slate-400'}`}></span>
                                      {step.action} • {step.status.replace('-', ' ')}
                                    </div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45 bg-slate-900 dark:bg-slate-700"></div>
                                  </div>
                                </div>
                                
                                {/* Connector line */}
                                {i < form.workflow.length - 1 && (
                                  <div className="relative w-8 h-[2px] mx-0.5">
                                    <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    <div 
                                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                        step.status === "completed" ? "bg-emerald-500 w-full" : step.status === "in-progress" ? "bg-indigo-500 w-1/2" : "w-0"
                                      }`}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            View
                          </button>
                          <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            Manage
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowCreateModal(false);
              setOpenDropdown(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Form</h2>
                      <p className="text-sm text-slate-500">Set up form details and workflow</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setOpenDropdown(null);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Form Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Form Name
                  </label>
                  <input
                    type="text"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    placeholder="Enter form name..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Template
                  </label>
                  <CustomSelect
                    value={templates.find((t) => t.id === newForm.templateId)}
                    options={templates}
                    onChange={(template) => setNewForm({ ...newForm, templateId: template.id })}
                    placeholder="Select a template..."
                    dropdownId="template-select"
                    renderValue={(template) => (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                        {template.name}
                      </span>
                    )}
                    renderOption={(template) => (
                      <>
                        <span className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                          {templateIcons[template.icon]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white">{template.name}</div>
                          <div className="text-xs text-slate-500 truncate">{template.description}</div>
                        </div>
                      </>
                    )}
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newForm.dueDate}
                    onChange={(e) => setNewForm({ ...newForm, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                  />
                </div>

                {/* Workflow Steps */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Workflow Steps
                    </label>
                    <button
                      type="button"
                      onClick={addWorkflowStep}
                      className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Step
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newForm.workflowSteps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow">
                          {index + 1}
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-3">
                          {/* User Select */}
                          <CustomSelect
                            value={step.user}
                            options={users}
                            onChange={(user) => updateWorkflowStep(step.id, "user", user)}
                            placeholder="Select user..."
                            dropdownId={`user-select-${step.id}`}
                            renderValue={(user) => (
                              <span className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                  {user.avatar}
                                </span>
                                <span className="truncate">{user.name}</span>
                              </span>
                            )}
                            renderOption={(user) => (
                              <>
                                <span className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">
                                  {user.avatar}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                                  <div className="text-xs text-slate-500">{user.role}</div>
                                </div>
                              </>
                            )}
                          />

                          {/* Action Select */}
                          <CustomSelect
                            value={step.action}
                            options={workflowActions}
                            onChange={(action) => updateWorkflowStep(step.id, "action", action)}
                            placeholder="Select action..."
                            dropdownId={`action-select-${step.id}`}
                            renderValue={(action) => (
                              <span>{action.label}</span>
                            )}
                            renderOption={(action) => (
                              <span className="font-medium text-slate-700 dark:text-slate-200">{action.label}</span>
                            )}
                          />
                        </div>

                        {/* Remove Step */}
                        {newForm.workflowSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWorkflowStep(step.id)}
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setOpenDropdown(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateForm}
                  disabled={!newForm.name || !newForm.templateId}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Form
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
