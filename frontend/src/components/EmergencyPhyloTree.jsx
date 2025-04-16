import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Global container to ensure it exists only once in the DOM
let globalContainer = null;
let initialized = false;

// Mock tree data
const MOCK_TREE_DATA = {
  name: "Life",
  children: [
    {
      name: "Bacteria",
      group: "OG0000001",
      children: [
        { name: "Proteobacteria", value: 1, description: "Gram-negative bacteria" },
        { name: "Firmicutes", value: 1, description: "Gram-positive bacteria" },
        { name: "Actinobacteria", value: 1, description: "High GC content bacteria" }
      ]
    },
    {
      name: "Eukaryota",
      group: "OG0000002",
      children: [
        { name: "Animals", value: 1, description: "Multicellular heterotrophs" },
        { name: "Plants", value: 1, description: "Multicellular autotrophs" },
        { name: "Fungi", value: 1, description: "Decomposers" },
        { name: "Protists", value: 1, description: "Single-celled eukaryotes" }
      ]
    }
  ]
};

// Draw the tree directly to a DOM element
const drawTree = (container, layout = 'radial', scientific = false) => {
  console.log('EmergencyPhyloTree: Drawing tree with layout:', layout);
  
  // Clear previous content
  container.innerHTML = '';
  
  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  container.appendChild(svg);
  
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  const margin = { top: 20, right: 120, bottom: 20, left: 120 };
  
  // Create D3 selection for the SVG
  const d3svg = d3.select(svg);
  
  // Create root hierarchy
  const root = d3.hierarchy(MOCK_TREE_DATA);
  
  // Create the tree layout
  let tree;
  if (layout === 'radial') {
    tree = d3.cluster()
      .size([2 * Math.PI, Math.min(width, height) / 2 - 100]);
  } else {
    tree = d3.tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
  }
  
  // Generate the tree layout
  tree(root);
  
  const g = d3svg.append('g');
    
  if (layout === 'radial') {
    g.attr('transform', `translate(${width / 2},${height / 2})`);
  } else {
    g.attr('transform', `translate(${margin.left},${margin.top})`);
  }
  
  // Add links
  const link = g.selectAll('.link')
    .data(root.links())
    .enter().append('path')
    .attr('fill', 'none')
    .attr('stroke', '#555')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', 1.5);
    
  if (layout === 'radial') {
    link.attr('d', d3.linkRadial()
      .angle(d => d.x)
      .radius(d => d.y));
  } else {
    link.attr('d', d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x));
  }
  
  // Add nodes
  const node = g.selectAll('.node')
    .data(root.descendants())
    .enter().append('g')
    .attr('class', d => `node ${d.children ? 'node--internal' : 'node--leaf'}`);
    
  if (layout === 'radial') {
    node.attr('transform', d => {
      const [x, y] = [(d.y) * Math.cos(d.x - Math.PI / 2), (d.y) * Math.sin(d.x - Math.PI / 2)];
      return `translate(${x},${y})`;
    });
  } else {
    node.attr('transform', d => `translate(${d.y},${d.x})`);
  }
  
  // Add circles to nodes
  node.append('circle')
    .attr('r', 4)
    .attr('fill', d => d.children ? '#555' : '#999')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5);
  
  // Add labels to nodes
  node.append('text')
    .attr('dy', '0.31em')
    .attr('x', d => d.children ? -8 : 8)
    .attr('text-anchor', d => d.children ? 'end' : 'start')
    .text(d => d.data.name)
    .attr('font-size', '10px')
    .attr('font-family', 'sans-serif');
  
  console.log('EmergencyPhyloTree: Tree drawing complete');
  return true;
};

// Ensure the container exists
const ensureContainer = () => {
  if (!globalContainer) {
    globalContainer = document.createElement('div');
    globalContainer.id = 'emergency-phylo-tree';
    globalContainer.style.width = '100%';
    globalContainer.style.height = '100%';
    globalContainer.style.position = 'absolute';
    globalContainer.style.top = '0';
    globalContainer.style.left = '0';
    globalContainer.style.background = 'white';
    globalContainer.style.zIndex = '10';
    document.body.appendChild(globalContainer);
    console.log('EmergencyPhyloTree: Container created');
  }
  return globalContainer;
};

export const EmergencyPhyloTree = ({ 
  visible = true,
  layout = 'radial',
  scientific = false
}) => {
  const triggerRef = useRef(null);
  
  // Initialize once on first render
  useEffect(() => {
    if (!initialized) {
      const container = ensureContainer();
      drawTree(container, layout, scientific);
      initialized = true;
      console.log('EmergencyPhyloTree: Initialized');
    }
    
    // Update visibility
    if (globalContainer) {
      globalContainer.style.display = visible ? 'block' : 'none';
    }
  }, [visible, layout, scientific]);
  
  // Update when layout changes
  useEffect(() => {
    if (initialized && globalContainer) {
      drawTree(globalContainer, layout, scientific);
    }
  }, [layout, scientific]);
  
  // The component just returns a trigger div that can be clicked to show the tree
  return (
    <div 
      ref={triggerRef}
      onClick={() => {
        if (globalContainer) {
          globalContainer.style.display = 'block';
        }
      }}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {!initialized && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading tree visualization...
        </div>
      )}
    </div>
  );
};

export default EmergencyPhyloTree;