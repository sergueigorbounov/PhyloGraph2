import { useState } from 'react';
import { api } from '../api/api';

const GENE_OPTS = [
  "AT1G01010",
  "AT2G37020",
  "GRMZM2G700000",
  "Zm00001d027783",
  "Os01g0100100",
  "Other..."
];

export default function SearchBar({ onGraphUpdate, onClearGraph, onLoadDemo }) {
  const [gene, setGene] = useState('');
  const [customGene, setCustomGene] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSubmit = async () => {
    const geneId = gene === 'Other...' ? customGene.trim() : gene.trim();
    if (!geneId) return;

    const payload = [{
      gene_id: geneId,
      gene_label: "Gene Label",
      trait_label: "Height",
      trait_uri: "http://purl.obolibrary.org/obo/TO_0000207",
      species: "Zea mays"
    }];

    try {
      await api.post('/graph', payload);
      onGraphUpdate(payload);
      setGene('');
      setCustomGene('');
    } catch (err) {
      console.error("Failed to add gene to graph:", err);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-white mb-4">
      <div className="relative flex-1">
        <select
          value={gene}
          onChange={(e) => setGene(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="w-full px-3 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white"
        >
          <option value="">— Select Gene ID —</option>
          {GENE_OPTS.map((g, i) => (
            <option key={i} value={g}>{g}</option>
          ))}
        </select>
        {gene === 'Other...' && (
          <input
            type="text"
            value={customGene}
            onChange={(e) => setCustomGene(e.target.value)}
            placeholder="Enter custom Gene ID"
            className="mt-2 w-full px-3 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white"
          />
        )}
      </div>

      <div className="flex gap-1 flex-wrap">
        <button
          onClick={handleSubmit}
          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 rounded transition"
        >
          ➕ Add
        </button>
        <button
          onClick={onClearGraph}
          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 rounded transition"
        >Clear
        </button>
        <button
          onClick={onLoadDemo}
          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 rounded transition"
        >Demo
        </button>
      </div>
    </div>
  );
}
