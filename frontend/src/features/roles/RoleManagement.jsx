import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function RoleManagement() {
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("teams");
  const [currentStep, setCurrentStep] = useState(1);

  const teams = [
    {
      id: 1,
      name: "Finance Team",
      members: 8,
      permissions: { read: 12, edit: 8, delete: 3 },
      folders: ["Invoices", "Financial Reports"],
    },
    {
      id: 2,
      name: "Legal Department",
      members: 5,
      permissions: { read: 24, edit: 18, delete: 12 },
      folders: ["Contracts", "Legal Documents", "NDA"],
    },
    {
      id: 3,
      name: "HR Team",
      members: 4,
      permissions: { read: 15, edit: 10, delete: 5 },
      folders: ["Employee Records", "Policies"],
    },
    {
      id: 4,
      name: "Marketing",
      members: 6,
      permissions: { read: 20, edit: 15, delete: 8 },
      folders: ["Campaigns", "Assets", "Reports"],
    },
  ];

  const members = [
    { id: 1, name: "John Doe", email: "john@company.com", role: "Admin", team: "Finance Team", initials: "JD" },
    { id: 2, name: "Jane Smith", email: "jane@company.com", role: "Editor", team: "Legal Department", initials: "JS" },
    { id: 3, name: "Mike Johnson", email: "mike@company.com", role: "Viewer", team: "HR Team", initials: "MJ" },
    { id: 4, name: "Sarah Williams", email: "sarah@company.com", role: "Editor", team: "Marketing", initials: "SW" },
    { id: 5, name: "Alex Chen", email: "alex@company.com", role: "Admin", team: "Finance Team", initials: "AC" },
  ];

  const stats = [
    { label: "Total Teams", value: teams.length },
    { label: "Total Members", value: members.length },
    { label: "Admins", value: members.filter(m => m.role === "Admin").length },
    { label: "Folders Managed", value: teams.reduce((sum, t) => sum + t.folders.length, 0) },
  ];

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-slate-900 dark:text-white mb-1"
        >
          Role Management
        </motion.h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage teams, members, and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4" hover>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
          {[
            { id: "teams", label: "Teams" },
            { id: "members", label: "Members" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={activeTab === "teams" ? "Search teams..." : "Search members..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white w-56"
            />
          </div>
          <Button onClick={() => setShowCreateTeamModal(true)}>
            + Create Team
          </Button>
        </div>
      </div>

      {/* Teams Tab */}
      {activeTab === "teams" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredTeams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-5" hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center">
                    <svg className="w-5 h-5 text-white dark:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{team.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{team.members} members</p>

                <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{team.permissions.read}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Read</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{team.permissions.edit}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Edit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">{team.permissions.delete}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Delete</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {team.folders.map((folder) => (
                    <span key={folder} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {folder}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1">Edit</Button>
                  <Button variant="danger" size="sm" className="flex-1">Delete</Button>
                </div>
              </Card>
            </motion.div>
          ))}
          {filteredTeams.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No teams found</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-xs font-medium text-white dark:text-slate-900">
                          {member.initials}
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{member.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{member.team}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        member.role === "Admin"
                          ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                          : member.role === "Editor"
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="danger" size="sm">Remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">No members found</p>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateTeamModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Team</h2>
                <button 
                  onClick={() => { setShowCreateTeamModal(false); setCurrentStep(1); }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-20 h-0.5 ${currentStep > step ? "bg-slate-900 dark:bg-white" : "bg-slate-200 dark:bg-slate-700"}`}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Team Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Team Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Marketing Team"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                    <textarea
                      placeholder="Team description..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Step 2: Add Members */}
              {currentStep === 2 && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select members to add</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {members.map((member) => (
                      <label key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600" />
                        <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-xs font-medium text-white dark:text-slate-900">
                          {member.initials}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{member.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Set Permissions */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Permission Level</label>
                    <div className="space-y-2">
                      {[
                        { id: "read", label: "Read Only", desc: "Can view documents" },
                        { id: "edit", label: "Read + Edit", desc: "Can view and edit" },
                        { id: "full", label: "Full Access", desc: "Can view, edit, and delete" },
                      ].map((perm) => (
                        <label key={perm.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <input type="radio" name="permission" className="w-4 h-4" />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{perm.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{perm.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-6">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>
                )}
                {currentStep < 3 ? (
                  <Button className="flex-1" onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
                ) : (
                  <Button className="flex-1" onClick={() => { setShowCreateTeamModal(false); setCurrentStep(1); }}>
                    Create Team
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
