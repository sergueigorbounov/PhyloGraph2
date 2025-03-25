import { useState } from 'react';
import { api } from '../api/api';

export default function AskPanel() {
  const [question, setQuestion] = useState('');
  const [sparql, setSparql] = useState('');

  const askLLM = async () => {
    const res = await api.post('/ask', { query: question });
    setSparql(res.data.sparql || res.data.error);
  };

  return (
    <div className="card">
      <h3>🧠 Natural Language Ask</h3>
      <input
        type="text"
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="e.g. Show all genes linked to drought"
        style={{ width: '100%' }}
      />
      <button onClick={askLLM}>Ask</button>
      <pre>{sparql}</pre>
    </div>
  );
}
