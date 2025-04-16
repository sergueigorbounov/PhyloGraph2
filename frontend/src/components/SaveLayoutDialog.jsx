// src/components/SaveLayoutDialog.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SaveLayoutDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  currentConfig,
  existingPresets = []
}) {
  const [presetName, setPresetName] = useState('');
  const [error, setError] = useState('');
  
  const handleSave = () => {
    // Validate name
    if (!presetName.trim()) {
      setError('Please enter a name for this layout preset');
      return;
    }
    
    // Check for duplicates
    if (existingPresets.some(preset => preset.name.toLowerCase() === presetName.toLowerCase())) {
      setError('A preset with this name already exists');
      return;
    }
    
    // Save the preset
    onSave({
      name: presetName,
      config: currentConfig
    });
    
    // Reset and close
    setPresetName('');
    setError('');
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-zinc-900 rounded-lg shadow-xl w-[400px] max-w-[90vw] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-zinc-800 px-4 py-3 flex justify-between items-center">
            <h3 className="text-white font-medium">Save Layout Preset</h3>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-zinc-400 text-sm mb-2">Preset Name</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => {
                  setPresetName(e.target.value);
                  setError('');
                }}
                placeholder="Enter a name for this layout preset"
                className="w-full bg-zinc-800 text-white rounded px-3 py-2 border border-zinc-700"
                autoFocus
              />
              
              {error && (
                <p className="text-red-500 text-xs mt-2">{error}</p>
              )}
            </div>
            
            <div className="bg-zinc-800 p-3 rounded mb-4">
              <h4 className="text-zinc-300 text-sm font-medium mb-2">Layout Configuration</h4>
              <div className="text-xs text-zinc-400 space-y-1">
                <div className="flex justify-between">
                  <span>Layout Type:</span>
                  <span className="text-zinc-300 capitalize">{currentConfig?.layout?.replace('-', ' ') || 'Default'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Split Ratio:</span>
                  <span className="text-zinc-300">{currentConfig?.splitRatio || 50}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 border-t border-zinc-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded"
            >
              Save Preset
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}