/**
 * @file PhyloResizableLayout.jsx
 * @description A flexible layout manager for PhyloGraph using react-resizable-panels
 * Provides resizable panels for various layout configurations while
 * maintaining compatibility with existing layout presets
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelGroup, 
  Panel, 
  PanelResizeHandle
} from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowsAlt, 
  FaTimes, 
  FaChevronLeft, 
  FaChevronRight, 
  FaArrowUp, 
  FaArrowDown,
  FaExchangeAlt 
} from 'react-icons/fa';

// Import custom styles
import './PhyloResizableLayout.css';

/**
 * PhyloResizableLayout
 * 
 * A resizable layout manager component for PhyloGraph using react-resizable-panels.
 * Supports multiple layout configurations with persistence.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.leftComponent - Component to render in the left/top panel
 * @param {ReactNode} props.rightComponent - Component to render in the right/bottom panel
 * @param {string} props.leftLabel - Label for the left panel
 * @param {string} props.rightLabel - Label for the right panel
 * @param {string} props.initialLayout - Initial layout type ('split-horizontal', 'split-vertical', 'grid', 'tabs', 'pip')
 * @param {boolean} props.scientificMode - Whether advanced scientific mode is enabled
 * @param {number} props.splitRatio - Initial split ratio (0-100)
 * @param {function} props.onSplitRatioChange - Callback when split ratio changes
 * @param {string} props.syncMode - Synchronization mode between panels
 * @param {function} props.onLayoutChange - Callback when layout changes
 * @param {function} props.onSync - Callback when sync occurs between panels
 * @param {Object} props.selectedNode - Currently selected node data
 * @param {Object} props.detailsComponent - Component to render node details
 */
const PhyloResizableLayout = ({
  leftComponent,
  rightComponent,
  leftLabel = "Network Graph",
  rightLabel = "Phylogenetic Tree",
  initialLayout = 'split-horizontal',
  scientificMode = false,
  splitRatio = 50,
  onSplitRatioChange,
  syncMode = 'none',
  onLayoutChange,
  onSync,
  selectedNode,
  detailsComponent,
  activeFocus,
  onActiveFocusChange,
  // Tool components for grid layout
  toolComponents = {},
  activePanel = 'tree',
}) => {
  // Refs for panel imperative handles
  const leftPanelRef = useRef(null);
  const rightPanelRef = useRef(null);
  const topLeftPanelRef = useRef(null);
  const bottomLeftPanelRef = useRef(null);
  const topRightPanelRef = useRef(null);
  const bottomRightPanelRef = useRef(null);

  // State for panel sizes
  const [leftPanelSize, setLeftPanelSize] = useState(splitRatio);
  const [rightPanelSize, setRightPanelSize] = useState(100 - splitRatio);
  
  // Grid layout panel sizes
  const [topLeftSize, setTopLeftSize] = useState(60);
  const [bottomLeftSize, setBottomLeftSize] = useState(40);
  const [topRightSize, setTopRightSize] = useState(60);
  const [bottomRightSize, setBottomRightSize] = useState(40);
  
  // State for maximized panels
  const [maximizedPanel, setMaximizedPanel] = useState(null);
  
  // Previous layout for restoration when toggling maximized state
  const previousLayoutRef = useRef(initialLayout);
  
  // Save initial layout when component mounts
  useEffect(() => {
    if (initialLayout !== 'maximized') {
      previousLayoutRef.current = initialLayout;
    }
  }, []);
  
  // Update panel sizes when splitRatio changes externally
  useEffect(() => {
    setLeftPanelSize(splitRatio);
    setRightPanelSize(100 - splitRatio);
  }, [splitRatio]);

  // Handle panel resize for the main split
  const handlePanelResize = (sizes) => {
    // Only trigger for horizontal/vertical splits, not grid
    if (initialLayout === 'split-horizontal' || initialLayout === 'split-vertical') {
      setLeftPanelSize(sizes[0]);
      setRightPanelSize(sizes[1]);
      
      if (onSplitRatioChange) {
        onSplitRatioChange(sizes[0]);
      }
    }
  };

  // Maximize/restore a panel
  const toggleMaximizePanel = (panelId) => {
    if (maximizedPanel === panelId) {
      // Restore previous layout
      setMaximizedPanel(null);
      if (onLayoutChange) {
        onLayoutChange(previousLayoutRef.current);
      }
    } else {
      // Save current layout and maximize panel
      previousLayoutRef.current = initialLayout;
      setMaximizedPanel(panelId);
      if (onLayoutChange) {
        onLayoutChange('maximized');
      }
    }
  };
  
  // Switch active focus when a panel is clicked
  const handlePanelFocus = (panelId) => {
    if (onActiveFocusChange) {
      onActiveFocusChange(panelId);
    }
  };

  // Horizontal split layout
  const renderHorizontalSplit = () => (
    <PanelGroup 
      direction="horizontal" 
      onLayout={handlePanelResize}
      className="phylo-panel-group"
    >
      <Panel 
        defaultSize={leftPanelSize} 
        minSize={15}
        ref={leftPanelRef}
        className={`phylo-panel ${activeFocus === 'left' ? 'panel-focused' : ''}`}
        onClick={() => handlePanelFocus('left')}
      >
        <div className="panel-header">
          <div className="panel-title">{leftLabel}</div>
          <div className="panel-controls">
            <button 
              className="panel-control-button" 
              onClick={() => toggleMaximizePanel('left')}
              title="Maximize panel"
            >
              <FaArrowsAlt />
            </button>
          </div>
        </div>
        <div className="panel-content">
          {leftComponent}
        </div>
      </Panel>
      
      <PanelResizeHandle className="resize-handle horizontal-handle">
        <div className="handle-grip"></div>
      </PanelResizeHandle>
      
      <Panel 
        defaultSize={rightPanelSize} 
        minSize={15}
        ref={rightPanelRef}
        className={`phylo-panel ${activeFocus === 'right' ? 'panel-focused' : ''}`}
        onClick={() => handlePanelFocus('right')}
      >
        <div className="panel-header">
          <div className="panel-title">{rightLabel}</div>
          <div className="panel-controls">
            <button 
              className="panel-control-button" 
              onClick={() => toggleMaximizePanel('right')}
              title="Maximize panel"
            >
              <FaArrowsAlt />
            </button>
          </div>
        </div>
        <div className="panel-content">
          {rightComponent}
        </div>
      </Panel>
    </PanelGroup>
  );

  // Vertical split layout
  const renderVerticalSplit = () => (
    <PanelGroup 
      direction="vertical" 
      onLayout={handlePanelResize}
      className="phylo-panel-group"
    >
      <Panel 
        defaultSize={leftPanelSize} 
        minSize={15}
        ref={leftPanelRef}
        className={`phylo-panel ${activeFocus === 'left' ? 'panel-focused' : ''}`}
        onClick={() => handlePanelFocus('left')}
      >
        <div className="panel-header">
          <div className="panel-title">{leftLabel}</div>
          <div className="panel-controls">
            <button 
              className="panel-control-button" 
              onClick={() => toggleMaximizePanel('left')}
              title="Maximize panel"
            >
              <FaArrowsAlt />
            </button>
          </div>
        </div>
        <div className="panel-content">
          {leftComponent}
        </div>
      </Panel>
      
      <PanelResizeHandle className="resize-handle vertical-handle">
        <div className="handle-grip horizontal-grip"></div>
      </PanelResizeHandle>
      
      <Panel 
        defaultSize={rightPanelSize} 
        minSize={15}
        ref={rightPanelRef}
        className={`phylo-panel ${activeFocus === 'right' ? 'panel-focused' : ''}`}
        onClick={() => handlePanelFocus('right')}
      >
        <div className="panel-header">
          <div className="panel-title">{rightLabel}</div>
          <div className="panel-controls">
            <button 
              className="panel-control-button" 
              onClick={() => toggleMaximizePanel('right')}
              title="Maximize panel"
            >
              <FaArrowsAlt />
            </button>
          </div>
        </div>
        <div className="panel-content">
          {rightComponent}
        </div>
      </Panel>
    </PanelGroup>
  );

  // Grid layout (2x2 grid)
  const renderGridLayout = () => (
    <PanelGroup direction="horizontal" className="phylo-panel-group">
      <Panel defaultSize={50} minSize={20}>
        <PanelGroup direction="vertical">
          <Panel 
            defaultSize={topLeftSize} 
            minSize={20}
            ref={topLeftPanelRef}
            className={`phylo-panel ${activeFocus === 'topleft' ? 'panel-focused' : ''}`}
            onResize={setTopLeftSize}
            onClick={() => handlePanelFocus('topleft')}
          >
            <div className="panel-header">
              <div className="panel-title">{leftLabel}</div>
              <div className="panel-controls">
                <button 
                  className="panel-control-button" 
                  onClick={() => toggleMaximizePanel('topleft')}
                  title="Maximize panel"
                >
                  <FaArrowsAlt />
                </button>
              </div>
            </div>
            <div className="panel-content">
              {leftComponent}
            </div>
          </Panel>
          
          <PanelResizeHandle className="resize-handle vertical-handle">
            <div className="handle-grip horizontal-grip"></div>
          </PanelResizeHandle>
          
          <Panel 
            defaultSize={bottomLeftSize} 
            minSize={20}
            ref={bottomLeftPanelRef}
            className={`phylo-panel ${activeFocus === 'bottomleft' ? 'panel-focused' : ''}`}
            onResize={setBottomLeftSize}
            onClick={() => handlePanelFocus('bottomleft')}
          >
            <div className="panel-header">
              <div className="panel-title">Details</div>
              <div className="panel-controls">
                <button 
                  className="panel-control-button" 
                  onClick={() => toggleMaximizePanel('bottomleft')}
                  title="Maximize panel"
                >
                  <FaArrowsAlt />
                </button>
              </div>
            </div>
            <div className="panel-content">
              {selectedNode ? detailsComponent : (
                <div className="empty-panel">
                  <p>Select a node to view details</p>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
      
      <PanelResizeHandle className="resize-handle horizontal-handle">
        <div className="handle-grip"></div>
      </PanelResizeHandle>
      
      <Panel defaultSize={50} minSize={20}>
        <PanelGroup direction="vertical">
          <Panel 
            defaultSize={topRightSize} 
            minSize={20}
            ref={topRightPanelRef}
            className={`phylo-panel ${activeFocus === 'topright' ? 'panel-focused' : ''}`}
            onResize={setTopRightSize}
            onClick={() => handlePanelFocus('topright')}
          >
            <div className="panel-header">
              <div className="panel-title">{rightLabel}</div>
              <div className="panel-controls">
                <button 
                  className="panel-control-button" 
                  onClick={() => toggleMaximizePanel('topright')}
                  title="Maximize panel"
                >
                  <FaArrowsAlt />
                </button>
              </div>
            </div>
            <div className="panel-content">
              {rightComponent}
            </div>
          </Panel>
          
          <PanelResizeHandle className="resize-handle vertical-handle">
            <div className="handle-grip horizontal-grip"></div>
          </PanelResizeHandle>
          
          <Panel 
            defaultSize={bottomRightSize} 
            minSize={20}
            ref={bottomRightPanelRef}
            className={`phylo-panel ${activeFocus === 'bottomright' ? 'panel-focused' : ''}`}
            onResize={setBottomRightSize}
            onClick={() => handlePanelFocus('bottomright')}
          >
            <div className="panel-header">
              <div className="panel-title">
                {activePanel === 'tree' ? 'SPARQL' : activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}
              </div>
              <div className="panel-controls">
                <button 
                  className="panel-control-button" 
                  onClick={() => toggleMaximizePanel('bottomright')}
                  title="Maximize panel"
                >
                  <FaArrowsAlt />
                </button>
              </div>
            </div>
            <div className="panel-content">
              {activePanel !== 'tree' ? toolComponents[activePanel] : toolComponents['sparql']}
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );

  // Tabbed layout (not a true tabbed interface, but a special case of maximized)
  const renderTabbedLayout = () => (
    <div className="tabs-container">
      <div className="tabs-header">
        <button 
          className={`tab-button ${!maximizedPanel || maximizedPanel === 'left' ? 'active' : ''}`}
          onClick={() => toggleMaximizePanel('left')}
        >
          {leftLabel}
        </button>
        <button 
          className={`tab-button ${maximizedPanel === 'right' ? 'active' : ''}`}
          onClick={() => toggleMaximizePanel('right')}
        >
          {rightLabel}
        </button>
      </div>
      <div className="tabs-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={maximizedPanel || 'left'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            {(!maximizedPanel || maximizedPanel === 'left') ? (
              <div className="panel-content full-height">
                {leftComponent}
              </div>
            ) : (
              <div className="panel-content full-height">
                {rightComponent}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

   // Picture-in-Picture layout (main panel with a smaller floating panel)
   const renderPipLayout = () => {
    // Determine which panel is the main one and which is in PiP
    const isPipLeft = maximizedPanel === 'right'; // if right is maximized, left is in PiP
    const mainComponent = isPipLeft ? rightComponent : leftComponent;
    const pipComponent = isPipLeft ? leftComponent : rightComponent;
    const mainLabel = isPipLeft ? rightLabel : leftLabel;
    const pipLabel = isPipLeft ? leftLabel : rightLabel;
    
    return (
      <div className="pip-layout">
        <div className="main-panel">
          <div className="panel-header">
            <div className="panel-title">{mainLabel}</div>
            <div className="panel-controls">
              <button 
                className="panel-control-button" 
                onClick={() => toggleMaximizePanel(isPipLeft ? 'left' : 'right')}
                title="Swap panels"
              >
                <FaExchangeAlt />
              </button>
            </div>
          </div>
          <div className="panel-content">
            {mainComponent}
          </div>
        </div>
        
        <div className="pip-panel" style={{ 
          right: '20px', 
          bottom: '20px',
          width: '30%',
          height: '30%'
        }}>
          <div className="panel-header draggable">
            <div className="panel-title">{pipLabel}</div>
            <div className="panel-controls">
              <button 
                className="panel-control-button" 
                onClick={() => toggleMaximizePanel(isPipLeft ? 'right' : 'left')}
                title="Swap panels"
              >
                <FaExchangeAlt />
              </button>
            </div>
          </div>
          <div className="panel-content">
            {pipComponent}
          </div>
          <div className="pip-resize-handle"></div>
        </div>
      </div>
    );
  };
  
  // Maximized panel layout (single panel taking full space)
  const renderMaximizedLayout = () => {
    let component;
    let title;
    
    if (maximizedPanel === 'right') {
      component = rightComponent;
      title = rightLabel;
    } else if (maximizedPanel === 'topright') {
      component = rightComponent;
      title = rightLabel;
    } else if (maximizedPanel === 'bottomright') {
      component = activePanel !== 'tree' ? toolComponents[activePanel] : toolComponents['sparql'];
      title = activePanel === 'tree' ? 'SPARQL' : activePanel.charAt(0).toUpperCase() + activePanel.slice(1);
    } else if (maximizedPanel === 'bottomleft') {
      component = selectedNode ? detailsComponent : (
        <div className="empty-panel">
          <p>Select a node to view details</p>
        </div>
      );
      title = "Details";
    } else {
      // Default to left panel
      component = leftComponent;
      title = leftLabel;
    }
    
    return (
      <div className="maximized-panel">
        <div className="panel-header">
          <div className="panel-title">{title}</div>
          <div className="panel-controls">
            <button 
              className="panel-control-button" 
              onClick={() => toggleMaximizePanel(null)}
              title="Restore layout"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="panel-content">
          {component}
        </div>
      </div>
    );
  };
  
    // Select which layout to render based on initialLayout prop
    const renderLayout = () => {
      // If a panel is maximized, render maximized layout
      if (initialLayout === 'maximized' || (maximizedPanel && initialLayout !== 'tabs' && initialLayout !== 'pip')) {
        return renderMaximizedLayout();
      }
      
      // Otherwise, render selected layout
      switch (initialLayout) {
        case 'split-vertical':
          return renderVerticalSplit();
        case 'grid':
          return renderGridLayout();
        case 'tabs':
          return renderTabbedLayout();
        case 'pip':
          return renderPipLayout();
        case 'split-horizontal':
        default:
          return renderHorizontalSplit();
      }
    };
  
    // Render sync indicator if sync is active
    const renderSyncIndicator = () => {
      if (syncMode === 'none') return null;
      
      return (
        <div className={`sync-indicator ${syncMode}`}>
          <span className="sync-badge">{syncMode} sync active</span>
        </div>
      );
    };
    
    // Scientific mode indicator
    const renderScientificModeIndicator = () => {
      if (!scientificMode) return null;
      
      return (
        <div className="scientific-mode-indicator">
          <span className="scientific-badge">Scientific Mode</span>
        </div>
      );
    };
  
    return (
      <div className={`phylo-resizable-layout ${scientificMode ? 'scientific-mode' : ''}`}>
        {renderLayout()}
        {renderSyncIndicator()}
        {renderScientificModeIndicator()}
      </div>
    );
  };
  
  export default PhyloResizableLayout;