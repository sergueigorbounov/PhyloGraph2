// src/components/SyncModeSelector.jsx

import React from 'react';
import { FaLink, FaUnlink, FaExchangeAlt } from 'react-icons/fa';

export default function SyncModeSelector({ 
  mode = 'selection', 
  onChange,
  tooltip = true
}) {
  // Modes and their configurations
  const modes = [
    { 
      id: 'none', 
      label: 'No Sync', 
      icon: <FaUnlink />, 
      color: 'none',
      description: 'Views operate independently'
    },
    { 
      id: 'selection', 
      label: 'Selection Sync', 
      icon: <FaExchangeAlt />, 
      color: 'selection',
      description: 'Selecting nodes in one view highlights them in other views'
    },
    { 
      id: 'full', 
      label: 'Full Sync', 
      icon: <FaLink />, 
      color: 'full',
      description: 'Views are fully synchronized - selection, zoom, pan'
    },
  ];
  
  // Find the current mode object
  const currentMode = modes.find(m => m.id === mode) || modes[0];
  
  return (
    <div className="sync-mode-selector">
      <button 
        className={`sync-mode-button ${currentMode.color}`}
        onClick={() => {
          // Cycle through modes
          const currentIndex = modes.findIndex(m => m.id === mode);
          const nextIndex = (currentIndex + 1) % modes.length;
          onChange(modes[nextIndex].id);
        }}
      >
        <span className="sync-mode-icon">
          {currentMode.icon}
        </span>
        <span className="sync-mode-label">
          {currentMode.label}
        </span>
      </button>
      
      {tooltip && (
        <div className="sync-mode-tooltip">
          {currentMode.description}
        </div>
      )}
    </div>
  );
}