import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { UploadCloud, Download, FileText, XCircle } from 'lucide-react';

export default function ExportPanel() {
  const [file, setFile] = useState(null);
  const [exportType, setExportType] = useState('csv-to-rdf');
  const [previewData, setPreviewData] = useState('');

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      toast.success(`File detected: ${droppedFile.name}`);
    }
  };

  const handleExport = async () => {
    if (!file) return toast.error('No file selected.');
    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.loading('Exporting...', { id: 'export' });
      const res = await fetch(`http://localhost:8000/export/${exportType}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Export failed');

      const ext = exportType.split('-').pop();
      const blob = await res.blob();

      // 🔍 Optional preview logic
      if (ext === 'rdf' || ext === 'sparql' || ext === 'owl') {
        const text = await blob.text();
        setPreviewData(text);
      } else if (ext === 'graph') {
        const json = await blob.text();
        setPreviewData(json);
      } else {
        setPreviewData('');
      }

      // 📦 Download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}.${ext}`;
      a.click();

      toast.success('Export ready!', { id: 'export' });
    } catch (err) {
      toast.error('Export failed', { id: 'export' });
    }
  };

  return (
    <div className="p-6 text-white space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <UploadCloud className="w-5 h-5 text-green-400" />
        Data Export & Conversion
      </h2>

      <select
        value={exportType}
        onChange={(e) => setExportType(e.target.value)}
        className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded text-sm w-full"
      >
        <option value="csv-to-rdf">CSV ➝ RDF (Turtle)</option>
        <option value="ttl-to-graph">TTL ➝ Cytoscape Graph</option>
        <option value="rdf-to-sparql">RDF ➝ SPARQL Preview</option>
        <option value="rdf-to-neo4j">RDF ➝ Neo4j</option>
        <option value="rdf-to-elastic">RDF ➝ ElasticSearch</option>
        <option value="rdf-to-sql">RDF ➝ SQL</option>
        <option value="csv-to-sql">CSV ➝ SQL</option>
        <option value="rdf-to-owl">RDF ➝ OWL Ontology</option>
      </select>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-sm text-zinc-400 bg-zinc-900 text-center hover:border-green-400 transition-all"
      >
        {file ? (
          <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
            <FileText className="w-4 h-4" />
            {file.name}
          </div>
        ) : (
          <div className="opacity-60">Drag & drop your file here</div>
        )}
      </div>

      <button
        onClick={handleExport}
        className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded px-4 py-2 text-sm flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {previewData && (
        <div className="bg-zinc-900 border border-zinc-700 rounded p-4 text-xs text-green-300 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-green-400">🔍 Preview</span>
            <button onClick={() => setPreviewData('')} className="text-red-400 text-xs">
              <XCircle className="inline w-3 h-3 mr-1" />
              Clear
            </button>
          </div>
          {previewData}
        </div>
      )}
    </div>
  );
}
