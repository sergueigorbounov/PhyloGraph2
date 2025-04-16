import { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { cluster, hierarchy } from 'd3-hierarchy';
import { mockTreeData } from '../data/mockTreeData';

// Singleton pattern to maintain tree instance across remounts
let treeInstance = null;

export const usePhyloTree = ({ 
  containerRef, 
  svgRef, 
  data = null, 
  onNodeClick = () => {},
  layoutType = 'radial',
  visibleGroups = []
}) => {
  const [initialized, setInitialized] = useState(false);
  const [currentLayout, setCurrentLayout] = useState(layoutType);
  const [scientificMode, setScientificMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [treeData, setTreeData] = useState(null);
  const [renderTime, setRenderTime] = useState(0);
  const [apiLatency, setApiLatency] = useState(0);
  
  // Maintain refs for d3 selections
  const treeGroup = useRef(null);
  const nodesGroup = useRef(null);
  const linksGroup = useRef(null);
  const labelsGroup = useRef(null);
  const dimensions = useRef({ width: 800, height: 600 });
  
  // Performance tracking
  const perfMetrics = useRef({
    initTime: 0,
    lastRenderTime: 0,
    renderCount: 0
  });

  // Debug information collected during operation
  const debugInfo = {
    treeStats: {
      totalNodes: 0,
      groupCount: visibleGroups?.length || 0,
      maxDepth: 0,
      leafNodes: 0,
      speciesDistribution: {}
    }
  };

  // Initialize the tree visualization
  const initialize = useCallback((treeData) => {
    console.log("[PhyloTree] Initializing with data:", treeData);
    setLoading(true);
    const startTime = performance.now();
    
    if (!containerRef.current || !svgRef.current) {
      console.error("[PhyloTree] Container or SVG ref not available");
      setError("Container or SVG references not available");
      setLoading(false);
      return;
    }
    
    try {
      // Store the tree data
      setTreeData(treeData);
      
      // Clear previous visualization
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      
      // Set dimensions
      const containerRect = containerRef.current.getBoundingClientRect();
      dimensions.current = {
        width: containerRect.width || 800,
        height: containerRect.height || 600
      };
      
      svg
        .attr("width", dimensions.current.width)
        .attr("height", dimensions.current.height)
        .attr("viewBox", [0, 0, dimensions.current.width, dimensions.current.height]);
      
      // Create groups for tree elements
      treeGroup.current = svg.append("g")
        .attr("class", "tree-container")
        .attr("transform", `translate(${dimensions.current.width / 2}, ${dimensions.current.height / 2})`);
      
      linksGroup.current = treeGroup.current.append("g").attr("class", "links");
      nodesGroup.current = treeGroup.current.append("g").attr("class", "nodes");
      labelsGroup.current = treeGroup.current.append("g").attr("class", "labels");
      
      // Create tree instance and store in singleton
      treeInstance = {
        data: treeData,
        svg,
        treeGroup: treeGroup.current,
        nodes: nodesGroup.current,
        links: linksGroup.current,
        labels: labelsGroup.current,
        dimensions: dimensions.current,
        layout: currentLayout,
        scientificMode
      };
      
      // Expose for external access
      window.treeRef = {
        refresh: renderTree,
        highlightNode,
        debug: {
          dumpTreeData: () => treeData
        }
      };
      
      // Render the tree with current settings
      renderTree();
      
      setInitialized(true);
      perfMetrics.current.initTime = performance.now() - startTime;
      console.log(`[PhyloTree] Initialization complete in ${perfMetrics.current.initTime.toFixed(2)}ms`);
    } catch (error) {
      console.error("[PhyloTree] Initialization error:", error);
      setError(`Initialization error: ${error.message}`);
      initializeStandaloneTree();
    } finally {
      setLoading(false);
    }
  }, [containerRef, svgRef, currentLayout, scientificMode]);

  // Fallback initialization with mock data
  const initializeStandaloneTree = useCallback(() => {
    console.log("[PhyloTree] INIT: EMERGENCY INITIALIZATION: Setting up standalone tree");
    
    if (!treeInstance && mockTreeData) {
      initialize(mockTreeData);
    }
  }, [initialize]);

  // Render the tree based on current layout
  const renderTree = useCallback(() => {
    if (!treeInstance) {
      console.warn("[PhyloTree] Cannot render: tree not initialized");
      return;
    }
    
    const startTime = performance.now();
    
    try {
      const { data, treeGroup, nodes, links, labels, dimensions, layout } = treeInstance;
      
      // Clear previous elements
      nodes.selectAll("*").remove();
      links.selectAll("*").remove();
      labels.selectAll("*").remove();
      
      // Process hierarchy data
      const root = hierarchy(data.root || data);
      
      // Update debug info
      let totalNodes = 0;
      let maxDepth = 0;
      let leafNodes = 0;
      const speciesDistribution = {};
      
      // Count statistics
      root.eachBefore((node) => {
        totalNodes++;
        maxDepth = Math.max(maxDepth, node.depth);
        if (!node.children || node.children.length === 0) {
          leafNodes++;
        }
        // Count species distribution if available
        const species = node.data.attributes?.species || node.data.species;
        if (species) {
          speciesDistribution[species] = (speciesDistribution[species] || 0) + 1;
        }
      });
      
      // Update debug stats
      debugInfo.treeStats = {
        totalNodes,
        groupCount: visibleGroups?.length || 0,
        maxDepth,
        leafNodes,
        speciesDistribution
      };
      
      // Configure layout
      let treeLayout;
      
      switch (layout) {
        case 'horizontal':
          treeLayout = cluster()
            .size([dimensions.height * 0.9, dimensions.width * 0.9])
            .separation((a, b) => a.parent === b.parent ? 1 : 1.5);
          break;
          
        case 'vertical':
          treeLayout = cluster()
            .size([dimensions.width * 0.9, dimensions.height * 0.9])
            .separation((a, b) => a.parent === b.parent ? 1 : 1.5);
          break;
          
        case 'rectangular':
          treeLayout = cluster()
            .size([dimensions.height * 0.8, dimensions.width * 0.8])
            .separation((a, b) => a.parent === b.parent ? 1 : 2);
          break;
          
        case 'radial':
        default:
          treeLayout = cluster()
            .size([2 * Math.PI, Math.min(dimensions.width, dimensions.height) * 0.4])
            .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
          break;
      }
      
      // Apply layout to data
      const hierarchyData = treeLayout(root);
      
      // Function to generate link paths based on layout
      const generateLinkPath = (d) => {
        if (layout === 'radial') {
          return d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y)(d);
        } else if (layout === 'vertical') {
          return d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)(d);
        } else {
          return d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)(d);
        }
      };
      
      // Draw links
      links.selectAll("path")
        .data(hierarchyData.links())
        .enter()
        .append("path")
        .attr("class", "tree-link")
        .attr("d", generateLinkPath)
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-width", d => d.target.data.confidence ? 
          1 + (d.target.data.confidence * 2) : 1)
        .attr("stroke-dasharray", d => 
          d.target.data.isInferred ? "5,5" : null);
      
      // Position calculation for different layouts
      const getNodePosition = (d) => {
        if (layout === 'radial') {
          const x = Math.sin(d.x) * d.y;
          const y = -Math.cos(d.x) * d.y;
          return { x, y };
        } else if (layout === 'vertical') {
          return { x: d.x, y: d.y };
        } else {
          return { x: d.y, y: d.x };
        }
      };
      
      // Draw nodes
      const nodeElements = nodes.selectAll("rect")
        .data(hierarchyData.descendants())
        .enter()
        .append("rect")
        .attr("id", d => `tree-node-${d.data.id}`)
        .attr("class", "tree-node")
        .attr("width", 20)
        .attr("height", 20)
        .attr("x", d => {
          const pos = getNodePosition(d);
          return pos.x - 10;
        })
        .attr("y", d => {
          const pos = getNodePosition(d);
          return pos.y - 10;
        })
        .attr("fill", d => {
          // Color nodes based on type
          if (d.data.type === "ortholog") return "#ff7e5f";
          if (d.data.type === "gene") return "#7ec8e3";
          return "#feb72b";
        })
        .attr("rx", 4)  // Rounded corners
        .attr("ry", 4)
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          // Select node and notify parent component
          d3.selectAll(".tree-node").classed("selected", false);
          d3.select(event.currentTarget).classed("selected", true);
          onNodeClick(d.data.id);
        })
        .on("mouseover", (event, d) => {
          highlightSubtree(d);
        })
        .on("mouseout", () => {
          resetHighlighting();
        });
      
      // Add tooltips
      nodeElements.append("title")
        .text(d => `${d.data.name}\nID: ${d.data.id}\n${
          d.data.support ? `Support: ${d.data.support}` : ""
        }`);
      
      // Draw labels
      labels.selectAll("text")
        .data(hierarchyData.descendants())
        .enter()
        .append("text")
        .attr("class", "tree-label")
        .attr("x", d => {
          const pos = getNodePosition(d);
          return pos.x + 12;
        })
        .attr("y", d => {
          const pos = getNodePosition(d);
          return pos.y + 4;
        })
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", "0.5px")
        .attr("paint-order", "stroke")
        .attr("font-size", scientificMode ? "10px" : "12px")
        .text(d => d.data.name);
      
      // Add scientific annotations if enabled
      if (scientificMode) {
        labels.selectAll(".scientific-label")
          .data(hierarchyData.descendants().filter(d => d.data.support))
          .enter()
          .append("text")
          .attr("class", "scientific-label")
          .attr("x", d => {
            const pos = getNodePosition(d);
            return layout === 'radial' ? pos.x : pos.x - 10;
          })
          .attr("y", d => {
            const pos = getNodePosition(d);
            return layout === 'radial' ? pos.y - 20 : pos.y - 15;
          })
          .attr("text-anchor", "middle")
          .attr("fill", "#555")
          .attr("font-size", "8px")
          .text(d => `BS:${d.data.support}`);
      }
      
      // Add zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.2, 8])
        .on("zoom", (event) => {
          treeGroup.attr("transform", event.transform);
        });
      
      treeInstance.svg.call(zoom);
      
      // Update performance metrics
      const renderDuration = performance.now() - startTime;
      perfMetrics.current.lastRenderTime = renderDuration;
      perfMetrics.current.renderCount++;
      setRenderTime(renderDuration);
      
      console.log(`[PhyloTree] Render #${perfMetrics.current.renderCount} complete in ${perfMetrics.current.lastRenderTime.toFixed(2)}ms`);
    } catch (error) {
      console.error("[PhyloTree] Render error:", error);
      setError(`Render error: ${error.message}`);
    }
  }, [onNodeClick, scientificMode, visibleGroups]);

  // Add tree data to the main graph visualization
  const injectTreeToGraph = useCallback((data) => {
    if (!data || !window.cy) {
      console.warn("[PhyloTree] Cannot inject tree: no data or cy instance");
      return;
    }
    
    console.log("[PhyloTree] Injecting tree data to graph");
    
    try {
      // Extract nodes and edges from tree data
      const extractNodesAndEdges = (node, parent = null) => {
        let elements = [];
        
        // Add this node
        elements.push({
          group: 'nodes',
          data: {
            id: node.id,
            label: node.name,
            type: node.type || 'gene',
            parent: parent ? parent.id : null
          }
        });
        
        // Add edge to parent
        if (parent) {
          elements.push({
            group: 'edges',
            data: {
              id: `e-${parent.id}-${node.id}`,
              source: parent.id,
              target: node.id,
              label: 'hasChild'
            }
          });
        }
        
        // Process children
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            elements = [...elements, ...extractNodesAndEdges(child, node)];
          });
        }
        
        return elements;
      };
      
      // Start extraction from root
      const elements = extractNodesAndEdges(data.root || data);
      
      // Add elements to graph
      window.cy.add(elements);
      window.cy.layout({ name: 'fcose' }).run();
      
      console.log(`[PhyloTree] Added ${elements.length} elements to graph`);
    } catch (error) {
      console.error("[PhyloTree] Error injecting tree data:", error);
    }
  }, []);

  // Highlight a subtree
  const highlightSubtree = useCallback((node) => {
    if (!treeInstance) return;
    
    // Helper function to get all descendants of a node
    const getDescendants = (n) => {
      const descendants = [];
      function collect(node) {
        descendants.push(node);
        if (node.children) {
          node.children.forEach(collect);
        }
      }
      collect(n);
      return descendants;
    };
    
       // Get all descendants of the hovered node
       const descendants = getDescendants(node);
       const descendantIds = new Set(descendants.map(d => d.data.id));
       
       // Highlight the subtree
       treeInstance.nodes.selectAll(".tree-node")
         .classed("highlighted", d => descendantIds.has(d.data.id))
         .classed("dimmed", d => !descendantIds.has(d.data.id));
       
       treeInstance.links.selectAll("path")
         .classed("highlighted", d => 
           descendantIds.has(d.source.data.id) && descendantIds.has(d.target.data.id))
         .classed("dimmed", d => 
           !(descendantIds.has(d.source.data.id) && descendantIds.has(d.target.data.id)));
       
       treeInstance.labels.selectAll("text")
         .classed("highlighted", d => descendantIds.has(d.data.id))
         .classed("dimmed", d => !descendantIds.has(d.data.id));
     }, []);
   
     // Reset highlighting
     const resetHighlighting = useCallback(() => {
       if (!treeInstance) return;
       
       treeInstance.nodes.selectAll(".tree-node")
         .classed("highlighted", false)
         .classed("dimmed", false);
       
       treeInstance.links.selectAll("path")
         .classed("highlighted", false)
         .classed("dimmed", false);
       
       treeInstance.labels.selectAll("text")
         .classed("highlighted", false)
         .classed("dimmed", false);
     }, []);
   
     // Update the tree layout
     const updateLayout = useCallback((layout) => {
       if (!treeInstance) {
         console.warn("[PhyloTree] Cannot update layout: tree not initialized");
         return;
       }
       
       console.log(`[PhyloTree] Updating layout to: ${layout}`);
       setCurrentLayout(layout);
       treeInstance.layout = layout;
       renderTree();
     }, [renderTree]);
   
     // Update scientific mode
     const updateScientificMode = useCallback((mode) => {
       if (!treeInstance) {
         console.warn("[PhyloTree] Cannot update scientific mode: tree not initialized");
         return;
       }
       
       console.log(`[PhyloTree] Updating scientific mode to: ${mode}`);
       setScientificMode(mode);
       treeInstance.scientificMode = mode;
       renderTree();
     }, [renderTree]);
   
     // Highlight a specific node
     const highlightNode = useCallback((nodeId) => {
       if (!treeInstance) return;
       
       // Find the node with the given ID
       const nodeElement = treeInstance.nodes.selectAll(".tree-node")
         .filter(d => d.data.id === nodeId);
       
       if (nodeElement.size() > 0) {
         // Reset previous selection
         treeInstance.nodes.selectAll(".tree-node").classed("selected", false);
         
         // Highlight the node
         nodeElement.classed("selected", true);
         
         // Get the data associated with the node
         const nodeData = nodeElement.datum();
         if (nodeData) {
           onNodeClick(nodeData.data.id);
         }
       }
     }, [onNodeClick]);
   
     // Export functions
     const exportSVG = useCallback((filename = "phylo-tree.svg") => {
       if (!treeInstance || !treeInstance.svg) return;
       
       try {
         // Create a copy of the SVG
         const svgCopy = treeInstance.svg.node().cloneNode(true);
         
         // Add stylesheet
         const styleSheet = document.createElement("style");
         styleSheet.textContent = `
           .tree-node { fill-opacity: 0.8; }
           .tree-node.selected { stroke: #f00; stroke-width: 2px; }
           .tree-link { stroke-linecap: round; }
           .tree-label { font-family: Arial, sans-serif; }
         `;
         svgCopy.insertBefore(styleSheet, svgCopy.firstChild);
         
         // Serialize the SVG
         const serializer = new XMLSerializer();
         let source = serializer.serializeToString(svgCopy);
         
         // Add XML declaration
         source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
         
         // Convert to Blob
         const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
         const url = URL.createObjectURL(blob);
         
         // Create download link
         const link = document.createElement("a");
         link.href = url;
         link.download = filename;
         document.body.appendChild(link);
         link.click();
         
         // Clean up
         setTimeout(() => {
           document.body.removeChild(link);
           URL.revokeObjectURL(url);
         }, 100);
         
         console.log("[PhyloTree] SVG exported as", filename);
       } catch (error) {
         console.error("[PhyloTree] Error exporting SVG:", error);
       }
     }, []);
   
     const exportPNG = useCallback((filename = "phylo-tree.png") => {
       if (!treeInstance || !treeInstance.svg) return;
       
       try {
         // Create a copy of the SVG
         const svgCopy = treeInstance.svg.node().cloneNode(true);
         
         // Add stylesheet
         const styleSheet = document.createElement("style");
         styleSheet.textContent = `
           .tree-node { fill-opacity: 0.8; }
           .tree-node.selected { stroke: #f00; stroke-width: 2px; }
           .tree-link { stroke-linecap: round; }
           .tree-label { font-family: Arial, sans-serif; }
         `;
         svgCopy.insertBefore(styleSheet, svgCopy.firstChild);
         
         // Serialize the SVG
         const serializer = new XMLSerializer();
         let source = serializer.serializeToString(svgCopy);
         
         // Create canvas
         const canvas = document.createElement("canvas");
         const context = canvas.getContext("2d");
         
         // Set canvas dimensions
         canvas.width = treeInstance.dimensions.width * 2;  // Higher resolution
         canvas.height = treeInstance.dimensions.height * 2;
         
         // Create image
         const image = new Image();
         image.onload = () => {
           // Draw white background
           context.fillStyle = "#fff";
           context.fillRect(0, 0, canvas.width, canvas.height);
           
           // Draw SVG
           context.drawImage(image, 0, 0, canvas.width, canvas.height);
           
           // Convert to PNG
           canvas.toBlob((blob) => {
             const url = URL.createObjectURL(blob);
             
             // Create download link
             const link = document.createElement("a");
             link.href = url;
             link.download = filename;
             document.body.appendChild(link);
             link.click();
             
             // Clean up
             setTimeout(() => {
               document.body.removeChild(link);
               URL.revokeObjectURL(url);
             }, 100);
             
             console.log("[PhyloTree] PNG exported as", filename);
           }, "image/png");
         };
         
         // Load SVG data URL
         const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
         const url = URL.createObjectURL(svgBlob);
         image.src = url;
       } catch (error) {
         console.error("[PhyloTree] Error exporting PNG:", error);
       }
     }, []);
   
     const exportNewick = useCallback((filename = "phylo-tree.nwk") => {
       if (!treeInstance) return;
       
       try {
         // Convert tree to Newick format
         const toNewick = (node) => {
           if (!node.children || node.children.length === 0) {
             return node.data.name || node.data.id;
           }
           
           const childrenNewick = node.children.map(toNewick).join(",");
           const branchLength = node.data.branchLength ? `:${node.data.branchLength}` : "";
           const support = node.data.support ? `:${node.data.support}` : "";
           
           return `(${childrenNewick})${node.data.name || ""}${branchLength}${support}`;
         };
         
         // Get the root of the hierarchy
         const root = hierarchy(treeInstance.data.root || treeInstance.data);
         
         // Generate Newick string
         const newickString = toNewick(root) + ";";
         
         // Create Blob and download
         const blob = new Blob([newickString], { type: "text/plain" });
         const url = URL.createObjectURL(blob);
         
         const link = document.createElement("a");
         link.href = url;
         link.download = filename;
         document.body.appendChild(link);
         link.click();
         
         setTimeout(() => {
           document.body.removeChild(link);
           URL.revokeObjectURL(url);
         }, 100);
         
         console.log("[PhyloTree] Newick exported as", filename);
       } catch (error) {
         console.error("[PhyloTree] Error exporting Newick:", error);
       }
     }, []);
   
     // Debug function
     const debug = useCallback(() => {
       console.log("[PhyloTree] Debug information:");
       console.log("- Tree instance:", treeInstance);
       console.log("- Performance metrics:", {
         initTime: perfMetrics.current.initTime.toFixed(2) + "ms",
         lastRenderTime: perfMetrics.current.lastRenderTime.toFixed(2) + "ms",
         renderCount: perfMetrics.current.renderCount
       });
       
       if (treeInstance) {
         console.log("- Layout:", treeInstance.layout);
         console.log("- Scientific mode:", treeInstance.scientificMode);
         console.log("- Dimensions:", treeInstance.dimensions);
         
         // Count nodes and links
         const nodeCount = treeInstance.nodes.selectAll(".tree-node").size();
         const linkCount = treeInstance.links.selectAll("path").size();
         console.log("- Node count:", nodeCount);
         console.log("- Link count:", linkCount);
       }
       
       return "Debug information logged to console";
     }, []);
   
     // Get tree stats for debug panel
     const getTreeStats = useCallback(() => {
       if (!treeInstance) return [];
       
       const nodeCount = treeInstance.nodes.selectAll(".tree-node").size();
       const linkCount = treeInstance.links.selectAll("path").size();
       
       return [
         { label: "Layout", value: treeInstance.layout },
         { label: "Scientific Mode", value: treeInstance.scientificMode ? "On" : "Off" },
         { label: "Node Count", value: nodeCount },
         { label: "Link Count", value: linkCount },
         { label: "Init Time", value: perfMetrics.current.initTime.toFixed(2) + "ms" },
         { label: "Last Render Time", value: perfMetrics.current.lastRenderTime.toFixed(2) + "ms" },
         { label: "Render Count", value: perfMetrics.current.renderCount }
       ];
     }, []);
   
     // Example data for debug mode
     const debugExamples = {
       simple: {
         root: {
           id: "root",
           name: "OrthoMember",
           type: "ortholog",
           children: [
             {
               id: "fallback1",
               name: "FallbackGene1",
               type: "gene",
               support: 95,
               branchLength: 0.2,
               confidence: 0.9,
               children: []
             },
             {
               id: "fallback2",
               name: "FallbackGene2",
               type: "gene",
               support: 87,
               branchLength: 0.15,
               confidence: 0.8,
               children: []
             }
           ]
         }
       },
       realWorld: {
         root: {
           id: "ortho1",
           name: "Ortholog Group",
           type: "ortholog",
           attributes: { species: "multi" },
           children: [
             {
               id: "AT1G01010",
               name: "AT1G01010",
               type: "gene",
               attributes: { species: "Arabidopsis thaliana" },
               support: 98,
               branchLength: 0.1,
               children: []
             },
             {
               id: "OS01G00010",
               name: "OS01G00010",
               type: "gene",
               attributes: { species: "Oryza sativa" },
               support: 92,
               branchLength: 0.15,
               children: []
             },
             {
               id: "GRMZM2G174784",
               name: "GRMZM2G174784",
               type: "gene",
               attributes: { species: "Zea mays" },
               support: 87,
               branchLength: 0.2,
               children: []
             }
           ]
         }
       },
       complex: {
         root: {
           id: "ortho-complex",
           name: "Complex Group",
           type: "ortholog",
           attributes: { species: "multi" },
           children: [
             {
               id: "clade1",
               name: "Monocots",
               type: "clade",
               support: 99,
               children: [
                 {
                   id: "OS01G00010",
                   name: "OS01G00010",
                   type: "gene",
                   attributes: { species: "Oryza sativa" },
                   support: 92,
                   branchLength: 0.15,
                   children: []
                 },
                 {
                   id: "GRMZM2G174784",
                   name: "GRMZM2G174784",
                   type: "gene",
                   attributes: { species: "Zea mays" },
                   support: 87,
                   branchLength: 0.2,
                   children: []
                 }
               ]
             },
             {
               id: "clade2",
               name: "Dicots",
               type: "clade",
               support: 97,
               children: [
                 {
                   id: "AT1G01010",
                   name: "AT1G01010",
                   type: "gene",
                   attributes: { species: "Arabidopsis thaliana" },
                   support: 98,
                   branchLength: 0.1,
                   children: []
                 },
                 {
                   id: "gene-tomato",
                   name: "Solyc01g005160",
                   type: "gene",
                   attributes: { species: "Solanum lycopersicum" },
                   support: 85,
                   branchLength: 0.18,
                   children: []
                 }
               ]
             }
           ]
         }
       }
     };
   
     // Debug controls
     const debugControls = {
       loadExample: (exampleKey) => {
         const example = debugExamples[exampleKey];
         if (example) {
           console.log(`[PhyloTree] Loading example: ${exampleKey}`);
           initialize(example);
         } else {
           console.warn(`[PhyloTree] Example not found: ${exampleKey}`);
         }
       },
       getExamples: () => [
         { key: 'simple', name: 'Simple Tree (2 nodes)' },
         { key: 'realWorld', name: 'Real Example (3 genes)' },
         { key: 'complex', name: 'Complex Tree (5 nodes, 2 clades)' }
       ],
       refreshTree: () => {
         renderTree();
       },
       toggleScientificMode: () => {
         updateScientificMode(!scientificMode);
       }
     };
   
     // Initialize with fallback data if no data provided
     useEffect(() => {
       if (!initialized && !treeInstance) {
         if (data) {
           initialize(data);
         } else {
           initializeStandaloneTree();
         }
       }
     }, [data, initialized, initialize, initializeStandaloneTree]);
   
     // Update layout when layoutType changes
     useEffect(() => {
       if (initialized && treeInstance && treeInstance.layout !== layoutType) {
         updateLayout(layoutType);
       }
     }, [layoutType, initialized, updateLayout]);
   
     // Cleanup on unmount
     useEffect(() => {
       return () => {
         console.log("[PhyloTree] Cleaning up (component unmounted)");
         // We keep treeInstance for persistence across remounts
       };
     }, []);
   
     return {
       initialize,
       updateLayout,
       updateScientificMode,
       highlightNode,
       highlightSubtree,
       resetHighlighting,
       exportSVG,
       exportPNG,
       exportNewick,
       getTreeStats,
       debug,
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
     };
   };
   
   // Also keep the default export for backward compatibility
   export default usePhyloTree;