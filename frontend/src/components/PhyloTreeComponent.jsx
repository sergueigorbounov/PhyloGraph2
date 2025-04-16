// src/components/PhyloTreeComponent.jsx
import React, { useRef, useEffect } from 'react';
import { usePhyloTree } from '../hooks/usePhyloTree';
import './PhyloTreeComponent.css';

// Debug overlay component
const DebugOverlay = ({ metrics }) => (
  <div className="debug-overlay">
    <h3>Debug Information</h3>
    <div className="metrics">
      {metrics ? (
        <>
          <div>Render time: {metrics.renderTime}ms</div>
          <div>Node count: {metrics.nodeCount}</div>
        </>
      ) : (
        <div>Waiting for metrics...</div>
      )}
    </div>
  </div>
);

// Error message component that safely handles different error types
const ErrorMessage = ({ error }) => {
  // Convert the error to a string representation
  const errorMessage = React.useMemo(() => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object') {
      try {
        return JSON.stringify(error);
      } catch (e) {
        return 'Unknown error object';
      }
    }
    return 'Unknown error';
  }, [error]);
  
  return (
    <div className="phylo-tree-error">
      <h3>Error loading tree data</h3>
      <p>{errorMessage}</p>
    </div>
  );
};

const PhyloTreeComponent = ({
  layout = 'radial',
  apiBaseUrl = 'http://localhost:8000',
  debugMode = false,
  scientificMode = false,
  onDataLoaded = () => {},
  onError = () => {},
  cytoscape = null
}) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  
  const {
    treeData,
    isLoading,
    error,
    renderMetrics,
    drawTree
  } = usePhyloTree({ 
    layout, 
    apiBaseUrl, 
    debugMode, 
    scientificMode
  });

  // Call onDataLoaded callback when tree data is available
  useEffect(() => {
    if (treeData) {
      onDataLoaded(treeData);
    }
  }, [treeData, onDataLoaded]);

  // Call onError callback when an error occurs
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  // Draw tree when svg reference is available
  useEffect(() => {
    if (treeData && svgRef.current) {
      drawTree(treeData, svgRef.current, layout);
    }
  }, [treeData, svgRef, layout, drawTree]);

  // Adjust container dimensions on resize
  useEffect(() => {
    const handleResize = () => {
        if (treeData && svgRef.current) {
            drawTree(treeData, svgRef.current, layout);
          }
        };
    
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, [treeData, drawTree, layout]);
    
      return (
        <div className="phylo-tree-container" ref={containerRef}>
          {isLoading && (
            <div className="phylo-tree-loading">
              <div className="spinner"></div>
              <p>Loading phylogenetic tree...</p>
            </div>
          )}
          
          {error && !isLoading && <ErrorMessage error={error} />}
          
          <svg 
            ref={svgRef} 
            className="phylo-tree-svg"
            width="100%" 
            height="100%"
          ></svg>
          
          {debugMode && <DebugOverlay metrics={renderMetrics} />}
          
          <div className="controls">
            <div className="layout-info">
              Current layout: {layout}
            </div>
            {scientificMode && (
              <div className="scientific-mode-indicator">
                Scientific Mode Enabled
              </div>
            )}
          </div>
        </div>
      );
    };
    
    export default PhyloTreeComponent;
    export { PhyloTreeComponent };