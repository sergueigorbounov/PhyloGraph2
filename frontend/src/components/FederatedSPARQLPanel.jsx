import { useState } from 'react';
import toast from 'react-hot-toast';
import '../components/Panel.css';

const SPARQL_PREFIXES = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX owl: <http://www.w3.org/2002/07/owl#>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nPREFIX foaf: <http://xmlns.com/foaf/0.1/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX obo: <http://purl.obolibrary.org/obo/>\nPREFIX agrold: <http://www.southgreen.fr/agrold/resource/>\n`;
const shortLabel = (val) => {
  if (!val) return '';
  if (!val.startsWith('http')) return val; // literal
  return val.split('/').pop().split('#').pop(); // URI
};

export default function FederatedSPARQLPanel({ addLog, addNode, addEdge }) {
  const [selected, setSelected] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [query, setQuery] = useState('');
  const [bindings, setBindings] = useState([]);

  const PRESET_ENDPOINTS = {
    'SyntenyViewer': 'https://urgi.versailles.inrae.fr/sparql',
    'FAIDARE': 'https://urgi.versailles.inrae.fr/faidare/sparql',
    'AgroLD': 'https://www.agrold.org/sparql',
    'Wikidata': 'https://query.wikidata.org/sparql',
    'Custom': 'custom'
  };

  const handlePresetChange = (e) => {
    const label = e.target.value;
    setSelected(label);
    setEndpoint(PRESET_ENDPOINTS[label] || '');
    addLog(`🔗 Selected endpoint: ${label} (${PRESET_ENDPOINTS[label] || 'custom'})`);
  };

  const runFederatedQuery = async () => {
    if (!endpoint || !query) return toast.error("Fill endpoint and query");
    try {
      addLog(`🚀 Running federated query on: ${endpoint}`);
      const res = await fetch('http://localhost:8000/sparql/federated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, query })
      });
      const data = await res.json();
      if (data.error) return toast.error(data.error);
      if (data.results?.bindings) {
        setBindings(data.results.bindings);
        addLog(`✅ Success: ${data.results.bindings.length} rows received`);
        toast.success("Federated query successful");
      } else {
        toast.error("No results returned");
      }
    } catch (err) {
      console.error(err);
      toast.error("Federated query failed");
      addLog(`❌ Error: ${err.message}`);
    }
  };

  const downloadCSV = () => {
    if (!bindings.length) return;
    const headers = Object.keys(bindings[0]);
    const csv = [
      headers.join(','),
      ...bindings.map(row => headers.map(h => row[h]?.value || '').join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'federated_results.csv';
    a.click();
    URL.revokeObjectURL(url);
    addLog("📅 Downloaded federated_results.csv");
  };

  const addToGraph = (row) => {
    if (!row.s || !row.p || !row.o) return;
  
    const cy = window.cy;
    if (!cy) return toast.error("Graph not ready");
  
    const sId = row.s.value;
    const pId = row.p.value;
    const oId = row.o.value;
  
    // Add subject node if it doesn't exist
    if (!cy.getElementById(sId).length) {
      cy.add({ group: 'nodes', data: { id: sId, label: shortLabel(sId) } });
    }
  
    // Add object node if it doesn't exist
    // Inside addToGraph()
if (!cy.getElementById(oId).length) {
  const isLiteral = row.o.type === 'literal';
  cy.add({ 
    group: 'nodes', 
    data: { id: oId, label: shortLabel(oId), ...(isLiteral && { type: 'literal' }) } 
  });
}
  
  
    // Add edge if it doesn't exist
    const edgeId = `${sId}-${pId}-${oId}`;
    if (!cy.getElementById(edgeId).length) {
      cy.add({ group: 'edges', data: { id: edgeId, source: sId, target: oId, label: shortLabel(pId) } });
    }
  
    toast.success("Triple added to graph");
    addLog(`🧩 Added triple: ${sId} — ${pId} → ${oId}`);
  };
  

  const addAllToGraph = () => {
    bindings.forEach(addToGraph);
    toast.success("All unique triples added to graph");
    addLog(`🧩 Added all ${bindings.length} results to graph`);
  };
  

  const insertPrefixes = () => {
    setQuery(prev => `${SPARQL_PREFIXES}\n${prev}`);
    toast.success("SPARQL prefixes inserted");
  };

  return (
    <div className="panel-wrapper">
      <h2>🌐 Federated SPARQL Query</h2>

      <label className="text-sm text-gray-300 mb-1">Choose Endpoint</label>
      <select
        value={selected}
        onChange={handlePresetChange}
        className="bg-[#121212] border border-[#333] text-white px-4 py-2 rounded mb-2"
      >
        {Object.keys(PRESET_ENDPOINTS).map((label) => (
          <option key={label} value={label}>{label}</option>
        ))}
      </select>

      {selected === 'Custom' && (
        <input
          className="mb-2"
          placeholder="Custom endpoint URL"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
        />
      )}

      <textarea
        rows={6}
        placeholder="Enter federated SPARQL query..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex gap-2 mt-2 flex-wrap">
        <button onClick={runFederatedQuery}>Run Query</button>
        <button onClick={downloadCSV}>⬇️ Download CSV</button>
        <button onClick={insertPrefixes}>✨ Autocomplete Prefixes</button>
        <button onClick={addAllToGraph}>➕ Add All to Graph</button>
      </div>

      <button
        className="text-sm text-blue-300 mt-2 underline"
        onClick={() => setQuery('SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10')}
      >
        Load example query
      </button>

      {bindings.length > 0 && (
        <div className="mt-4 overflow-auto text-sm text-white">
          <p className="text-xs text-green-500 mb-1">
            ✅ Results from: <strong>{selected}</strong> ({endpoint})
          </p>
          <table className="table-auto w-full border-collapse border border-gray-600">
            <thead className="bg-[#111] text-blue-300">
              <tr>
                {Object.keys(bindings[0]).map((col) => (
                  <th key={col} className="border border-gray-600 px-2 py-1">{col}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bindings.map((row, i) => (
                <tr key={i} className="hover:bg-gray-800">
                  {Object.keys(row).map((col) => (
                    <td key={col} className="border border-gray-600 px-2 py-1">
                      {row[col].value}
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    <button
                      className="text-blue-400 hover:underline"
                      onClick={() => addToGraph(row)}
                    >
                      Add to Graph
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
