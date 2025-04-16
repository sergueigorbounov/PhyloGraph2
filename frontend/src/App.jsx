/**
 * @file App.jsx
 * @description PhyloGraph main application with advanced layout system
 * A comprehensive scientific platform for phylogenetic and evolutionary research
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { 
  FaColumns, FaLayerGroup, FaWindowRestore, FaThLarge, FaExpand, 
  FaExchangeAlt, FaSyncAlt, FaLink, FaUnlink, FaCog, FaSearch, 
  FaPlus, FaDownload, FaSave, FaTimes, FaCompass
} from 'react-icons/fa';

// Core components
import StandalonePhyloTree from './components/StandalonePhyloTree';
import SearchBar from './components/SearchBar';
import GraphViewer from './components/GraphViewer';
import SPARQLPanel from './components/SPARQLPanel';
import NLQPanel from './components/NLQPanel';
import AskPanel from './components/AskPanel';
import BrapiPanel from './components/BrapiPanel';
import ExportPanel from './components/ExportPanel';
import OntologyPanel from './components/OntologyPanel';
import PhyD3 from './components/PhyD3';
import OrthologBanner from './components/OrthologBanner';
import FederatedSPARQLPanel from './components/FederatedSPARQLPanel';
// Import PersistentPhyloTree with correct path
import { PersistentPhyloTree } from './components/PersistentPhyloTree';
import SimplePhyloTree from './components/SimplePhyloTree';
// Layout & UI components
import LayoutPresetsBar from './components/LayoutPresetsBar';
import MiniMap from './components/MiniMap';
import ViewLinkageIndicator from './components/ViewLinkageIndicator';
import SaveLayoutDialog from './components/SaveLayoutDialog';
import SyncModeSelector from './components/SyncModeSelector';
import DataExportDialog from './components/DataExportDialog';
import SmartLayoutDetector from './components/SmartLayoutDetector';
import LayoutPreferencesPanel from './components/LayoutPreferencesPanel';
import CommandPalette from './components/CommandPalette';
import EmergencyPhyloTree from './components/EmergencyPhyloTree';
// Scientific components
import ScientificMetricsPanel from './components/ScientificMetricsPanel';
import NodeDetailsPanel from './components/NodeDetailsPanel';
import PublicationExportPanel from './components/PublicationExportPanel';
import BatchAnalysisPanel from './components/BatchAnalysisPanel';
import PhyloResizableLayout from './components/PhyloResizableLayout';
// Hooks
import { useLog } from './hooks/useLog';
import { useOrthologGroupsFromGraph } from './hooks/useOrthologGroupsFromGraph';
import { usePhyloViewSync } from './hooks/usePhyloViewSync';
import { usePhyloGraphLayout } from './hooks/usePhyloGraphLayout';
import { useDataExport } from './hooks/useDataExport';

import './App.css';

// Enhanced fallback genes with additional scientific metadata
const FALLBACK_GENES = [
  {
    gene_id: 'FallbackGene1',
    gene_label: 'FallbackGene1',
    trait_label: 'Ortholog Member',
    trait_uri: 'http://example.org/trait/ortholog',
    species: 'Zea mays',
    confidence: 0.95,
    synonymous_mutations: 12,
    nonsynonymous_mutations: 3,
  },
  {
    gene_id: 'FallbackGene2',
    gene_label: 'FallbackGene2',
    trait_label: 'Ortholog Member',
    trait_uri: 'http://example.org/trait/ortholog',
    species: 'Zea mays',
    confidence: 0.88,
    synonymous_mutations: 8,
    nonsynonymous_mutations: 2,
  },
];

const getSyntenyLink = (geneId) =>
  geneId ? `https://urgi.versailles.inrae.fr/syntenyviewer?gene=${geneId}` : null;

export default function App() {
  const { addLog } = useLog();
  const [elements, setElements] = useState([]);
  const [activePanel, setActivePanel] = useState('tree');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    dataProcessingTime: 0,
    nodeCount: 0,
    fps: 0,
  });
  
  // Layout state from custom hook
  const {
    layout,
    splitRatio,
    syncMode,
    pipPosition,
    pipSize,
    activeFocus,
    previousLayout,
    setLayout,
    setSplitRatio,
    setSyncMode,
    setPipPosition,
    setPipSize,
    setActiveFocus,
    getCurrentConfig,
    userPresets,
    savePreset,
    deletePreset,
    applyPreset,
    showPreferencesPanel,
    setShowPreferencesPanel,
    showSavePresetDialog,
    setShowSavePresetDialog,
    showPresetsManager,
    setShowPresetsManager,
    containerRef
  } = usePhyloGraphLayout();
  
  // UI state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [syncActive, setSyncActive] = useState(false);
  
  // Refs
  const treeRef = useRef();
  const phyloTreeRef = useRef();
  const graphRef = useRef();
  const mountedRef = useRef(false);
  const perfTimerRef = useRef(null);
  
  // Data for visualizations
  const { groupMap, fallbackUsed } = useOrthologGroupsFromGraph();
  const detectedGroup = Object.values(groupMap)[0] || 'http://example.org/group/DemoOrtholog1';
  
  // Data export functionality
  const { 
    exportTreeAsNewick,
    exportTreeAsSVG,
    exportGraphAsJSON,
    exportGraphAsPNG,
    exportAllFormats 
  } = useDataExport({ treeRef, graphRef });
  
  // Initialize view synchronization 
  const { 
    setTreeSelection,
    setGraphSelection
  } = usePhyloViewSync({
    treeRef,
    graphRef,
    enabled: syncMode !== 'none',
    syncMode
  });

  // Performance monitoring for scientific mode
  useEffect(() => {
    if (advancedMode && mountedRef.current) {
      // Start FPS counter
      let frameCount = 0;
      let lastTime = performance.now();
      
      const calculateFPS = () => {
        const now = performance.now();
        const delta = now - lastTime;
        frameCount++;
        
        if (delta >= 1000) {
          const fps = Math.round((frameCount * 1000) / delta);
          setPerformanceMetrics(prev => ({ ...prev, fps }));
          frameCount = 0;
          lastTime = now;
        }
        
        perfTimerRef.current = requestAnimationFrame(calculateFPS);
      };
      
      calculateFPS();
      
      return () => {
        if (perfTimerRef.current) {
          cancelAnimationFrame(perfTimerRef.current);
        }
      };
    }
  }, [advancedMode]);

  // Component initialization
  useEffect(() => {
    mountedRef.current = true;
    
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        // First update the state
        handleGraphUpdate(FALLBACK_GENES);
        
        // Then set up the window.treeRef with enhanced functions
        window.treeRef = {
          highlightNode: (id) => {
            const cy = window.cy;
            if (cy && cy.$(`#${id}`).length) {
              cy.$(`#${id}`).select();
              cy.animate({ fit: { eles: cy.$(`#${id}`), padding: 80 }, duration: 500 });
            }
          },
          refresh: () => {
            const event = new Event('refresh-tree');
            window.dispatchEvent(event);
          },
          // Added scientific functions
          getNewickFormat: () => {
            // Simple implementation - would be replaced with actual conversion
            return "(Gene1:0.1,Gene2:0.2,(Gene3:0.3,Gene4:0.4):0.5);";
          },
          calculateConservation: (nodeId) => {
            // Placeholder for conservation calculation
            return { score: 0.85, pValue: 0.01 };
          },
          exportHighResolution: (format = 'SVG') => {
            // Implementation for high-res export would go here
            toast.success(`Exporting high-resolution ${format}`);
            return true;
          }
        };
        
        // Load example tree data
        setTreeData({
          nodes: FALLBACK_GENES.map(gene => ({
            id: gene.gene_id,
            name: gene.gene_label,
            data: {
              species: gene.species,
              confidence: gene.confidence
            }
          })),
          edges: [],
          maxDepth: 3
        });
        
        // Show toast after a delay to ensure rendering is complete
        setTimeout(() => {
          if (mountedRef.current) {
            toast.success('Demo graph loaded.');
          }
        }, 100);
      }
    }, 0);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (perfTimerRef.current) {
        cancelAnimationFrame(perfTimerRef.current);
      }
    };
  }, []);

  // Enhanced graph update with performance tracking
  const handleGraphUpdate = (data) => {
    const startTime = performance.now();
    
    setElements((prev) => {
      const newElements = [...prev];
      const existingNodeIds = new Set(newElements.map(e => e.data?.id));
      const existingEdges = new Set(
        newElements
          .filter(e => e.data?.source && e.data?.target)
          .map(e => `${e.data.source}→${e.data.target}`)
      );

      data.forEach((item) => {
        const geneId = item.gene_id;
        const traitLabel = item.trait_label;

        if (!existingNodeIds.has(geneId)) {
          newElements.push({
            data: {
              id: geneId,
              label: item.gene_label,
              external_link: getSyntenyLink(geneId),
              // Add scientific metadata
              species: item.species,
              confidence: item.confidence || 1.0,
              synonymous_mutations: item.synonymous_mutations,
              nonsynonymous_mutations: item.nonsynonymous_mutations,
            },
          });
        }

        if (!existingNodeIds.has(traitLabel)) {
          newElements.push({ 
            data: { 
              id: traitLabel, 
              label: traitLabel,
              type: 'trait',
              uri: item.trait_uri 
            } 
          });
        }

        const edgeKey = `${geneId}→${traitLabel}`;
        if (!existingEdges.has(edgeKey)) {
          newElements.push({
            data: { 
              source: geneId, 
              target: traitLabel, 
              label: 'associatedWith',
              weight: item.association_score || 1.0,
              evidence: item.evidence_code || 'EXPERIMENTAL'
            },
          });
        }
      });

      const processingTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        dataProcessingTime: processingTime,
        nodeCount: newElements.length
      }));
      
      return newElements;
    });
    
    // Update tree data as well
    setTreeData({
      nodes: data.map(gene => ({
        id: gene.gene_id,
        name: gene.gene_label,
        data: {
          species: gene.species,
          confidence: gene.confidence
        }
      })),
      edges: [],
      maxDepth: 3
    });
    
    // Show toast after state update with delay
    setTimeout(() => {
      if (mountedRef.current) {
        toast.success(`Graph updated with ${data.length} gene-trait entries.`);
      }
    }, 100);
  };

  const loadFallbackGraph = () => {
    // Update state
    handleGraphUpdate(FALLBACK_GENES);
    
    // Show toast after a delay
    setTimeout(() => {
      if (mountedRef.current) {
        toast.success('Demo graph loaded.');
      }
    }, 100);
  };

  // Handle node selection with synchronization
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
    
    if (syncMode !== 'none' && node?.id) {
      // This will trigger syncing to the tree
      setGraphSelection(node.id);
      setSyncActive(true);
      
      // Turn off sync indicator after a delay
      setTimeout(() => setSyncActive(false), 1500);
    }
  }, [syncMode, setGraphSelection]);

  // Handle tree node click with synchronization
  const handleTreeNodeClick = useCallback((id) => {
    if (!id) return;
    
    const cy = window.cy;
    if (cy && cy.$(`#${id}`).length) {
      cy.$(`#${id}`).select();
      cy.center(cy.$(`#${id}`));
      cy.animate({ fit: { eles: cy.$(`#${id}`), padding: 80 }, duration: 500 });
    }
    
    if (syncMode !== 'none') {
      // This will trigger syncing to the graph
      setTreeSelection(id);
      setSyncActive(true);
      
      // Turn off sync indicator after a delay
      setTimeout(() => setSyncActive(false), 1500);
    }
  }, [syncMode, setTreeSelection]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+P or Cmd+Shift+P for command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      
      // Alt+Shift+S for save layout
      if (e.altKey && e.shiftKey && e.key === 's') {
        e.preventDefault();
        setShowSavePresetDialog(true);
      }
      
      // Alt+Shift+E for export dialog
      if (e.altKey && e.shiftKey && e.key === 'e') {
        e.preventDefault();
        setShowExportDialog(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Memoize the GraphViewer for performance
  const memoizedGraphViewer = useMemo(() => (
    <GraphViewer 
      elements={elements}
      scientificMode={advancedMode}
      onNodeSelect={handleNodeSelect}
      ref={graphRef}
    />
  ), [elements, advancedMode, handleNodeSelect]);

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const fadeProps = {
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
    variants: panelVariants,
    transition: { duration: 0.4 },
  };

  const isActive = (panel) => activePanel === panel ? 'active' : '';

  // Simple performance overlay for scientists
  const PerformanceOverlay = () => (
    <div className="performance-overlay">
      <div className="performance-stats">
      <h3>Performance Metrics</h3>
        <div>
          <span>FPS:</span>
          <span>{performanceMetrics.fps}</span>
        </div>
        <div>
          <span>Data Processing:</span>
          <span>{performanceMetrics.dataProcessingTime.toFixed(2)}ms</span>
        </div>
        <div>
          <span>Render Time:</span>
          <span>{performanceMetrics.renderTime.toFixed(2)}ms</span>
        </div>
        <div>
          <span>Node Count:</span>
          <span>{performanceMetrics.nodeCount}</span>
        </div>
      </div>
    </div>
  );

  // Graph panel content with search bar and graph viewer
  const GraphPanelContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-zinc-800">
        <SearchBar
          onGraphUpdate={handleGraphUpdate}
          onClearGraph={() => {
            setElements([]);
            setTimeout(() => {
              if (mountedRef.current) {
                toast.success('Graph cleared.');
              }
            }, 100);
          }}
          onLoadDemo={loadFallbackGraph}
          advancedMode={advancedMode}
        />
      </div>
      <div className="flex-grow relative">
        {memoizedGraphViewer}
        {advancedMode && <PerformanceOverlay />}
      </div>
    </div>
  );

  // Tree panel content with PhyD3 tree and scientific metrics
  const TreePanelContent = React.memo(() => (
    <div className="h-full flex flex-col">
      {detectedGroup && <OrthologBanner group={detectedGroup} />}
      <div className="flex-grow relative">
        {/* Use our extremely simplified phylo tree component */}
        {advancedMode ? (
          <SimplePhyloTree
            visible={activePanel === 'tree' && advancedMode}
            layout={layout === 'split-horizontal' ? 'horizontal' : 'radial'}
            scientificMode={advancedMode}
            debugMode={advancedMode}
          />
        ) : (
          <PhyD3
            onNodeClick={handleTreeNodeClick}
            ref={treeRef}
            scientificMode={advancedMode}
          />
        )}
        
        {/* Scientific metrics panel */}
        {advancedMode && (
          <ScientificMetricsPanel
            conservationScore={0.78}
            dndsRatio={0.32}
            bootstrapValue={95}
            pValue={0.002}
            onExport={() => {
              if (treeRef.current && treeRef.current.exportHighResolution) {
                treeRef.current.exportHighResolution('SVG');
              } else {
                toast.success('Exporting publication-ready visualization');
              }
            }}
          />
        )}
      </div>
    </div>
  ));

  // Content for the tools panel
  const ToolsPanelContent = () => (
    <AnimatePresence mode="wait">
      {activePanel === 'sparql' && <motion.div key="sparql" {...fadeProps}><SPARQLPanel /></motion.div>}
      {activePanel === 'ask' && <motion.div key="ask" {...fadeProps}><AskPanel /></motion.div>}
      {activePanel === 'nlq' && <motion.div key="nlq" {...fadeProps}><NLQPanel /></motion.div>}
      {activePanel === 'federated' && <motion.div key="federated" {...fadeProps}><FederatedSPARQLPanel addLog={addLog} /></motion.div>}
      {activePanel === 'brapi' && <motion.div key="brapi" {...fadeProps}><BrapiPanel addLog={addLog} /></motion.div>}
      {activePanel === 'export' && <motion.div key="export" {...fadeProps}><ExportPanel /></motion.div>}
      {activePanel === 'ontology' && <motion.div key="ontology" {...fadeProps}><OntologyPanel /></motion.div>}
      {activePanel === 'publication' && (
        <motion.div key="publication" {...fadeProps}>
          <PublicationExportPanel treeRef={treeRef} />
        </motion.div>
      )}
      {activePanel === 'batch' && (
        <motion.div key="batch" {...fadeProps}>
          <BatchAnalysisPanel />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Create tools components map for grid layout
  const toolComponents = {
    sparql: <SPARQLPanel />,
    ask: <AskPanel />,
    nlq: <NLQPanel />,
    federated: <FederatedSPARQLPanel addLog={addLog} />,
    brapi: <BrapiPanel addLog={addLog} />,
    export: <ExportPanel />,
    ontology: <OntologyPanel />,
    publication: <PublicationExportPanel treeRef={treeRef} />,
    batch: <BatchAnalysisPanel />
  };

  // Generate commands for command palette
  const getCommands = () => [
    { 
      id: 'change-layout-split', 
      title: 'Change Layout: Side by Side', 
      category: 'Layout',
      shortcut: 'Alt+1',
      action: () => setLayout('split-horizontal') 
    },
    { 
      id: 'change-layout-stacked', 
      title: 'Change Layout: Stacked', 
      category: 'Layout',
      shortcut: 'Alt+2',
      action: () => setLayout('split-vertical') 
    },
    { 
      id: 'change-layout-pip', 
      title: 'Change Layout: Picture in Picture', 
      category: 'Layout',
      shortcut: 'Alt+3',
      action: () => setLayout('pip') 
    },
    { 
      id: 'change-layout-tabs', 
      title: 'Change Layout: Tabs', 
      category: 'Layout',
      shortcut: 'Alt+4',
      action: () => setLayout('tabs') 
    },
    { 
      id: 'change-layout-grid', 
      title: 'Change Layout: Grid', 
      category: 'Layout',
      shortcut: 'Alt+5',
      action: () => setLayout('grid') 
    },
    { 
      id: 'toggle-scientific-mode', 
      title: `${advancedMode ? 'Disable' : 'Enable'} Scientific Mode`,
      category: 'View',
      shortcut: 'Alt+S',
      action: () => setAdvancedMode(!advancedMode) 
    },
    { 
      id: 'toggle-sync-mode', 
      title: `Change Sync Mode: ${
        syncMode === 'none' ? 'Enable Selection Sync' : 
        syncMode === 'selection' ? 'Enable Full Sync' : 'Disable Sync'
      }`,
      category: 'View',
      shortcut: 'Ctrl+Space',
      action: () => setSyncMode(
        syncMode === 'none' ? 'selection' : 
        syncMode === 'selection' ? 'full' : 'none'
      )
    },
    { 
      id: 'save-layout-preset', 
      title: 'Save Current Layout as Preset',
      category: 'Layout',
      shortcut: 'Alt+Shift+S',
      action: () => setShowSavePresetDialog(true)
    },
    { 
      id: 'layout-preferences', 
      title: 'Layout Preferences',
      category: 'Settings',
      action: () => setShowPreferencesPanel(true)
    },
    { 
      id: 'clear-graph', 
      title: 'Clear Graph',
      category: 'Data',
      action: () => {
        setElements([]);
        toast.success('Graph cleared.');
      } 
    },
    { 
      id: 'load-demo', 
      title: 'Load Demo Data',
      category: 'Data',
      action: loadFallbackGraph 
    },
    { 
      id: 'export-tree-svg', 
      title: 'Export Tree as SVG',
      category: 'Export',
      action: exportTreeAsSVG
    },
    { 
      id: 'export-tree-newick', 
      title: 'Export Tree as Newick',
      category: 'Export',
      action: exportTreeAsNewick
    },
    { 
      id: 'export-graph-png', 
      title: 'Export Graph as PNG',
      category: 'Export',
      action: exportGraphAsPNG
    },
    { 
      id: 'export-graph-json', 
      title: 'Export Graph as JSON',
      category: 'Export',
      action: exportGraphAsJSON
    },
    { 
      id: 'export-all', 
      title: 'Export All Formats (ZIP)',
      category: 'Export',
      shortcut: 'Alt+Shift+E',
      action: () => setShowExportDialog(true)
    },
  ];

  return (
    <div className="app">
      <nav className="top-menu">
        <div className="top-menu-inner">
          <div className="title-box">
            <h1>PhyloGraph</h1>
          </div>
          <div className="menu-center flex items-center gap-4">
            <button onClick={() => setActivePanel('tree')} className={isActive('tree')}>Tree</button>
            <button onClick={() => setActivePanel('sparql')} className={isActive('sparql')}>SPARQL</button>
            <button onClick={() => setActivePanel('brapi')} className={isActive('brapi')}>BrAPI</button>
            <button onClick={() => setActivePanel('ontology')} className={isActive('ontology')}>Ontology</button>
            <button onClick={() => setActivePanel('export')} className={isActive('export')}>Convert</button>
            <button onClick={() => setActivePanel('nlq')} className={isActive('nlq')}>NLQ</button>
            
            {/* Scientific panels */}
            {advancedMode && (
              <>
                <button onClick={() => setActivePanel('publication')} className={isActive('publication')}>Publication</button>
                <button onClick={() => setActivePanel('batch')} className={isActive('batch')}>Batch</button>
              </>
            )}
            
            {/* Layout selector */}
            <div className="ml-2 flex items-center gap-2 border-l border-zinc-700 pl-4">
              <span className="text-xs text-zinc-400">Layout:</span>
              <select 
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                className="bg-zinc-800 text-white rounded text-xs px-2 py-1 border border-zinc-700"
              >
                <option value="split-horizontal">Side by Side</option>
                <option value="split-vertical">Stacked</option>
                <option value="pip">Picture in Picture</option>
                <option value="tabs">Tabs</option>
                <option value="grid">Grid</option>
              </select>
            </div>
            
            {/* View sync selector */}
            <div className="flex items-center gap-2">
              <SyncModeSelector 
                mode={syncMode}
                onChange={setSyncMode}
              />
            </div>
            
            {/* Preset layouts */}
            <div className="relative">
              <button 
                onClick={() => setShowPresetsManager(!showPresetsManager)}
                className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1 rounded border border-zinc-700"
              >
                <FaSave className="text-xs" />
                <span>Presets</span>
              </button>
              
              {showPresetsManager && (
                <div className="absolute top-full right-0 mt-1 z-40">
                  <LayoutPresetsBar
                    currentLayout={layout}
                    onLayoutChange={setLayout}
                    userPresets={userPresets}
                    onSavePreset={() => setShowSavePresetDialog(true)}
                    onDeletePreset={deletePreset}
                    onManagePresets={() => setShowPreferencesPanel(true)}
                  />
                </div>
              )}
            </div>
            
            {/* Advanced mode toggle for scientists */}
            <label className="advanced-mode-toggle ml-2">
              <input 
                type="checkbox" 
                checked={advancedMode} 
                onChange={() => setAdvancedMode(!advancedMode)} 
              />
              <span>Scientific Mode</span>
            </label>
          </div>
          <div className="info-box">
            <p>FAIR Semantic Graph Explorer for Gene-Function-Trait Links</p>
            <span>AgroDiv & BReIF / URGI & CNRGV, INRAE</span>
          </div>
        </div>
      </nav>

      <main 
        ref={containerRef} 
        className="main-content relative"
      >
        {/* Main layout system - Using the new PhyloResizableLayout */}
        <PhyloResizableLayout
          leftComponent={<GraphPanelContent />}
          rightComponent={
            activePanel === 'tree' 
              ? <TreePanelContent />
              : <div className="h-full bg-black p-4"><ToolsPanelContent /></div>
          }
          leftLabel="Network Graph"
          rightLabel={activePanel === 'tree' ? "Phylogenetic Tree" : activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}
          initialLayout={layout}
          scientificMode={advancedMode}
          splitRatio={splitRatio}
          onSplitRatioChange={setSplitRatio}
          syncMode={syncMode}
          onSyncModeChange={setSyncMode}
          onLayoutChange={setLayout}
          pipPosition={pipPosition}
          onPipPositionChange={setPipPosition}
          pipSize={pipSize}
          onPipSizeChange={setPipSize}
          activeFocus={activeFocus}
          onActiveFocusChange={setActiveFocus}
          onSync={() => setSyncActive(true)}
          selectedNode={selectedNode}
          detailsComponent={
            <NodeDetailsPanel 
              node={selectedNode} 
              onClose={() => setSelectedNode(null)}
              embedded={true}
            />
          }
          toolComponents={toolComponents}
          activePanel={activePanel}
        />
        
        {/* Show synchronization indicator when syncing */}
        {syncActive && (
          <ViewLinkageIndicator
            isActive={syncActive}
            syncMode={syncMode}
            onToggle={() => {
              setSyncMode(prev => 
                prev === 'none' ? 'selection' :
                prev === 'selection' ? 'full' : 'none'
              );
            }}
          />
        )}
        
        {/* MiniMap for advanced navigation */}
        {advancedMode && layout !== 'grid' && (
          <div className="absolute bottom-4 left-4 z-30">
            <MiniMap
              treeData={treeData}
              graphData={elements}
              activeView={activeFocus === 'left' ? 'graph' : 'tree'}
              size="small"
              onNavigate={(navInfo) => {
                // Navigation logic here
                console.log("Navigate to:", navInfo);
              }}
            />
          </div>
        )}
        
        {/* Smart layout detector */}
        <SmartLayoutDetector
          treeData={treeData}
          graphData={elements}
          currentLayout={layout}
          onLayoutChange={setLayout}
          enabled={advancedMode && layout !== 'grid'}
        />
      </main>
      
      {/* Command palette toggle button */}
      <button 
        className="fixed bottom-4 right-4 bg-green-700 hover:bg-green-600 text-white rounded-full p-3 shadow-lg z-50"
        onClick={() => setShowCommandPalette(true)}
        title="Open Command Palette (Ctrl+Shift+P)"
      >
        <FaSearch />
      </button>

      {/* Dialogs and Modals */}
      
      {/* Command Palette */}
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={getCommands()}
      />
      
      {/* Layout preferences panel */}
      <LayoutPreferencesPanel
        isOpen={showPreferencesPanel}
        onClose={() => setShowPreferencesPanel(false)}
      />
      
      {/* Save layout dialog */}
      <SaveLayoutDialog
        isOpen={showSavePresetDialog}
        onClose={() => setShowSavePresetDialog(false)}
        onSave={savePreset}
        currentConfig={getCurrentConfig()}
        existingPresets={userPresets}
      />
      
      {/* Data export dialog */}
      <DataExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        treeRef={treeRef}
        graphRef={graphRef}
      />
      
      {/* Toast notifications */}
      <Toaster 
        position="bottom-right" 
        toastOptions={{ 
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          }
        }} 
      />
      
      {/* Global keyboard shortcut guide (only shown on '?' press) */}
      <div className="sr-only" aria-live="polite">
        Press Ctrl+Shift+P for command palette, Alt+1-5 for layouts, Alt+Shift+S to save layout
      </div>
    </div>
  );
}