import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import formService from "@/services/form.service";

// ── Icon map ─────────────────────────────────
const templateIcons = {
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  receipt: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

const workflowActions = [
  { value: "fill", label: "Fill" },
  { value: "review", label: "Review" },
  { value: "approve", label: "Approve" },
  { value: "sign", label: "Sign" },
];

const workflowIcons = {
  fill: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  review: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  approve: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  sign: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
};

const statusConfig = {
  active: { label: "Active", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  draft: { label: "Draft", bg: "bg-slate-100 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
  completed: { label: "Completed", bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  cancelled: { label: "Cancelled", bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-500" },
};

const stepStatusConfig = {
  completed: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-2 ring-emerald-500/30", border: "border-emerald-200 dark:border-emerald-500/30", badge: "bg-emerald-500", icon: <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> },
  in_progress: { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", ring: "ring-2 ring-indigo-500/30", border: "border-indigo-200 dark:border-indigo-500/30", badge: "bg-indigo-500", icon: <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3" /></svg> },
  pending: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-400 dark:text-slate-500", ring: "", border: "border-slate-200 dark:border-slate-700", badge: "bg-slate-400", icon: null },
  skipped: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", ring: "", border: "border-amber-200 dark:border-amber-500/30", badge: "bg-amber-500", icon: null },
};

// ── Custom Select ────────────────────────────
function CustomSelect({ value, options, onChange, placeholder, renderValue, renderOption, dropUp }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left text-sm flex items-center justify-between gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
        {value ? renderValue(value) : <span className="text-slate-400 text-xs">{placeholder}</span>}
        <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className={`absolute ${dropUp ? "bottom-full mb-1" : "top-full mt-1"} left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto`}>
          {options.map((opt, i) => (
            <button key={opt.value || opt.id || i} type="button" onClick={() => { onChange(opt); setOpen(false); }} className="w-full px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 text-sm transition-colors">
              {renderOption(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Forms() {
  const [activeSection, setActiveSection] = useState("templates");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Data from API
  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form instance state
  const [newForm, setNewForm] = useState({
    name: "",
    formId: "",
    dueDate: "",
    workflowSteps: [{ id: Date.now(), userId: "", action: "" }],
  });

  // Create template state
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    description: "",
    icon: "document",
    category: "general",
    fields: [{ label: "", type: "text", required: false }],
  });

  // ─── Fetch data ─────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, instRes, usersRes] = await Promise.all([
        formService.getTemplates(),
        formService.getInstances(),
        formService.getUsers(),
      ]);
      if (tplRes.success) setTemplates(tplRes.data);
      if (instRes.success) setInstances(instRes.data);
      if (usersRes.success) setOrgUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch forms data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Handlers ───────────────────────────────
  const handleCreateTemplate = async () => {
    if (!newTemplate.title) return;
    try {
      const schema = {
        fields: newTemplate.fields.filter(f => f.label.trim()).map((f, i) => ({
          id: `field_${i}`,
          label: f.label,
          type: f.type,
          required: f.required,
        })),
      };
      const res = await formService.createTemplate({
        title: newTemplate.title,
        description: newTemplate.description,
        icon: newTemplate.icon,
        category: newTemplate.category,
        schema,
      });
      if (res.success) {
        setTemplates(prev => [res.data, ...prev]);
        setShowTemplateModal(false);
        setNewTemplate({ title: "", description: "", icon: "document", category: "general", fields: [{ label: "", type: "text", required: false }] });
      }
    } catch (err) {
      console.error("Create template error:", err);
    }
  };

  const handleUseTemplate = (template) => {
    setNewForm({ ...newForm, formId: template.id, name: `${template.title} - ${new Date().toLocaleDateString()}` });
    setShowCreateModal(true);
  };

  const handleCreateForm = async () => {
    if (!newForm.name || !newForm.formId) return;
    try {
      const payload = {
        name: newForm.name,
        formId: newForm.formId,
        dueDate: newForm.dueDate || null,
        workflowSteps: newForm.workflowSteps
          .filter(s => s.userId && s.action)
          .map(s => ({ userId: s.userId, action: s.action })),
      };
      const res = await formService.createInstance(payload);
      if (res.success) {
        await fetchData();
        setShowCreateModal(false);
        setNewForm({ name: "", formId: "", dueDate: "", workflowSteps: [{ id: Date.now(), userId: "", action: "" }] });
        setActiveSection("created");
      }
    } catch (err) {
      console.error("Create form error:", err);
    }
  };

  const handleDeleteInstance = async (id) => {
    if (!confirm("Delete this form instance?")) return;
    try {
      await formService.deleteInstance(id);
      setInstances(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error("Delete instance error:", err);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm("Delete this form template?")) return;
    try {
      await formService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Delete template error:", err);
    }
  };

  // Workflow step helpers
  const addWorkflowStep = () => {
    setNewForm(prev => ({ ...prev, workflowSteps: [...prev.workflowSteps, { id: Date.now(), userId: "", action: "" }] }));
  };
  const removeWorkflowStep = (id) => {
    setNewForm(prev => ({ ...prev, workflowSteps: prev.workflowSteps.filter(s => s.id !== id) }));
  };
  const updateWorkflowStep = (id, field, value) => {
    setNewForm(prev => ({
      ...prev,
      workflowSteps: prev.workflowSteps.map(s => s.id === id ? { ...s, [field]: typeof value === "object" ? value.value || value.id : value } : s),
    }));
  };

  // Template field helpers
  const addField = () => {
    setNewTemplate(prev => ({ ...prev, fields: [...prev.fields, { label: "", type: "text", required: false }] }));
  };
  const removeField = (idx) => {
    setNewTemplate(prev => ({ ...prev, fields: prev.fields.filter((_, i) => i !== idx) }));
  };
  const updateField = (idx, key, val) => {
    setNewTemplate(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === idx ? { ...f, [key]: val } : f),
    }));
  };

  // ─── Render ─────────────────────────────────
  const sections = [
    { id: "templates", label: "Templates", count: templates.length },
    { id: "created", label: "Created", count: instances.length },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Forms</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">Create and manage form templates and workflows</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTemplateModal(true)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Template
            </button>
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create Form
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 w-fit">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeSection === s.id ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}>
              {s.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeSection === s.id ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                {s.count}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Templates Grid */}
        {!loading && activeSection === "templates" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No templates yet</h3>
                <p className="text-sm text-slate-500">Create your first form template to get started</p>
              </div>
            ) : (
              templates.map((tpl, idx) => (
                <motion.div key={tpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className="group relative overflow-hidden border border-slate-200 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        {templateIcons[tpl.icon] || templateIcons.document}
                      </div>
                      <button onClick={() => handleDeleteTemplate(tpl.id)} className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{tpl.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{tpl.description || "No description"}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                          {tpl.schema?.fields?.length || 0} fields
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          {tpl.usageCount || 0} uses
                        </span>
                      </div>
                      <button onClick={() => handleUseTemplate(tpl)} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm hover:shadow transition-all">
                        Use Template
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Created Forms List */}
        {!loading && activeSection === "created" && (
          <div className="space-y-3">
            {instances.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No forms created yet</h3>
                <p className="text-sm text-slate-500">Use a template to create your first form</p>
              </div>
            ) : (
              instances.map((form, idx) => {
                const st = statusConfig[form.status] || statusConfig.draft;
                return (
                  <motion.div key={form.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Card className="p-4 sm:p-5 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                            <span className="text-xs text-slate-400">Based on {form.templateName || "Unknown"}</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{form.name}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            {form.dueDate && (
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Due: {new Date(form.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {form.workflow?.filter(s => s.status === "completed").length || 0}/{form.workflow?.length || 0} steps done
                            </div>
                          </div>
                        </div>

                        {/* Workflow Steps */}
                        {form.workflow && form.workflow.length > 0 && (
                          <div className="flex items-center gap-1">
                            {form.workflow.map((step, i) => {
                              const ss = stepStatusConfig[step.status] || stepStatusConfig.pending;
                              const icon = workflowIcons[step.action] || workflowIcons.fill;
                              return (
                                <div key={step.id || i} className="flex items-center">
                                  <div className="relative group">
                                    <div className={`w-10 h-10 rounded-full ${ss.bg} ${ss.ring} border ${ss.border} flex items-center justify-center transition-all duration-200 hover:scale-110`}>
                                      <span className={ss.text}>{icon}</span>
                                    </div>
                                    {step.status !== "pending" && (
                                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${ss.badge} flex items-center justify-center shadow-sm`}>
                                        {ss.icon}
                                      </div>
                                    )}
                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 shadow-xl">
                                      <div className="font-semibold">{step.user || "Unassigned"}</div>
                                      <div className="text-slate-400 capitalize flex items-center gap-1.5 mt-0.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${step.status === "completed" ? "bg-emerald-400" : step.status === "in_progress" ? "bg-indigo-400" : "bg-slate-400"}`} />
                                        {step.action} &bull; {(step.status || "pending").replace(/_/g, " ")}
                                      </div>
                                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45 bg-slate-900 dark:bg-slate-700" />
                                    </div>
                                  </div>
                                  {i < form.workflow.length - 1 && (
                                    <div className="relative w-8 h-[2px] mx-0.5">
                                      <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                      <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                        step.status === "completed" ? "bg-emerald-500 w-full" : step.status === "in_progress" ? "bg-indigo-500 w-1/2" : "w-0"
                                      }`} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDeleteInstance(form.id)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-500 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                            Delete
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

      {/* ═══ Create Form Modal ═══ */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Form</h2>
                    <p className="text-sm text-slate-500">Set up form details and workflow</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
                {/* Form Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Form Name</label>
                  <input type="text" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="Enter form name..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm" />
                </div>

                {/* Template */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Template</label>
                  <CustomSelect
                    value={templates.find(t => t.id === newForm.formId)}
                    options={templates}
                    onChange={(t) => setNewForm({ ...newForm, formId: t.id })}
                    placeholder="Select a template..."
                    renderValue={(t) => <span className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-indigo-500" /><span className="truncate">{t.title}</span></span>}
                    renderOption={(t) => (
                      <>
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">{templateIcons[t.icon] || templateIcons.document}</span>
                        <div className="flex-1 min-w-0"><div className="font-medium text-slate-900 dark:text-white text-sm">{t.title}</div><div className="text-xs text-slate-500 truncate">{t.description || "No description"}</div></div>
                      </>
                    )}
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
                  <input type="date" value={newForm.dueDate} onChange={(e) => setNewForm({ ...newForm, dueDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm" />
                </div>

                {/* Workflow Steps */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Workflow Steps</label>
                    <button type="button" onClick={addWorkflowStep} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Step
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newForm.workflowSteps.map((step, index) => (
                      <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow">{index + 1}</div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <CustomSelect
                            value={orgUsers.find(u => u.id === step.userId)}
                            options={orgUsers}
                            onChange={(u) => updateWorkflowStep(step.id, "userId", u.id)}
                            placeholder="Select user..."
                            dropUp={true}
                            renderValue={(u) => <span className="flex items-center gap-1 text-xs"><span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold shrink-0">{u.avatar}</span><span className="truncate">{u.name}</span></span>}
                            renderOption={(u) => (
                              <>
                                <span className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">{u.avatar}</span>
                                <div className="flex-1 min-w-0"><div className="font-medium text-slate-900 dark:text-white text-sm">{u.name}</div><div className="text-xs text-slate-500">{u.role}</div></div>
                              </>
                            )}
                          />
                          <CustomSelect
                            value={workflowActions.find(a => a.value === step.action)}
                            options={workflowActions}
                            onChange={(a) => updateWorkflowStep(step.id, "action", a.value)}
                            placeholder="Action..."
                            dropUp={true}
                            renderValue={(a) => <span className="text-xs">{a.label}</span>}
                            renderOption={(a) => <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{a.label}</span>}
                          />
                        </div>
                        {newForm.workflowSteps.length > 1 && (
                          <button type="button" onClick={() => removeWorkflowStep(step.id)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">Cancel</button>
                <button onClick={handleCreateForm} disabled={!newForm.name || !newForm.formId} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">Create Form</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Create Template Modal ═══ */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowTemplateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Template</h2>
                    <p className="text-sm text-slate-500">Define form fields and settings</p>
                  </div>
                </div>
                <button onClick={() => setShowTemplateModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Template Name</label>
                  <input type="text" value={newTemplate.title} onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })} placeholder="e.g., Employee Onboarding" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                  <textarea value={newTemplate.description} onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })} placeholder="What is this template for?" rows={2} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Icon</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {Object.keys(templateIcons).map(key => (
                        <button key={key} type="button" onClick={() => setNewTemplate({ ...newTemplate, icon: key })}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${newTemplate.icon === key ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600" : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300"}`}>
                          {templateIcons[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                    <select value={newTemplate.category} onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500">
                      <option value="general">General</option>
                      <option value="hr">HR</option>
                      <option value="finance">Finance</option>
                      <option value="legal">Legal</option>
                      <option value="operations">Operations</option>
                    </select>
                  </div>
                </div>

                {/* Fields */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Form Fields</label>
                    <button type="button" onClick={addField} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Field
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newTemplate.fields.map((field, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <input type="text" value={field.label} onChange={(e) => updateField(idx, "label", e.target.value)} placeholder="Field label" className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                        <select value={field.type} onChange={(e) => updateField(idx, "type", e.target.value)} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none">
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="textarea">Textarea</option>
                          <option value="select">Select</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="file">File</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer whitespace-nowrap">
                          <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, "required", e.target.checked)} className="rounded border-slate-300" />
                          Req
                        </label>
                        {newTemplate.fields.length > 1 && (
                          <button type="button" onClick={() => removeField(idx)} className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-colors shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button onClick={() => setShowTemplateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">Cancel</button>
                <button onClick={handleCreateTemplate} disabled={!newTemplate.title} className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">Create Template</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
