import { useState } from 'react';
import { api } from '../api/api';
import { Play, ClipboardCopy, Download } from 'lucide-react';

const queryTemplates = [
  {
    label: 'All triples',
    query: `SELECT ?s ?p ?o WHERE { ?s ?p ?o }`
  },
  {
    label: 'Genes and Traits',
    query: `SELECT ?gene ?trait WHERE { ?gene :associatedWith ?trait }`
  },
  {
    label: 'All Genes',
    query: `PREFIX : <http://example.org/>\nSELECT ?g WHERE { ?g a :Gene }`
  }
];

export default function SPARQLPanel() {
  const [query, setQuery] = useState(queryTemplates[0].query);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const runQuery = async () => {
    try {
      const res = await api.post('/sparql', { query });
      if (res.data.error) {
        setError(res.data.error);
        setRows([]);
      } else {
        const lines = res.data.trim().split('\n');
        const parsed = lines.map(line => line.split(' | '));
        setRows(parsed);
        setError('');
      }
    } catch (err) {
      setError('Error: ' + err.message);
      setRows([]);
    }
  };

  const copyResults = () => {
    const csv = rows.map(r => r.join('\t')).join('\n');
    navigator.clipboard.writeText(csv);
  };

  const downloadCSV = () => {
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sparql-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 p-6 rounded-xl border border-neutral-700 bg-[#121212] text-white shadow-inner h-full overflow-y-auto">
      <h2 className="text-lg font-semibold">SPARQL Query Panel</h2>

      <select
        className="bg-neutral-900 border border-neutral-700 px-3 py-2 rounded-md text-sm"
        onChange={(e) => setQuery(e.target.value)}
        value={query}
      >
        {queryTemplates.map((q, i) => (
          <option key={i} value={q.query}>
            {q.label}
          </option>
        ))}
      </select>

      <textarea
        rows={6}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-3 text-sm font-mono text-white"
      />

      <div className="flex gap-2">
        <button
          onClick={runQuery}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-neutral-600 bg-neutral-800 hover:bg-neutral-700"
        >
          <Play size={16} /> Run SPARQL
        </button>
        <button
          onClick={copyResults}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-neutral-600 bg-neutral-800 hover:bg-neutral-700"
        >
          <ClipboardCopy size={16} /> Copy
        </button>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-neutral-600 bg-neutral-800 hover:bg-neutral-700"
        >
          <Download size={16} /> CSV
        </button>
      </div>

      {error && (
        <pre className="bg-red-900 text-red-300 p-3 rounded-md text-sm">{error}</pre>
      )}

      {rows.length > 1 && (
        <div className="overflow-auto border border-neutral-700 rounded-md">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="bg-neutral-800 text-neutral-300">
                {rows[0].map((col, i) => (
                  <th key={i} className="px-3 py-2 border-b border-neutral-700">
                    {col || `?col${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri} className="hover:bg-neutral-800">
                  {row.map((val, ci) => (
                    <td key={ci} className="px-3 py-2 border-b border-neutral-800 text-neutral-200">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
