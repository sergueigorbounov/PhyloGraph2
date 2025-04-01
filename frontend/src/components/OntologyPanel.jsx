// ✅ OntologyPanel.jsx – BrAPI-style Panel with Dynamic Terms, RDF Preview, Auto-Color by Ontology
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Search, PlusCircle, Download, ExternalLink, FileText } from 'lucide-react';

const TO_TERMS = [
  { label: 'Drought tolerance', id: 'http://purl.obolibrary.org/obo/TO_0006001' },
  { label: 'Yield increase', id: 'http://purl.obolibrary.org/obo/TO_0000387' },
  { label: 'Root biomass', id: 'http://purl.obolibrary.org/obo/TO_0000529' },
  { label: 'Plant height', id: 'http://purl.obolibrary.org/obo/TO_0000207' }
];

const PO_TERMS = [
  { label: 'Leaf length', id: 'http://purl.obolibrary.org/obo/PO_0001237' },
  { label: 'Root system', id: 'http://purl.obolibrary.org/obo/PO_0020127' },
  { label: 'Shoot system', id: 'http://purl.obolibrary.org/obo/PO_0009006' },
  { label: 'Flower development', id: 'http://purl.obolibrary.org/obo/PO_0007616' }
];

const GO_TERMS = [
  { label: 'Photosynthesis', id: 'http://purl.obolibrary.org/obo/GO_0015979' },
  { label: 'DNA repair', id: 'http://purl.obolibrary.org/obo/GO_0006281' },
  { label: 'Protein transport', id: 'http://purl.obolibrary.org/obo/GO_0015031' },
  { label: 'Cell cycle', id: 'http://purl.obolibrary.org/obo/GO_0007049' }
];

const TERM_SETS = { TO: TO_TERMS, PO: PO_TERMS, GO: GO_TERMS };

export default function OntologyPanel({ addLog }) {
  const [ontology, setOntology] = useState('TO');
  const [term, setTerm] = useState('');
  const [customUri, setCustomUri] = useState('');
  const [results, setResults] = useState([]);
  const [selectedRDF, setSelectedRDF] = useState('');

  const terms = (TERM_SETS[ontology] || []).concat([{ label: 'Other...', id: 'custom' }]);
  const selectedTerms = terms.filter((t) => term === t.label);

  const getColor = (ont) => {
    if (ont === 'PO') return '#fde047';
    if (ont === 'GO') return '#60a5fa';
    return '#86efac';
  };

  const handleAdd = (t) => {
    const cy = window.cy;
    if (!cy || !t.id) return;
    if (!cy.getElementById(t.id).length) {
      cy.add({
        group: 'nodes',
        data: {
          id: t.id,
          label: t.label,
          type: 'trait',
          color: getColor(ontology),
          external_link: t.id
        }
      });
      cy.layout({ name: 'fcose', animate: true }).run();
      cy.fit();
    }
    setResults((r) => [...r, t]);
    toast.success(`Injected ${t.label}`);
    addLog?.(`🧠 Ontology term injected: ${t.label}`);
  };

  const addAll = () => {
    selectedTerms.forEach(handleAdd);
    toast.success(`Added ${selectedTerms.length} terms to graph`);
  };

  const generateRDF = (t) => `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n\n<${t.id}> a <http://purl.obolibrary.org/obo/${ontology}_Trait> ;\n  rdfs:label \"${t.label}\" .`;

  const downloadRDF = (t) => {
    const ttl = generateRDF(t);
    const blob = new Blob([ttl], { type: 'text/turtle' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${t.label}.ttl`;
    a.click();
    toast.success(`Downloaded RDF for ${t.label}`);
  };

  return (
    <div className="p-6 text-white flex flex-col gap-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Search /> Ontology Term Search</h2>

      <div className="flex gap-2">
        <select
          value={ontology}
          onChange={(e) => setOntology(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 px-2 py-2 rounded text-sm"
        >
          <option value="TO">TO</option>
          <option value="PO">PO</option>
          <option value="GO">GO</option>
        </select>

        <select
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded w-full text-sm"
        >
          <option value="">— Select Term —</option>
          {terms.map((opt, i) => (
            <option key={i} value={opt.label}>{opt.label}</option>
          ))}
        </select>

        <button onClick={addAll} className="btn-dark px-3 py-2"><PlusCircle size={16} /></button>
      </div>

      {term === 'Other...' && (
        <input
          type="text"
          value={customUri}
          onChange={(e) => setCustomUri(e.target.value)}
          placeholder="Enter custom URI"
          className="bg-zinc-900 border border-zinc-700 px-3 py-2 rounded text-sm"
        />
      )}

      {results.length > 0 && (
        <>
          <div className="text-sm mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {results.map((t, i) => (
              <div key={i} className="bg-zinc-800 p-3 rounded">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-green-300">{t.label}</div>
                  <span className="text-xs bg-zinc-700 text-white px-2 py-0.5 rounded-full">{ontology}</span>
                </div>
                <div className="text-xs text-zinc-400">URI: {t.id}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleAdd(t)} className="btn-dark text-xs"><PlusCircle size={16} /> Add</button>
                  <button onClick={() => downloadRDF(t)} className="btn-dark text-xs"><Download size={16} /> RDF</button>
                  <button onClick={() => setSelectedRDF(generateRDF(t))} className="btn-dark text-xs"><FileText size={16} /> Preview</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedRDF && (
        <div className="bg-zinc-800 text-xs p-4 mt-4 rounded border border-zinc-700 whitespace-pre-wrap">
          <div className="flex justify-between mb-2">
            <div className="text-green-400 font-semibold">🔎 RDF Preview</div>
            <button onClick={() => setSelectedRDF('')} className="text-red-400 text-xs">✖ Close</button>
          </div>
          {selectedRDF}
        </div>
      )}
    </div>
  );
}
