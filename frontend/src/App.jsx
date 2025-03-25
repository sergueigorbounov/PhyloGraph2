import { useEffect, useState } from 'react';
import SearchBar from './components/SearchBar';
import GraphViewer from './components/GraphViewer';
import RDFDownloader from './components/RDFDownloader';
import SPARQLPanel from './components/SPARQLPanel';
import NLQPanel from './components/NLQPanel';
import AskPanel from './components/AskPanel';
import './App.css';

function App() {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    const demo = [
      {
        gene_id: "AT1G01010",
        gene_label: "Gene1",
        trait_label: "Drought tolerance",
        trait_uri: "http://purl.obolibrary.org/obo/TO_0006001",
        species: "Arabidopsis thaliana"
      },
      {
        gene_id: "AT1G01010",
        gene_label: "Gene1",
        trait_label: "Yield increase",
        trait_uri: "http://purl.obolibrary.org/obo/TO_0000387",
        species: "Arabidopsis thaliana"
      }
    ];

    const startupElements = demo.flatMap(item => ([
      { data: { id: item.gene_id, label: item.gene_label } },
      { data: { id: item.trait_label, label: item.trait_label } },
      { data: { source: item.gene_id, target: item.trait_label, label: 'associatedWith' } }
    ]));

    setElements(startupElements);
  }, []);

  const handleGraphUpdate = (data) => {
    const newElements = data.flatMap(item => ([
      { data: { id: item.gene_id, label: item.gene_label } },
      { data: { id: item.trait_label, label: item.trait_label } },
      { data: { source: item.gene_id, target: item.trait_label, label: 'associatedWith' } }
    ]));
    setElements(prev => [...prev, ...newElements]);
  };

  const handleClearGraph = () => {
    setElements([]);
  };

  return (
    <div className="app">
      {/* Top navigation bar */}
      <nav className="top-menu">
        <div className="top-menu-inner">
          <div className="title-box">
            <h1>🌿 PhyloGraph</h1>
          </div>

          <div className="menu-center">
            <a href="#graph">Graph</a>
            <a href="#rdf">RDF</a>
            <a href="#sparql">SPARQL</a>
            <a href="#ask">LLM (Mistral)</a>
            <a href="#nlq">NLQ</a>
          </div>

          <div className="info-box">
            <p>FAIR Semantic Graph Explorer for Gene-Function-Trait Links in Translational Plant Genomics</p>
            <span>PEPR Agroecology - AgroDiv & BReIF / URGI & CNRGV, INRAE</span>
          </div>
        </div>
      </nav>

      {/* Body layout */}
      <main className="main-content">
        <section className="section full-width">
          <SearchBar onGraphUpdate={handleGraphUpdate} onClearGraph={handleClearGraph} />
        </section>

        <section id="graph" className="section full-width">
          <GraphViewer elements={elements} />
        </section>

        <section id="rdf" className="section full-width">
          <RDFDownloader />
        </section>

        <section id="sparql" className="section full-width">
          <SPARQLPanel />
        </section>

        <section id="ask" className="section full-width">
          <AskPanel />
        </section>

        <section id="nlq" className="section full-width">
          <NLQPanel />
        </section>
      </main>
    </div>
  );
}

export default App;
