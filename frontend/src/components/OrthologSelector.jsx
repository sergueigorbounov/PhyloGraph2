import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function OrthologSelector({
  onGraphUpdate,
  onSetGroupId,
  selectedGroupId,
  groupOptions = []
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('orthologGroup');
    if (stored && Array.isArray(groupOptions) && groupOptions.includes(stored)) {
      onSetGroupId?.(stored);
      fetchOrthologs(stored);
    } else if (!selectedGroupId && groupOptions.length > 0) {
      const first = groupOptions[0];
      onSetGroupId?.(first);
      fetchOrthologs(first);
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
      localStorage.setItem('orthologGroup', groupId);

      toast.success('Ortholog group loaded ✅', { id: 'ortholog' });

      // Auto-scroll tree
      document.querySelector('.tree-wrapper')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      toast.error('Failed to fetch orthologs ❌', { id: 'ortholog' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-64">
      <div className="relative">
        <select
          disabled={loading || groupOptions.length === 0}
          value={selectedGroupId}
          onChange={(e) => {
            const val = e.target.value;
            onSetGroupId(val);
            fetchOrthologs(val);
          }}
          className="w-full px-3 py-2 text-sm bg-zinc-900 text-white border border-zinc-700 rounded hover:border-zinc-600 focus:outline-none"
        >
          <option value="" disabled>Select Ortholog Group</option>
          {groupOptions.map(uri => (
            <option key={uri} value={uri}>
              {uri.split('/').pop()}
            </option>
          ))}
        </select>

        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 animate-pulse">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
