import { useState } from 'react';
import { api } from '../api/api';
import RDFDownloader from './RDFDownloader';
import './SearchBar.css';

export default function SearchBar({ onGraphUpdate, onClearGraph }) {
  const [gene, setGene] = useState('');

  const handleSubmit = async () => {
    if (!gene.trim()) return;

    const payload = [{
      gene_id: gene,
      gene_label: "Gene Label",
      trait_label: "Height",
      trait_uri: "http://purl.obolibrary.org/obo/TO_0000207",
      species: "Zea mays"
    }];
    
    try {
      const res = await api.post('/graph', payload);
      console.log(res.data);
      onGraphUpdate(payload);
      setGene('');
    } catch (err) {
      console.error("Failed to add gene to graph:", err);
    }
  };

  return (
    <div className="searchbar-wrapper">
      <input
        type="text"
        placeholder="Enter Gene ID"
        value={gene}
        onChange={(e) => setGene(e.target.value)}
      />
      <button onClick={handleSubmit}>Add to Graph</button>
      <button onClick={onClearGraph} className="clear-btn">Clear Graph</button>
      <RDFDownloader />
    </div>
  );
}
