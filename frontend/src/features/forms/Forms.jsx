import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import OnlyOfficeEditor from "@/components/onlyoffice/OnlyOfficeEditor";
import formService from "@/services/form.service";
import folderService from "@/services/folder.service";

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

const categoryOptions = [
  { value: "general", label: "General", icon: "🏷️" },
  { value: "hr", label: "HR", icon: "👥" },
  { value: "finance", label: "Finance", icon: "💰" },
  { value: "legal", label: "Legal", icon: "⚖️" },
  { value: "operations", label: "Operations", icon: "⚙️" },
];

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
  const [showNewTemplateChoice, setShowNewTemplateChoice] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // OnlyOffice editor state
  const [editorConfig, setEditorConfig] = useState(null);
  const [editorDocName, setEditorDocName] = useState("");
  const [editorTemplateId, setEditorTemplateId] = useState(null);
  const [editorMode, setEditorMode] = useState("edit");
  const [editorDocId, setEditorDocId] = useState(null);

  // Data from API
  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Create form instance state
  const [newForm, setNewForm] = useState({
    name: "",
    formId: "",
    startDate: "",
    dueDate: "",
    workflowSteps: [{ id: Date.now(), userId: "", action: "" }],
  });

  // Create template state (for JSON schema templates — legacy)
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    description: "",
    icon: "document",
    category: "general",
    fields: [{ label: "", type: "text", required: false }],
  });

  // Upload template state
  const [uploadTemplate, setUploadTemplate] = useState({
    title: "",
    description: "",
    icon: "document",
    category: "general",
    file: null,
  });

  // Blank template state
  const [blankTemplate, setBlankTemplate] = useState({
    title: "",
    description: "",
    icon: "document",
    category: "general",
  });

  // Post-creation settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState(null); // template just created
  const [settingsForm, setSettingsForm] = useState({
    title: "", description: "", icon: "document", category: "general", folderId: null, notes: "",
  });

  // Template detail/action modal (click on card)
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Edit metadata modal
  const [showEditMetaModal, setShowEditMetaModal] = useState(false);
  const [editMetaForm, setEditMetaForm] = useState({
    title: "", description: "", icon: "document", category: "general",
  });
  const [editMetaId, setEditMetaId] = useState(null);

  // Folders
  const [folders, setFolders] = useState([]);

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: null, id: null, name: '' });

  // ─── Fetch data ─────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, instRes, usersRes, foldersRes] = await Promise.all([
        formService.getTemplates(),
        formService.getInstances(),
        formService.getUsers(),
        folderService.getAllFolders().catch(() => ({ success: false })),
      ]);
      if (tplRes.success) setTemplates(tplRes.data);
      if (instRes.success) setInstances(instRes.data);
      if (usersRes.success) setOrgUsers(usersRes.data);
      if (foldersRes.success) setFolders(foldersRes.data || []);
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

  // Create blank document template → show settings modal after creation
  const handleCreateBlankTemplate = async () => {
    setTemplateLoading(true);
    try {
      const title = blankTemplate.title?.trim() || `Untitled Template ${new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
      const res = await formService.createBlankTemplate({ ...blankTemplate, title });
      if (res.success) {
        const tpl = res.data.template;
        setTemplates(prev => [tpl, ...prev]);
        setShowNewTemplateChoice(false);
        setBlankTemplate({ title: "", description: "", icon: "document", category: "general" });
        // Show post-creation settings modal
        setCreatedTemplate(tpl);
        setSettingsForm({
          title: tpl.title, description: tpl.description || "", icon: tpl.icon || "document",
          category: tpl.category || "general", folderId: null, notes: "",
        });
        setShowSettingsModal(true);
      }
    } catch (err) {
      console.error("Create blank template error:", err);
    } finally {
      setTemplateLoading(false);
    }
  };

  // Upload file as template (PDF→DOCX) → show settings modal after creation
  const handleUploadTemplate = async () => {
    if (!uploadTemplate.file) return;
    setTemplateLoading(true);
    try {
      const res = await formService.uploadFileTemplate(uploadTemplate.file, {
        title: uploadTemplate.title || uploadTemplate.file.name.replace(/\.[^.]+$/, ''),
        description: uploadTemplate.description,
        icon: uploadTemplate.icon,
        category: uploadTemplate.category,
      });
      if (res.success) {
        const tpl = res.data.template;
        setTemplates(prev => [tpl, ...prev]);
        setShowUploadModal(false);
        setUploadTemplate({ title: "", description: "", icon: "document", category: "general", file: null });
        // Show post-creation settings modal
        setCreatedTemplate(tpl);
        setSettingsForm({
          title: tpl.title, description: tpl.description || "", icon: tpl.icon || "document",
          category: tpl.category || "general", folderId: null, notes: "",
        });
        setShowSettingsModal(true);
      }
    } catch (err) {
      console.error("Upload template error:", err);
    } finally {
      setTemplateLoading(false);
    }
  };

  // Save post-creation settings and optionally continue editing
  const handleSaveSettings = async (continueEditing = false) => {
    if (!createdTemplate) return;
    try {
      // Update template metadata
      await formService.updateTemplate(createdTemplate.id, {
        title: settingsForm.title,
        description: settingsForm.description,
        icon: settingsForm.icon,
        category: settingsForm.category,
      });
      // Move document to folder if selected
      if (settingsForm.folderId && createdTemplate.schema?.documentId) {
        await folderService.moveDocument(createdTemplate.schema.documentId, settingsForm.folderId).catch(() => {});
      }
      // Update local state
      setTemplates(prev => prev.map(t => t.id === createdTemplate.id
        ? { ...t, title: settingsForm.title, description: settingsForm.description, icon: settingsForm.icon, category: settingsForm.category }
        : t
      ));
      setShowSettingsModal(false);
      if (continueEditing) {
        await openTemplateInEditor(createdTemplate.id);
      }
      setCreatedTemplate(null);
    } catch (err) {
      console.error("Save settings error:", err);
    }
  };

  // Open a template's document in OnlyOffice editor
  const openTemplateInEditor = async (templateId, mode = 'edit') => {
    try {
      const res = await formService.getTemplateDocument(templateId, mode);
      if (res.success) {
        setEditorConfig(res.data.config);
        setEditorDocName(res.data.templateTitle || res.data.document.originalFilename);
        setEditorDocId(res.data.document?.id || null);
        setEditorTemplateId(templateId);
        setEditorMode(mode);
        setSelectedTemplate(null); // close detail modal if open
      }
    } catch (err) {
      console.error("Open template in editor error:", err);
    }
  };

  const closeEditor = () => {
    setEditorConfig(null);
    setEditorDocName("");
    setEditorTemplateId(null);
    setEditorDocId(null);
    setEditorMode("edit");
    fetchData(); // Refresh data after editing
  };

  // Template card click → open detail/actions modal
  const handleTemplateClick = (tpl) => {
    setSelectedTemplate(tpl);
  };

  // Open edit metadata modal
  const handleEditMeta = (tpl, e) => {
    if (e) e.stopPropagation();
    setEditMetaId(tpl.id);
    setEditMetaForm({
      title: tpl.title, description: tpl.description || "",
      icon: tpl.icon || "document", category: tpl.category || "general",
    });
    setSelectedTemplate(null);
    setShowEditMetaModal(true);
  };

  // Save metadata edits
  const handleSaveMetaEdit = async () => {
    if (!editMetaId) return;
    try {
      const res = await formService.updateTemplate(editMetaId, editMetaForm);
      if (res.success) {
        setTemplates(prev => prev.map(t => t.id === editMetaId ? { ...t, ...editMetaForm } : t));
        setShowEditMetaModal(false);
        setEditMetaId(null);
      }
    } catch (err) {
      console.error("Update template metadata error:", err);
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
        startDate: newForm.startDate || null,
        dueDate: newForm.dueDate || null,
        workflowSteps: newForm.workflowSteps
          .filter(s => s.userId && s.action)
          .map(s => ({ userId: s.userId, action: s.action })),
      };
      const res = await formService.createInstance(payload);
      if (res.success) {
        await fetchData();
        setShowCreateModal(false);
        setNewForm({ name: "", formId: "", startDate: "", dueDate: "", workflowSteps: [{ id: Date.now(), userId: "", action: "" }] });
        setActiveSection("created");
      }
    } catch (err) {
      console.error("Create form error:", err);
    }
  };

  const handleDeleteInstance = (id, name) => {
    setDeleteConfirm({ show: true, type: 'instance', id, name: name || 'this form' });
  };

  const handleDeleteTemplate = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, type: 'template', id, name: name || 'this template' });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteConfirm;
    try {
      if (type === 'template') {
        await formService.deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else if (type === 'instance') {
        await formService.deleteInstance(id);
        setInstances(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error(`Delete ${type} error:`, err);
    } finally {
      setDeleteConfirm({ show: false, type: null, id: null, name: '' });
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
            <button onClick={() => setShowNewTemplateChoice(true)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
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
                  <Card
                    onClick={() => tpl.schema?.documentId ? openTemplateInEditor(tpl.id, 'view') : handleTemplateClick(tpl)}
                    className="group relative overflow-hidden border border-slate-200 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 p-5 cursor-pointer"
                  >
                    {/* Top row: icon + type badge + edit/delete */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          {templateIcons[tpl.icon] || templateIcons.document}
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                          tpl.schema?.type === 'document-template'
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          {tpl.schema?.type === 'document-template' ? 'Document' : 'Schema'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUseTemplate(tpl); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-all"
                          title="Assign Task"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        </button>
                        <button
                          onClick={(e) => handleEditMeta(tpl, e)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-500/10 text-slate-400 hover:text-violet-500 transition-all"
                          title="Edit Template"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(tpl.id, tpl.title, e); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>

                    {/* Title & description */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{tpl.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[2.5rem]">{tpl.description || "No description"}</p>

                    {/* Footer: stats + category */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {tpl.schema?.type === 'document-template' ? (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            DOCX
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                            {tpl.schema?.fields?.length || 0} fields
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          {tpl.usageCount || 0} uses
                        </span>
                      </div>
                      {tpl.category && (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{tpl.category}</span>
                      )}
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
                            {form.startDate && (
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Start: {new Date(form.startDate).toLocaleDateString()}
                              </div>
                            )}
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
                          <button onClick={() => handleDeleteInstance(form.id, form.name)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-500 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
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

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
                    <input type="date" value={newForm.startDate} onChange={(e) => setNewForm({ ...newForm, startDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
                    <input type="date" value={newForm.dueDate} onChange={(e) => setNewForm({ ...newForm, dueDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm [color-scheme:dark]" />
                  </div>
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
                    <CustomSelect
                      value={categoryOptions.find(c => c.value === newTemplate.category)}
                      options={categoryOptions}
                      onChange={(opt) => setNewTemplate({ ...newTemplate, category: opt.value })}
                      placeholder="Select category..."
                      renderValue={(c) => <span className="flex items-center gap-2 text-sm"><span>{c.icon}</span>{c.label}</span>}
                      renderOption={(c) => <span className="flex items-center gap-2"><span>{c.icon}</span><span className="font-medium text-slate-700 dark:text-slate-200">{c.label}</span></span>}
                    />
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

      {/* ═══ New Template Choice Modal ═══ */}
      <AnimatePresence>
        {showNewTemplateChoice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowNewTemplateChoice(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Template</h2>
                  <button onClick={() => setShowNewTemplateChoice(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Choose how you'd like to start</p>
              </div>

              {/* Options */}
              <div className="px-6 pb-4 space-y-3">
                {/* Option 1: Create Blank — directly clickable */}
                <button
                  onClick={handleCreateBlankTemplate}
                  disabled={templateLoading}
                  className="w-full p-5 rounded-2xl border-2 border-indigo-100 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/5 dark:to-blue-500/5 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Blank Document</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Start fresh with an empty document. Opens directly in the editor.</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </button>

                {/* Option 2: Upload Existing */}
                <button
                  onClick={() => { setShowNewTemplateChoice(false); setShowUploadModal(true); }}
                  disabled={templateLoading}
                  className="w-full p-5 rounded-2xl border-2 border-violet-100 dark:border-violet-500/20 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-500/5 dark:to-purple-500/5 hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-violet-100 dark:border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform shrink-0">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Upload File</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Upload a DOCX or PDF file. PDF will be auto-converted for editing.</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-500 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </button>

                {/* Divider */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
                  <div className="relative flex justify-center"><span className="px-3 bg-white dark:bg-slate-900 text-xs text-slate-400 uppercase tracking-wider">or</span></div>
                </div>

                {/* Option 3: JSON Schema (legacy) */}
                <button
                  onClick={() => { setShowNewTemplateChoice(false); setShowTemplateModal(true); }}
                  className="w-full p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Form Schema Template</h3>
                      <p className="text-xs text-slate-400">Define form fields manually (no document)</p>
                    </div>
                  </div>
                </button>
              </div>

              {templateLoading && (
                <div className="px-6 pb-5">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Creating blank template...</span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Upload Template Modal ═══ */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { if (!templateLoading) setShowUploadModal(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-700/50" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-6 pt-6 pb-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Template</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Upload a DOCX or PDF file as template</p>
                    </div>
                  </div>
                  <button onClick={() => { if (!templateLoading) setShowUploadModal(false); }} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 my-3 border-t border-slate-100 dark:border-slate-800" />

              {/* Body */}
              <div className="px-6 pb-4 space-y-4 flex-1 overflow-y-auto">
                {/* File Upload Area */}
                <div>
                  <div className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer ${uploadTemplate.file ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5' : 'border-slate-300 dark:border-slate-600 hover:border-violet-400 dark:hover:border-violet-500/40 hover:bg-violet-50/30 dark:hover:bg-violet-500/5'}`}>
                    {uploadTemplate.file ? (
                      <div className="p-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${uploadTemplate.file.type.includes('pdf') ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                            {uploadTemplate.file.type.includes('pdf') ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{uploadTemplate.file.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500">{(uploadTemplate.file.size / 1024).toFixed(1)} KB</span>
                              {uploadTemplate.file.type.includes('pdf') && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                  Will convert to DOCX
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setUploadTemplate({ ...uploadTemplate, file: null }); }} className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">File ready to upload</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-violet-500 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Click to browse or drag & drop</p>
                        <p className="text-xs text-slate-400">Supports DOCX, PDF, DOC, ODT (max 50MB)</p>
                        <div className="flex items-center justify-center gap-3 mt-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-xs text-blue-600 dark:text-blue-400 font-medium">DOCX</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-xs text-rose-600 dark:text-rose-400 font-medium">PDF</span>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".docx,.pdf,.doc,.odt,.rtf"
                      onChange={(e) => { if (e.target.files?.[0]) setUploadTemplate({ ...uploadTemplate, file: e.target.files[0], title: uploadTemplate.title || e.target.files[0].name.replace(/\.[^.]+$/, '') }); }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Template Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Template Name</label>
                  <input type="text" value={uploadTemplate.title} onChange={(e) => setUploadTemplate({ ...uploadTemplate, title: e.target.value })} placeholder="Auto-filled from filename" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description <span className="normal-case font-normal">(optional)</span></label>
                  <textarea value={uploadTemplate.description} onChange={(e) => setUploadTemplate({ ...uploadTemplate, description: e.target.value })} placeholder="What is this template for?" rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm resize-none" />
                </div>

                {/* Icon & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Icon</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.keys(templateIcons).map(key => (
                        <button key={key} type="button" onClick={() => setUploadTemplate({ ...uploadTemplate, icon: key })}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${uploadTemplate.icon === key ? "border-violet-500 bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 shadow-sm shadow-violet-500/20" : "border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300"}`}>
                          {templateIcons[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <CustomSelect
                      value={categoryOptions.find(c => c.value === uploadTemplate.category)}
                      options={categoryOptions}
                      onChange={(opt) => setUploadTemplate({ ...uploadTemplate, category: opt.value })}
                      placeholder="Select category..."
                      renderValue={(c) => <span className="flex items-center gap-2 text-sm"><span>{c.icon}</span>{c.label}</span>}
                      renderOption={(c) => <span className="flex items-center gap-2"><span>{c.icon}</span><span className="font-medium text-slate-700 dark:text-slate-200">{c.label}</span></span>}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button onClick={() => { if (!templateLoading) setShowUploadModal(false); }} disabled={templateLoading} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm disabled:opacity-50">Cancel</button>
                <button onClick={handleUploadTemplate} disabled={!uploadTemplate.file || templateLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
                  {templateLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {uploadTemplate.file?.type?.includes('pdf') ? 'Converting...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Upload Template
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Post-Creation Settings Modal ═══ */}
      <AnimatePresence>
        {showSettingsModal && createdTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-700/50" onClick={(e) => e.stopPropagation()}>
              {/* Success Header */}
              <div className="px-6 pt-6 pb-2 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Template Created!</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure your template settings before you start</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 my-2 border-t border-slate-100 dark:border-slate-800" />

              {/* Body */}
              <div className="px-6 pb-4 space-y-4 flex-1 overflow-y-auto">
                {/* Template Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Template Name</label>
                  <input type="text" value={settingsForm.title} onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })} placeholder="Enter template name..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description <span className="normal-case font-normal">(optional)</span></label>
                  <textarea value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} placeholder="What is this template for?" rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm resize-none" />
                </div>

                {/* Store in Folder */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Store in Folder <span className="normal-case font-normal">(optional)</span></label>
                  <CustomSelect
                    value={folders.find(f => f.id === settingsForm.folderId) || { id: null, name: "Root (no folder)" }}
                    options={[{ id: null, name: "Root (no folder)", icon: "📁" }, ...folders.map(f => ({ ...f, icon: "📂" }))]}
                    onChange={(opt) => setSettingsForm({ ...settingsForm, folderId: opt.id })}
                    placeholder="Select folder..."
                    renderValue={(f) => <span className="flex items-center gap-2 text-sm"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>{f.name}</span>}
                    renderOption={(f) => <span className="flex items-center gap-2"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg><span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{f.name}</span></span>}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes <span className="normal-case font-normal">(optional)</span></label>
                  <textarea value={settingsForm.notes} onChange={(e) => setSettingsForm({ ...settingsForm, notes: e.target.value })} placeholder="Internal notes about this template..." rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm resize-none" />
                </div>

                {/* Icon & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Icon</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.keys(templateIcons).map(key => (
                        <button key={key} type="button" onClick={() => setSettingsForm({ ...settingsForm, icon: key })}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${settingsForm.icon === key ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/20" : "border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300"}`}>
                          {templateIcons[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <CustomSelect
                      value={categoryOptions.find(c => c.value === settingsForm.category)}
                      options={categoryOptions}
                      onChange={(opt) => setSettingsForm({ ...settingsForm, category: opt.value })}
                      placeholder="Select category..."
                      renderValue={(c) => <span className="flex items-center gap-2 text-sm"><span>{c.icon}</span>{c.label}</span>}
                      renderOption={(c) => <span className="flex items-center gap-2"><span>{c.icon}</span><span className="font-medium text-slate-700 dark:text-slate-200">{c.label}</span></span>}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                <button onClick={() => handleSaveSettings(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm">
                  Save & Close
                </button>
                {createdTemplate?.schema?.documentId && (
                  <button onClick={() => handleSaveSettings(true)} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Continue Editing
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Template Detail / Action Modal ═══ */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedTemplate(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    {templateIcons[selectedTemplate.icon] || templateIcons.document}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{selectedTemplate.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{selectedTemplate.description || "No description"}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                        selectedTemplate.schema?.type === 'document-template'
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        {selectedTemplate.schema?.type === 'document-template' ? 'Document' : 'Schema'}
                      </span>
                      <span className="text-xs text-slate-400">{selectedTemplate.usageCount || 0} uses</span>
                      {selectedTemplate.category && <span className="text-xs text-slate-400 capitalize">{selectedTemplate.category}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 space-y-2">
                {/* Edit Document (only for document-backed templates) */}
                {selectedTemplate.schema?.documentId && (
                  <button
                    onClick={() => openTemplateInEditor(selectedTemplate.id, 'edit')}
                    className="w-full p-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-md text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Document</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Open in editor to modify content</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* View Document (read-only, only for document-backed templates) */}
                {selectedTemplate.schema?.documentId && (
                  <button
                    onClick={() => openTemplateInEditor(selectedTemplate.id, 'view')}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md text-left transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-600 dark:bg-slate-500 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">View Document</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Open read-only preview</p>
                      </div>
                    </div>
                  </button>
                )}

                {/* Edit Metadata */}
                <button
                  onClick={() => handleEditMeta(selectedTemplate)}
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Metadata</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Change name, description, category</p>
                    </div>
                  </div>
                </button>

                {/* Assign Task */}
                <button
                  onClick={() => { handleUseTemplate(selectedTemplate); setSelectedTemplate(null); }}
                  className="w-full p-4 rounded-2xl border-2 border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:shadow-md text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Task</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Create a new form and assign to users</p>
                    </div>
                  </div>
                </button>

                {/* Cancel */}
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Edit Metadata Modal ═══ */}
      <AnimatePresence>
        {showEditMetaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowEditMetaModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/50 dark:border-slate-700/50" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Template</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Update template details</p>
                    </div>
                  </div>
                  <button onClick={() => setShowEditMetaModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 my-3 border-t border-slate-100 dark:border-slate-800" />

              {/* Body */}
              <div className="px-6 pb-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Template Name</label>
                  <input type="text" value={editMetaForm.title} onChange={(e) => setEditMetaForm({ ...editMetaForm, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={editMetaForm.description} onChange={(e) => setEditMetaForm({ ...editMetaForm, description: e.target.value })} rows={3} placeholder="What is this template for?" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm resize-none" />
                </div>

                {/* Icon & Category in a nicer layout */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Icon</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.keys(templateIcons).map(key => (
                        <button key={key} type="button" onClick={() => setEditMetaForm({ ...editMetaForm, icon: key })}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${editMetaForm.icon === key ? "border-violet-500 bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 shadow-sm shadow-violet-500/20" : "border-transparent bg-slate-50 dark:bg-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300"}`}>
                          {templateIcons[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <CustomSelect
                      value={categoryOptions.find(c => c.value === editMetaForm.category)}
                      options={categoryOptions}
                      onChange={(opt) => setEditMetaForm({ ...editMetaForm, category: opt.value })}
                      placeholder="Select category..."
                      renderValue={(c) => <span className="flex items-center gap-2 text-sm"><span>{c.icon}</span>{c.label}</span>}
                      renderOption={(c) => <span className="flex items-center gap-2"><span>{c.icon}</span><span className="font-medium text-slate-700 dark:text-slate-200">{c.label}</span></span>}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button onClick={() => setShowEditMetaModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm">Cancel</button>
                <button onClick={handleSaveMetaEdit} disabled={!editMetaForm.title} className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Delete Confirmation Modal ═══ */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setDeleteConfirm({ show: false, type: null, id: null, name: '' })}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.15 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200/50 dark:border-slate-700/50" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>

                {/* Text */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-1">
                  Delete {deleteConfirm.type === 'template' ? 'Template' : 'Form'}?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1">
                  Are you sure you want to delete
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center mb-4 px-4 truncate">
                  "{deleteConfirm.name}"
                </p>
                <p className="text-xs text-rose-500 dark:text-rose-400 text-center bg-rose-50 dark:bg-rose-500/10 rounded-lg py-2 px-3">
                  This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button onClick={() => setDeleteConfirm({ show: false, type: null, id: null, name: '' })} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm">
                  Cancel
                </button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-lg shadow-rose-500/25 transition-all text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ OnlyOffice Editor Overlay ═══ */}
      {editorConfig && (
        <OnlyOfficeEditor
          config={editorConfig}
          onClose={closeEditor}
          documentName={editorDocName}
          documentId={editorDocId}
          onSwitchToEdit={editorMode === 'view' && editorTemplateId ? () => openTemplateInEditor(editorTemplateId, 'edit') : undefined}
        />
      )}
    </DashboardLayout>
  );
}