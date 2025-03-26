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
    <div className="flex flex-col gap-4 p-6 rounded-xl border border-neutral-700 bg-[#121212] text-white shadow-inner">
      <h2 className="text-lg font-semibold">Natural Language Query (NLQ)</h2>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g. genes related to flowering time in rice"
        className="w-full px-4 py-2 rounded-md bg-neutral-900 text-white border border-neutral-700 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <button
        onClick={runNLQ}
        className="self-start px-4 py-2 rounded-md border border-neutral-600 bg-neutral-800 text-sm text-neutral-200 hover:bg-neutral-700 transition"
      >
        Run NLQ
      </button>

      {result && (
        <pre className="bg-black/30 border border-neutral-800 text-sm p-3 rounded-md max-h-[200px] overflow-y-auto whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
