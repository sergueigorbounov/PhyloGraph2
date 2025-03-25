import CytoscapeComponent from 'react-cytoscapejs';
import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import edgehandles from 'cytoscape-edgehandles';

cytoscape.use(fcose);
cytoscape.use(edgehandles);

export default function GraphViewer({ elements }) {
  const [layoutKey, setLayoutKey] = useState(0);
  const cyRef = useRef(null);

  useEffect(() => {
    setLayoutKey(prev => prev + 1);
  }, [elements]);

  const layout = {
    name: 'fcose',
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
        color: '#aaa'
      }
    }
  ];

  const handleCytoscapeReady = (cy) => {
    cyRef.current = cy;
    cy.zoomingEnabled(true);
    cy.panningEnabled(true);
    cy.userPanningEnabled(true);
    cy.boxSelectionEnabled(true);
    cy.center();
    cy.fit();

    // Enable edgehandles plugin
    cy.edgehandles();
  };

  return (
    <div className="graph-container">

      <CytoscapeComponent
        key={layoutKey}
        elements={elements}
        layout={layout}
        stylesheet={stylesheet}
        style={{ width: '100%', height: '100%' }}
        cy={handleCytoscapeReady}
      />
    </div>
  );
}
