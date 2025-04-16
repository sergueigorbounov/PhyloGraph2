// services/PhyloDataService.js
import { mockTreeData } from '../data/mockTreeData';

export const PhyloDataService = {
  // Fetch phylogenetic data from API
  async fetchPhylogeneticData(geneId) {
    console.log(`[PhyloDataService] Fetching data for gene: ${geneId}`);
    
    try {
      // Try primary API endpoint
      const response = await fetch(`https://api.phylograph.org/gene/${geneId}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.convertApiResponseToTreeFormat(data);
    } catch (primaryError) {
      console.warn("[PhyloDataService] Primary API failed:", primaryError);
      
      try {
        // Try fallback API
        const fallbackResponse = await fetch(`https://fallback-api.biodb.org/phylo?id=${geneId}`);
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback API request failed: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        return this.convertApiResponseToTreeFormat(fallbackData);
      } catch (fallbackError) {
        console.error("[PhyloDataService] All API requests failed:", fallbackError);
        
        // Return mock data if all APIs fail
        console.log("[PhyloDataService] Using mock data as fallback");
        return mockTreeData;
      }
    }
  },
  
  // Get pre-defined demo data
  async getDemoData() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTreeData;
  },
  
  // Convert API response to expected tree format
  convertApiResponseToTreeFormat(apiData) {
    try {
      // Check if data is already in the expected format
      if (apiData.root) {
        return apiData;
      }
      
      // Create a hierarchical structure from flat data
      const buildTree = (data) => {
        // Extract nodes and relationships
        const { genes, relationships } = data;
        
        // Map to track nodes by ID
        const nodesMap = {};
        
        // Create node objects
        genes.forEach(gene => {
          nodesMap[gene.id] = {
            id: gene.id,
            name: gene.name || gene.id,
            type: gene.type || "gene",
            support: gene.bootstrapValue,
            children: []
          };
        });
        
        // Build tree structure
        relationships.forEach(rel => {
          const parent = nodesMap[rel.parent];
          const child = nodesMap[rel.child];
          
          if (parent && child) {
            parent.children.push(child);
            
            // Add branch properties
            if (rel.distance) {
              child.branchLength = rel.distance;
            }
            
            if (rel.confidence) {
              child.confidence = rel.confidence;
            }
            
            if (rel.isInferred) {
              child.isInferred = true;
            }
          }
        });
        
        // Find the root node (no parents)
        const findRoot = () => {
          const childrenIds = new Set(relationships.map(r => r.child));
          const rootCandidates = genes.filter(g => !childrenIds.has(g.id));
          
          if (rootCandidates.length === 0) {
            console.warn("[PhyloDataService] No root found, using first node");
            return nodesMap[genes[0].id];
          }
          
          return nodesMap[rootCandidates[0].id];
        };
        
        return { root: findRoot() };
      };
      
      return buildTree(apiData);
    } catch (error) {
      console.error("[PhyloDataService] Error converting API data:", error);
      return mockTreeData;
    }
  }
};