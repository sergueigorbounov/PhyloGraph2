// data/mockTreeData.js

export const mockTreeData = {
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
  };
  
  // Additional mock datasets can be defined here
  export const complexMockTreeData = {
    root: {
      id: "root",
      name: "OrthoGroup",
      type: "ortholog",
      children: [
        {
          id: "clade1",
          name: "Clade1",
          type: "clade",
          support: 98,
          children: [
            {
              id: "gene1",
              name: "AT1G01010",
              type: "gene",
              support: 92,
              branchLength: 0.1,
              confidence: 0.95,
              children: []
            },
            {
              id: "gene2",
              name: "AT2G01020",
              type: "gene",
              support: 89,
              branchLength: 0.15,
              confidence: 0.9,
              children: []
            }
          ]
        }
      ]
    }
  };