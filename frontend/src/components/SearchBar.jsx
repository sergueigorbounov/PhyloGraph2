import { useState } from 'react';
import { api } from '../api/api';
import toast from 'react-hot-toast';

const GENE_OPTS = [
  "AT1G01010",
  "AT2G37020",
  "GRMZM2G700000",
  "Zm00001d027783",
  "Os01g0100100",
  "Other..."
];

const SPECIES_MAP = {
  AT1G01010: "Arabidopsis thaliana",
  AT2G37020: "Arabidopsis thaliana",
  GRMZM2G700000: "Zea mays",
  Zm00001d027783: "Zea mays",
  Os01g0100100: "Oryza sativa"
};

export default function SearchBar({ onGraphUpdate, onClearGraph, onLoadDemo }) {
  const [gene, setGene] = useState('');
  const [customGene, setCustomGene] = useState('');

  const handleSubmit = async () => {
    const geneId = gene === 'Other...' ? customGene.trim() : gene.trim();
    if (!geneId) return;

    const species = SPECIES_MAP[geneId] || "Zea mays";

    const payload = [{
      gene_id: geneId,
      gene_label: geneId,
      trait_label: "Height",
      trait_uri: "http://purl.obolibrary.org/obo/TO_0000207",
      species
    }];

    try {
      // 1. Inject gene-trait RDF
      await api.post('/graph', payload);

      // 2. Inject tree triple to associate with DemoOrtholog1
      await api.post('/graph/tree', [{
        gene_id: geneId,
        species,
        group_id: "DemoOrtholog1"
      }]);

      onGraphUpdate(payload);
      setGene('');
      setCustomGene('');
      toast.success(`${geneId} added and tree triple injected.`);
    } catch (err) {
      console.error("Failed to add gene:", err);
      toast.error("Error while adding gene.");
    }
  };

  const downloadRDF = async () => {
    try {
      const res = await api.get('/rdf');
      const blob = new Blob([res.data], { type: 'text/turtle' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'graph.ttl';
      link.click();
      toast.success("RDF downloaded.");
    } catch (err) {
      toast.error("RDF export failed.");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-white mb-4 w-full">
      {/* Gene Select + Optional Custom Input */}
      <div className="flex-1 flex flex-col gap-2">
        <select
          value={gene}
          onChange={(e) => setGene(e.target.value)}
          className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-white text-sm"
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
            className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-white text-sm"
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 rounded transition"
        >
          Add
        </button>
        <button
          onClick={onClearGraph}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 rounded transition"
        >
          Clear
        </button>
        <button
          onClick={onLoadDemo}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 rounded transition"
        >
          Demo
        </button>
        <button
          onClick={downloadRDF}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 rounded transition"
        >
          Download RDF
        </button>
      </div>
    </div>
  );
}
