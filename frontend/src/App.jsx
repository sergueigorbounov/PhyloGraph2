import { useEffect, useState, useRef } from 'react';
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
import PhyloTree from './components/PhyloTree';
import OrthologSelector from './components/OrthologSelector';

function getSyntenyLink(geneId) {
  if (!geneId) return null;
  return `https://urgi.versailles.inrae.fr/syntenyviewer?gene=${geneId}`;
}

function App() {
  const { logs, setLogs, addLog } = useLog();
  const [elements, setElements] = useState([]);
  const [activePanel, setActivePanel] = useState('graph');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);
  const treeRef = useRef();

  useEffect(() => {
    const stored = localStorage.getItem('activePanel');
    if (stored) setActivePanel(stored);
    loadDemoGraph();
    fetchOrthologGroups();
  }, []);

  useEffect(() => {
    localStorage.setItem('activePanel', activePanel);
  }, [activePanel]);

  useEffect(() => {
    window.treeRef = treeRef.current;
  }, []);

  const handleGraphUpdate = (data) => {
    const newElements = data.flatMap(item => ([
      {
        data: {
          id: item.gene_id,
          label: item.gene_label,
          external_link: getSyntenyLink(item.gene_id) // ✅ ici le lien
        }
      },
      {
        data: {
          id: item.trait_label,
          label: item.trait_label
        }
      },
      {
        data: {
          source: item.gene_id,
          target: item.trait_label,
          label: 'associatedWith'
        }
      }
    ]));
    setElements(prev => [...prev, ...newElements]);
  };
  

  const handleClearGraph = () => {
    setElements([]);
  };

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

    handleGraphUpdate(demo);
    toast.success('Demo graph loaded');
  };

  const fetchOrthologGroups = async () => {
    const query = `PREFIX orth: <http://www.orthology.org/ontology#>
SELECT DISTINCT ?group WHERE {
  ?group a orth:OrthologGroup ;
         orth:hasMember ?gene .
} LIMIT 50
`;

    try {
      const res = await fetch('http://localhost:8000/sparql/federated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, endpoint: 'https://urgi.versailles.inrae.fr/sparql' })
      });

      const data = await res.json();
      const bindings = data.results?.bindings || [];
      const groupUris = bindings.map(b => b.group.value);

      setGroupOptions(groupUris);

      if (groupUris.length > 0) {
        const firstGroup = groupUris[0];
        setSelectedGroupId(firstGroup);
        fetchGroupGenes(firstGroup);
      }
    } catch (err) {
      console.error('Failed to fetch ortholog groups', err);
    }
  };

  const handleGroupSelect = (e) => {
    const groupId = e.target.value;
    setSelectedGroupId(groupId);
    fetchGroupGenes(groupId);
  };

  const fetchGroupGenes = async (groupId) => {
    const query = `PREFIX orth: <http://www.orthology.org/ontology#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT ?gene ?label WHERE {
        <${groupId}> orth:hasMember ?gene .
        ?gene rdfs:label ?label .
      }`;

    try {
      const res = await fetch('http://localhost:8000/sparql/federated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, endpoint: 'https://urgi.versailles.inrae.fr/sparql' })
      });

      const data = await res.json();
      const bindings = data.results?.bindings || [];
      const nodes = bindings.map(b => ({ data: { id: b.gene.value, label: b.label.value } }));
      setElements(nodes);
      toast.success('Ortholog group loaded into graph');
    } catch (err) {
      toast.error('Failed to load ortholog group');
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
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
      const exists = prev.find(e =>
        e.data.source === source &&
        e.data.target === target &&
        e.data.label === label
      );
      if (!exists) {
        return [...prev, { data: { source, target, label } }];
      }
      return prev;
    });
  };

  return (
    <div className="app">
      <nav className="top-menu">
        <div className="top-menu-inner">
          <div className="title-box">
            <h1>PhyloGraph</h1>
          </div>
          <div className="menu-center">
            <OrthologSelector
              onGraphUpdate={handleGraphUpdate}
              onSetGroupId={setSelectedGroupId}
              selectedGroupId={selectedGroupId}
              groupOptions={groupOptions}
            />
            <button onClick={() => setActivePanel('sparql')}>SPARQL</button>
            <button onClick={() => setActivePanel('ask')}>LLM (Mistral)</button>
            <button onClick={() => setActivePanel('nlq')}>NLQ</button>
            <button onClick={() => setActivePanel('federated')}>Federated</button>
          </div>
          <div className="info-box">
            <p>FAIR Semantic Graph Explorer for Gene-Function-Trait Links in Translational Plant Genomics</p>
            <span>PEPR Agroecology – AgroDiv & BReIF / URGI & CNRGV, INRAE</span>
          </div>
        </div>
      </nav>

      <main className="main-content split-layout">
        <div className="left-panel">
          <SearchBar onGraphUpdate={handleGraphUpdate} onClearGraph={handleClearGraph} onLoadDemo={loadDemoGraph} />
          <div className="tree-wrapper" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <PhyloTree
              ref={treeRef}
              groupId={selectedGroupId}
              onNodeClick={(id) => {
                const cy = window.cy;
                if (cy && cy.$(`#${id}`).length) {
                  cy.$(`#${id}`).select();
                  cy.center(cy.$(`#${id}`));
                  cy.animate({ fit: { eles: cy.$(`#${id}`), padding: 80 }, duration: 500 });
                }
              }}
            />
          </div>
          <GraphViewer elements={elements} />
        </div>
        <div className="right-panel bg-[#0c0c0c] h-full overflow-y-auto p-4 space-y-6">
          <AnimatePresence mode="wait">
            {activePanel === 'sparql' && <motion.div key="sparql" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><SPARQLPanel /></motion.div>}
            {activePanel === 'ask' && <motion.div key="ask" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><AskPanel /></motion.div>}
            {activePanel === 'nlq' && <motion.div key="nlq" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><NLQPanel /></motion.div>}
            {activePanel === 'federated' && <motion.div key="federated" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}><FederatedSPARQLPanel addLog={addLog} addNode={addNode} addEdge={addEdge} /></motion.div>}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
