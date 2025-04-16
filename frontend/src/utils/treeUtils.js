// utils/treeUtils.js

// Calculate tree statistics
export const calculateTreeStats = (treeData) => {
    if (!treeData || !treeData.root) return {};
    
    let nodeCount = 0;
    let maxDepth = 0;
    let leafCount = 0;
    
    const processNode = (node, depth = 0) => {
      nodeCount++;
      maxDepth = Math.max(maxDepth, depth);
      
      if (!node.children || node.children.length === 0) {
        leafCount++;
      } else {
        node.children.forEach(child => processNode(child, depth + 1));
      }
    };
    
    processNode(treeData.root);
    
    return {
      nodeCount,
      maxDepth,
      leafCount,
      branchingFactor: (nodeCount - 1) / (nodeCount - leafCount)
    };
  };
  
  // Format tree data for D3
  export const formatTreeForD3 = (treeData) => {
    if (!treeData || !treeData.root) return null;
    
    // D3 hierarchy expects children nodes under a "children" property
    const formatNode = (node) => {
      const formatted = { ...node };
      
      if (node.children && node.children.length > 0) {
        formatted.children = node.children.map(formatNode);
      }
      
      return formatted;
    };
    
    return formatNode(treeData.root);
  };
  
  // Generate a unique ID for tree nodes
  export const generateUniqueId = (prefix = 'node') => {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // Find a node by ID in the tree
  export const findNodeById = (treeData, nodeId) => {
    if (!treeData || !treeData.root) return null;
    
    const search = (node) => {
      if (node.id === nodeId) return node;
      
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const found = search(child);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    return search(treeData.root);
  };
  
  // Convert between tree formats
  export const convertNewickToJson = (newickString) => {
    // Simplified Newick parser
    if (!newickString) return null;
    
    // Remove whitespace and trailing semicolon
    newickString = newickString.trim();
    if (newickString.endsWith(';')) {
      newickString = newickString.slice(0, -1);
    }
    
    let pos = 0;
    
    const parseNode = () => {
      let node = {
        children: []
      };
      
      // Check for nested definition (children)
      if (newickString[pos] === '(') {
        pos++; // Skip '('
        
        // Parse all children
        while (true) {
          node.children.push(parseNode());
          
          // Check if we have more siblings
          if (newickString[pos] === ',') {
            pos++; // Skip ','
          } else {
            break;
          }
        }
        
        if (newickString[pos] === ')') {
          pos++; // Skip ')'
        }
      }
      
      // Parse name
      let name = '';
      while (pos < newickString.length && 
             !['(', ')', ',', ':', ';'].includes(newickString[pos])) {
        name += newickString[pos];
        pos++;
      }
      
      if (name) {
        node.name = name;
        node.id = generateUniqueId(name);
      }
      
      // Parse branch length
      if (newickString[pos] === ':') {
        pos++; // Skip ':'
        let lengthStr = '';
        
        while (pos < newickString.length && 
               !['(', ')', ',', ':', ';'].includes(newickString[pos])) {
          lengthStr += newickString[pos];
          pos++;
        }
        
        if (lengthStr) {
          node.branchLength = parseFloat(lengthStr);
        }
      }
      
      return node;
    };
    
    // Parse the entire string
    const root = parseNode();
    
    // Add types based on hierarchy
    const assignTypes = (node, depth = 0) => {
      if (depth === 0) {
        node.type = 'ortholog';
      } else if (!node.children || node.children.length === 0) {
        node.type = 'gene';
      } else {
        node.type = 'clade';
      }
      
      if (node.children) {
        node.children.forEach(child => assignTypes(child, depth + 1));
      }
    };
    
    assignTypes(root);
    
    return { root };
  };