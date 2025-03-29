import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Download, ExternalLink, FileText, BookOpen, Sparkles } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useLog } from '../hooks/useLog';

export default function NodeModal({ node, onClose, setQueryResults, addNode, addEdge }) {
  const [query, setQuery] = useState(node.query || '');
  const [bindings, setBindings] = useState([]);
  const { addLog } = useLog();

  useEffect(() => {
    addLog(`🧬 Node opened: ${node.label} (${node.id})`);
  }, [node, addLog]);

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
      setQueryResults?.(data.results?.bindings || []);
      toast.success('Query successful');
    } catch {
      toast.error('Query failed');
    }
  };

  const getCitation = () => {
    return `@misc{${node.label.replace(/\s+/g, '')},
  title = {${node.label}},
  author = {INRAE},
  year = {2025},
  url = {${node.id}},
  note = {Generated by PhyloGraph}
}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(node.id);
    toast.success('Copied URI to clipboard!');
  };

  const handleDownloadBib = () => {
    const blob = new Blob([getCitation()], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${node.label.replace(/\s+/g, '_')}.bib`);
  };

  const handleInjectBindings = () => {
    if (!bindings?.length) return;
    bindings.forEach(b => {
      const s = b.s?.value;
      const o = b.o?.value;
      const p = b.p?.value || 'linkedTo';
      if (s) addNode(s, s.split('/').pop());
      if (o) addNode(o, o.split('/').pop());
      if (s && o) addEdge(s, p, o);
    });
    toast.success('Bindings injected into graph');
  };

  const isTO = node.id?.includes('/TO_');
  const isGO = node.id?.includes('/GO_');
  const isGene = node.id?.includes('AT');

  const ensemblLink = isGene ? `https://plants.ensembl.org/Multi/Search/Results?q=${node.label}` : null;
  const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/?term=${node.label}`;
  const goLink = isGO ? `https://www.ebi.ac.uk/QuickGO/term/${node.id.split('/').pop()}` : null;
  const toLink = isTO ? `http://browser.agroportal.lirmm.fr/ontologies/TO?p=classes&conceptid=${node.id}` : null;
  const syntLink = isGene ? `https://urgi.versailles.inrae.fr/syntenyviewer?gene=${node.label}` : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full space-y-4 relative text-sm text-gray-800">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Node Info
        </h2>

        <div className="space-y-1">
          <p><strong>Label:</strong> {node.label}</p>
          <p><strong>Type:</strong> {node.type || 'N/A'}</p>
          <p>
            <strong>URI:</strong>{' '}
            <code className="break-all bg-gray-100 px-1 py-0.5 rounded">{node.id}</code>
            <button onClick={handleCopy} className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-800">
              <Copy className="w-4 h-4" />
            </button>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ensemblLink && (
            <a href={ensemblLink} target="_blank" rel="noreferrer" className="btn-link">
              <ExternalLink className="w-4 h-4" /> Ensembl
            </a>
          )}
          {pubmedLink && (
            <a href={pubmedLink} target="_blank" rel="noreferrer" className="btn-link">
              <ExternalLink className="w-4 h-4" /> PubMed
            </a>
          )}
          {goLink && (
            <a href={goLink} target="_blank" rel="noreferrer" className="btn-link">
              <ExternalLink className="w-4 h-4" /> GO Term
            </a>
          )}
          {toLink && (
            <a href={toLink} target="_blank" rel="noreferrer" className="btn-link">
              <ExternalLink className="w-4 h-4" /> TO Term
            </a>
          )}
          {syntLink && (
            <a href={syntLink} target="_blank" rel="noreferrer" className="btn-link">
              <ExternalLink className="w-4 h-4" /> SyntenyViewer
            </a>
          )}
        </div>

        <div className="mt-4 space-x-2">
          <button onClick={handleDownloadBib} className="btn-blue">
            <Download className="w-4 h-4" /> Download Citation (.bib)
          </button>
          <button onClick={() => navigator.clipboard.writeText(getCitation())} className="btn-blue">
            <FileText className="w-4 h-4" /> Copy Citation (BibTeX)
          </button>
          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(node, null, 2))} className="btn-blue">
            <Sparkles className="w-4 h-4" /> Copy JSON
          </button>
        </div>

        <div>
          <textarea
            className="w-full h-28 p-2 border border-gray-300 rounded mt-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={runQuery} className="btn-dark mt-2">Run SPARQL</button>
        </div>

        {bindings.length > 0 && (
          <div className="mt-4">
            <button onClick={handleInjectBindings} className="btn-green mb-2">+ Add All to Graph</button>
            <table className="text-xs w-full border border-collapse">
              <thead>
                <tr>{Object.keys(bindings[0]).map(k => <th key={k} className="border px-1">{k}</th>)}</tr>
              </thead>
              <tbody>
                {bindings.map((b, i) => (
                  <tr key={i} className="odd:bg-gray-100">
                    {Object.keys(b).map(k => (
                      <td key={k} className="border px-1">{b[k]?.value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button onClick={onClose} className="absolute top-2 right-3 text-blue-600 hover:text-blue-800 text-sm">Close</button>
      </div>
    </div>
  );
}
