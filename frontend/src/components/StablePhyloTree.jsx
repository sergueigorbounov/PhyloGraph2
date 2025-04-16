import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import PhyloTreeComponent from './PhyloTreeComponent';
import PhyloTreeErrorBoundary from './PhyloTreeErrorBoundary';

// This component stays mounted in the DOM outside the React tree
export const StablePhyloTree = ({ 
  containerSelector = '#phylo-tree-container',
  layout = 'radial',
  debugMode = false,
  scientificMode = false,
  onDataLoaded = () => {},
  onError = () => {}
}) => {
  // Create a container if it doesn't exist
  useEffect(() => {
    let container = document.querySelector(containerSelector);
    
    if (!container) {
      container = document.createElement('div');
      container.id = containerSelector.replace('#', '');
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      document.body.appendChild(container);
    }
    
    // Return cleanup function
    return () => {
      // We intentionally don't remove the container to keep the tree alive
    };
  }, [containerSelector]);
  
  // Use React Portal to render outside of the normal component tree
  return ReactDOM.createPortal(
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <PhyloTreeErrorBoundary showDetails={debugMode}>
        <PhyloTreeComponent
          layout={layout}
          apiBaseUrl="mock"
          debugMode={debugMode}
          scientificMode={scientificMode}
          onDataLoaded={onDataLoaded}
          onError={onError}
        />
      </PhyloTreeErrorBoundary>
    </div>,
    document.querySelector(containerSelector) || document.body
  );
};

// A simple wrapper that controls visibility without destroying the component
export const PhyloTreeVisibilityWrapper = ({
  visible = true,
  layout = 'radial',
  debugMode = false,
  scientificMode = false,
  onDataLoaded = () => {},
  onError = () => {}
}) => {
  const [mounted, setMounted] = useState(false);
  const containerId = useRef(`phylo-tree-container-${Math.random().toString(36).substring(2, 9)}`);
  
  // Mount once and never unmount
  useEffect(() => {
    setMounted(true);
    return () => {
      // We intentionally don't unmount
    };
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      visibility: visible ? 'visible' : 'hidden'
    }}>
      <div id={containerId.current} style={{ width: '100%', height: '100%' }}>
        <StablePhyloTree
          containerSelector={`#${containerId.current}`}
          layout={layout}
          debugMode={debugMode}
          scientificMode={scientificMode}
          onDataLoaded={onDataLoaded}
          onError={onError}
        />
      </div>
    </div>
  );
};

export default PhyloTreeVisibilityWrapper;