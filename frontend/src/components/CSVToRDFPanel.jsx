import { useState } from 'react';
import Papa from 'papaparse';
import { DataFactory, Writer } from 'n3';
import { Save } from 'lucide-react';
import { saveAs } from 'file-saver';

const { namedNode, literal } = DataFactory;

export default function CSVToRDFPanel() {
  const [rdfText, setRdfText] = useState('');
  const [filename, setFilename] = useState('converted.ttl');

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.csv')) return;

    setFilename(file.name.replace('.csv', '.ttl'));

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const triples = [];
        const writer = new Writer({ prefixes: {
          '': 'http://example.org/',
          to: 'http://purl.obolibrary.org/obo/TO_',
          rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
        } });

        result.data.forEach((row) => {
          const geneUri = namedNode(`http://example.org/${row.gene_id}`);
          triples.push({ subject: geneUri, predicate: namedNode('rdf:type'), object: namedNode('http://example.org/Gene') });
          triples.push({ subject: geneUri, predicate: namedNode('rdfs:label'), object: literal(row.gene_label) });
          triples.push({ subject: geneUri, predicate: namedNode('http://example.org/associatedWith'), object: namedNode(row.trait_uri) });
          triples.push({ subject: geneUri, predicate: namedNode('http://example.org/species'), object: literal(row.species) });
        });

        triples.forEach(t => writer.addQuad(t.subject, t.predicate, t.object));
        writer.end((error, result) => setRdfText(result));
      }
    });
  };

  const handleDownload = () => {
    const blob = new Blob([rdfText], { type: 'text/turtle' });
    saveAs(blob, filename);
  };

  return (
    <div className="flex flex-col gap-4 p-6 rounded-xl border border-neutral-700 bg-[#121212] text-white shadow-inner h-full overflow-y-auto">
      <h2 className="text-lg font-semibold">📂 CSV ➝ RDF Turtle</h2>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border border-dashed border-neutral-600 rounded-lg p-10 text-center bg-neutral-900 hover:border-neutral-400 transition cursor-pointer"
      >
        <p className="text-neutral-400">Drag & drop your <strong>.csv</strong> file here</p>
        <p className="text-xs text-neutral-600 mt-1">Expected columns: gene_id, gene_label, trait_label, trait_uri, species</p>
      </div>

      {rdfText && (
        <>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 self-start"
          >
            <Save size={16} /> Download Turtle
          </button>

          <pre className="bg-black/30 border border-neutral-700 text-sm p-3 rounded-md max-h-[300px] overflow-auto whitespace-pre-wrap">
            {rdfText}
          </pre>
        </>
      )}
    </div>
  );
}
