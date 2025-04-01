// Clean SPARQLPanel with Monaco, Wikidata, Local, and SyntenyViewer support
// Includes: endpoint logging, error fallback, SyntenyViewer presets

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Play, ClipboardCopy, Plus, Eye } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import Editor from '@monaco-editor/react';

const ENDPOINTS = {
  Local: '',
  Wikidata: 'https://query.wikidata.org/sparql',
  SyntenyViewer: 'https://urgi.versailles.inrae.fr/sparql'
};

const QUERY_TEMPLATES = [
  {
    label: 'All triples',
    query: 'SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10'
  },
  {
    label: 'SyntenyViewer: All genes',
    query: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nSELECT ?gene WHERE { ?gene rdf:type ?type } LIMIT 10'
  },
  {
    label: 'SyntenyViewer: Gene positions',
    query: 'PREFIX obo: <http://purl.obolibrary.org/obo/>\nSELECT ?gene ?start ?end WHERE { ?gene obo:SO_start ?start ; obo:SO_end ?end } LIMIT 10'
  }
];

const shortLabel = (val) => !val ? '' : (!val.startsWith('http') ? val : val.split('/').pop().split('#').pop());
const getNodeColor = (id, type = '') => type === 'literal' ? '#facc15' : id.includes('/GO_') ? '#3b82f6' : id.includes('/TO_') ? '#22c55e' : '#e2e8f0';

export default function SPARQLPanel({ addLog }) {
  const [query, setQuery] = useState(localStorage.getItem('sparqlQuery') || QUERY_TEMPLATES[0].query);
  const [rows, setRows] = useState([]);
  const [endpointKey, setEndpointKey] = useState('Local');
  const [error, setError] = useState('');
  const [showJson, setShowJson] = useState(false);

  const endpoint = ENDPOINTS[endpointKey];

  useEffect(() => {
    localStorage.setItem('sparqlQuery', query);
  }, [query]);

  const runQuery = async () => {
    setError('');
    const url = endpointKey === 'Local' ? 'http://localhost:8000/sparql' : 'http://localhost:8000/sparql/federated';
    toast.loading(`Querying ${endpointKey}...`, { id: 'query' });
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, endpoint })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRows(data.results?.bindings || []);
      toast.success(`✅ ${data.results?.bindings?.length || 0} results`, { id: 'query' });
      addLog?.(`🔍 ${data.results?.bindings?.length} rows from ${endpointKey}`);
    } catch (err) {
      toast.error(`${endpointKey} failed`, { id: 'query' });
      setError(err.message);
      addLog?.(`${endpointKey} error: ${err.message}`);
    }
  };

  const addTripleToGraph = (row) => {
    const s = row.s?.value;
    const p = row.p?.value;
    const o = row.o?.value;
    const oType = row.o?.type;
    const cy = window.cy;
    if (!cy || !s || !p || !o) return;
    if (!cy.getElementById(s).length) cy.add({ group: 'nodes', data: { id: s, label: shortLabel(s), color: getNodeColor(s) } });
    if (!cy.getElementById(o).length) cy.add({ group: 'nodes', data: { id: o, label: shortLabel(o), color: getNodeColor(o, oType), ...(oType === 'literal' && { type: 'literal' }) } });
    const eid = `${s}-${p}-${o}`;
    if (!cy.getElementById(eid).length) cy.add({ group: 'edges', data: { id: eid, source: s, target: o, label: shortLabel(p) } });
  };

  const addAllToGraph = () => {
    const cy = window.cy;
    rows.forEach(addTripleToGraph);
    setTimeout(() => {
      cy?.layout({ name: 'fcose', animate: true }).run();
      cy?.fit();
    }, 300);
    toast.success('📈 Added all to graph');
  };

  return (
    <div className="flex flex-col gap-4 p-6 text-white max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center gap-2">SPARQL Panel</h2>
        <Tippy content="Toggle JSON view"><button onClick={() => setShowJson(v => !v)}><Eye /></button></Tippy>
      </div>

      <label className="text-sm">Endpoint</label>
      <select
        className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded"
        value={endpointKey}
        onChange={e => {
          const newKey = e.target.value;
          setEndpointKey(newKey);
          toast.success(`Switched to ${newKey}`);
          addLog?.(`Switched to ${newKey}`);
        }}>
        {Object.keys(ENDPOINTS).map(key => <option key={key}>{key}</option>)}
      </select>

      <label className="text-sm">Templates</label>
      <select onChange={(e) => setQuery(e.target.value)} className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded">
        {QUERY_TEMPLATES.map((t, i) => <option key={i} value={t.query}>{t.label}</option>)}
      </select>

      <Editor
        height="200px"
        theme="vs-dark"
        defaultLanguage="sparql"
        value={query}
        onChange={val => setQuery(val)}
        options={{ fontSize: 13, minimap: { enabled: false }, wordWrap: 'on', lineNumbers: 'on' }}
      />

      <div className="flex flex-wrap gap-2">
        <button onClick={runQuery} className="btn-dark"><Play /> Run</button>
        <button onClick={() => navigator.clipboard.writeText(query)} className="btn-dark"><ClipboardCopy /> Copy</button>
        {rows.length > 0 && <button onClick={addAllToGraph} className="btn-dark"><Plus /> Add All to Graph</button>}
      </div>

      <div className="text-xs text-zinc-400 mt-2"><strong>Legend:</strong> 🟢 TO Term, 🔵 GO Term, 🟡 Literal, ⚪ Other</div>
      {error && <pre className="text-red-400 mt-2 text-sm">{error}</pre>}

      {rows.length > 0 && (
        showJson ? (
          <pre className="bg-zinc-900 p-3 rounded text-sm text-green-300 overflow-auto max-h-[300px]">{JSON.stringify(rows, null, 2)}</pre>
        ) : (
          <table className="text-sm border mt-4">
            <thead><tr>{Object.keys(rows[0]).map((k, i) => <th key={i} className="px-2 text-zinc-400">{k}</th>)}<th>Actions</th></tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={i}>{Object.entries(r).map(([k, v], j) => <td key={j} className="px-2">{v.value}</td>)}<td><button onClick={() => addTripleToGraph(r)} className="text-blue-400 hover:underline">Add</button></td></tr>
            ))}</tbody>
          </table>
        )
      )}
    </div>
  );
}
