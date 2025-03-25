import { api } from '../api/api';

export default function RDFDownloader() {
  const handleDownload = async () => {
    try {
      const res = await api.get('/rdf');
      const blob = new Blob([res.data], { type: 'text/turtle' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'phylograph.ttl';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("RDF export failed:", error);
    }
  };

  return (
    <button onClick={handleDownload}>
      Export RDF (Turtle Format)
    </button>
  );
}
