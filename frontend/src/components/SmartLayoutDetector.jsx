// src/components/SmartLayoutDetector.jsx

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LAYOUTS } from './LayoutManager';

export default function SmartLayoutDetector({ 
  treeData,
  graphData,
  currentLayout,
  onLayoutChange,
  enabled = true
}) {
  const [recommendation, setRecommendation] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    if (!enabled || dismissed || !treeData || !graphData) {
      return;
    }
    
    // Simple recommendation logic
    const detectOptimalLayout = () => {
      // Get basic stats about the data
      const treeNodeCount = treeData.nodes?.length || 0;
      const graphNodeCount = Array.isArray(graphData) ? graphData.length : 0;
      
      let suggestedLayout = null;
      let reason = '';
      
      // Very simple recommendation logic
      if (treeNodeCount > 50 && graphNodeCount < 20) {
        suggestedLayout = LAYOUTS.SPLIT_HORIZONTAL;
        reason = 'Large tree detected - horizontal split recommended for better visibility';
      } else if (graphNodeCount > 50 && treeNodeCount < 20) {
        suggestedLayout = LAYOUTS.SPLIT_VERTICAL;
        reason = 'Complex graph detected - vertical split recommended for better analysis';
      } else if (treeNodeCount > 30 && graphNodeCount > 30) {
        suggestedLayout = LAYOUTS.GRID;
        reason = 'Both visualizations are complex - grid layout recommended';
      } else if (treeNodeCount < 10 && graphNodeCount < 10) {
        suggestedLayout = LAYOUTS.PIP;
        reason = 'Simple visualizations detected - PIP layout for compact viewing';
      }
      
      // Only suggest if it's different from current layout
      if (suggestedLayout && suggestedLayout !== currentLayout) {
        setRecommendation({
          layout: suggestedLayout,
          reason
        });
      } else {
        setRecommendation(null);
      }
    };
    
    // Wait a bit to analyze after data loads
    const timer = setTimeout(detectOptimalLayout, 1000);
    return () => clearTimeout(timer);
  }, [treeData, graphData, currentLayout, enabled, dismissed]);
  
  // Reset dismissed state when data changes
  useEffect(() => {
    setDismissed(false);
  }, [treeData, graphData]);
  
  if (!recommendation || dismissed) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 left-4 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg p-4 max-w-md z-40"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-white font-medium">Layout Recommendation</h3>
          <button 
            onClick={() => setDismissed(true)}
            className="text-zinc-400 hover:text-white text-sm"
          >
            Dismiss
          </button>
        </div>
        
        <p className="text-zinc-300 text-sm mb-3">{recommendation.reason}</p>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              onLayoutChange(recommendation.layout);
              setDismissed(true);
            }}
            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded"
          >
            Apply Recommendation
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded"
          >
            Keep Current Layout
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}