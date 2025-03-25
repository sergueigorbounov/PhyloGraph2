import { useState } from 'react';
import { api } from '../api/api';

export default function NLQPanel() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');

  const askQuestion = async () => {
    try {
      const res = await api.post('/ask', { query: question });
      setResponse(res.data.parsed_query);
    } catch (err) {
      setResponse('Error: ' + err.message);
    }
  };

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h3>🧠 Natural Language Ask</h3>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="e.g. Which genes are associated with drought?"
        style={{ width: '100%', padding: '0.5rem', fontSize: '1em' }}
      />
      <button onClick={askQuestion}>Ask</button>
      <pre style={{ marginTop: '1rem' }}>{response}</pre>
    </div>
  );
}
