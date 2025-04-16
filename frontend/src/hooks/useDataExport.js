// src/hooks/useDataExport.js

import { useState, useCallback } from 'react';

export function useDataExport({ treeRef, graphRef }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState(null);
  
  // Export tree as Newick format
  const exportTreeAsNewick = useCallback(() => {
    setIsExporting(true);
    setExportProgress(10);
    setExportError(null);
    
    try {
      if (!treeRef.current || !treeRef.current.getNewickFormat) {
        throw new Error("Tree export functionality not available");
      }
      
      setExportProgress(50);
      const newick = treeRef.current.getNewickFormat();
      
      setExportProgress(80);
      // Instead of using file-saver library, we'll create a download link
      const blob = new Blob([newick], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'phylogeny.nwk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportProgress(100);
      setIsExporting(false);
      return true;
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
      return false;
    }
  }, [treeRef]);
  
  // Export tree as SVG
  const exportTreeAsSVG = useCallback(() => {
    setIsExporting(true);
    setExportProgress(10);
    setExportError(null);
    
    try {
      if (!treeRef.current || !treeRef.current.exportHighResolution) {
        throw new Error("Tree SVG export functionality not available");
      }
      
      setExportProgress(50);
      treeRef.current.exportHighResolution('SVG');
      
      setExportProgress(100);
      setIsExporting(false);
      return true;
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
      return false;
    }
  }, [treeRef]);
  
  // Export graph as JSON
  const exportGraphAsJSON = useCallback(() => {
    setIsExporting(true);
    setExportProgress(10);
    setExportError(null);
    
    try {
      if (!window.cy) {
        throw new Error("Graph export functionality not available");
      }
      
      setExportProgress(30);
      const graphJSON = window.cy.json();
      
      setExportProgress(60);
      const jsonStr = JSON.stringify(graphJSON, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'graph_export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportProgress(100);
      setIsExporting(false);
      return true;
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
      return false;
    }
  }, []);
  
  // Export graph as PNG
  const exportGraphAsPNG = useCallback(() => {
    setIsExporting(true);
    setExportProgress(10);
    setExportError(null);
    
    try {
      if (!window.cy) {
        throw new Error("Graph export functionality not available");
      }
      
      setExportProgress(50);
      const dataUrl = window.cy.png({ 
        output: 'blob', 
        scale: 2, // High resolution
        bg: '#000000', 
        full: true 
      });
      
      setExportProgress(80);
      const url = URL.createObjectURL(dataUrl);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'graph_export.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportProgress(100);
      setIsExporting(false);
      return true;
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
      return false;
    }
  }, []);
  
  // Export all formats (simplified version without ZIP functionality)
  const exportAllFormats = useCallback(async () => {
    setIsExporting(true);
    setExportProgress(5);
    setExportError(null);
    
    try {
      // Export formats individually
      await exportTreeAsNewick();
      setExportProgress(40);
      
      await exportGraphAsJSON();
      setExportProgress(70);
      
      await exportTreeAsSVG();
      setExportProgress(100);
      
      setIsExporting(false);
      return true;
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
      return false;
    }
  }, [exportTreeAsNewick, exportGraphAsJSON, exportTreeAsSVG]);
  
  return {
    isExporting,
    exportProgress,
    exportError,
    exportTreeAsNewick,
    exportTreeAsSVG,
    exportGraphAsJSON,
    exportGraphAsPNG,
    exportAllFormats
  };
}

export default useDataExport;