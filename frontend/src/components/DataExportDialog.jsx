// src/components/DataExportDialog.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DataExportDialog({ isOpen, onClose, treeRef, graphRef }) {
  const [exportType, setExportType] = useState('tree-newick');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  
  const handleExport = () => {
    setExporting(true);
    setExportError(null);
    
    try {
      // Mock export functionality
      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      setExportError(error.message);
      setExporting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={(e) => e.target === e.currentTarget && !exporting && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-zinc-900 rounded-lg shadow-xl w-[500px] max-w-[90vw] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-zinc-800 px-4 py-3 flex justify-between items-center">
            <h3 className="text-white font-medium">Export Data</h3>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
              disabled={exporting}
            >
              ✕
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-zinc-400 text-sm mb-2">Export Format</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded px-3 py-2 border border-zinc-700"
                disabled={exporting}
              >
                <option value="tree-newick">Tree - Newick Format (.nwk)</option>
                <option value="tree-svg">Tree - Vector Graphic (.svg)</option>
                <option value="graph-json">Graph - JSON Format (.json)</option>
                <option value="graph-png">Graph - Image (.png)</option>
                <option value="all-formats">All Formats (ZIP Archive)</option>
              </select>
            </div>
            
            {exportType === 'tree-newick' && (
              <div className="bg-zinc-800 p-3 rounded mb-4 text-sm text-zinc-300">
                Newick format is the standard for representing phylogenetic trees in text form, 
                compatible with most phylogenetics software.
              </div>
            )}
            
            {exportError && (
              <div className="bg-red-900 text-red-100 p-3 rounded mb-4 text-sm">
                Export error: {exportError}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-zinc-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
              disabled={exporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded flex items-center"
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <span className="animate-spin mr-2">◌</span> Exporting...
                </>
              ) : (
                <>
                  Export
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}