// ✅ PhyloGraph — Dynamic Tree Sync Version (Dedup Fix)
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ExportPanel from './components/ExportPanel';
import OntologyPanel from './components/OntologyPanel';
import SearchBar from './components/SearchBar';
import GraphViewer from './components/GraphViewer';
import SPARQLPanel from './components/SPARQLPanel';
import NLQPanel from './components/NLQPanel';
import AskPanel from './components/AskPanel';
import CSVToRDFPanel from './components/CSVToRDFPanel';
import PhyloTree from './components/PhyloTree';
import OrthologSelector from './components/OrthologSelector';
import BrapiPanel from './components/BrapiPanel';
import FederatedSPARQLPanel from './components/FederatedSPARQLPanel';
import { useLog } from './hooks/useLog';
import './App.css';

const getSyntenyLink = (geneId) =>
  geneId ? `https://urgi.versailles.inrae.fr/syntenyviewer?gene=${geneId}` : null;

export default function App() {
  const { addLog } = useLog();
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
    window.treeRef = treeRef.current;
  }, []);

  useEffect(() => {
    localStorage.setItem('activePanel', activePanel);
  }, [activePanel]);

  const handleGraphUpdate = (data) => {
    setElements((prev) => {
      const newElements = [...prev];
  
      data.forEach((item) => {
        const geneId = item.gene_id;
        const traitLabel = item.trait_label;
  
        const existingNodeIds = new Set(newElements.map(e => e.data.id));
        const existingEdges = new Set(
          newElements
            .filter(e => e.data.source && e.data.target)
            .map(e => `${e.data.source}→${e.data.target}`)
        );
  
        // Gene node
        if (!existingNodeIds.has(geneId)) {
          newElements.push({
            data: {
              id: geneId,
              label: item.gene_label,
              external_link: getSyntenyLink(geneId),
            },
          });
        }
  
        // Trait node
        if (!existingNodeIds.has(traitLabel)) {
          newElements.push({
            data: {
              id: traitLabel,
              label: traitLabel,
            },
          });
        }
  
        // Edge
        const edgeKey = `${geneId}→${traitLabel}`;
        if (!existingEdges.has(edgeKey)) {
          newElements.push({
            data: {
              source: geneId,
              target: traitLabel,
              label: 'associatedWith',
            },
          });
        }
      });
  
      return newElements;
    });
  };  

  const detectAndSetOrthologGroup = async (geneId) => {
    const uri = geneId.startsWith('http') ? geneId : `http://example.org/${geneId}`;
    const query = `
      PREFIX orth: <http://www.orthology.org/ontology#>
      SELECT ?group WHERE {
        ?group orth:hasMember <${uri}> .
      } LIMIT 1
    `;
    try {
      const res = await fetch('http://localhost:8000/sparql/federated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          endpoint: 'https://urgi.versailles.inrae.fr/sparql',
        }),
      });
      const data = await res.json();
      const groupUri = data.results?.bindings?.[0]?.group?.value;
      if (groupUri) {
        setSelectedGroupId(groupUri);
        fetchGroupGenes(groupUri);
        toast.success(`🌳 Tree synced to group from ${geneId}`);
      }
    } catch (err) {
      console.warn('Group fetch failed', err);
    }
  };

  const handleClearGraph = () => setElements([]);

  const loadDemoGraph = () => {
    const demo = [
      {
        gene_id: 'AT1G01010',
        gene_label: 'Gene1',
        trait_label: 'Drought tolerance',
        trait_uri: 'http://purl.obolibrary.org/obo/TO_0006001',
        species: 'Arabidopsis thaliana',
      },
      {
        gene_id: 'AT1G01010',
        gene_label: 'Gene1',
        trait_label: 'Yield increase',
        trait_uri: 'http://purl.obolibrary.org/obo/TO_0000387',
        species: 'Arabidopsis thaliana',
      },
    ];
    handleGraphUpdate(demo);
    toast.success('Demo graph loaded');
  };

  const fetchOrthologGroups = async () => {
    const query = `PREFIX orth: <http://www.orthology.org/ontology#>
      SELECT DISTINCT ?group WHERE {
        ?group a orth:OrthologGroup ; orth:hasMember ?gene .
      } LIMIT 50`;

    try {
      const res = await fetch('http://localhost:8000/sparql/federated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          endpoint: 'https://urgi.versailles.inrae.fr/sparql',
        }),
      });

      const data = await res.json();
      const bindings = data.results?.bindings || [];
      const groupUris = bindings.map((b) => b.group.value);
      const final =
        groupUris.length > 0
          ? groupUris
          : [
              'http://example.org/group/DemoOrtholog1',
              'http://example.org/group/DemoOrtholog2',
            ];

      setGroupOptions(final);
      setSelectedGroupId(final[0]);
      fetchGroupGenes(final[0]);
    } catch (err) {
      console.error('SPARQL group fetch error:', err);
    }
  };

  const fetchGroupGenes = async (groupId) => {
    const query = `PREFIX orth: <http://www.orthology.org/ontology#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT ?gene ?label WHERE {
        <${groupId}> orth:hasMember ?gene .
        OPTIONAL { ?gene rdfs:label ?label }
      }`;

    try {
      const res = await fetch('http://localhost:8000/sparql/federated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          endpoint: 'https://urgi.versailles.inrae.fr/sparql',
        }),
      });
      const data = await res.json();
      const bindings = data.results?.bindings || [];
      const nodes = bindings.map((b) => ({
        gene_id: b.gene.value.split('/').pop(),
        gene_label: b.label?.value || b.gene.value.split('/').pop(),
        trait_label: 'Ortholog Member',
        trait_uri: 'http://example.org/trait/ortholog',
        species: 'Triticum aestivum',
      }));
      handleGraphUpdate(nodes);
    } catch (err) {
      toast.error('Failed to load ortholog group');
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="app">
      <nav className="top-menu">
        <div className="top-menu-inner">
          <div className="title-box">
            <h1>PhyloGraph</h1>
          </div>
          <div className="menu-center flex items-center gap-4">
            <button onClick={() => setActivePanel('tree')}>Tree</button>
            <button onClick={() => setActivePanel('sparql')}>SPARQL</button>
            <button onClick={() => setActivePanel('brapi')}>BrAPI</button>
            <button onClick={() => setActivePanel('ontology')}>Ontology</button>
            <button onClick={() => setActivePanel('export')}>Convert</button>
            <button onClick={() => setActivePanel('nlq')}>NLQ (Mistral)</button>
          </div>
          <div className="info-box">
            <p>FAIR Semantic Graph Explorer for Gene-Function-Trait Links</p>
            <span>AgroDiv & BReIF / URGI & CNRGV, INRAE</span>
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

        <div className="right-panel bg-black h-full overflow-y-auto p-4 space-y-6">
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
            {activePanel === 'federated' && (
              <motion.div key="federated" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
                <FederatedSPARQLPanel addLog={addLog} addNode={(id, label) => setElements((e) => [...e, { data: { id, label } }])} addEdge={(s, l, t) => setElements((e) => [...e, { data: { source: s, label: l, target: t } }])} />
              </motion.div>
            )}
            {activePanel === 'brapi' && (
              <motion.div key="brapi" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
                <BrapiPanel addLog={addLog} />
              </motion.div>
            )}
            {activePanel === 'tree' && (
              <motion.div key="tree" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
                <OrthologSelector onGraphUpdate={handleGraphUpdate} onSetGroupId={setSelectedGroupId} selectedGroupId={selectedGroupId} groupOptions={groupOptions} />
                <PhyloTree ref={treeRef} groupId={selectedGroupId} onNodeClick={(id) => {
                  const cy = window.cy;
                  if (cy && cy.$(`#${id}`).length) {
                    cy.$(`#${id}`).select();
                    cy.center(cy.$(`#${id}`));
                    cy.animate({
                      fit: { eles: cy.$(`#${id}`), padding: 80 },
                      duration: 500,
                    });
                  }
                }} />
              </motion.div>
            )}
            {activePanel === 'export' && (
              <motion.div key="export" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
                <ExportPanel />
              </motion.div>
            )}
            {activePanel === 'ontology' && (
              <motion.div key="ontology" initial="hidden" animate="visible" exit="exit" variants={panelVariants} transition={{ duration: 0.4 }}>
                <OntologyPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
