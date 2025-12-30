import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function Trash() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const trashedDocuments = [
    { id: 1, name: "Old_Contract.pdf", deletedBy: "John Doe", deletedOn: "2 days ago", expiresIn: "28 days", size: "1.2 MB" },
    { id: 2, name: "Draft_Report.docx", deletedBy: "Jane Smith", deletedOn: "5 days ago", expiresIn: "25 days", size: "3.4 MB" },
    { id: 3, name: "Temp_Invoice.pdf", deletedBy: "Mike Johnson", deletedOn: "1 week ago", expiresIn: "23 days", size: "890 KB" },
    { id: 4, name: "Backup_Data.xlsx", deletedBy: "Sarah Williams", deletedOn: "2 weeks ago", expiresIn: "16 days", size: "5.1 MB" },
  ];

  const filteredDocs = trashedDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedItems(
      selectedItems.length === filteredDocs.length
        ? []
        : filteredDocs.map((doc) => doc.id)
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-slate-900 dark:text-white mb-1"
        >
          Trash
        </motion.h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Documents are permanently deleted after 30 days
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4 mb-5 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-0.5">Auto-deletion Notice</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Restore documents before they are permanently removed.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5"
      >
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search trash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white w-56"
          />
        </div>

        {selectedItems.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {selectedItems.length} selected
            </span>
            <Button variant="outline" size="sm">Restore</Button>
            <Button variant="danger" size="sm">Delete Forever</Button>
          </div>
        )}
      </motion.div>

      {/* Trashed Documents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-xl">🗑️</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Trash is empty</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">No deleted documents found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredDocs.length && filteredDocs.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Deleted By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Deleted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc, index) => (
                  <motion.tr 
                    key={doc.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">📄</div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{doc.size}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{doc.deletedBy}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{doc.deletedOn}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        {doc.expiresIn}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Restore</Button>
                        <Button variant="danger" size="sm">Delete</Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
