import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// Sample documents for each folder
const folderDocuments = {
  "1": [
    { id: "doc-1", name: "Master Agreement 2025.pdf", type: "PDF", date: "Dec 28, 2025" },
    { id: "doc-2", name: "Vendor Contract.docx", type: "DOCX", date: "Dec 25, 2025" },
  ],
  "1-1": [
    { id: "doc-3", name: "Active Contract A.pdf", type: "PDF", date: "Dec 20, 2025" },
    { id: "doc-4", name: "Active Contract B.pdf", type: "PDF", date: "Dec 18, 2025" },
  ],
  "2": [
    { id: "doc-5", name: "Q4 Financial Report.xlsx", type: "XLSX", date: "Dec 15, 2025" },
    { id: "doc-6", name: "Budget 2026.xlsx", type: "XLSX", date: "Dec 10, 2025" },
  ],
  "2-1": [
    { id: "doc-7", name: "Invoice #1234.pdf", type: "PDF", date: "Dec 22, 2025" },
    { id: "doc-8", name: "Invoice #1235.pdf", type: "PDF", date: "Dec 23, 2025" },
  ],
};

// Sortable Folder Item Component
function SortableFolderItem({ 
  folder, 
  depth = 0, 
  expandedFolders, 
  toggleExpand, 
  onAddSubfolder,
  onDelete,
  onViewDocs,
  onMoveToFolder,
  allFolders,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isExpanded = expandedFolders.includes(folder.id);
  const hasChildren = folder.children && folder.children.length > 0;
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const moveMenuRef = useRef(null);

  // Close move menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(event.target)) {
        setShowMoveMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get available folders to move to (excluding self and children)
  const getAvailableFolders = (items, excludeId, currentPath = "") => {
    const result = [];
    items.forEach(f => {
      if (f.id !== excludeId) {
        const path = currentPath ? `${currentPath} / ${f.name}` : f.name;
        result.push({ id: f.id, name: f.name, path });
        if (f.children && f.children.length > 0) {
          result.push(...getAvailableFolders(f.children, excludeId, path));
        }
      }
    });
    return result;
  };

  const availableFolders = getAvailableFolders(allFolders, folder.id);

  return (
    <div ref={setNodeRef} style={{ ...style, marginLeft: depth > 0 ? `${depth * 24}px` : 0 }}>
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`group flex items-center gap-3 p-3 rounded-xl border-2 mb-2 transition-all bg-white dark:bg-slate-800 ${
          isDragging 
            ? "border-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30" 
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
        } ${depth > 0 ? "border-l-4 border-l-indigo-400" : ""}`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => toggleExpand(folder.id)}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
            hasChildren 
              ? "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" 
              : "text-transparent cursor-default"
          }`}
          disabled={!hasChildren}
        >
          <motion.svg 
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </motion.svg>
        </button>

        {/* Folder Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          depth === 0 
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white" 
            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{folder.name}</p>
          {hasChildren && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{folder.children.length} subfolder{folder.children.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* View Documents */}
          <button
            onClick={() => onViewDocs(folder)}
            className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            title="View documents"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* Add Subfolder */}
          <button
            onClick={() => onAddSubfolder(folder.id)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            title="Add subfolder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Move to Folder */}
          <div className="relative" ref={moveMenuRef}>
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Move to folder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
            
            <AnimatePresence>
              {showMoveMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                >
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Move to folder</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        onMoveToFolder(folder.id, null);
                        setShowMoveMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="text-slate-700 dark:text-slate-300">Root Level</span>
                    </button>
                    {availableFolders.map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          onMoveToFolder(folder.id, f.id);
                          setShowMoveMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span className="text-slate-700 dark:text-slate-300 truncate">{f.path}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Delete */}
          <button
            onClick={() => onDelete(folder.id)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SortableContext items={folder.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {folder.children.map((child) => (
                <SortableFolderItem
                  key={child.id}
                  folder={child}
                  depth={depth + 1}
                  expandedFolders={expandedFolders}
                  toggleExpand={toggleExpand}
                  onAddSubfolder={onAddSubfolder}
                  onDelete={onDelete}
                  onViewDocs={onViewDocs}
                  onMoveToFolder={onMoveToFolder}
                  allFolders={allFolders}
                />
              ))}
            </SortableContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Drag Overlay Item
function DragOverlayItem({ folder }) {
  return (
    <div className="p-3 rounded-xl border-2 border-indigo-500 bg-white dark:bg-slate-800 shadow-2xl flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{folder.name}</p>
    </div>
  );
}

export default function FolderHierarchy() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(["1", "2", "6"]);
  const [activeId, setActiveId] = useState(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const [folders, setFolders] = useState([
    {
      id: "1",
      name: "Contracts",
      children: [
        { id: "1-1", name: "Active Contracts", children: [] },
        { id: "1-2", name: "Expired Contracts", children: [] },
        { 
          id: "1-3", 
          name: "Templates", 
          children: [
            { id: "1-3-1", name: "NDA Templates", children: [] },
            { id: "1-3-2", name: "Service Agreements", children: [] },
          ] 
        },
      ],
    },
    {
      id: "2",
      name: "Financial",
      children: [
        { id: "2-1", name: "Invoices", children: [] },
        { id: "2-2", name: "Reports", children: [] },
        { id: "2-3", name: "Budgets", children: [] },
      ],
    },
    {
      id: "3",
      name: "HR Documents",
      children: [],
    },
    {
      id: "4",
      name: "Legal",
      children: [],
    },
    {
      id: "5",
      name: "Marketing",
      children: [],
    },
    {
      id: "6",
      name: "Reports",
      children: [
        { id: "6-1", name: "Q1 2025", children: [] },
        { id: "6-2", name: "Q2 2025", children: [] },
      ],
    },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find folder by ID in nested structure
  const findFolder = (items, id) => {
    for (const folder of items) {
      if (folder.id === id) return folder;
      if (folder.children && folder.children.length > 0) {
        const found = findFolder(folder.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Find parent of a folder
  const findParent = (items, id, parent = null) => {
    for (const folder of items) {
      if (folder.id === id) return parent;
      if (folder.children && folder.children.length > 0) {
        const found = findParent(folder.children, id, folder);
        if (found !== undefined) return found;
      }
    }
    return undefined;
  };

  // Get all folder IDs for sortable context
  const getAllFolderIds = (items) => {
    const ids = [];
    items.forEach(folder => {
      ids.push(folder.id);
      if (folder.children && folder.children.length > 0) {
        ids.push(...getAllFolderIds(folder.children));
      }
    });
    return ids;
  };

  const countAllFolders = (items) => {
    let count = items.length;
    items.forEach(folder => {
      if (folder.children) {
        count += countAllFolders(folder.children);
      }
    });
    return count;
  };

  const countEmptyFolders = (items) => {
    let count = 0;
    items.forEach(folder => {
      if (!folder.children || folder.children.length === 0) {
        count++;
      } else {
        count += countEmptyFolders(folder.children);
      }
    });
    return count;
  };

  const toggleExpand = (folderId) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      children: [],
    };

    if (selectedParent) {
      const addToChildren = (items) => {
        return items.map(folder => {
          if (folder.id === selectedParent) {
            return { ...folder, children: [...folder.children, newFolder] };
          }
          if (folder.children && folder.children.length > 0) {
            return { ...folder, children: addToChildren(folder.children) };
          }
          return folder;
        });
      };
      setFolders(addToChildren(folders));
      if (!expandedFolders.includes(selectedParent)) {
        setExpandedFolders(prev => [...prev, selectedParent]);
      }
    } else {
      setFolders(prev => [...prev, newFolder]);
    }

    setNewFolderName("");
    setSelectedParent(null);
    setShowAddFolderModal(false);
  };

  const handleDeleteFolder = (folderId) => {
    const removeFolder = (items) => {
      return items.filter(folder => folder.id !== folderId).map(folder => {
        if (folder.children && folder.children.length > 0) {
          return { ...folder, children: removeFolder(folder.children) };
        }
        return folder;
      });
    };
    setFolders(removeFolder(folders));
  };

  const handleMoveToFolder = (folderId, targetParentId) => {
    // Find and remove the folder
    let movedFolder = null;
    const removeFolder = (items) => {
      return items.filter(folder => {
        if (folder.id === folderId) {
          movedFolder = { ...folder };
          return false;
        }
        return true;
      }).map(folder => {
        if (folder.children && folder.children.length > 0) {
          return { ...folder, children: removeFolder(folder.children) };
        }
        return folder;
      });
    };

    let newFolders = removeFolder(folders);

    if (movedFolder) {
      if (targetParentId === null) {
        // Move to root
        newFolders = [...newFolders, movedFolder];
      } else {
        // Move to specific parent
        const addToParent = (items) => {
          return items.map(folder => {
            if (folder.id === targetParentId) {
              return { ...folder, children: [...(folder.children || []), movedFolder] };
            }
            if (folder.children && folder.children.length > 0) {
              return { ...folder, children: addToParent(folder.children) };
            }
            return folder;
          });
        };
        newFolders = addToParent(newFolders);
        
        // Expand target folder
        if (!expandedFolders.includes(targetParentId)) {
          setExpandedFolders(prev => [...prev, targetParentId]);
        }
      }
    }

    setFolders(newFolders);
  };

  const handleViewDocs = (folder) => {
    setSelectedFolder(folder);
    setShowDocsModal(true);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find the parent arrays containing active and over items
    const activeParent = findParent(folders, active.id);
    const overParent = findParent(folders, over.id);

    if (activeParent === overParent) {
      // Same parent - reorder within the same level
      const parentArray = activeParent ? activeParent.children : folders;
      const oldIndex = parentArray.findIndex(f => f.id === active.id);
      const newIndex = parentArray.findIndex(f => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(parentArray, oldIndex, newIndex);
        
        if (activeParent) {
          // Update within a parent
          const updateChildren = (items) => {
            return items.map(folder => {
              if (folder.id === activeParent.id) {
                return { ...folder, children: newOrder };
              }
              if (folder.children && folder.children.length > 0) {
                return { ...folder, children: updateChildren(folder.children) };
              }
              return folder;
            });
          };
          setFolders(updateChildren(folders));
        } else {
          // Update root level
          setFolders(newOrder);
        }
      }
    }
  };

  const getFolderName = (folderId) => {
    const folder = findFolder(folders, folderId);
    return folder ? folder.name : "";
  };

  const getActiveFolder = () => {
    return activeId ? findFolder(folders, activeId) : null;
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const docs = selectedFolder ? (folderDocuments[selectedFolder.id] || []) : [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-semibold text-slate-900 dark:text-white mb-1"
        >
          Folder Hierarchy
        </motion.h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Organize and manage your folder structure
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Root Folders", value: folders.length, icon: "📁" },
          { label: "Total Folders", value: countAllFolders(folders), icon: "🗂️" },
          { label: "Max Depth", value: 4, icon: "📊" },
          { label: "Empty Folders", value: countEmptyFolders(folders), icon: "📭" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4" hover>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>

        <Button onClick={() => { setSelectedParent(null); setShowAddFolderModal(true); }}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Root Folder
        </Button>
      </motion.div>

      {/* Info Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-6"
      >
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Drag & Drop to Reorganize</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Drag the handle (⋮⋮) to reorder folders. Use the move button to nest folders inside others.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Folder Tree with DnD Kit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Folder Structure</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">{filteredFolders.length} root folders</span>
          </div>

          {filteredFolders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">No folders found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Create a folder to get started</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={getAllFolderIds(folders)} strategy={verticalListSortingStrategy}>
                {filteredFolders.map((folder) => (
                  <SortableFolderItem
                    key={folder.id}
                    folder={folder}
                    expandedFolders={expandedFolders}
                    toggleExpand={toggleExpand}
                    onAddSubfolder={(parentId) => {
                      setSelectedParent(parentId);
                      setShowAddFolderModal(true);
                    }}
                    onDelete={handleDeleteFolder}
                    onViewDocs={handleViewDocs}
                    onMoveToFolder={handleMoveToFolder}
                    allFolders={folders}
                  />
                ))}
              </SortableContext>
              
              <DragOverlay>
                {activeId && getActiveFolder() ? (
                  <DragOverlayItem folder={getActiveFolder()} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </Card>
      </motion.div>

      {/* Add Folder Modal */}
      <AnimatePresence>
        {showAddFolderModal && (
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
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedParent ? "Add Subfolder" : "Add Root Folder"}
                </h2>
                <button 
                  onClick={() => { setShowAddFolderModal(false); setSelectedParent(null); setNewFolderName(""); }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                  />
                </div>

                {selectedParent && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Adding subfolder to: <span className="font-semibold text-slate-900 dark:text-white">
                        {getFolderName(selectedParent)}
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => { setShowAddFolderModal(false); setSelectedParent(null); setNewFolderName(""); }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleAddFolder}
                    disabled={!newFolderName.trim()}
                  >
                    Create Folder
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents Modal */}
      <AnimatePresence>
        {showDocsModal && selectedFolder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {selectedFolder.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowDocsModal(false); setSelectedFolder(null); }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {docs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">No documents</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">This folder is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                          doc.type === 'PDF' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                          doc.type === 'DOCX' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {doc.type}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{doc.date}</p>
                        </div>
                        <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button className="w-full" onClick={() => { setShowDocsModal(false); setSelectedFolder(null); }}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
