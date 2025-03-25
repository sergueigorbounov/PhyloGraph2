import { useState } from 'react';
import { api } from '../api/api';

export default function SPARQLPanel() {
  const [query, setQuery] = useState('');
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

  return (
    <div className="card">
      <h3>SPARQL Query Panel</h3>
      <textarea
        rows={6}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`PREFIX ex: <http://example.org/>\nSELECT ?s ?p ?o WHERE { ?s ?p ?o }`}
      />
      <button onClick={runQuery}>Run SPARQL</button>

      {error && <pre>{error}</pre>}

      {rows.length > 0 && (
        <div className="sparql-table">
          <table>
            <thead>
              <tr>
                {rows[0].map((col, i) => <th key={i}>{col.startsWith('?') ? col : `?col${i+1}`}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, ri) => (
                <tr key={ri}>
                  {row.map((val, ci) => <td key={ci}>{val}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
