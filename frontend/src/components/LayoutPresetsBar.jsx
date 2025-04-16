// src/components/LayoutPresetsBar.jsx

import React from 'react';
import { 
  FaColumns, FaLayerGroup, FaWindowRestore, FaThLarge, FaExpand, 
  FaSave, FaTrash, FaPlus
} from 'react-icons/fa';
import { LAYOUTS } from './LayoutManager';

export default function LayoutPresetsBar({ 
  currentLayout, 
  onLayoutChange, 
  userPresets = [],
  onSavePreset,
  onDeletePreset,
  onManagePresets
}) {
  // Built-in layouts
  const builtInLayouts = [
    { id: LAYOUTS.SPLIT_HORIZONTAL, name: 'Side by Side', icon: <FaColumns />, shortcut: 'Alt+1' },
    { id: LAYOUTS.SPLIT_VERTICAL, name: 'Stacked', icon: <FaLayerGroup />, shortcut: 'Alt+2' },
    { id: LAYOUTS.PIP, name: 'PIP', icon: <FaWindowRestore />, shortcut: 'Alt+3' },
    { id: LAYOUTS.TABS, name: 'Tabs', icon: <div className="flex flex-col items-center">
      <div className="w-2.5 h-0.5 bg-current mb-0.5"></div>
      <div className="w-2.5 h-0.5 bg-current mb-0.5"></div>
      <div className="w-2.5 h-0.5 bg-current"></div>
    </div>, shortcut: 'Alt+4' },
    { id: LAYOUTS.GRID, name: 'Grid', icon: <FaThLarge />, shortcut: 'Alt+5' },
  ];
  
  return (
    <div className="layout-presets-bar">
      {/* Built-in layouts */}
      {builtInLayouts.map(layout => (
        <button
          key={layout.id}
          onClick={() => onLayoutChange(layout.id)}
          className={`preset-button ${
            currentLayout === layout.id 
              ? 'active' 
              : ''
          }`}
          title={`${layout.name} (${layout.shortcut})`}
        >
          <span className="preset-icon">{layout.icon}</span>
          <span className="preset-label">{layout.name}</span>
        </button>
      ))}
      
      {/* Divider */}
      {userPresets.length > 0 && (
        <div className="presets-divider"></div>
      )}
      
      {/* User presets (first 3 only) */}
      {userPresets.slice(0, 3).map(preset => (
        <button
          key={preset.id}
          onClick={() => onLayoutChange(preset.config.layout, preset.config)}
          className={`preset-button relative ${
            currentLayout === preset.config.layout 
              ? 'active' 
              : ''
          }`}
          title={preset.name}
        >
          {/* Use builtInLayouts icon based on layout type */}
          <span className="preset-icon">
            {builtInLayouts.find(l => l.id === preset.config.layout)?.icon || <FaColumns />}
          </span>
          <span className="preset-label">{preset.name}</span>
          
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeletePreset(preset.id);
            }}
            className="preset-button-delete"
          >
            <FaTrash />
          </button>
        </button>
      ))}
      
      {/* Save current layout button */}
      <button
        onClick={onSavePreset}
        className="preset-button"
        title="Save Current Layout"
      >
        <span className="preset-icon"><FaPlus /></span>
        <span className="preset-label">Save</span>
      </button>
      
      {/* More options button (if we have more than 3 presets) */}
      {userPresets.length > 3 && (
        <button
          onClick={onManagePresets}
          className="preset-button"
          title="Manage Layout Presets"
        >
          <span className="preset-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </span>
          <span className="preset-label">More</span>
        </button>
      )}
    </div>
  );
}