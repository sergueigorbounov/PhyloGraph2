import { useState } from 'react';
import { api } from '../api/api';

export default function AskPanel() {
  const [question, setQuestion] = useState('');
  const [sparql, setSparql] = useState('');

  const askLLM = async () => {
    try {
      const res = await api.post('/ask', { query: question });
      setSparql(res.data.sparql || res.data.parsed_query || 'No result');
    } catch (err) {
      setSparql('Error: ' + err.message);
    }
  };

  return (
    <div className="panel-wrapper">
      <h2>Ask the LLM (Mistral)</h2>
      <input
        type="text"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="e.g. Show all genes linked to drought"
      />
      <button onClick={askLLM}>Ask</button>
      {sparql && (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#111', padding: '1em', borderRadius: '8px' }}>
          {sparql}
        </pre>
      )}
    </div>
  );
}
