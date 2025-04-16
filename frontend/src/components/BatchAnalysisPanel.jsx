// components/BatchAnalysisPanel.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function BatchAnalysisPanel() {
  const [files, setFiles] = useState([]);
  const [analysisType, setAnalysisType] = useState('phylogeny');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const analysisTypes = [
    { value: 'phylogeny', label: 'Phylogenetic Analysis' },
    { value: 'conservation', label: 'Conservation Analysis' },
    { value: 'synteny', label: 'Synteny Analysis' },
    { value: 'enrichment', label: 'Gene Enrichment' }
  ];
  
  const handleDrop = (event) => {
    event.preventDefault();
    
    const newFiles = Array.from(event.dataTransfer?.files || []);
    
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} files for processing`);
    }
  };
  
  const handleFileSelect = (event) => {
    const newFiles = Array.from(event.target.files || []);
    
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} files for processing`);
    }
  };
  
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const processFiles = () => {
    if (files.length === 0) {
      toast.error('Please add files for batch processing');
      return;
    }
    
    setIsProcessing(true);
    toast.success(`Starting batch ${analysisType} analysis on ${files.length} files...`);
    
    // In a real implementation, this would process the files
    // and potentially use a worker thread for heavy computation
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Batch processing complete!');
      
      // Mock download of results
      const link = document.createElement('a');
      link.download = `batch_${analysisType}_results.zip`;
      link.href = '#';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 3000);
  };
  
  return (
    <div className="batch-processing-panel">
      <h3 className="text-white text-lg font-bold mb-4">Batch Analysis</h3>
      
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">Analysis Type:</label>
        <select 
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
        >
          {analysisTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>
      
      <div 
        className={`batch-file-dropzone ${dragOver ? 'active' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById('batch-file-input').click()}
      >
        <p>Drag and drop files here or click to browse</p>
        <p className="text-sm text-gray-400 mt-2">
          Supported formats: FASTA, NEWICK, CSV, TSV
        </p>
        <input 
          id="batch-file-input"
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      {files.length > 0 && (
        <div className="batch-file-list">
          {files.map((file, index) => (
            <div key={index} className="batch-file-item">
              <span className="batch-file-name">{file.name}</span>
              <div className="flex items-center gap-2">
                <span className="batch-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-300"
                  aria-label="Remove file"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={processFiles}
        disabled={isProcessing || files.length === 0}
        className={`batch-process-button ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isProcessing ? 'Processing...' : `Process ${files.length} Files`}
      </button>
    </div>
  );
}