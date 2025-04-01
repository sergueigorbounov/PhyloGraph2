import { useEffect, useState } from 'react';

export default function useOrthologTreeData(groupId) {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const fetchTree = async () => {
      setLoading(true);

      const query = `
        PREFIX orth: <http://www.orthology.org/ontology#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?gene ?label WHERE {
          <${groupId}> orth:hasMember ?gene .
          OPTIONAL { ?gene rdfs:label ?label }
        }
      `;

      try {
        const res = await fetch('http://localhost:8000/sparql/federated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            endpoint: 'https://urgi.versailles.inrae.fr/sparql'
          })
        });

        const data = await res.json();
        const nodes = data.results?.bindings || [];
        const treeData = {
          name: "AT1G01010",
          function: "Transcription factor",
          location: "Nucleus",
          children: [
            {
              name: "AT1G01020",
              function: "Kinase activity",
              location: "Cytoplasm"
            },
            {
              name: "AT1G01030",
              function: "Signal transduction",
              location: "Plasma membrane"
            }
          ]
        };
        
        const children = nodes.map(b => ({
          name: b.label?.value || b.gene.value.split('/').pop()
        }));

        // Fallback if SPARQL gave 0 results
        if (children.length === 0) throw new Error('No children from SPARQL');

        setTreeData({
          name: groupId.split('/').pop(),
          children
        });
      } catch (err) {
        console.warn('❌ Tree fetch failed, using fallback data');

        setTreeData({
          name: groupId.split('/').pop(),
          children: [
            { name: 'Gene A' },
            {
              name: 'Gene B',
              children: [
                { name: 'Gene B1' },
                { name: 'Gene B2' }
              ]
            },
            { name: 'Gene C' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [groupId]);

  return { treeData, loading };
}
