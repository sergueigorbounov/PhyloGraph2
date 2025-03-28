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
import FederatedSPARQLPanel from './components/FederatedSPARQLPanel';
import { useLog } from './hooks/useLog';

function App() {
  const { logs, setLogs, addLog } = useLog();
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

  const addNode = (id, label) => {
    setElements(prev => {
      if (!prev.find(e => e.data.id === id)) {
        return [...prev, { data: { id, label } }];
      }
      return prev;
    });
  };

  const addEdge = (source, label, target) => {
    setElements(prev => {
      const exists = prev.find(e => e.data.source === source && e.data.target === target && e.data.label === label);
      if (!exists) {
        return [...prev, { data: { source, target, label } }];
      }
      return prev;
    });
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
            <h1>PhyloGraph</h1>
          </div>

          <div className="menu-center">
            <button onClick={() => setActivePanel('sparql')}>SPARQL</button>
            <button onClick={() => setActivePanel('ask')}>LLM (Mistral)</button>
            <button onClick={() => setActivePanel('nlq')}>NLQ</button>
            <button onClick={() => setActivePanel('federated')}>Federated</button>

            <div className="relative group">
              <button className="px-3 py-2 hover:bg-[#1a1a1a] rounded-md">Convert ▼</button>
              <div className="absolute top-full left-0 pt-1 z-50">
                <div className="bg-[#111] border border-[#333] rounded-md shadow-lg w-64 flex-col hidden group-hover:flex hover:flex transition-all duration-150">
                  <button onClick={() => setActivePanel('csv-frontend')} className="px-4 py-2 text-left hover:bg-[#222]">CSV ➝ RDF</button>
                  <button onClick={() => setActivePanel('csv-backend')} className="px-4 py-2 text-left hover:bg-[#222]">CSV ➝ RDF (large files)</button>
                  <button onClick={() => setActivePanel('csv-sql')} className="px-4 py-2 text-left hover:bg-[#222]">CSV ➝ SQL</button>
                  <button onClick={() => setActivePanel('sql-rdf')} className="px-4 py-2 text-left hover:bg-[#222]">SQL ➝ RDF</button>
                  <button onClick={() => setActivePanel('csv-neo4j')} className="px-4 py-2 text-left hover:bg-[#222]">CSV ➝ Neo4j</button>
                  <button onClick={() => setActivePanel('ttl-graph')} className="px-4 py-2 text-left hover:bg-[#222]">Turtle ➝ Graph</button>
                  <button onClick={() => setActivePanel('rdf-api-graph')} className="px-4 py-2 text-left hover:bg-[#222]">RDF API ➝ Graph</button>
                  <button onClick={() => setActivePanel('jsonld-rdf')} className="px-4 py-2 text-left hover:bg-[#222]">JSON-LD ➝ RDF</button>
                  <button onClick={() => setActivePanel('rdf-sparql')} className="px-4 py-2 text-left hover:bg-[#222]">RDF ➝ SPARQL</button>
                </div>
              </div>
            </div>
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
          <AnimatePresence mode="wait">
            {activePanel === 'sparql' && <motion.div key="sparql" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><SPARQLPanel /></motion.div>}
            {activePanel === 'ask' && <motion.div key="ask" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><AskPanel /></motion.div>}
            {activePanel === 'nlq' && <motion.div key="nlq" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><NLQPanel /></motion.div>}
            {activePanel === 'federated' && <motion.div key="federated" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><FederatedSPARQLPanel addLog={addLog} addNode={addNode} addEdge={addEdge} /></motion.div>}
            {activePanel === 'csv-frontend' && <motion.div key="csv-frontend" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><CSVToRDFPanel /></motion.div>}
            {activePanel === 'csv-backend' && <motion.div key="csv-backend" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><CSVToRDFPanel backend={true} /></motion.div>}
            <motion.div key="logs" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
              <div className="log-panel bg-[#111] border border-[#333] rounded p-3 text-xs text-gray-300 max-h-48 overflow-y-auto">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-green-400 font-bold">🧾 Logs</h3>
                  <button onClick={() => setLogs([])} className="text-red-400 hover:text-red-300 text-xs">🗑️ Clear Logs</button>
                </div>
                <pre>{logs.join('\n')}</pre>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
