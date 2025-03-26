import { useEffect, useState } from 'react';
import { Download, Search, RefreshCcw } from 'lucide-react';
import SearchBar from './components/SearchBar';
import GraphViewer from './components/GraphViewer';
import RDFDownloader from './components/RDFDownloader';
import SPARQLPanel from './components/SPARQLPanel';
import NLQPanel from './components/NLQPanel';
import AskPanel from './components/AskPanel';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { Toaster, toast } from 'react-hot-toast';
import CSVToRDFPanel from './components/CSVToRDFPanel';

function App() {
  const [elements, setElements] = useState([]);
  const [activePanel, setActivePanel] = useState('graph');

  useEffect(() => {
    const stored = localStorage.getItem('activePanel');
    if (stored) setActivePanel(stored);
    loadDemoGraph();
  }, []);

  useEffect(() => {
    localStorage.setItem('activePanel', activePanel);
  }, [activePanel]);

  const loadDemoGraph = () => {
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

    const demoElements = demo.flatMap(item => ([
      { data: { id: item.gene_id, label: item.gene_label } },
      { data: { id: item.trait_label, label: item.trait_label } },
      { data: { source: item.gene_id, target: item.trait_label, label: 'associatedWith' } }
    ]));

    setElements(demoElements);
    toast.success('Demo graph loaded');
  };

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

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="app">
      <nav className="top-menu">
        <div className="top-menu-inner">
          <div className="title-box">
            <h1>🌿 PhyloGraph</h1>
          </div>

          <div className="menu-center">
            <button onClick={() => setActivePanel('sparql')}>SPARQL</button>
            <button onClick={() => setActivePanel('ask')}>LLM (Mistral)</button>
            <button onClick={() => setActivePanel('nlq')}>NLQ</button>
            <button onClick={() => setActivePanel('csv')}>CSV ➝ RDF</button>
          </div>

          <div className="info-box">
            <p>FAIR Semantic Graph Explorer for Gene-Function-Trait Links in Translational Plant Genomics</p>
            <span>PEPR Agroecology – AgroDiv & BReIF / URGI & CNRGV, INRAE</span>
          </div>
        </div>
      </nav>

      <main className="main-content split-layout">
  <div className="left-panel">
    <SearchBar
      onGraphUpdate={handleGraphUpdate}
      onClearGraph={handleClearGraph}
      onLoadDemo={loadDemoGraph}
    />
    <GraphViewer elements={elements} />
  </div>

  <div className="right-panel bg-[#0c0c0c] h-full overflow-y-auto p-4 space-y-6">
  {/* Panels inside here will scroll independently */}

    <AnimatePresence mode="wait">
      {activePanel === 'sparql' && (
        <motion.div key="sparql" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
          <SPARQLPanel />
        </motion.div>
      )}
      {activePanel === 'ask' && (
        <motion.div key="ask" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
          <AskPanel />
        </motion.div>
      )}
      {activePanel === 'nlq' && (
        <motion.div key="nlq" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
          <NLQPanel />
        </motion.div>
      )}
      {activePanel === 'csv' && (
  <motion.div key="csv" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
          
    <CSVToRDFPanel />
  </motion.div>
)}
    </AnimatePresence>
  </div>
</main>



    </div>
  );
}

export default App;
