import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Mock tree data that won't need an API call
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

// Global instance to survive component remounts
let treeInstance = null;

// Create a tree drawer function that will operate directly on a DOM element
const createTreeDrawer = (containerId, config = {}) => {
  const { 
    debugMode = false, 
    scientificMode = false,
    onNodeClick = () => {}
  } = config;
  
  const drawer = {
    containerId,
    layout: 'radial',
    data: MOCK_TREE_DATA,
    svg: null,
    
    initialize() {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('Tree container not found:', containerId);
        return false;
      }
      
      // Clear previous content
      container.innerHTML = '';
      
      // Create SVG element
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svg.setAttribute('width', '100%');
      this.svg.setAttribute('height', '100%');
      this.svg.style.overflow = 'visible';
      container.appendChild(this.svg);
      
      console.log('StandalonePhyloTree initialized with container:', containerId);
      return true;
    },
    
    setLayout(layout) {
      this.layout = layout;
      this.draw();
    },
    
    draw() {
      if (!this.svg) {
        if (!this.initialize()) return;
      }
      
      const width = this.svg.clientWidth || 800;
      const height = this.svg.clientHeight || 600;
      const margin = { top: 20, right: 120, bottom: 20, left: 120 };
      
      // Clear previous content
      d3.select(this.svg).selectAll('*').remove();
      
      // Create root hierarchy
      const root = d3.hierarchy(this.data);
      
      // Create the tree layout
      let tree;
      if (this.layout === 'radial') {
        tree = d3.cluster()
          .size([2 * Math.PI, Math.min(width, height) / 2 - 100]);
      } else {
        tree = d3.tree()
          .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
      }
      
      // Generate the tree layout
      tree(root);
      
      const svg = d3.select(this.svg)
        .attr('width', width)
        .attr('height', height)
        .append('g');
        
      if (this.layout === 'radial') {
        svg.attr('transform', `translate(${width / 2},${height / 2})`);
      } else {
        svg.attr('transform', `translate(${margin.left},${margin.top})`);
      }
      
      // Add links
      const link = svg.selectAll('.link')
        .data(root.links())
        .enter().append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#555')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1.5);
        
      if (this.layout === 'radial') {
        link.attr('d', d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y));
      } else {
        link.attr('d', d3.linkHorizontal()
          .x(d => d.y)
          .y(d => d.x));
      }
      
      // Add nodes
      const node = svg.selectAll('.node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', d => `node ${d.children ? 'node--internal' : 'node--leaf'}`)
        .on('click', (event, d) => {
          onNodeClick(d.data.name);
        });
        
      if (this.layout === 'radial') {
        node.attr('transform', d => `translate(${this.radialPoint(d.x, d.y)})`);
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
      
      // Add scientific information if needed
      if (scientificMode) {
        node.append('title')
          .text(d => d.data.description || d.data.name);
        
        // Add group annotations for internal nodes with 'group' property
        svg.selectAll('.node--internal')
          .filter(d => d.data.group)
          .each(function(d) {
            d3.select(this).append('text')
              .attr('dy', '0.31em')
              .attr('x', d.children ? -8 : 8)
              .attr('y', -15)
              .attr('text-anchor', 'end')
              .text(d.data.group)
              .attr('font-size', '8px')
              .attr('fill', '#666')
              .attr('font-family', 'monospace');
          });
      }
      
      console.log('StandalonePhyloTree drawn with layout:', this.layout);
    },
    
    radialPoint(x, y) {
      return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
    }
  };
  
  return drawer;
};

// React component that uses imperative tree instance
export const StandalonePhyloTree = ({ 
  containerId = 'standalone-phylo-tree',
  layout = 'radial',
  debugMode = false,
  scientificMode = false,
  onNodeClick = () => {}
}) => {
  const containerRef = useRef(null);
  
  // Create or update tree instance
  useEffect(() => {
    // If the element doesn't exist yet, create it
    if (!document.getElementById(containerId)) {
      const container = document.createElement('div');
      container.id = containerId;
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.position = 'relative';
      document.body.appendChild(container);
    }
    
    // Create or reuse tree instance
    if (!treeInstance) {
      treeInstance = createTreeDrawer(containerId, { 
        debugMode, 
        scientificMode,
        onNodeClick 
      });
      treeInstance.initialize();
    }
    
    // Update layout and redraw
    treeInstance.setLayout(layout);
    
    // Don't clean up on unmount to persist the instance
  }, [containerId, layout, debugMode, scientificMode, onNodeClick]);
  
  // This component doesn't render anything itself
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative'
      }}
    >
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute',
          pointerEvents: 'none'
        }}
        onClick={() => {
          const container = document.getElementById(containerId);
          if (container) {
            container.style.visibility = 'visible';
            container.style.pointerEvents = 'auto';
          }
        }}
      />
    </div>
  );
};

export default StandalonePhyloTree;