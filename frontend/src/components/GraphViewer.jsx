/**
 * @file GraphViewer.jsx
 * @description Component to visualize a Cytoscape graph representation of gene-trait relationships.
 * Supports dynamic node and edge visualization, multiple layouts, tooltips, node highlighting, and RDF export functionality.
 * Integrated with the PhyloGraph web app to display interactive data from RDF graphs.
 * 
 * @module GraphViewer
 * @requires cytoscape
 * @requires cytoscape-fcose
 * @requires cytoscape-edgehandles
 * @requires cytoscape-svg
 * @requires tippy.js
 */

import CytoscapeComponent from 'react-cytoscapejs';
import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose'; // Force-directed layout extension
import edgehandles from 'cytoscape-edgehandles'; // Edge creation extension
import tippy from 'tippy.js'; // Tooltip library for interactive information
import 'tippy.js/dist/tippy.css';
import { motion, AnimatePresence } from 'framer-motion';
import NodeModal from './NodeModal'; // Modal component for displaying node details
import popper from 'cytoscape-popper'; // Popper.js for tooltips
import svg from 'cytoscape-svg'; // SVG export extension

// Extend Cytoscape with necessary plugins
cytoscape.use(svg);
cytoscape.use(popper);
cytoscape.use(fcose);
cytoscape.use(edgehandles);

/**
 * Returns the type of a node based on its URI.
 * Classifies nodes into types like 'literal', 'gene', 'trait', etc.
 * 
 * @param {string} uri - The URI of the node.
 * @returns {string} - The type of the node (e.g., 'gene', 'trait', 'literal').
 */
const getNodeType = (uri) => {
  if (!uri.startsWith('http')) return 'literal'; // Non-URI nodes are treated as literals
  if (uri.includes('obo/TO_')) return 'trait'; // Trait nodes are identified by TO ontology
  if (uri.includes('obo/PO_')) return 'plant_part'; // Plant part nodes are identified by PO ontology
  if (uri.includes('obo/GO_')) return 'function'; // Function nodes are identified by GO ontology
  if (uri.includes('gene') || uri.match(/AT\dG\d+/)) return 'gene'; // Gene nodes (Arabidopsis genes)
  return 'entity'; // Default classification for other nodes
};

/**
 * GraphViewer component to render a Cytoscape graph with interactive features.
 * Allows for dynamic node interactions, layout adjustments, and RDF export.
 * 
 * @param {Object} props - The component's properties.
 * @param {Array} props.elements - The elements (nodes and edges) to render in the graph.
 * @returns {JSX.Element} - The rendered GraphViewer component.
 */
export default function GraphViewer({ elements }) {
  const [layoutKey, setLayoutKey] = useState(0); // Key to trigger re-rendering with new layout
  const [layoutType, setLayoutType] = useState('fcose'); // Layout type for Cytoscape visualization (e.g., FCoSE, Concentric)
  const [modalNode, setModalNode] = useState(null); // Node selected for displaying in modal
  const cyRef = useRef(null); // Reference to Cytoscape instance

  /**
   * Updates node types whenever elements or layout change.
   * This ensures nodes are classified correctly when data changes.
   */
  useEffect(() => {
    elements.forEach(el => {
      if (el.data?.id) {
        el.data.type = getNodeType(el.data.id); // Classify node based on its ID
      }
    });
    setLayoutKey(prev => prev + 1); // Trigger re-render on layout change
  }, [elements, layoutType]);

  // Cytoscape layout configuration for node arrangement
  const layout = {
    name: layoutType,
    animate: true,
    fit: true,
    padding: 50,
    randomize: false,
    nodeRepulsion: 4500,
    idealEdgeLength: 100,
    edgeElasticity: 0.4,
    gravity: 0.2,
    numIter: 1000,
  };

  /**
   * Custom stylesheet for Cytoscape graph to control node and edge appearance.
   * 
   * @type {Array} stylesheet - Array of styles for nodes and edges.
   */
  const stylesheet = [
    {
      selector: 'node[label]',
      style: {
        label: 'data(label)', // Node label
        backgroundColor: '#61dafb', // Background color
        color: '#000',
        textValign: 'center',
        textHalign: 'center',
        fontSize: 14,
        textWrap: 'wrap',
        textMaxWidth: 80,
        textOutlineColor: '#fff',
        textOutlineWidth: 2,
        shape: 'ellipse', // Node shape
        padding: '6px',
      },
    },
    // Node styles based on types (literal, trait, gene, etc.)
    {
      selector: 'node[type = "literal"]',
      style: {
        shape: 'rectangle', // Literal nodes are rectangles
        backgroundColor: '#fca5a5',
        fontSize: 12,
        textWrap: 'wrap',
        textHalign: 'center',
        textValign: 'center',
      },
    },
    { selector: 'node[type = "trait"]', style: { backgroundColor: '#86efac' } },
    { selector: 'node[type = "plant_part"]', style: { backgroundColor: '#fde68a' } },
    { selector: 'node[type = "function"]', style: { backgroundColor: '#a5b4fc' } },
    { selector: 'node[type = "gene"]', style: { backgroundColor: '#f9a8d4' } },
    { selector: 'node:selected', style: { backgroundColor: '#38bdf8', fontSize: 16 } },
    // Edge styles
    {
      selector: 'edge[label]',
      style: {
        width: 2,
        lineColor: '#ccc',
        targetArrowColor: '#ccc',
        targetArrowShape: 'triangle',
        curveStyle: 'bezier',
        label: 'data(label)',
        fontSize: 10,
        textRotation: 'autorotate',
        textMarginY: -6,
        color: '#aaa',
        textWrap: 'wrap',
        textMaxWidth: 80,
      },
    },
  ];

  /**
   * Callback for when Cytoscape is initialized.
   * It sets up zooming, panning, layout, and edge handling features.
   * 
   * @param {Object} cy - The Cytoscape instance.
   */
  const handleCytoscapeReady = (cy) => {
    cyRef.current = cy;
    window.cy = cy; // Expose Cytoscape instance globally for access from other components

    // Enable zooming and panning in the graph
    cy.zoomingEnabled(true);
    cy.panningEnabled(true);
    cy.userPanningEnabled(true);
    cy.boxSelectionEnabled(true); // Enable box selection for multiple nodes

    // Layout configuration
    setTimeout(() => {
      if (!cy || cy.destroyed()) return;
      cy.layout(layout).run(); // Apply layout
      cy.center(); // Center the graph
      cy.fit(); // Fit the graph into the container
    }, 100);

    cy.edgehandles(); // Enable edge handling (dragging edges between nodes)

    // Add tooltips to nodes using Tippy.js
    cy.nodes().forEach(node => {
      const type = getNodeType(node.id()); // Determine node type
      node.data('type', type); // Assign node type data

      if (typeof node.popperRef === 'function') {
        const ref = node.popperRef();
        const content = document.createElement('div');
        content.innerHTML = `
          <strong>${node.data('label')}</strong><br/>
          <em>Type:</em> ${type}<br/>
          <em>URI:</em> <small>${node.id()}</small>
        `;

        // Tippy.js initialization
        tippy(document.body, {
          getReferenceClientRect: ref.getBoundingClientRect,
          appendTo: () => document.body,
          content,
          arrow: true,
          theme: 'light-border',
          placement: 'top',
        });
      }
    });

    // Set up click event listener for nodes
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setModalNode({
        id: node.id(),
        label: node.data('label'),
        type: node.data('type'),
      });

      // Highlight corresponding node in Phylogenetic Tree
      if (window.treeRef?.highlightNode) {
        window.treeRef.highlightNode(node.id());
      }
    });
  };

  /**
   * Export the graph as PNG.
   * Triggers a download of the current graph in PNG format.
   */
  const exportPNG = () => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    const png = cy.png({ full: true });
    const a = document.createElement('a');
    a.href = png;
    a.download = 'graph.png';
    a.click();
  };

  /**
   * Export the graph as SVG.
   * Triggers a download of the current graph in SVG format.
   */
  const exportSVG = () => {
    const cy = cyRef.current;
    if (!cy || !cy.svg || cy.destroyed()) return alert('SVG export not supported.');
    const svg = cy.svg({ full: true });
    const a = document.createElement('a');
    a.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    a.download = 'graph.svg';
    a.click();
  };

  /**
   * Export the full RDF graph in Turtle format.
   * Triggers a download of the full RDF representation of the graph.
   */
  const exportFullRDF = async () => {
    try {
      const res = await fetch('http://localhost:8000/rdf');
      const turtle = await res.text();
      const blob = new Blob([turtle], { type: 'text/turtle' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'full_graph.ttl';
      a.click();
      toast.success('Exported RDF from backend');
    } catch (err) {
      toast.error('RDF export failed');
      console.error(err);
    }
  };

  return (
    <div className="graph-wrapper w-full h-[calc(100vh-64px-80px)] bg-black border border-zinc-800 rounded-xl overflow-hidden relative">
      {/* Export buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button onClick={exportPNG} className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-white hover:bg-zinc-700">PNG</button>
        <button onClick={exportSVG} className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-white hover:bg-zinc-700">SVG</button>
        <button onClick={exportFullRDF} className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-white hover:bg-zinc-700">RDF</button>
        <select
          onChange={(e) => setLayoutType(e.target.value)}
          value={layoutType}
          className="text-xs bg-zinc-800 border border-zinc-600 text-white rounded px-2 py-1"
        >
          <option value="fcose">FCoSE</option>
          <option value="concentric">Concentric</option>
          <option value="cose">CoSE</option>
          <option value="breadthfirst">Tree</option>
        </select>
      </div>

      {/* Modal for node details */}
      <AnimatePresence>
        {modalNode && <NodeModal node={modalNode} onClose={() => setModalNode(null)} />}
      </AnimatePresence>

      {/* Cytoscape graph rendering */}
      <motion.div
        key={layoutKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', height: '100%' }}
      >
        <CytoscapeComponent
          elements={elements}
          layout={layout}
          stylesheet={stylesheet}
          style={{ width: '100%', height: '100%' }}
          cy={handleCytoscapeReady}
        />
      </motion.div>
    </div>
  );
}
