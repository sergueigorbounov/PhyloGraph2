// src/components/LayoutManager.jsx

import React, { useState, useEffect } from 'react';

// Layout configuration constants
export const LAYOUTS = {
  SPLIT_HORIZONTAL: 'split-horizontal',
  SPLIT_VERTICAL: 'split-vertical',
  PIP: 'pip',
  TABS: 'tabs',
  GRID: 'grid',
  FULLSCREEN_LEFT: 'fullscreen-left',
  FULLSCREEN_RIGHT: 'fullscreen-right'
};

export default function LayoutManager({ 
  leftComponent, 
  rightComponent,
  leftLabel = "Left Panel",
  rightLabel = "Right Panel",
  onLayoutChange,
  initialLayout = LAYOUTS.SPLIT_HORIZONTAL,
  scientificMode = false,
  splitRatio = 50,
  onSplitRatioChange,
  syncMode = 'selection',
  onSyncModeChange,
  pipPosition = { x: 20, y: 20 },
  onPipPositionChange,
  pipSize = { width: 300, height: 250 },
  onPipSizeChange,
  activeFocus = 'left',
  onActiveFocusChange,
  onSync
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [isDragging, setIsDragging] = useState(false);
  
  // Update internal layout state when prop changes
  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);
  
  // Notify parent component when layout changes
  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  };
  
  // Render the correct layout based on state
  const renderLayout = () => {
    switch (layout) {
      case LAYOUTS.SPLIT_HORIZONTAL:
        return (
          <div className="flex h-full">
            <div style={{ width: `${splitRatio}%` }}>
              {leftComponent}
            </div>
            <div className="splitter-handle horizontal"
              onMouseDown={() => setIsDragging(true)}
              style={{ left: `${splitRatio}%` }}
            ></div>
            <div style={{ width: `${100 - splitRatio}%` }}>
              {rightComponent}
            </div>
          </div>
        );
      case LAYOUTS.SPLIT_VERTICAL:
        return (
          <div className="flex flex-col h-full">
            <div style={{ height: `${splitRatio}%` }}>
              {leftComponent}
            </div>
            <div className="splitter-handle vertical"
              onMouseDown={() => setIsDragging(true)}
              style={{ top: `${splitRatio}%` }}
            ></div>
            <div style={{ height: `${100 - splitRatio}%` }}>
              {rightComponent}
            </div>
          </div>
        );
      case LAYOUTS.PIP:
        return (
          <div className="relative h-full">
            <div className="h-full">
              {activeFocus === 'left' ? leftComponent : rightComponent}
            </div>
            <div className="pip-container" style={{ 
              width: pipSize.width, 
              height: pipSize.height,
              left: pipPosition.x,
              top: pipPosition.y
            }}>
              <div className="pip-header">
                <h4>{activeFocus === 'left' ? rightLabel : leftLabel}</h4>
                <button onClick={() => onActiveFocusChange && onActiveFocusChange(activeFocus === 'left' ? 'right' : 'left')}>
                  Swap
                </button>
              </div>
              <div className="pip-content">
                {activeFocus === 'left' ? rightComponent : leftComponent}
              </div>
            </div>
          </div>
        );
      case LAYOUTS.TABS:
        return (
          <div className="tabs-container">
            <div className="tabs-header">
              <button 
                className={`tab-button ${activeFocus === 'left' ? 'active' : ''}`}
                onClick={() => onActiveFocusChange && onActiveFocusChange('left')}
              >
                {leftLabel}
              </button>
              <button 
                className={`tab-button ${activeFocus === 'right' ? 'active' : ''}`}
                onClick={() => onActiveFocusChange && onActiveFocusChange('right')}
              >
                {rightLabel}
              </button>
            </div>
            <div className="tabs-content">
              {activeFocus === 'left' ? leftComponent : rightComponent}
            </div>
          </div>
        );
      case LAYOUTS.GRID:
        return (
          <div className="grid-layout">
            <div className="grid-cell">
              <div className="grid-cell-header">
                <h4>{leftLabel}</h4>
              </div>
              <div className="grid-cell-content">
                {leftComponent}
              </div>
            </div>
            <div className="grid-cell">
              <div className="grid-cell-header">
                <h4>{rightLabel}</h4>
              </div>
              <div className="grid-cell-content">
                {rightComponent}
              </div>
            </div>
            <div className="grid-cell">
              <div className="grid-cell-header">
                <h4>Analysis</h4>
              </div>
              <div className="grid-cell-content">
                {scientificMode ? (
                  <div className="p-2 text-zinc-400">
                    Scientific analysis panel
                  </div>
                ) : (
                  <div className="p-2 text-zinc-500">
                    Enable scientific mode for analysis tools
                  </div>
                )}
              </div>
            </div>
            <div className="grid-cell">
              <div className="grid-cell-header">
                <h4>Details</h4>
              </div>
              <div className="grid-cell-content">
                <div className="p-2 text-zinc-500">
                  Select a node to view details
                </div>
              </div>
            </div>
          </div>
        );
      case LAYOUTS.FULLSCREEN_LEFT:
        return (
          <div className="h-full">
            {leftComponent}
          </div>
        );
      case LAYOUTS.FULLSCREEN_RIGHT:
        return (
          <div className="h-full">
            {rightComponent}
          </div>
        );
      default:
        return renderSplitHorizontal();
    }
  };
  
  // Handle mouse move for drag operations
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e) => {
      if (layout === LAYOUTS.SPLIT_HORIZONTAL) {
        const container = document.querySelector('.main-content');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
          // Constrain between 20% and 80%
          const clampedRatio = Math.max(20, Math.min(80, newRatio));
          if (onSplitRatioChange) onSplitRatioChange(clampedRatio);
        }
      } else if (layout === LAYOUTS.SPLIT_VERTICAL) {
        const container = document.querySelector('.main-content');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const newRatio = ((e.clientY - containerRect.top) / containerRect.height) * 100;
          // Constrain between 20% and 80%
          const clampedRatio = Math.max(20, Math.min(80, newRatio));
          if (onSplitRatioChange) onSplitRatioChange(clampedRatio);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, layout, onSplitRatioChange]);
  
  return (
    <div className="w-full h-full relative">
      {renderLayout()}
    </div>
  );
}