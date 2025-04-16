import React, { memo, useState, useRef, useEffect } from 'react';
import PhyloTreeComponent from './PhyloTreeComponent';
import PhyloTreeErrorBoundary from './PhyloTreeErrorBoundary';

export const PersistentPhyloTree = memo(({ 
  layout = 'radial',
  apiBaseUrl = 'mock', // Always use mock data
  debugMode = false,
  scientificMode = false,
  cytoscape = null,
  onDataLoaded = () => {},
  onError = () => {}
}) => {
  // Use ref for layout to prevent unnecessary remounts
  const layoutRef = useRef(layout);
  const [key, setKey] = useState(0);
  const [loadCount, setLoadCount] = useState(0);
  const mountedRef = useRef(false);
  
  // Mark when component is mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Only update key if layout has actually changed
  useEffect(() => {
    if (mountedRef.current && layoutRef.current !== layout) {
      layoutRef.current = layout;
      setKey(prevKey => prevKey + 1);
    }
  }, [layout]);
  
  const handleDataLoaded = (data) => {
    if (mountedRef.current) {
      setLoadCount(prev => prev + 1);
      onDataLoaded(data);
    }
  };
  
  const handleError = (error) => {
    if (mountedRef.current) {
      console.error('[PersistentPhyloTree] Error in tree component:', error);
      onError(error);
    }
  };
  
  // Use a stable key to prevent unnecessary remounting
  // Only change key when layout actually changes
  return (
    <div className="persistent-phylo-tree">
      <PhyloTreeErrorBoundary showDetails={debugMode}>
        <PhyloTreeComponent
          key={`phylo-tree-${layoutRef.current}-${key}`}
          layout={layoutRef.current}
          apiBaseUrl="mock"
          debugMode={debugMode}
          scientificMode={scientificMode}
          cytoscape={cytoscape}
          onDataLoaded={handleDataLoaded}
          onError={handleError}
        />
      </PhyloTreeErrorBoundary>
      
      {debugMode && (
        <div className="persistent-debug-info">
          <div>Component instance: {key}</div>
          <div>Current layout: {layoutRef.current}</div>
          <div>Successful loads: {loadCount}</div>
        </div>
      )}
    </div>
  );
});

// Support default export as well
export default PersistentPhyloTree;