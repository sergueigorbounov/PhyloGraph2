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
import PhyloTree from './components/PhyloTree';
import OrthologSelector from './components/OrthologSelector';
import BrapiPanel from './components/BrapiPanel';
import FederatedSPARQLPanel from './components/FederatedSPARQLPanel';
import { useLog } from './hooks/useLog';
import './App.css';

const FALLBACK_GROUP = 'http://example.org/group/DemoOrtholog1';
const FALLBACK_GENES = [
  {
    gene_id: 'FallbackGene1',
    gene_label: 'FallbackGene1',
    trait_label: 'Ortholog Member',
    trait_uri: 'http://example.org/trait/ortholog',
    species: 'Zea mays',
  },
  {
    gene_id: 'FallbackGene2',
    gene_label: 'FallbackGene2',
    trait_label: 'Ortholog Member',
    trait_uri: 'http://example.org/trait/ortholog',
    species: 'Zea mays',
  },
];
const getSyntenyLink = (geneId) =>
  geneId ? `https://urgi.versailles.inrae.fr/syntenyviewer?gene=${geneId}` : null;

export default function App() {
  const { addLog } = useLog();
  const [elements, setElements] = useState([]);
  const [activePanel, setActivePanel] = useState('tree');
  const [selectedGroupId, setSelectedGroupId] = useState(FALLBACK_GROUP);
  const [groupOptions, setGroupOptions] = useState([FALLBACK_GROUP]);
  const treeRef = useRef();

  useEffect(() => {
    loadFallbackGraph();
    window.treeRef = treeRef.current;
  }, []);

  const loadFallbackGraph = () => {
    handleGraphUpdate(FALLBACK_GENES);
    toast.success('🌱 Fallback demo graph loaded');
  };

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
        if (!existingNodeIds.has(geneId)) {
          newElements.push({
            data: {
              id: geneId,
              label: item.gene_label,
              external_link: getSyntenyLink(geneId),
            },
          });
        }
        if (!existingNodeIds.has(traitLabel)) {
          newElements.push({ data: { id: traitLabel, label: traitLabel } });
        }
        const edgeKey = `${geneId}→${traitLabel}`;
        if (!existingEdges.has(edgeKey)) {
          newElements.push({
            data: { source: geneId, target: traitLabel, label: 'associatedWith' },
          });
        }
      });
      return newElements;
    });
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const fadeProps = {
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
    variants: panelVariants,
    transition: { duration: 0.4 },
  };

  return (
    <div className="app">
      <nav className="top-menu">
        <div className="top-menu-inner">
          <div className="title-box"><h1>PhyloGraph</h1></div>
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
            onClearGraph={() => setElements([])}
            onLoadDemo={loadFallbackGraph}
          />
          <GraphViewer elements={elements} />
        </div>
        <div className="right-panel bg-black h-full overflow-y-auto p-4 space-y-6">
          <AnimatePresence mode="wait">
            {activePanel === 'sparql' && <motion.div key="sparql" {...fadeProps}><SPARQLPanel /></motion.div>}
            {activePanel === 'ask' && <motion.div key="ask" {...fadeProps}><AskPanel /></motion.div>}
            {activePanel === 'nlq' && <motion.div key="nlq" {...fadeProps}><NLQPanel /></motion.div>}
            {activePanel === 'federated' && <motion.div key="federated" {...fadeProps}><FederatedSPARQLPanel addLog={addLog} /></motion.div>}
            {activePanel === 'brapi' && <motion.div key="brapi" {...fadeProps}><BrapiPanel addLog={addLog} /></motion.div>}
            {activePanel === 'tree' && <motion.div key="tree" {...fadeProps}>
              <OrthologSelector
                onGraphUpdate={handleGraphUpdate}
                onSetGroupId={setSelectedGroupId}
                selectedGroupId={selectedGroupId}
                groupOptions={groupOptions}
              />
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
            </motion.div>}
            {activePanel === 'export' && <motion.div key="export" {...fadeProps}><ExportPanel /></motion.div>}
            {activePanel === 'ontology' && <motion.div key="ontology" {...fadeProps}><OntologyPanel /></motion.div>}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
