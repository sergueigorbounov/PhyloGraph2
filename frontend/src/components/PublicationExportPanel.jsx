// components/PublicationExportPanel.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function PublicationExportPanel({ treeRef }) {
  const [settings, setSettings] = useState({
    format: 'SVG',
    journal: 'Nature',
    dpi: 600,
    labels: true,
    showBootstrap: true,
    width: 180, // mm
    height: 120, // mm
  });
  
  const formats = ['SVG', 'PNG', 'PDF', 'EPS'];
  const journals = ['Nature', 'Science', 'PNAS', 'PLOS'];
  const dpiOptions = [300, 600, 1200];
  
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleExport = () => {
    toast.success(`Preparing ${settings.format} export for ${settings.journal}...`);
    
    // In a real implementation, this would use the treeRef to access the tree
    // and generate a high-quality export using settings
    setTimeout(() => {
      toast.success('Export complete!');
      
      // Mock download
      const filename = `phylograph_${settings.journal.toLowerCase()}_${settings.dpi}dpi.${settings.format.toLowerCase()}`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = '#';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 2000);
  };
  
  return (
    <div className="publication-panel">
      <h3>Publication Export</h3>
      
      <div className="publication-options">
        <div className="publication-option-group">
          <h4>Format</h4>
          <div className="option-buttons">
            {formats.map(format => (
              <button 
                key={format}
                className={`option-button ${settings.format === format ? 'selected' : ''}`}
                onClick={() => handleSettingChange('format', format)}
              >
                {format}
              </button>
            ))}
          </div>
        </div>
        
        <div className="publication-option-group">
          <h4>Journal Style</h4>
          <div className="option-buttons">
            {journals.map(journal => (
              <button 
                key={journal}
                className={`option-button ${settings.journal === journal ? 'selected' : ''}`}
                onClick={() => handleSettingChange('journal', journal)}
              >
                {journal}
              </button>
            ))}
          </div>
        </div>
        
        <div className="publication-option-group">
          <h4>Resolution (DPI)</h4>
          <div className="option-buttons">
            {dpiOptions.map(dpi => (
              <button 
                key={dpi}
                className={`option-button ${settings.dpi === dpi ? 'selected' : ''}`}
                onClick={() => handleSettingChange('dpi', dpi)}
              >
                {dpi}
              </button>
            ))}
          </div>
        </div>
        
        <div className="publication-option-group">
          <h4>Display Options</h4>
          <div className="option-buttons">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input 
                type="checkbox" 
                checked={settings.labels} 
                onChange={e => handleSettingChange('labels', e.target.checked)}
              />
              <span>Show Labels</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input 
                type="checkbox" 
                checked={settings.showBootstrap} 
                onChange={e => handleSettingChange('showBootstrap', e.target.checked)}
              />
              <span>Bootstrap Values</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="publication-dimensions flex gap-4 items-center">
        <label className="text-sm text-gray-300">
          Width (mm):
          <input 
            type="number" 
            value={settings.width} 
            onChange={e => handleSettingChange('width', parseInt(e.target.value))}
            className="ml-2 w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1"
          />
        </label>
        <label className="text-sm text-gray-300">
          Height (mm):
          <input 
            type="number" 
            value={settings.height} 
            onChange={e => handleSettingChange('height', parseInt(e.target.value))}
            className="ml-2 w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1"
          />
        </label>
      </div>
      
      <button 
        onClick={handleExport}
        className="batch-process-button w-full mt-4"
      >
        Export for Publication
      </button>
    </div>
  );
}