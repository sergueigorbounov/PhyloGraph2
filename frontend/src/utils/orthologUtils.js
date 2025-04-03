export async function getOrthologGroupFromGraph(geneURIs) {
    const uri = geneURIs[0].startsWith('http') ? geneURIs[0] : `http://example.org/${geneURIs[0]}`;
    const query = `
      PREFIX orth: <http://www.orthology.org/ontology#>
      SELECT DISTINCT ?group WHERE {
        ?group orth:hasMember <${uri}> .
      } LIMIT 1
    `;
  
    return fetch('http://localhost:8000/sparql/federated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        endpoint: 'https://urgi.versailles.inrae.fr/sparql',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        return data.results?.bindings?.[0]?.group?.value || null;
      })
      .catch((err) => {
        console.warn("Ortholog group detection failed:", err);
        toast.error("🧬 SPARQL sync failed — using demo group");
        return "http://example.org/group/DemoOrtholog1";
      });
  }
  