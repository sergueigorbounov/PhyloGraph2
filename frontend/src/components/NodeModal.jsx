// 📁 components/NodeModal.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function NodeModal({ node, onClose, setQueryResults }) {
  const [query, setQuery] = useState(node.query);
  const [bindings, setBindings] = useState([]);

  const runQuery = async () => {
    try {
      const res = await fetch('http://localhost:8000/sparql/federated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, endpoint: node.endpoint })
      });
      const data = await res.json();
      if (data.error) return toast.error(data.error);
      setBindings(data.results?.bindings || []);
      setQueryResults(data.results?.bindings || []);
      toast.success('Query successful');
    } catch (err) {
      toast.error('Query failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="bg-white text-black p-4 rounded-lg w-full max-w-2xl shadow-lg">
        <h2 className="text-lg font-bold mb-2">Node Info</h2>
        <p><strong>Label:</strong> {node.label}</p>
        <p><strong>Type:</strong> {node.type}</p>
        <p><strong>URI:</strong> <code className="text-xs break-all">{node.id}</code></p>

        <textarea
          className="w-full h-32 mt-4 p-2 border border-gray-300 rounded"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={runQuery}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >Run SPARQL</button>

        {bindings.length > 0 && (
          <div className="mt-4 text-sm">
            <table className="w-full border text-xs">
              <thead>
                <tr>
                  {Object.keys(bindings[0]).map(k => <th key={k} className="border px-1 py-0.5">{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {bindings.map((row, i) => (
                  <tr key={i} className="odd:bg-gray-100">
                    {Object.keys(row).map(k => (
                      <td key={k} className="border px-1 py-0.5">{row[k]?.value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 text-sm underline text-blue-600 hover:text-blue-800"
        >Close</button>
      </div>
    </div>
  );
}
