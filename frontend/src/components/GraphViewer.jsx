// GraphViewer.jsx
import CytoscapeComponent from 'react-cytoscapejs';
import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import edgehandles from 'cytoscape-edgehandles';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { motion, AnimatePresence } from 'framer-motion';
import NodeModal from './NodeModal';
import popper from 'cytoscape-popper';
import svg from 'cytoscape-svg';

cytoscape.use(svg);
cytoscape.use(popper);
cytoscape.use(fcose);
cytoscape.use(edgehandles);

const getNodeType = (uri) => {
  if (!uri.startsWith('http')) return 'literal';
  if (uri.includes('obo/TO_')) return 'trait';
  if (uri.includes('obo/PO_')) return 'plant_part';
  if (uri.includes('obo/GO_')) return 'function';
  if (uri.includes('gene') || uri.match(/AT\dG\d+/)) return 'gene';
  return 'entity';
};

export default function GraphViewer({ elements }) {
  const [layoutKey, setLayoutKey] = useState(0);
  const [layoutType, setLayoutType] = useState('fcose');
  const [modalNode, setModalNode] = useState(null);
  const cyRef = useRef(null);

  useEffect(() => {
    setLayoutKey(prev => prev + 1);
  }, [elements, layoutType]);

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
    numIter: 1000
  };

  const stylesheet = [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        backgroundColor: '#61dafb',
        color: '#000',
        textValign: 'center',
        textHalign: 'center',
        fontSize: 14,
        textWrap: 'wrap',
        textMaxWidth: 80,
        textOutlineColor: '#fff',
        textOutlineWidth: 2,
        shape: 'ellipse',
        padding: '6px'
      }
    },
    {
      selector: 'node[type = "literal"]',
      style: {
        shape: 'rectangle',
        backgroundColor: '#fca5a5',
        fontSize: 12,
        textWrap: 'wrap',
        textHalign: 'center',
        textValign: 'center'
      }
    },
    { selector: 'node[type = "trait"]', style: { backgroundColor: '#86efac' } },
    { selector: 'node[type = "plant_part"]', style: { backgroundColor: '#fde68a' } },
    { selector: 'node[type = "function"]', style: { backgroundColor: '#a5b4fc' } },
    { selector: 'node[type = "gene"]', style: { backgroundColor: '#f9a8d4' } },
    { selector: 'node:selected', style: { backgroundColor: '#38bdf8', fontSize: 16 } },
    {
      selector: 'edge',
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
        textMaxWidth: 80
      }
    }
  ];

  const handleCytoscapeReady = (cy) => {
    cyRef.current = cy;
    window.cy = cy;

    cy.zoomingEnabled(true);
    cy.panningEnabled(true);
    cy.userPanningEnabled(true);
    cy.boxSelectionEnabled(true);

    setTimeout(() => {
      if (!cy || cy.destroyed()) return;
      cy.layout(layout).run();
      cy.center();
      cy.fit();
    }, 100);

    cy.edgehandles();

    cy.nodes().forEach(node => {
      const type = getNodeType(node.id());
      node.data('type', type);

      if (typeof node.popperRef === 'function') {
        const ref = node.popperRef();
        const content = document.createElement('div');
        content.innerHTML = `
          <strong>${node.data('label')}</strong><br/>
          <em>Type:</em> ${type}<br/>
          <em>URI:</em> <small>${node.id()}</small>
        `;

        tippy(document.body, {
          getReferenceClientRect: ref.getBoundingClientRect,
          appendTo: () => document.body,
          content,
          arrow: true,
          theme: 'light-border',
          placement: 'top'
        });
      }
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setModalNode({
        id: node.id(),
        label: node.data('label'),
        type: node.data('type')
      });
    });
  };

  const exportPNG = () => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    const png = cy.png({ full: true });
    const a = document.createElement('a');
    a.href = png;
    a.download = 'graph.png';
    a.click();
  };

  const exportSVG = () => {
    const cy = cyRef.current;
    if (!cy || !cy.svg || cy.destroyed()) return alert('SVG export not supported.');
    const svg = cy.svg({ full: true });
    const a = document.createElement('a');
    a.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    a.download = 'graph.svg';
    a.click();
  };

  return (
    <div className="graph-container relative w-full h-full">
      <AnimatePresence>
        {modalNode && <NodeModal node={modalNode} onClose={() => setModalNode(null)} />}
      </AnimatePresence>
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button onClick={exportPNG} className="text-xs bg-gray-800 px-2 py-1 rounded text-white">Export PNG</button>
        <button onClick={exportSVG} className="text-xs bg-gray-800 px-2 py-1 rounded text-white">Export SVG</button>
        <select
          onChange={(e) => setLayoutType(e.target.value)}
          value={layoutType}
          className="text-xs bg-gray-800 text-white rounded px-1"
        >
          <option value="fcose">FCoSE</option>
          <option value="concentric">Concentric</option>
          <option value="cose">CoSE</option>
          <option value="breadthfirst">Tree</option>
        </select>
      </div>
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
