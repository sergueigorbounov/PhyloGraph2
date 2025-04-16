// src/utils/mockApi.js
const MOCK_DELAY = 800; // Simulate network delay

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

// Mock API functions
export const fetchPhyloTree = async (signal) => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(MOCK_TREE_DATA);
    }, MOCK_DELAY);
    
    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        resolve(null); // Resolve with null on abort
      });
    }
  });
};

export default {
  fetchPhyloTree
};