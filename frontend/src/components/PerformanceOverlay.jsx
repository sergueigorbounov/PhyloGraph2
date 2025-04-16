// components/PerformanceOverlay.jsx
import React, { useState, useEffect } from 'react';

export default function PerformanceOverlay({ nodeCount = 0 }) {
  const [metrics, setMetrics] = useState({
    fps: 0,
    renderTime: 0,
    memoryUsage: 0,
    dataProcessingTime: 0
  });
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let interval;
    
    // Update FPS counter
    const calculateFPS = () => {
      const now = performance.now();
      const delta = now - lastTime;
      frameCount++;
      
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        const memory = window.performance?.memory ? 
          Math.round(window.performance.memory.usedJSHeapSize / 1048576) : 'N/A';
        
        setMetrics(prev => ({ 
          ...prev, 
          fps, 
          memoryUsage: memory
        }));
        
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(calculateFPS);
    };
    
    calculateFPS();
    
    // Measure render times
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const renderEntries = entries.filter(entry => entry.name.includes('render'));
      
      if (renderEntries.length) {
        const avgRenderTime = renderEntries.reduce((sum, entry) => sum + entry.duration, 0) / renderEntries.length;
        setMetrics(prev => ({ ...prev, renderTime: avgRenderTime.toFixed(2) }));
      }
    });
    
    // Start observing
    observer.observe({ entryTypes: ['measure'] });
    
    return () => {
      observer.disconnect();
      cancelAnimationFrame(calculateFPS);
      if (interval) clearInterval(interval);
    };
  }, []);
  
  return (
    <div className="performance-overlay">
      <div className="performance-stats">
        <h3>Performance Metrics</h3>
        <div>
          <span>FPS:</span>
          <span>{metrics.fps}</span>
        </div>
        <div>
          <span>Render Time:</span>
          <span>{metrics.renderTime} ms</span>
        </div>
        <div>
          <span>Heap Usage:</span>
          <span>{typeof metrics.memoryUsage === 'number' ? `${metrics.memoryUsage} MB` : metrics.memoryUsage}</span>
        </div>
        <div>
          <span>Node Count:</span>
          <span>{nodeCount}</span>
        </div>
      </div>
    </div>
  );
}