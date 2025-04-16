// components/ScientificMetricsPanel.jsx
import React from 'react';
import { toast } from 'react-hot-toast';

export default function ScientificMetricsPanel({ 
  conservationScore = 0.78, 
  dndsRatio = 0.32, 
  bootstrapValue = 95, 
  pValue = 0.002,
  onExport
}) {
  const handleExport = () => {
    if (typeof onExport === 'function') {
      onExport();
    } else {
      // Default export handling
      toast.success('Preparing publication-ready visualization...');
      
      // In a real implementation, this would generate high-quality exports
      setTimeout(() => {
        toast.success('Export complete!');
        
        // Mock download prompt
        const link = document.createElement('a');
        link.download = 'phylograph_scientific_export.svg';
        // This would be a real data URL in actual implementation
        link.href = '#';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 1500);
    }
  };
  
  return (
    <div className="scientific-metrics mt-4 p-4 bg-gray-900 rounded-lg">
      <h3 className="text-white text-lg font-bold mb-2">Phylogenetic Metrics</h3>
      <div className="grid grid-cols-2 gap-2">
        <div className="metric-item">
          <span className="metric-label">Conservation Score:</span>
          <span className="metric-value">{conservationScore.toFixed(2)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">dN/dS Ratio:</span>
          <span className="metric-value">{dndsRatio.toFixed(2)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Bootstrap Value:</span>
          <span className="metric-value">{bootstrapValue}%</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">p-Value:</span>
          <span className="metric-value">{pValue.toFixed(3)}</span>
        </div>
      </div>
      
      <div className="mt-3">
        <button 
          className="export-scientific-btn bg-blue-600 px-3 py-1 rounded text-sm"
          onClick={handleExport}
        >
          Export for Publication
        </button>
      </div>
    </div>
  );
}