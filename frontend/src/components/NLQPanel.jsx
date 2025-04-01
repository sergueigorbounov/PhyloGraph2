import { useState } from 'react';
import { api } from '../api/api';

export default function NLQPanel() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const runNLQ = async () => {
    try {
      const res = await api.post('/nlq', { query: input });
      setResult(res.data.result || res.data.error);
    } catch (err) {
      setResult('Error: ' + err.message);
    }
  };

  return (
    <div className="bg-black text-white rounded-lg shadow p-4 space-y-4">
      <h2 className="text-lg font-semibold text-accent">Natural Language Query</h2>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g. genes related to flowering time in rice"
        className="w-full px-3 py-2 text-sm rounded-md bg-zinc-900 border border-zinc-700 placeholder:text-zinc-500 focus:outline-none focus:ring focus:ring-accent"
      />

      <button
        onClick={runNLQ}
        className="px-4 py-2 text-sm rounded-md bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 transition"
      >
        Run NLQ
      </button>

      {result && (
        <pre className="bg-zinc-950 text-sm p-3 rounded-md max-h-[200px] overflow-y-auto whitespace-pre-wrap font-mono">
          {result}
        </pre>
      )}
    </div>
  );
}
