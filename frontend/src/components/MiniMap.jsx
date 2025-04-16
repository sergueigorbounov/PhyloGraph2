// src/components/MiniMap.jsx

import React, { useRef } from 'react';
import { FaCompress, FaExpand } from 'react-icons/fa';

export default function MiniMap({ 
  treeData, 
  graphData, 
  activeView = 'graph',
  size = 'small',
  onNavigate 
}) {
  const canvasRef = useRef(null);
  
  // Simplified MiniMap for now
  return (
    <div className="minimap">
      <div className="minimap-header">
        <span className="minimap-title">
          {activeView === 'both' ? 'Overview' : 
           activeView === 'graph' ? 'Graph View' : 'Tree View'}
        </span>
        
        <button className="minimap-control-button">
          <FaExpand size={10} />
        </button>
      </div>
      
      <canvas 
        ref={canvasRef}
        width={size === 'small' ? 120 : 180}
        height={size === 'small' ? 80 : 120}
        className="minimap-canvas"
      />
    </div>
  );
}