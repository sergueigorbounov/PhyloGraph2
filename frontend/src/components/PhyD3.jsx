import React, { useRef, useState, useEffect } from 'react';
import { useOrthologGroupsFromGraph } from '../hooks/useOrthologGroupsFromGraph';
import NodeModal from './NodeModal';
import html2canvas from 'html2canvas';
import { exportToNewick } from '../utils/exportToNewick';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import * as d3 from 'd3';


// To this:
import usePhyloTree from '/src/hooks/usePhyloTree.jsx';
export default function PhyD3({ onNodeClick }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const [layoutType, setLayoutType] = useState('radial');
  const [visibleGroups, setVisibleGroups] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);

  const { groupMap } = useOrthologGroupsFromGraph();
  const uniqueGroups = [...new Set(Object.values(groupMap || {}))];

  useEffect(() => {
    if (uniqueGroups.length > 0) setVisibleGroups(uniqueGroups);
  }, [groupMap]);

  const {
    treeData,
    injectTreeToGraph,
    loading,
    error,
    debugMode,
    setDebugMode,
    renderTime,
    apiLatency,
    debugInfo,
    debugControls
  } = usePhyloTree({
    layoutType,
    svgRef,
    containerRef,
    onNodeClick: handleNodeClick,
    visibleGroups
  });

  function handleExport(format) {
    if (format === 'png') {
      html2canvas(containerRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = 'phylotree.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    } else if (format === 'svg') {
      const serializer = new XMLSerializer();
      const source = serializer.serializeToString(svgRef.current);
      const blob = new Blob([source], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'phylotree.svg';
      link.click();
    } else if (format === 'newick') {
      if (!treeData) {
        alert("No tree data available to export");
        return;
      }
      
      try {
        const newick = exportToNewick(treeData) + ';';
        const blob = new Blob([newick], { type: 'text/plain' });
        const link = document.createElement('a');
        link.download = 'phylogeny.nwk';
        link.href = URL.createObjectURL(blob);
        link.click();
      } catch (err) {
        console.error("Error exporting to Newick format:", err);
        alert(`Error exporting: ${err.message}`);
      }
    } else if (format === 'json' && debugMode) {
      // Debug-only JSON export
      const json = JSON.stringify(treeData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.download = 'tree-data.json';
      link.href = URL.createObjectURL(blob);
      link.click();
    }
  }

  function handleNodeClick(id) {
    if (!id) return;
    
    const nodeEl = d3.select(`#tree-node-${id}`);
    if (nodeEl.empty()) {
      console.warn(`Node element #tree-node-${id} not found in the DOM`);
      return;
    }

    try {
      const data = nodeEl.datum();
      const meta = data?.data?.attributes || {};
      const label = data?.data?.name;

      setSelectedNode({
        id,
        label,
        species: meta.species || 'unknown',
        type: 'Gene',
        external_link: `https://www.ensembl.org/Multi/Search/Results?q=${id}`,
        pubmed_link: `https://pubmed.ncbi.nlm.nih.gov/?term=${id}`,
      });

      if (window.cy && window.cy.$(`#${id}`).length) {
        window.cy.$(`#${id}`).select();
        window.cy.center(window.cy.$(`#${id}`));
      }

      if (typeof onNodeClick === 'function') {
        onNodeClick(id);
      }

      if (typeof window.highlightNodeInGraph === 'function') {
        window.highlightNodeInGraph(id);
      }
    } catch (error) {
      console.error("Error handling node click:", error);
    }
  }

  function addTippyTooltips() {
    try {
      d3.selectAll('.tree-node').each(function (_, i, nodes) {
        const node = d3.select(nodes[i]);
        const data = node.datum();
        if (!data || !data.data) return;
        
        const label = data.data.name;
        const species = data.data.attributes?.species || 'unknown';

        tippy(nodes[i], {
          content: `${label}<br/><i>${species}</i>`,
          allowHTML: true,
          placement: 'top',
          theme: 'light',
          delay: [300, 0],
        });
      });
    } catch (error) {
      console.error("Error adding tooltips:", error);
    }
  }

  useEffect(() => {
    if (treeData) {
      const tooltipTimer = setTimeout(addTippyTooltips, 800);
      return () => clearTimeout(tooltipTimer);
    }
  }, [treeData]);

  return (
    <div
      ref={containerRef}
      className="bg-black rounded-xl p-4 border border-zinc-700 shadow-md relative overflow-hidden"
    >
      {/* Top toolbar */}
      <div className="absolute top-3 right-4 flex gap-2 z-10">
        <select
          value={layoutType}
          onChange={e => setLayoutType(e.target.value)}
          className="text-xs bg-zinc-800 text-white rounded px-2 py-1 border border-zinc-600"
        >
          <option value="radial">Radial</option>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
        
        <button 
          onClick={() => injectTreeToGraph(treeData)} 
          className="bg-zinc-800 text-white text-xs px-3 py-1 rounded border border-zinc-600"
          disabled={!treeData}
        >
          Add to Graph
        </button>
        
        <button 
          onClick={() => handleExport('svg')} 
          className="bg-zinc-800 text-white text-xs px-3 py-1 rounded border border-zinc-600"
          disabled={!treeData}
        >
          Export SVG
        </button>
        
        <button 
          onClick={() => handleExport('png')} 
          className="bg-zinc-800 text-white text-xs px-3 py-1 rounded border border-zinc-600"
          disabled={!treeData}
        >
          Export PNG
        </button>
        
        <button 
          onClick={() => handleExport('newick')} 
          className="bg-zinc-800 text-white text-xs px-3 py-1 rounded border border-emerald-600"
          disabled={!treeData}
        >
          Export Newick
        </button>
        
        {/* Debug toggle button */}
        <button 
                   onClick={() => setDebugMode(!debugMode)} 
                   className={`text-xs px-3 py-1 rounded border 
                     ${debugMode ? 'bg-yellow-700 border-yellow-500' : 'bg-zinc-800 border-zinc-600'} text-white`}
                 >
                   Debug
                 </button>
                 
                 {debugMode && (
                   <button 
                     onClick={() => setDebugPanelOpen(!debugPanelOpen)} 
                     className="bg-yellow-700 text-white text-xs px-3 py-1 rounded border border-yellow-500"
                   >
                     {debugPanelOpen ? 'Hide Panel' : 'Show Panel'}
                   </button>
                 )}
               </div>
         
               {/* Loading overlay */}
               {loading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
                   <div className="text-center">
                     <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
                     <p className="text-white text-lg">Loading phylogenetic tree data...</p>
                     {debugMode && apiLatency && (
                       <p className="text-yellow-500 text-sm mt-2">API Latency: {Math.round(apiLatency)}ms</p>
                     )}
                   </div>
                 </div>
               )}
         
               {/* Error message */}
               {error && !loading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
                   <div className="bg-red-900 bg-opacity-80 p-6 rounded-lg max-w-md text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                     <h3 className="text-xl text-white font-bold mb-2">Error Loading Tree</h3>
                     <p className="text-red-200 mb-4">{error}</p>
                     <div className="flex justify-center gap-3">
                       <button 
                         onClick={() => window.location.reload()} 
                         className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded"
                       >
                         Reload Page
                       </button>
                       <button 
                         onClick={() => debugControls.loadExample('simple')} 
                         className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded"
                       >
                         Load Demo
                       </button>
                     </div>
                   </div>
                 </div>
               )}
         
               {/* Empty state message */}
               {!loading && !error && (!treeData || !treeData.children || treeData.children.length === 0) && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
                   <div className="bg-zinc-900 bg-opacity-80 p-6 rounded-lg max-w-md text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <h3 className="text-xl text-white font-bold mb-2">No Phylogenetic Data</h3>
                     <p className="text-gray-300 mb-4">There are no tree nodes available. Please add genes to the graph or load example data.</p>
                     <div className="flex justify-center gap-3">
                       <button 
                         onClick={() => debugControls.loadExample('realWorld')} 
                         className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded"
                       >
                         Load Demo Data
                       </button>
                       {debugMode && (
                         <div className="relative ml-2">
                           <button 
                             onClick={() => setShowExampleMenu(!showExampleMenu)} 
                             className="bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                           >
                             More Examples
                           </button>
                           
                           {/* Example dropdown menu */}
                           {showExampleMenu && (
                             <div className="absolute top-full mt-1 left-0 bg-zinc-800 border border-zinc-600 rounded shadow-lg z-30">
                               {debugControls.getExamples().map(example => (
                                 <button
                                   key={example.key}
                                   onClick={() => {
                                     debugControls.loadExample(example.key);
                                     setShowExampleMenu(false);
                                   }}
                                   className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700"
                                 >
                                   {example.name}
                                 </button>
                               ))}
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               )}
         
               {/* Main SVG tree container */}
               <svg
                 ref={svgRef}
                 width="100%"
                 height="800px"
                 className="w-full h-[800px] select-none"
                 style={{ 
                   border: debugMode ? '1px dashed yellow' : 'none',
                   background: debugMode ? '#111' : 'transparent' 
                 }}
               />
         
               {/* Debug panel */}
               {debugMode && debugPanelOpen && (
                 <div className="absolute top-12 right-4 w-80 bg-black bg-opacity-90 border border-yellow-500 rounded shadow-lg z-30 text-sm overflow-hidden">
                   {/* Debug panel header */}
                   <div className="bg-yellow-800 text-white px-4 py-2 flex justify-between items-center">
                     <h3 className="font-bold">PhyloTree Debug Panel</h3>
                     <button 
                       onClick={() => setDebugPanelOpen(false)}
                       className="text-white hover:text-yellow-200"
                     >
                       ✕
                     </button>
                   </div>
                   
                   {/* Debug panel content */}
                   <div className="p-3 max-h-[500px] overflow-y-auto">
                     {/* Tree statistics */}
                     <div className="mb-4">
                       <h4 className="text-yellow-500 font-bold mb-1 border-b border-yellow-800 pb-1">Tree Statistics</h4>
                       <div className="grid grid-cols-2 gap-1 text-xs">
                         <div className="text-gray-400">Total Nodes:</div>
                         <div className="text-white">{debugInfo?.treeStats?.totalNodes || 0}</div>
                         
                         <div className="text-gray-400">Groups:</div>
                         <div className="text-white">{debugInfo?.treeStats?.groupCount || 0}</div>
                         
                         <div className="text-gray-400">Max Depth:</div>
                         <div className="text-white">{debugInfo?.treeStats?.maxDepth || 0}</div>
                         
                         <div className="text-gray-400">Leaf Nodes:</div>
                         <div className="text-white">{debugInfo?.treeStats?.leafNodes || 0}</div>
                         
                         <div className="text-gray-400">API Latency:</div>
                         <div className="text-white">{apiLatency ? `${Math.round(apiLatency)}ms` : 'N/A'}</div>
                         
                         <div className="text-gray-400">Render Time:</div>
                         <div className={`${renderTime > 500 ? 'text-red-400' : 'text-green-400'}`}>
                           {renderTime ? `${Math.round(renderTime)}ms` : 'N/A'}
                         </div>
                       </div>
                     </div>
                     
                     {/* Species distribution */}
                     {debugInfo?.treeStats?.speciesDistribution && Object.keys(debugInfo.treeStats.speciesDistribution).length > 0 && (
                       <div className="mb-4">
                         <h4 className="text-yellow-500 font-bold mb-1 border-b border-yellow-800 pb-1">Species Distribution</h4>
                         <div className="grid grid-cols-7 gap-1 text-xs">
                           {Object.entries(debugInfo.treeStats.speciesDistribution).map(([species, count]) => (
                             <React.Fragment key={species}>
                               <div className="text-gray-400 col-span-5 truncate" title={species}>{species}:</div>
                               <div className="text-white col-span-2">{count}</div>
                             </React.Fragment>
                           ))}
                         </div>
                       </div>
                     )}
                     
                     {/* Quick actions */}
                     <div className="mb-4">
                       <h4 className="text-yellow-500 font-bold mb-1 border-b border-yellow-800 pb-1">Debug Actions</h4>
                       <div className="grid grid-cols-2 gap-2 mt-2">
                         <button 
                           onClick={() => window.treeRef?.refresh()}
                           className="bg-blue-700 hover:bg-blue-600 text-white rounded py-1 text-xs"
                         >
                           Refresh Tree
                         </button>
                         <button 
                           onClick={() => window.location.reload()}
                           className="bg-green-700 hover:bg-green-600 text-white rounded py-1 text-xs"
                         >
                           Reload Page
                         </button>
                         <button 
                           onClick={() => handleExport('json')}
                           className="bg-purple-700 hover:bg-purple-600 text-white rounded py-1 text-xs"
                         >
                           Export JSON
                         </button>
                         <button 
                           onClick={() => {
                             if (window.treeRef?.debug) {
                               console.log("Tree Data:", window.treeRef.debug.dumpTreeData());
                             }
                           }}
                           className="bg-yellow-700 hover:bg-yellow-600 text-white rounded py-1 text-xs"
                         >
                           Log Data
                         </button>
                       </div>
                     </div>
                     
                     {/* Layout options */}
                     <div className="mb-4">
                       <h4 className="text-yellow-500 font-bold mb-1 border-b border-yellow-800 pb-1">Layout Options</h4>
                       <div className="grid grid-cols-3 gap-2 mt-2">
                         <button 
                           onClick={() => setLayoutType('radial')}
                           className={`rounded py-1 text-xs ${layoutType === 'radial' ? 'bg-yellow-600 text-white' : 'bg-zinc-700 text-gray-300'}`}
                         >
                           Radial
                         </button>
                         <button 
                           onClick={() => setLayoutType('horizontal')}
                           className={`rounded py-1 text-xs ${layoutType === 'horizontal' ? 'bg-yellow-600 text-white' : 'bg-zinc-700 text-gray-300'}`}
                         >
                           Horizontal
                         </button>
                         <button 
                           onClick={() => setLayoutType('vertical')}
                           className={`rounded py-1 text-xs ${layoutType === 'vertical' ? 'bg-yellow-600 text-white' : 'bg-zinc-700 text-gray-300'}`}
                         >
                           Vertical
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
         
               {/* Node details modal */}
               {selectedNode && (
                 <NodeModal node={selectedNode} onClose={() => setSelectedNode(null)} />
               )}
             </div>
           );
         }