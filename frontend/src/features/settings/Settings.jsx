import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import useAuthStore from "../../app/store/auth.store";
import { authService } from "../../services/auth.service";
import userService from "../../services/user.service";
import totpService from "../../services/totp.service";
import departmentService from "../../services/department.service";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState(1);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showProfileDeptDropdown, setShowProfileDeptDropdown] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  // Department management state
  const [departmentsList, setDepartmentsList] = useState([]);
  const [deptsLoading, setDeptsLoading] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", color: "#6366f1" });
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [deptMembers, setDeptMembers] = useState({ department: null, members: [] });
  const [deptMembersLoading, setDeptMembersLoading] = useState(false);
  const [showDeleteDeptModal, setShowDeleteDeptModal] = useState(false);
  const [deletingDept, setDeletingDept] = useState(null);

  // Fetch 2FA status on mount
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const response = await totpService.getStatus();
        if (response.success) {
          setTwoFAEnabled(response.data.enabled);
        }
      } catch (error) {
        console.error("Error fetching 2FA status:", error);
      }
    };
    fetch2FAStatus();
  }, []);

  // Profile form state - initialize from user data
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "John",
    lastName: user?.lastName || "Doe",
    email: user?.email || "john@company.com",
    phone: user?.phone || "",
    department: user?.department || "Engineering",
    position: user?.position || "Senior Developer",
  });

  // New user form state with password
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    departmentId: "",
    position: "",
    role: "user",
  });

  // Users list from API
  const [users, setUsers] = useState([]);

  // Fetch users on component mount and tab change
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
    if (activeTab === "departments") {
      fetchDepartments();
    }
  }, [activeTab]);

  // Fetch departments on mount (needed for user management dropdown too)
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await userService.getUsers({ limit: 50 });
      if (response.success) {
        setUsers(response.data.users.map(u => ({
          ...u,
          status: u.isActive ? "Active" : "Inactive",
          initials: `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || 'U',
        })));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setDeptsLoading(true);
    try {
      const response = await departmentService.getDepartments();
      if (response.success) {
        setDepartmentsList(response.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setDeptsLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      const fn = editingDept 
        ? departmentService.updateDepartment(editingDept.id, deptForm)
        : departmentService.createDepartment(deptForm);
      const response = await fn;
      if (response.success) {
        await fetchDepartments();
        setShowDeptModal(false);
        setEditingDept(null);
        setDeptForm({ name: "", description: "", color: "#6366f1" });
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to save department");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deletingDept) return;
    setIsLoading(true);
    try {
      const response = await departmentService.deleteDepartment(deletingDept.id);
      if (response.success) {
        await fetchDepartments();
        setShowDeleteDeptModal(false);
        setDeletingDept(null);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete department");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeptMembers = async (dept) => {
    setDeptMembersLoading(true);
    setShowMembersModal(true);
    setDeptMembers({ department: dept, members: [] });
    try {
      const response = await departmentService.getDepartmentMembers(dept.id);
      if (response.success) {
        setDeptMembers(response.data);
      }
    } catch (error) {
      console.error("Error fetching department members:", error);
    } finally {
      setDeptMembersLoading(false);
    }
  };

  const tabs = [
    { id: "profile", name: "Profile", mobileShort: "Profile", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { id: "users", name: "User Management", mobileShort: "Users", adminOnly: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { id: "departments", name: "Departments", mobileShort: "Depts", adminOnly: true, icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )},
    { id: "security", name: "Security", mobileShort: "Security", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )},
    { id: "notifications", name: "Notifications", mobileShort: "Notifs", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )},
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate to login even if API fails
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const roles = ["admin", "manager", "user", "auditor", "viewer"];
  const roleLabels = { 
    super_admin: "Super Admin",
    admin: "Admin", 
    manager: "Manager",
    user: "User",
    auditor: "Auditor",
    viewer: "Viewer"
  };
  const departments = departmentsList.map(d => d.name);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const filteredUsers = users.filter(user =>
    `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (departmentsList.find(d => d.id === user.departmentId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // Handle profile update logic
    console.log("Profile updated:", profileForm);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await userService.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        firstName: newUserForm.firstName,
        lastName: newUserForm.lastName,
        role: newUserForm.role,
        departmentId: newUserForm.departmentId || undefined,
        position: newUserForm.position,
        phone: newUserForm.phone,
      });

      if (response.success) {
        // Refresh users list
        await fetchUsers();
        
        // Reset form
        setNewUserForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phone: "",
          departmentId: "",
          position: "",
          role: "user",
        });
        setShowAddUserModal(false);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const response = await userService.deleteUser(selectedUser.id);
      if (response.success) {
        await fetchUsers();
        setShowDeleteModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const response = await userService.toggleUserStatus(userId);
      if (response.success) {
        await fetchUsers();
      }
    } catch (error) {
      setErrorMessage(error.message || "Failed to toggle user status");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
      case "super_admin":
      case "Admin": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "editor":
      case "Editor": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "user":
      case "Viewer": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      super_admin: "Super Admin",
      admin: "Admin",
      editor: "Editor",
      user: "Viewer",
    };
    return labels[role] || role;
  };

  const getStatusBadgeColor = (status) => {
    return status === "Active" 
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };

  return (
    <DashboardLayout>
      {/* Success Toast Notification */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-4 right-4 z-[100] max-w-sm"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-emerald-500/20 border border-emerald-200 dark:border-emerald-800/50 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Changes Saved!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your profile has been updated successfully.</p>
              </div>
              <button 
                onClick={() => setShowSaveSuccess(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-1"
        >
          Settings
        </motion.h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Manage your account and application settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar Tabs - Horizontal scroll on mobile, vertical on desktop */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-64 flex-shrink-0"
        >
          {/* Mobile: Horizontal scrollable tabs */}
          <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {tabs.filter(tab => !tab.adminOnly || isAdmin).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.mobileShort || tab.name}</span>
                </button>
              ))}
              {/* Mobile Logout Button */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Desktop: Vertical tabs */}
          <Card className="p-2 hidden lg:block">
            <nav className="space-y-1">
              {tabs.filter(tab => !tab.adminOnly || isAdmin).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
              {/* Desktop Logout Button */}
              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </nav>
          </Card>
        </motion.div>

        {/* Content Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-w-0"
        >
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700 text-center sm:text-left">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg shadow-indigo-500/25 flex-shrink-0">
                  {profileForm.firstName[0]}{profileForm.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                    {profileForm.firstName} {profileForm.lastName}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">{profileForm.position}</p>
                  <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">{profileForm.department}</p>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Custom Department Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Department
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowProfileDeptDropdown(!showProfileDeptDropdown)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span className="text-slate-900 dark:text-slate-100 font-medium">
                            {profileForm.department || 'Select Department'}
                          </span>
                        </div>
                        <motion.svg 
                          animate={{ rotate: showProfileDeptDropdown ? 180 : 0 }}
                          className="w-5 h-5 text-slate-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </button>
                      
                      <AnimatePresence>
                        {showProfileDeptDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 z-50 overflow-hidden"
                          >
                            <div className="max-h-48 overflow-y-auto py-1">
                              {departments.map((dept) => (
                                <button
                                  key={dept}
                                  type="button"
                                  onClick={() => {
                                    setProfileForm({ ...profileForm, department: dept });
                                    setShowProfileDeptDropdown(false);
                                  }}
                                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                                    profileForm.department === dept
                                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                  }`}
                                >
                                  {profileForm.department === dept && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  <span className={profileForm.department === dept ? 'font-medium' : ''}>{dept}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <Input
                    label="Position"
                    value={profileForm.position}
                    onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </button>
                </div>
              </form>
            </Card>
          )}

          {/* User Management Tab */}
          {activeTab === "users" && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="p-4" hover>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Users</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">{users.length}</p>
                </Card>
                <Card className="p-4" hover>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Active Users</p>
                  <p className="text-2xl font-semibold text-emerald-600">{users.filter(u => u.status === "Active").length}</p>
                </Card>
                <Card className="p-4" hover>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Admins</p>
                  <p className="text-2xl font-semibold text-purple-600">{users.filter(u => u.role === "Admin").length}</p>
                </Card>
                <Card className="p-4" hover>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Departments</p>
                  <p className="text-2xl font-semibold text-blue-600">{departmentsList.length}</p>
                </Card>
              </div>

              {/* Toolbar */}
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                  <Button onClick={() => setShowAddUserModal(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add User</span>
                  </Button>
                </div>
              </Card>

              {/* Users Table */}
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Department</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                {user.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate md:hidden">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <p className="text-sm text-slate-900 dark:text-white">{user.email}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.phone || '-'}</p>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <p className="text-sm text-slate-900 dark:text-white">{departmentsList.find(d => d.id === user.departmentId)?.name || '-'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.position || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleToggleUserStatus(user.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  user.isActive 
                                    ? 'hover:bg-amber-100 dark:hover:bg-amber-900/30' 
                                    : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                }`}
                                title={user.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <svg className={`w-4 h-4 ${user.isActive ? 'text-amber-500' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {user.isActive ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  )}
                                </svg>
                              </button>
                              <button 
                                onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <Card className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">Security Settings</h2>
              
              <div className="space-y-5 sm:space-y-6">
                <div className="pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Update your password to keep your account secure
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                        Current Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Two-Factor Authentication</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Add an extra layer of security to your account using Google Authenticator
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${twoFAEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        {twoFAEnabled ? (
                          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {twoFAEnabled ? '2FA Enabled' : '2FA Disabled'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {twoFAEnabled ? 'Your account is protected' : 'Protect your account'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {twoFAEnabled ? (
                        <button 
                          onClick={() => { setShowDisable2FAModal(true); setDisableCode(""); setTwoFAError(""); }}
                          className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          <span>Disable</span>
                        </button>
                      ) : (
                        <button 
                          onClick={async () => { 
                            setShow2FAModal(true); 
                            setTwoFAStep(1); 
                            setVerificationCode(""); 
                            setTwoFAError("");
                            setQrCodeImage("");
                            setTotpSecret("");
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Enable 2FA</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Active Sessions</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Manage devices where you're currently logged in
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">MacBook Pro - Chrome</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Current session</p>
                        </div>
                      </div>
                      <span className="px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex-shrink-0">
                        Current
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Departments Tab */}
          {activeTab === "departments" && (
            <div className="space-y-4">
              {/* Header */}
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Department Management</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage organizational departments</p>
                  </div>
                  <Button 
                    onClick={() => { setEditingDept(null); setDeptForm({ name: "", description: "", color: "#6366f1" }); setShowDeptModal(true); setErrorMessage(""); }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Department</span>
                  </Button>
                </div>
              </Card>

              {/* Departments Grid */}
              {deptsLoading ? (
                <Card className="p-12">
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm text-slate-500">Loading departments...</span>
                  </div>
                </Card>
              ) : departmentsList.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">No departments yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Create your first department to organize your team</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departmentsList.map((dept, index) => (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-5 hover:shadow-lg transition-shadow" hover>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: (dept.color || '#6366f1') + '20' }}
                            >
                              <svg className="w-5 h-5" style={{ color: dept.color || '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{dept.name}</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{dept.description || 'No description'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setEditingDept(dept); setDeptForm({ name: dept.name, description: dept.description || "", color: dept.color || "#6366f1" }); setShowDeptModal(true); setErrorMessage(""); }}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => { setDeletingDept(dept); setShowDeleteDeptModal(true); setErrorMessage(""); }}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => fetchDeptMembers(dept)}
                            className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {dept.memberCount || 0} member{(dept.memberCount || 0) !== 1 ? 's' : ''}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color || '#6366f1' }} />
                            <span className="text-xs text-slate-400">{new Date(dept.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-4 sm:mb-6">Notification Preferences</h2>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Email Notifications</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Receive email updates about your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Document Updates</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Get notified when documents are updated</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Task Reminders</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Receive reminders for upcoming tasks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Security Alerts</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Get notified about security events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => { setShowAddUserModal(false); setShowDeptDropdown(false); setShowRoleDropdown(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Add New User</h2>
                      <p className="text-xs text-white/70">Create a new team member account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowAddUserModal(false); setShowDeptDropdown(false); setShowRoleDropdown(false); }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleAddUser} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Error Message */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                  </div>
                )}

                {/* Avatar Preview */}
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/25">
                    {newUserForm.firstName && newUserForm.lastName 
                      ? `${newUserForm.firstName[0]}${newUserForm.lastName[0]}`.toUpperCase()
                      : <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    }
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={newUserForm.firstName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newUserForm.lastName}
                      onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      placeholder="john.doe@company.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showNewUserPassword ? "text" : "password"}
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      placeholder="Min. 8 characters"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewUserPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Minimum 8 characters</p>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Department & Role - Custom Dropdowns */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Department Custom Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Department
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setShowDeptDropdown(!showDeptDropdown); setShowRoleDropdown(false); }}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${showDeptDropdown ? 'border-indigo-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 focus:outline-none transition-all text-left flex items-center justify-between`}
                      >
                        <span className={newUserForm.departmentId ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
                          {newUserForm.departmentId ? departmentsList.find(d => d.id === newUserForm.departmentId)?.name || 'Select...' : 'Select...'}
                        </span>
                        <svg className={`w-5 h-5 text-slate-400 transition-transform ${showDeptDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <AnimatePresence>
                        {showDeptDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-20 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                          >
                            {departmentsList.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-slate-400 text-center">No departments yet</div>
                            ) : (
                              departmentsList.map((dept) => (
                                <button
                                  key={dept.id}
                                  type="button"
                                  onClick={() => { setNewUserForm({ ...newUserForm, departmentId: dept.id }); setShowDeptDropdown(false); }}
                                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-between ${
                                    newUserForm.departmentId === dept.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {dept.color && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }} />}
                                    {dept.name}
                                  </div>
                                  {newUserForm.departmentId === dept.id && (
                                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Role Custom Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Role
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setShowRoleDropdown(!showRoleDropdown); setShowDeptDropdown(false); }}
                        className={`w-full px-4 py-3 rounded-xl border-2 ${showRoleDropdown ? 'border-indigo-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800/50 focus:outline-none transition-all text-left flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            newUserForm.role === 'admin' ? 'bg-purple-500' : 
                            newUserForm.role === 'editor' ? 'bg-blue-500' : 'bg-slate-400'
                          }`} />
                          <span className="text-slate-900 dark:text-slate-100">{roleLabels[newUserForm.role] || newUserForm.role}</span>
                        </div>
                        <svg className={`w-5 h-5 text-slate-400 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <AnimatePresence>
                        {showRoleDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-20 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                          >
                            {roles.map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => { setNewUserForm({ ...newUserForm, role }); setShowRoleDropdown(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-between ${
                                  newUserForm.role === role ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    role === 'admin' ? 'bg-purple-500' : 
                                    role === 'editor' ? 'bg-blue-500' : 'bg-slate-400'
                                  }`} />
                                  <span className={newUserForm.role === role ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}>{roleLabels[role]}</span>
                                </div>
                                {newUserForm.role === role && (
                                  <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Position
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={newUserForm.position}
                      onChange={(e) => setNewUserForm({ ...newUserForm, position: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      placeholder="e.g. Senior Developer"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddUserModal(false); setShowDeptDropdown(false); setShowRoleDropdown(false); setErrorMessage(""); }}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete User Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete User</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-medium text-slate-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</span>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteUser} className="flex-1">
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA Setup Modal */}
      <AnimatePresence>
        {show2FAModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShow2FAModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Step indicators */}
              {twoFAStep < 4 && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        twoFAStep >= step 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {twoFAStep > step ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : step}
                      </div>
                      {step < 3 && (
                        <div className={`w-12 h-0.5 ${twoFAStep > step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 1: Install App */}
              {twoFAStep === 1 && (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Install Google Authenticator
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Download and install Google Authenticator on your mobile device from the App Store or Google Play Store.
                  </p>

                  <div className="flex gap-3 mb-6">
                    <div className="flex-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <svg className="w-8 h-8 mx-auto mb-2 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">App Store</p>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <svg className="w-8 h-8 mx-auto mb-2 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                      </svg>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Google Play</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setShow2FAModal(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button 
                      onClick={async () => {
                        setTwoFALoading(true);
                        setTwoFAError("");
                        try {
                          const response = await totpService.generateSecret();
                          if (response.success) {
                            setQrCodeImage(response.data.qrCode);
                            setTotpSecret(response.data.secret);
                            setTwoFAStep(2);
                          } else {
                            setTwoFAError(response.error || "Failed to generate secret");
                          }
                        } catch (error) {
                          setTwoFAError(error.message || "Failed to generate secret");
                        } finally {
                          setTwoFALoading(false);
                        }
                      }} 
                      className="flex-1"
                      disabled={twoFALoading}
                    >
                      {twoFALoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </span>
                      ) : "Next"}
                    </Button>
                  </div>
                  {twoFAError && (
                    <p className="text-sm text-red-500 mt-3">{twoFAError}</p>
                  )}
                </div>
              )}

              {/* Step 2: Scan QR Code */}
              {twoFAStep === 2 && (
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Scan QR Code
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Open Google Authenticator and scan this QR code to add your account.
                  </p>

                  {/* Real QR Code from API */}
                  <div className="w-48 h-48 mx-auto mb-4 bg-white p-2 rounded-2xl shadow-lg">
                    {qrCodeImage ? (
                      <img 
                        src={qrCodeImage} 
                        alt="2FA QR Code" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
                        <svg className="w-8 h-8 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Or enter this code manually:</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono text-slate-900 dark:text-slate-100 tracking-widest break-all">
                        {totpSecret || "Loading..."}
                      </code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(totpSecret);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setTwoFAStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={() => setTwoFAStep(3)} className="flex-1">
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Verify Code */}
              {twoFAStep === 3 && (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Verify Setup
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Enter the 6-digit code from Google Authenticator to verify the setup.
                  </p>

                  <div className="mb-6">
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={verificationCode[index] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const newCode = verificationCode.split('');
                            newCode[index] = value;
                            setVerificationCode(newCode.join(''));
                            if (value && e.target.nextElementSibling) {
                              e.target.nextElementSibling.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !verificationCode[index] && e.target.previousElementSibling) {
                              e.target.previousElementSibling.focus();
                            }
                          }}
                          className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">Enter the code from your authenticator app (or 123456 for testing)</p>
                    {twoFAError && (
                      <p className="text-sm text-red-500 mt-2">{twoFAError}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setTwoFAStep(2)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={async () => {
                        setTwoFALoading(true);
                        setTwoFAError("");
                        try {
                          const response = await totpService.enable(verificationCode);
                          if (response.success) {
                            setTwoFAStep(4);
                          } else {
                            setTwoFAError(response.error || "Invalid verification code");
                          }
                        } catch (error) {
                          setTwoFAError(error.message || "Failed to enable 2FA");
                        } finally {
                          setTwoFALoading(false);
                        }
                      }} 
                      className="flex-1"
                      disabled={verificationCode.length !== 6 || twoFALoading}
                    >
                      {twoFALoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </span>
                      ) : "Enable 2FA"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {twoFAStep === 4 && (
                <div className="text-center">
                  {/* Success Animation */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <motion.svg 
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="w-10 h-10 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      2FA Successfully Enabled!
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      Your account is now protected with two-factor authentication.
                    </p>
                  </motion.div>

                  {/* Security Status Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 mb-6"
                  >
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Security Level: High</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Google Authenticator connected</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Enabled just now</span>
                    </div>
                  </motion.div>

                  {/* Backup Codes Reminder */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 mb-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Don't forget your backup codes!</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Keep your backup codes in a safe place. You'll need them if you lose access to your authenticator app.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <button 
                      onClick={() => {
                        setTwoFAEnabled(true);
                        setShow2FAModal(false);
                        setVerificationCode('');
                        setTwoFAStep(1);
                      }} 
                      className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-medium transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Done
                    </button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showDisable2FAModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDisable2FAModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Disable Two-Factor Authentication
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Enter your current authenticator code to disable 2FA. This will make your account less secure.
                </p>

                <div className="mb-6">
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        value={disableCode[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const newCode = disableCode.split('');
                          newCode[index] = value;
                          setDisableCode(newCode.join(''));
                          if (value && e.target.nextElementSibling) {
                            e.target.nextElementSibling.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !disableCode[index] && e.target.previousElementSibling) {
                            e.target.previousElementSibling.focus();
                          }
                        }}
                        className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-slate-900 dark:text-slate-100"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Enter the code from your authenticator app (or 123456 for testing)</p>
                  {twoFAError && (
                    <p className="text-sm text-red-500 mt-2">{twoFAError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => { setShowDisable2FAModal(false); setDisableCode(""); setTwoFAError(""); }} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <button 
                    onClick={async () => {
                      setTwoFALoading(true);
                      setTwoFAError("");
                      try {
                        const response = await totpService.disable(disableCode);
                        if (response.success) {
                          setTwoFAEnabled(false);
                          setShowDisable2FAModal(false);
                          setDisableCode("");
                        } else {
                          setTwoFAError(response.error || "Invalid verification code");
                        }
                      } catch (error) {
                        setTwoFAError(error.message || "Failed to disable 2FA");
                      } finally {
                        setTwoFALoading(false);
                      }
                    }}
                    disabled={disableCode.length !== 6 || twoFALoading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {twoFALoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Disabling...
                      </span>
                    ) : "Disable 2FA"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/50 p-6 sm:p-8 max-w-sm w-full border border-slate-200 dark:border-slate-800/50 overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/50 to-transparent" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative text-center mb-6 sm:mb-8">
                {/* Animated icon */}
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-5 rounded-2xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 flex items-center justify-center shadow-lg"
                >
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2"
                >
                  Sign out
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-slate-500 dark:text-slate-400"
                >
                  Are you sure you want to sign out of your account?
                </motion.p>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex gap-3"
              >
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing out...
                    </>
                  ) : (
                    <>
                      Sign out
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Department Add/Edit Modal */}
      <AnimatePresence>
        {showDeptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeptModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">{editingDept ? 'Edit Department' : 'Add Department'}</h2>
                      <p className="text-xs text-white/70">{editingDept ? 'Update department details' : 'Create a new department'}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDeptModal(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreateDept} className="p-6 space-y-5">
                {errorMessage && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department Name</label>
                  <input
                    type="text"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    placeholder="e.g. Engineering"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none"
                    placeholder="Brief description of the department..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={deptForm.color}
                      onChange={(e) => setDeptForm({ ...deptForm, color: e.target.value })}
                      className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer"
                    />
                    <div className="flex gap-2">
                      {['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#6b7280'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setDeptForm({ ...deptForm, color: c })}
                          className={`w-7 h-7 rounded-full transition-all ${deptForm.color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowDeptModal(false)} className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" disabled={isLoading}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {editingDept ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Department Modal */}
      <AnimatePresence>
        {showDeleteDeptModal && deletingDept && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteDeptModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Department</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-medium text-slate-900 dark:text-white">{deletingDept.name}</span>? This action cannot be undone.
                </p>
                {errorMessage && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-3">{errorMessage}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => { setShowDeleteDeptModal(false); setErrorMessage(""); }} className="flex-1">Cancel</Button>
                <Button variant="danger" onClick={handleDeleteDept} className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Department Members Modal */}
      <AnimatePresence>
        {showMembersModal && deptMembers.department && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowMembersModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (deptMembers.department.color || '#6366f1') + '20' }}>
                      <svg className="w-5 h-5" style={{ color: deptMembers.department.color || '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{deptMembers.department.name}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{deptMembers.members.length} member{deptMembers.members.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowMembersModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                {deptMembersLoading ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm text-slate-500">Loading members...</span>
                  </div>
                ) : deptMembers.members.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No members in this department</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deptMembers.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                          {`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.position || member.email}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${member.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
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
