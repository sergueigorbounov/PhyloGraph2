// src/hooks/usePhyloViewSync.js

import { useState, useEffect, useCallback } from 'react';

export function usePhyloViewSync({ 
  treeRef, 
  graphRef, 
  enabled = true,
  syncMode = 'selection'
}) {
  const [treeSelection, setTreeSelection] = useState(null);
  const [graphSelection, setGraphSelection] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Sync from tree to graph
  useEffect(() => {
    if (!enabled || syncMode === 'none' || !treeSelection || !graphRef.current) return;
    
    setIsSyncing(true);
    
    const cy = window.cy;
    if (cy && cy.$(`#${treeSelection}`).length) {
      cy.$(`#${treeSelection}`).select();
      cy.center(cy.$(`#${treeSelection}`));
      
      if (syncMode === 'full') {
        cy.animate({ fit: { eles: cy.$(`#${treeSelection}`), padding: 80 }, duration: 500 });
      }
    }
    
    setTimeout(() => setIsSyncing(false), 500);
  }, [treeSelection, syncMode, enabled]);
  
  // Sync from graph to tree
  useEffect(() => {
    if (!enabled || syncMode === 'none' || !graphSelection || !treeRef.current) return;
    
    setIsSyncing(true);
    
    if (treeRef.current.highlightNode) {
      treeRef.current.highlightNode(graphSelection);
    }
    
    setTimeout(() => setIsSyncing(false), 500);
  }, [graphSelection, syncMode, enabled]);
  
  // Sync selection
  const syncSelection = useCallback((id) => {
    if (!enabled || syncMode === 'none' || !id) return;
    
    setIsSyncing(true);
    setTreeSelection(id);
    setGraphSelection(id);
    setTimeout(() => setIsSyncing(false), 500);
  }, [syncMode, enabled]);
  
  return {
    syncMode,
    isSyncing,
    treeSelection,
    graphSelection,
    setTreeSelection,
    setGraphSelection,
    syncSelection
  };
}

export default usePhyloViewSync;