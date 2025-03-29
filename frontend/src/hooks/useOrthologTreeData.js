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
      const res = await fetch('http://localhost:8000/sparql/federated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, endpoint: 'https://urgi.versailles.inrae.fr/sparql' })
      });
      const data = await res.json();
      const nodes = data.results?.bindings || [];

      const children = nodes.map(b => ({
        name: b.label?.value || b.gene.value.split('/').pop()
      }));

      setTreeData({ name: groupId.split('/').pop(), children });
      setLoading(false);
    };

    fetchTree();
  }, [groupId]);

  return { treeData, loading };
}
