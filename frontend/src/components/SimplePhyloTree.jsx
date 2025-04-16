import React, { useEffect, useState, useRef } from 'react';
import { usePhyloTree } from '../hooks/usePhyloTree';

const SimplePhyloTree = ({ 
  visible = true,
  layout = 'radial',
  scientificMode = false,
  debugMode = false 
}) => {
  const [initialized, setInitialized] = useState(false);
  const visibleRef = useRef(visible);
  const layoutRef = useRef(layout);
  
  const { showTree, hideTree, isInitialized } = usePhyloTree({
    layout, // Pass current layout for initial setup
    scientificMode,
    debugMode
  });
  
  // Update refs when props change
  useEffect(() => {
    visibleRef.current = visible;
    layoutRef.current = layout;
    
    // Apply visibility changes
    if (visible) {
      showTree();
    } else {
      hideTree();
    }
  }, [visible, layout, showTree, hideTree]);
  
  // Set initialized state after first render
  useEffect(() => {
    if (isInitialized && !initialized) {
      setInitialized(true);
      
      // Show tree if it should be visible
      if (visibleRef.current) {
        showTree();
      }
    }
  }, [isInitialized, initialized, showTree]);
  
  // Just return a placeholder div
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!initialized && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#333',
          fontSize: '14px',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ marginBottom: '10px' }}>Initializing tree visualization...</div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            margin: '0 auto',
            border: '4px solid rgba(0, 0, 0, 0.1)',
            borderTopColor: '#3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default React.memo(SimplePhyloTree);