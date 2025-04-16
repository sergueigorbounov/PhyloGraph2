// 🔬 BrapiPanel.jsx – Scientific BrAPI Germplasm UI Panel with Tree Linking

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, PlusCircle, Download, Network, FileText } from 'lucide-react';

const GERMP_OPTS = [
  { name: "Chinese Spring", species: "wheat" },
  { name: "IR64", species: "rice" },
  { name: "B73", species: "maize" },
  { name: "Golden Promise", species: "barley" },
  { name: "Tx430", species: "sorghum" },
  { name: "Other...", species: "wheat" }
];

export default function BrapiPanel({ addLog }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('name');
  const [species, setSpecies] = useState('wheat');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRDF, setSelectedRDF] = useState('');

  const handlePresetSelect = (e) => {
    const selected = GERMP_OPTS.find(opt => opt.name === e.target.value);
    setQuery(selected?.name || '');
    setSpecies(selected?.species || 'wheat');
  };

  const searchGermplasm = async () => {
    if (!query) return toast.error('Enter a search term');
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/brapi/germplasm?q=${encodeURIComponent(query)}&filter=${filter}&species=${species}`);
      const data = await res.json();
      const hits = data.result?.data || [];
      setResults(hits);
      addLog?.(`🌱 Found ${hits.length} germplasm records for "${query}" (${species})`);
      toast.success(`Found ${hits.length} records`);
    } catch (err) {
      toast.error('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pushToRDFBackend = async (g) => {
    await fetch('http://localhost:8000/graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          gene_id: g.germplasmDbId,
          gene_label: g.germplasmName,
          trait_label: "Unknown",
          trait_uri: "http://example.org/trait/unknown",
          species: g.commonCropName || species || "unknown"
        }
      ])
    });
  };

  const pushToTreeBackend = async (g) => {
    await fetch('http://localhost:8000/graph/tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          gene_id: g.germplasmDbId,
          species: g.commonCropName || species || "unknown",
          group_id: "BrAPIGroup1"
        }
      ])
    });
  };

  const addToGraph = async (g) => {
    const cy = window.cy;
    if (!cy || !g.germplasmDbId) return;
    const id = g.germplasmDbId;

    if (!cy.getElementById(id).length) {
      cy.add({
        group: 'nodes',
        data: {
          id,
          label: g.germplasmName || id,
          type: 'germplasm',
          color: '#f472b6',
          external_link: `https://urgi.versailles.inrae.fr/faidare/germplasm/${id}`,
          ...g
        }
      });
    }

    // Add BrAPIGroup1 node if not exists
    if (!cy.getElementById("BrAPIGroup1").length) {
      cy.add({
        group: 'nodes',
        data: {
          id: "BrAPIGroup1",
          label: "BrAPIGroup1",
          type: "group",
          color: "#22d3ee"
        }
      });
    }

    // Visual link to group
    if (!cy.getElementById(`${id}→BrAPIGroup1`).length) {
      cy.add({
        group: 'edges',
        data: {
          id: `${id}→BrAPIGroup1`,
          source: id,
          target: "BrAPIGroup1",
          predicate: "http://example.org/ortholog/memberOf"
        }
      });
    }

    cy.layout({ name: 'fcose', animate: true }).run();
    cy.fit();

    await pushToRDFBackend(g);
    await pushToTreeBackend(g);

    toast.success(`Added ${id} to graph + RDF + Tree`);
    addLog?.(`🧬 Added ${g.germplasmName} to graph and RDF + tree`);
  };

  const addAllToGraph = async () => {
    for (const g of results) await addToGraph(g);
    toast.success(`Added ${results.length} nodes to graph + RDF + tree`);
    addLog?.(`🧬 Added ${results.length} germplasm records to graph, RDF, and tree`);
  };

  const generateRDF = (g) => {
    return `@prefix ex: <http://example.org/> .\n\nex:${g.germplasmDbId} a ex:Germplasm ;\n  ex:name "${g.germplasmName}" ;\n  ex:accessionNumber "${g.accessionNumber}" ;\n  ex:hasCrop "${g.commonCropName || species || 'unknown'}" .`;
  };

  const downloadRDF = (g) => {
    const ttl = generateRDF(g);
    const blob = new Blob([ttl], { type: 'text/turtle' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${g.germplasmDbId}.ttl`;
    a.click();
    toast.success(`Downloaded RDF for ${g.germplasmDbId}`);
    addLog?.(`📦 RDF downloaded for ${g.germplasmDbId}`);
  };

  return (
    <div className="p-6 text-white flex flex-col gap-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Network /> BrAPI Germplasm Search</h2>

      <div className="flex gap-2">
        <select
          value={species}
          onChange={e => setSpecies(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 px-2 py-2 rounded text-sm"
        >
          <option value="wheat">Wheat</option>
          <option value="rice">Rice</option>
          <option value="maize">Maize</option>
          <option value="barley">Barley</option>
          <option value="sorghum">Sorghum</option>
        </select>

        <select
          value={query}
          onChange={handlePresetSelect}
          className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded w-full text-sm"
        >
          <option value="">— Select Germplasm —</option>
          {GERMP_OPTS.map((opt, i) => (
            <option key={i} value={opt.name}>
              {opt.name}
            </option>
          ))}
        </select>

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 px-2 py-2 rounded text-sm"
        >
          <option value="name">Name</option>
          <option value="accessionNumber">Accession</option>
          <option value="synonym">Synonym</option>
        </select>

        <button onClick={searchGermplasm} className="btn-dark px-3 py-2"><Search /></button>
      </div>

      {loading && <div className="text-sm text-zinc-400">Searching FAIDARE BrAPI for {species}…</div>}

      {results.length > 0 && (
        <>
          <button onClick={addAllToGraph} className="btn-dark w-fit text-sm flex items-center gap-1"><PlusCircle size={16} /> Add All to Graph + RDF + Tree</button>
          <div className="text-sm mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {results.map((g, i) => (
              <div key={i} className="bg-zinc-800 p-3 rounded">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-green-300">{g.germplasmName || g.germplasmDbId}</div>
                  <span className="text-xs bg-zinc-700 text-white px-2 py-0.5 rounded-full">
                    🌾 {g.commonCropName || species}
                  </span>
                </div>
                <div className="text-xs text-zinc-400">ID: {g.germplasmDbId}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => addToGraph(g)} className="btn-dark text-xs"><PlusCircle size={16} /> Add</button>
                  <button onClick={() => downloadRDF(g)} className="btn-dark text-xs"><Download size={16} /> RDF</button>
                  <button onClick={() => setSelectedRDF(generateRDF(g))} className="btn-dark text-xs"><FileText size={16} /> Preview</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedRDF && (
        <div className="bg-zinc-800 text-xs p-4 mt-4 rounded border border-zinc-700 whitespace-pre-wrap">
          <div className="flex justify-between mb-2">
            <div className="text-green-400 font-semibold">🔎 RDF Preview</div>
            <button onClick={() => setSelectedRDF('')} className="text-red-400 text-xs">✖ Close</button>
          </div>
          {selectedRDF}
        </div>
      )}
    </div>
  );
}
