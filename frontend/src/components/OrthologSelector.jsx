import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function OrthologSelector({
  onGraphUpdate,
  onSetGroupId,
  selectedGroupId,
  groupOptions
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedGroupId && groupOptions.length > 0) {
      const first = groupOptions[0];
      onSetGroupId?.(first);            // ✅ Update state
      fetchOrthologs(first);           // ✅ Fetch genes
    }
  }, [groupOptions]);
  

  const fetchOrthologs = async (groupId) => {
    setLoading(true);
    toast.loading('Fetching ortholog group...', { id: 'ortholog' });

    const query = `
      PREFIX orth: <http://www.orthology.org/ontology#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT ?gene ?label WHERE {
        <${groupId}> a orth:OrthologGroup ;
                     orth:hasMember ?gene .
        OPTIONAL { ?gene rdfs:label ?label }
      }
    `;

    try {
      const res = await fetch('http://localhost:8000/sparql/federated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, endpoint: 'https://urgi.versailles.inrae.fr/sparql' })
      });

      const data = await res.json();
      const bindings = data.results?.bindings || [];

      const elements = bindings.map(b => ({
        gene_id: b.gene.value.split('/').pop(),
        gene_label: b.label?.value || b.gene.value.split('/').pop(),
        trait_label: 'Ortholog Member',
        trait_uri: 'http://example.org/trait/ortholog',
        species: 'Triticum aestivum'
      }));

      onGraphUpdate?.(elements);
      onSetGroupId?.(groupId);

      toast.success('Ortholog group loaded ✅', { id: 'ortholog' });
    } catch (err) {
      toast.error('Failed to fetch orthologs ❌', { id: 'ortholog' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-2">
      <label className="text-sm text-gray-300 mb-1 block">Ortholog Group</label>
      <select
  disabled={loading}
  value={selectedGroupId} // ✅ Bind here
  onChange={(e) => {
    const val = e.target.value;
    onSetGroupId(val);     // ✅ sync state
    fetchOrthologs(val);   // ✅ trigger fetch
  }}
  className="bg-[#111] border border-[#333] text-white text-sm px-2 py-1 rounded w-full"
>

        <option value="">Select Ortholog Group</option>
        {groupOptions.map(uri => (
          <option key={uri} value={uri}>
            {uri.split('/').pop()}
          </option>
        ))}
      </select>
    </div>
  );
}
