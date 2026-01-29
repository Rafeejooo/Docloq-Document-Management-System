// OnlyOffice Editor Component
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ONLYOFFICE_URL = import.meta.env.VITE_ONLYOFFICE_URL || 'http://localhost:8082';

export default function OnlyOfficeEditor({ config, onClose, documentName }) {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorInstance, setEditorInstance] = useState(null);

  useEffect(() => {
    // Load OnlyOffice API script dynamically
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        // Check if script already loaded
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
        
        // Wait a bit for DocsAPI to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!window.DocsAPI) {
          throw new Error('OnlyOffice API not available');
        }

        // Destroy existing editor if any
        if (editorInstance) {
          editorInstance.destroyEditor();
        }

        // Initialize editor
        const editor = new window.DocsAPI.DocEditor('onlyoffice-editor', config);
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

    // Cleanup
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
          </div>
          
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
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
      </motion.div>
    </AnimatePresence>
  );
}
