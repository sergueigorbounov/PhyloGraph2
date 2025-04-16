// src/components/LayoutPreferencesPanel.jsx

import React from 'react';
import { motion } from 'framer-motion';

export default function LayoutPreferencesPanel({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed right-4 top-16 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50 overflow-hidden"
    >
      <div className="bg-zinc-800 px-4 py-3 flex justify-between items-center">
        <h3 className="text-white font-medium">Layout Preferences</h3>
        <button 
          onClick={onClose}
          className="text-zinc-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Default Layout */}
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Default Layout</label>
            <select
              className="w-full bg-zinc-800 text-white rounded px-3 py-2 border border-zinc-700"
            >
              <option value="split-horizontal">Side by Side</option>
              <option value="split-vertical">Stacked</option>
              <option value="pip">Picture in Picture</option>
              <option value="tabs">Tabs</option>
              <option value="grid">Grid</option>
            </select>
          </div>
          
          {/* Split Ratio */}
          <div>
            <label className="block text-zinc-400 text-sm mb-1">
              Default Split Ratio: 50%
            </label>
            <input
              type="range"
              min="20"
              max="80"
              value="50"
              className="w-full"
            />
          </div>
          
          {/* Sync Mode */}
          <div>
            <label className="block text-zinc-400 text-sm mb-1">View Synchronization</label>
            <select
              className="w-full bg-zinc-800 text-white rounded px-3 py-2 border border-zinc-700"
            >
              <option value="none">Disabled</option>
              <option value="selection">Selection Only</option>
              <option value="full">Full Sync</option>
            </select>
          </div>
          
          {/* Other Preferences */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Advanced Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={true}
                  className="mr-2"
                />
                <span className="text-white">Suggest optimal layouts</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={true}
                  className="mr-2"
                />
                <span className="text-white">Remember last layout</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={false}
                  className="mr-2"
                />
                <span className="text-white">Use scientific notation</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-3 border-t border-zinc-700 flex justify-between">
        <button
          className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
        >
          Reset
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded"
        >
          Apply
        </button>
      </div>
    </motion.div>
  );
}