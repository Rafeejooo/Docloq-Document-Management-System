import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";

// Permission Icons as SVG components
const PermissionIcons = {
  none: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  viewer: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  editor: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  admin: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

// Permission levels for documents
const PERMISSION_LEVELS = [
  { id: "none", name: "No Access", color: "slate" },
  { id: "viewer", name: "Viewer", color: "emerald", desc: "Can view only" },
  { id: "editor", name: "Editor", color: "blue", desc: "Can view & edit" },
  { id: "admin", name: "Admin", color: "violet", desc: "Full access" },
];

// Sample folder/document structure
const FOLDER_STRUCTURE = [
  {
    id: "folder-1",
    name: "Contracts",
    documents: [
      { id: "doc-1", name: "Master Agreement 2025.pdf", type: "PDF" },
      { id: "doc-2", name: "Vendor Contract.docx", type: "DOCX" },
      { id: "doc-3", name: "Service Agreement.pdf", type: "PDF" },
      { id: "doc-4", name: "Partnership Deal.pdf", type: "PDF" },
    ],
  },
  {
    id: "folder-2",
    name: "Financial Reports",
    documents: [
      { id: "doc-5", name: "Q4 2025 Report.xlsx", type: "XLSX" },
      { id: "doc-6", name: "Budget 2026.xlsx", type: "XLSX" },
      { id: "doc-7", name: "Expense Summary.pdf", type: "PDF" },
      { id: "doc-8", name: "Revenue Analysis.xlsx", type: "XLSX" },
    ],
  },
  {
    id: "folder-3",
    name: "HR Documents",
    documents: [
      { id: "doc-9", name: "Employee Handbook.pdf", type: "PDF" },
      { id: "doc-10", name: "Leave Policy.docx", type: "DOCX" },
      { id: "doc-11", name: "Onboarding Guide.pdf", type: "PDF" },
    ],
  },
  {
    id: "folder-4",
    name: "Marketing Assets",
    documents: [
      { id: "doc-12", name: "Brand Guidelines.pdf", type: "PDF" },
      { id: "doc-13", name: "Campaign Assets.zip", type: "ZIP" },
      { id: "doc-14", name: "Social Media Plan.pptx", type: "PPTX" },
    ],
  },
  {
    id: "folder-5",
    name: "Legal Documents",
    documents: [
      { id: "doc-15", name: "Terms of Service.pdf", type: "PDF" },
      { id: "doc-16", name: "Privacy Policy.pdf", type: "PDF" },
      { id: "doc-17", name: "NDA Template.docx", type: "DOCX" },
    ],
  },
];

// Sample initial roles
const INITIAL_ROLES = [
  {
    id: 1,
    name: "Finance Team",
    description: "Access to financial documents and reports",
    color: "indigo",
    members: 8,
    permissions: {
      "folder-2": "admin",
      "doc-5": "admin",
      "doc-6": "admin",
      "doc-7": "viewer",
      "folder-1": "viewer",
    },
    createdAt: "Dec 15, 2025",
  },
  {
    id: 2,
    name: "Legal Department",
    description: "Full access to contracts and legal docs",
    color: "violet",
    members: 5,
    permissions: {
      "folder-1": "admin",
      "folder-5": "admin",
      "folder-2": "viewer",
    },
    createdAt: "Dec 10, 2025",
  },
  {
    id: 3,
    name: "HR Team",
    description: "Manage employee documents and policies",
    color: "emerald",
    members: 4,
    permissions: {
      "folder-3": "admin",
      "folder-1": "viewer",
    },
    createdAt: "Dec 20, 2025",
  },
  {
    id: 4,
    name: "Marketing",
    description: "Access to marketing materials and assets",
    color: "amber",
    members: 6,
    permissions: {
      "folder-4": "admin",
      "folder-2": "viewer",
    },
    createdAt: "Dec 22, 2025",
  },
];

// Sample users
const USERS = [
  { id: 1, name: "John Doe", email: "john@company.com", avatar: "JD" },
  { id: 2, name: "Jane Smith", email: "jane@company.com", avatar: "JS" },
  { id: 3, name: "Mike Johnson", email: "mike@company.com", avatar: "MJ" },
  { id: 4, name: "Sarah Williams", email: "sarah@company.com", avatar: "SW" },
  { id: 5, name: "Alex Chen", email: "alex@company.com", avatar: "AC" },
  { id: 6, name: "Emily Brown", email: "emily@company.com", avatar: "EB" },
];

// Custom Permission Dropdown Component
function PermissionDropdown({ value, onChange, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPermissionStyle = (level) => {
    switch (level) {
      case "viewer":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "editor":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "admin":
        return "bg-violet-500/10 text-violet-400 border-violet-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const currentPerm = PERMISSION_LEVELS.find((p) => p.id === value) || PERMISSION_LEVELS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all hover:opacity-80 ${getPermissionStyle(value)} ${compact ? "min-w-[90px]" : "min-w-[110px]"}`}
      >
        <span className="flex-shrink-0">{PermissionIcons[value] || PermissionIcons.none}</span>
        <span className="flex-1 text-left truncate">{currentPerm.name}</span>
        <svg className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          {PERMISSION_LEVELS.map((perm) => (
            <button
              key={perm.id}
              type="button"
              onClick={() => {
                onChange(perm.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-slate-700/50 ${
                value === perm.id ? "bg-slate-700/70" : ""
              } ${
                perm.id === "none" ? "text-slate-400" :
                perm.id === "viewer" ? "text-emerald-400" :
                perm.id === "editor" ? "text-blue-400" : "text-violet-400"
              }`}
            >
              <span className="flex-shrink-0">{PermissionIcons[perm.id]}</span>
              <span>{perm.name}</span>
              {value === perm.id && (
                <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoleManagement() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "indigo",
    permissions: {},
    assignedUsers: [],
  });
  
  // Expanded folders in permission editor
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [permissionSearch, setPermissionSearch] = useState("");

  // Color options for roles
  const colorOptions = [
    { id: "indigo", bg: "bg-indigo-500", gradient: "from-indigo-500 to-indigo-600", light: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30" },
    { id: "violet", bg: "bg-violet-500", gradient: "from-violet-500 to-violet-600", light: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
    { id: "emerald", bg: "bg-emerald-500", gradient: "from-emerald-500 to-emerald-600", light: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    { id: "amber", bg: "bg-amber-500", gradient: "from-amber-500 to-amber-600", light: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    { id: "rose", bg: "bg-rose-500", gradient: "from-rose-500 to-rose-600", light: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
    { id: "cyan", bg: "bg-cyan-500", gradient: "from-cyan-500 to-cyan-600", light: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  ];

  // Get color classes
  const getColorClasses = useCallback((colorId) => {
    return colorOptions.find(c => c.id === colorId) || colorOptions[0];
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const totalPermissions = roles.reduce((sum, role) => sum + Object.keys(role.permissions).length, 0);
    return [
      { label: "Total Roles", value: roles.length },
      { label: "Total Members", value: roles.reduce((sum, r) => sum + r.members, 0) },
      { label: "Permissions Set", value: totalPermissions },
      { label: "Folders Managed", value: FOLDER_STRUCTURE.length },
    ];
  }, [roles]);

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!debouncedSearch.trim()) return roles;
    return roles.filter(role =>
      role.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      role.description.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [roles, debouncedSearch]);

  // Filter folders/docs in permission editor
  const filteredFolders = useMemo(() => {
    if (!permissionSearch.trim()) return FOLDER_STRUCTURE;
    const search = permissionSearch.toLowerCase();
    return FOLDER_STRUCTURE.map(folder => ({
      ...folder,
      documents: folder.documents.filter(doc => 
        doc.name.toLowerCase().includes(search)
      ),
    })).filter(folder => 
      folder.name.toLowerCase().includes(search) || folder.documents.length > 0
    );
  }, [permissionSearch]);

  // Open create modal
  const handleCreateRole = useCallback(() => {
    setModalMode("create");
    setFormData({
      name: "",
      description: "",
      color: "indigo",
      permissions: {},
      assignedUsers: [],
    });
    setExpandedFolders([]);
    setPermissionSearch("");
    setShowModal(true);
  }, []);

  // Open edit modal
  const handleEditRole = useCallback((role) => {
    setModalMode("edit");
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: { ...role.permissions },
      assignedUsers: [],
    });
    setExpandedFolders([]);
    setPermissionSearch("");
    setShowModal(true);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedRole(null);
  }, []);

  // Save role
  const handleSaveRole = useCallback(() => {
    if (!formData.name.trim()) return;

    if (modalMode === "create") {
      const newRole = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        color: formData.color,
        members: formData.assignedUsers.length,
        permissions: formData.permissions,
        createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
      setRoles(prev => [...prev, newRole]);
    } else {
      setRoles(prev => prev.map(role =>
        role.id === selectedRole.id
          ? { ...role, name: formData.name, description: formData.description, color: formData.color, permissions: formData.permissions }
          : role
      ));
    }
    handleCloseModal();
  }, [formData, modalMode, selectedRole, handleCloseModal]);

  // Delete role
  const handleDeleteRole = useCallback((roleId) => {
    setRoles(prev => prev.filter(role => role.id !== roleId));
    setShowDeleteModal(false);
    setRoleToDelete(null);
  }, []);

  // Open delete confirmation
  const openDeleteModal = useCallback((role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  }, []);

  // Toggle folder expansion
  const toggleFolderExpand = useCallback((folderId) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  }, []);

  // Set permission for folder or document
  const setPermission = useCallback((itemId, level) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions };
      if (level === "none") {
        delete newPermissions[itemId];
      } else {
        newPermissions[itemId] = level;
      }
      return { ...prev, permissions: newPermissions };
    });
  }, []);

  // Set folder permission and apply to all documents
  const setFolderPermission = useCallback((folder, level) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions };
      if (level === "none") {
        delete newPermissions[folder.id];
        folder.documents.forEach(doc => delete newPermissions[doc.id]);
      } else {
        newPermissions[folder.id] = level;
        folder.documents.forEach(doc => {
          newPermissions[doc.id] = level;
        });
      }
      return { ...prev, permissions: newPermissions };
    });
  }, []);

  // Get permission level for an item
  const getPermission = useCallback((itemId) => {
    return formData.permissions[itemId] || "none";
  }, [formData.permissions]);

  // Count permissions for a role
  const countPermissions = useCallback((permissions) => {
    const counts = { viewer: 0, editor: 0, admin: 0 };
    Object.values(permissions).forEach(level => {
      if (counts[level] !== undefined) counts[level]++;
    });
    return counts;
  }, []);

  // Toggle user assignment
  const toggleUserAssignment = useCallback((userId) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId)
        ? prev.assignedUsers.filter(id => id !== userId)
        : [...prev.assignedUsers, userId],
    }));
  }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Role Management</h1>
            <p className="text-slate-400 text-sm">Create custom roles with granular document permissions</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 hover:border-slate-600/50 transition-all group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-72 transition-all"
          />
        </div>
        <button
          onClick={handleCreateRole}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredRoles.map((role, index) => {
          const colors = getColorClasses(role.color);
          const permCounts = countPermissions(role.permissions);
          
          return (
            <div
              key={role.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              <div className={`group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all hover:shadow-xl hover:shadow-black/20`}>
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`} />
                
                <div className="p-5">
                  {/* Role Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{role.name}</h3>
                        <p className="text-xs text-slate-400">{role.members} members</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openDeleteModal(role)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {role.description || "No description"}
                  </p>

                  {/* Permission Summary */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {permCounts.viewer > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {PermissionIcons.viewer}
                        <span>{permCounts.viewer}</span>
                      </span>
                    )}
                    {permCounts.editor > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {PermissionIcons.editor}
                        <span>{permCounts.editor}</span>
                      </span>
                    )}
                    {permCounts.admin > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {PermissionIcons.admin}
                        <span>{permCounts.admin}</span>
                      </span>
                    )}
                    {permCounts.viewer === 0 && permCounts.editor === 0 && permCounts.admin === 0 && (
                      <span className="text-xs text-slate-500 italic">No permissions set</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500">
                      {role.createdAt}
                    </span>
                    <button
                      onClick={() => handleEditRole(role)}
                      className={`text-sm font-medium ${colors.text} hover:underline flex items-center gap-1.5 transition-all`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Role
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredRoles.length === 0 && (
          <div className="col-span-full">
            <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No roles found</h3>
              <p className="text-sm text-slate-400 mb-4">
                {searchQuery ? "Try a different search term" : "Create your first role to get started"}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreateRole}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition-all"
                >
                  Create Role
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700/50 animate-fade-in-up overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-700/50 shrink-0 bg-slate-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getColorClasses(formData.color).gradient} flex items-center justify-center shadow-lg`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {modalMode === "create" ? "Create New Role" : "Edit Role"}
                    </h2>
                    <p className="text-sm text-slate-400">
                      Define role permissions for folders and documents
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-700/50 transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column - Role Details */}
                <div className="lg:col-span-2 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Role Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Finance Team"
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What is this role for?"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Role Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color: color.id }))}
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color.gradient} transition-all ${
                            formData.color === color.id 
                              ? "ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110 shadow-lg" 
                              : "hover:scale-105 opacity-70 hover:opacity-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Assign Users */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Assign Users
                      <span className="ml-2 text-xs font-normal text-slate-500">({formData.assignedUsers.length} selected)</span>
                    </label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/30 p-2">
                      {USERS.map((user) => (
                        <label
                          key={user.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                            formData.assignedUsers.includes(user.id) 
                              ? "bg-indigo-500/10 border border-indigo-500/30" 
                              : "hover:bg-slate-700/30 border border-transparent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.assignedUsers.includes(user.id)}
                            onChange={() => toggleUserAssignment(user.id)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                          />
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-semibold text-white">
                            {user.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Permission Legend */}
                  <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Permission Levels</p>
                    <div className="space-y-2.5">
                      {PERMISSION_LEVELS.filter(p => p.id !== "none").map((perm) => (
                        <div key={perm.id} className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            perm.id === "viewer" ? "bg-emerald-500/10 text-emerald-400" :
                            perm.id === "editor" ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"
                          }`}>
                            {PermissionIcons[perm.id]}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-slate-200">{perm.name}</span>
                            <span className="text-xs text-slate-500 ml-2">{perm.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Document Permissions */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-slate-300">
                      Document Permissions
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 transition-all"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-700/50 overflow-hidden max-h-[420px] overflow-y-auto bg-slate-800/30">
                    {filteredFolders.map((folder) => {
                      const isExpanded = expandedFolders.includes(folder.id);
                      const folderPerm = getPermission(folder.id);
                      
                      return (
                        <div key={folder.id} className="border-b border-slate-700/50 last:border-b-0">
                          {/* Folder Row */}
                          <div className="flex items-center gap-3 p-3.5 bg-slate-800/50 hover:bg-slate-700/30 transition-colors">
                            <button
                              onClick={() => toggleFolderExpand(folder.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-600/50 transition-colors"
                            >
                              <svg
                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>

                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                            </div>
                            <span className="flex-1 text-sm font-medium text-white">
                              {folder.name}
                            </span>
                            <span className="text-xs text-slate-500 mr-2">
                              {folder.documents.length} docs
                            </span>

                            <PermissionDropdown
                              value={folderPerm}
                              onChange={(level) => setFolderPermission(folder, level)}
                            />
                          </div>

                          {/* Documents (Expanded) */}
                          {isExpanded && (
                            <div className="bg-slate-900/30">
                              {folder.documents.map((doc) => {
                                const docPerm = getPermission(doc.id);
                                
                                return (
                                  <div
                                    key={doc.id}
                                    className="flex items-center gap-3 px-4 py-3 pl-14 border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
                                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                    <span className="flex-1 text-sm text-slate-300 truncate">
                                      {doc.name}
                                    </span>

                                    <PermissionDropdown
                                      value={docPerm}
                                      onChange={(level) => setPermission(doc.id, level)}
                                      compact
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredFolders.length === 0 && (
                      <div className="p-8 text-center">
                        <p className="text-sm text-slate-500">No documents found</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <span className="text-xs text-slate-500 font-medium">Permissions set:</span>
                    {(() => {
                      const counts = countPermissions(formData.permissions);
                      return (
                        <>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                            {PermissionIcons.viewer} {counts.viewer} Viewer
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400">
                            {PermissionIcons.editor} {counts.editor} Editor
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400">
                            {PermissionIcons.admin} {counts.admin} Admin
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex gap-3 shrink-0 bg-slate-800/30">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
              >
                {modalMode === "create" ? "Create Role" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roleToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700/50 animate-fade-in-up overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Role</h3>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete <span className="text-white font-semibold">"{roleToDelete.name}"</span>? 
                This will remove all {roleToDelete.members} members from this role.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setRoleToDelete(null); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRole(roleToDelete.id)}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
                >
                  Delete Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
