// OnlyOffice Editor Component
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import documentService from '../../services/document.service';

const ONLYOFFICE_URL = import.meta.env.VITE_ONLYOFFICE_URL || 'http://localhost:8082';

export default function OnlyOfficeEditor({ config, onClose, documentName, documentId, onSwitchToEdit }) {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorInstance, setEditorInstance] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const isViewMode = config?.editorConfig?.mode === 'view';

  // Track save status via a ref so callbacks can access latest value
  const hasChangesRef = useRef(false);
  const saveResolveRef = useRef(null);
  const everModifiedRef = useRef(false);    // true once user makes ANY edit
  const userExplicitSaveRef = useRef(false); // true only after explicit Save click

  const handleSave = useCallback(async () => {
    if (!documentId || !hasChangesRef.current || isSaving) return;
    setIsSaving(true);

    try {
      // Call backend force-save endpoint which triggers OnlyOffice Command Service
      const result = await documentService.forceSave(documentId);
      console.log('Force-save result:', result);

      // Wait a moment for OnlyOffice to process the callback
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsSaving(false);
      setHasChanges(false);
      hasChangesRef.current = false;
      userExplicitSaveRef.current = true;
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setIsSaving(false);
    }
  }, [documentId, isSaving]);

  const handleCloseClick = useCallback(() => {
    // Show confirmation if doc was modified and user never explicitly saved
    if (!isViewMode && (hasChangesRef.current || (everModifiedRef.current && !userExplicitSaveRef.current))) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [onClose, isViewMode]);

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  const handleSaveAndClose = useCallback(async () => {
    if (!documentId || !hasChangesRef.current) {
      setShowCloseConfirm(false);
      onClose();
      return;
    }
    setIsSaving(true);
    setShowCloseConfirm(false);

    try {
      await documentService.forceSave(documentId);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error('Save before close failed:', err);
    }

    setIsSaving(false);
    userExplicitSaveRef.current = true;
    onClose();
  }, [documentId, onClose]);

  useEffect(() => {
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.DocsAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = `${ONLYOFFICE_URL}/web-apps/apps/api/documents/api.js`;
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load OnlyOffice API'));
        document.body.appendChild(script);
      });
    };

    const initEditor = async () => {
      try {
        await loadScript();
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!window.DocsAPI) {
          throw new Error('OnlyOffice API not available');
        }

        if (editorInstance) {
          editorInstance.destroyEditor();
        }

        // Inject event handlers into the config
        const editorConfig = {
          ...config,
          events: {
            onDocumentStateChange: (event) => {
              // event.data is true when document has unsaved changes
              const changed = event.data;
              setHasChanges(changed);
              hasChangesRef.current = changed;

              // Mark that user has modified the document at least once
              if (changed) everModifiedRef.current = true;

              // If changes become false, it means save completed
              if (!changed && saveResolveRef.current) {
                saveResolveRef.current();
                saveResolveRef.current = null;
              }
            },
            onReady: () => {
              setIsLoading(false);
            },
            onError: (event) => {
              console.error('OnlyOffice editor error:', event);
            },
          },
        };

        const editor = new window.DocsAPI.DocEditor('onlyoffice-editor', editorConfig);
        setEditorInstance(editor);
        setIsLoading(false);
      } catch (err) {
        console.error('OnlyOffice init error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    if (config) {
      initEditor();
    }

    return () => {
      if (editorInstance) {
        try {
          editorInstance.destroyEditor();
        } catch (e) {
          console.warn('Error destroying editor:', e);
        }
      }
    };
  }, [config]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-900"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span className="text-white font-medium truncate max-w-md">
              {documentName || 'Document'}
            </span>

            {/* Save status indicator */}
            <AnimatePresence mode="wait">
              {isSaving && (
                <motion.div key="saving" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-amber-400 font-medium">Saving...</span>
                </motion.div>
              )}
              {showSaved && !isSaving && (
                <motion.div key="saved" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-xs text-emerald-400 font-medium">Saved</span>
                </motion.div>
              )}
              {hasChanges && !isSaving && !showSaved && !isViewMode && (
                <motion.div key="unsaved" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-xs text-slate-400 font-medium">Unsaved changes</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Document button — only in view mode when onSwitchToEdit is provided */}
            {isViewMode && onSwitchToEdit && (
              <button
                onClick={onSwitchToEdit}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-indigo-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Document
              </button>
            )}

            {/* Save Button — only in edit mode */}
            {!isViewMode && (
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  hasChanges && !isSaving
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={handleCloseClick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>

        {/* Editor Container */}
        <div className="pt-14 h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading document editor...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
              <div className="text-center max-w-md p-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Editor</h3>
                <p className="text-slate-400 mb-4">{error}</p>
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Make sure OnlyOffice Document Server is running at:</p>
                  <code className="text-xs bg-slate-800 px-3 py-1 rounded text-indigo-400">{ONLYOFFICE_URL}</code>
                </div>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div
            id="onlyoffice-editor"
            ref={editorRef}
            className="w-full h-full"
          />
        </div>

        {/* ══ Unsaved Changes Confirmation Dialog ══ */}
        <AnimatePresence>
          {showCloseConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30"
              onClick={() => setShowCloseConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-slate-200/50 dark:border-slate-700/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Warning Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>

                  {/* Text */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
                    Unsaved Changes
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                    Your document has unsaved changes. Are you sure you want to close without saving?
                  </p>
                </div>

                {/* Actions - 3 buttons */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {/* Save & Close */}
                  <button
                    onClick={handleSaveAndClose}
                    className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Save & Close
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Discard & Close */}
                    <button
                      onClick={handleConfirmClose}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-all text-sm"
                    >
                      Discard & Close
                    </button>

                    {/* Cancel */}
                    <button
                      onClick={() => setShowCloseConfirm(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
