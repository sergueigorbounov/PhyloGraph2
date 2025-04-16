// src/components/ViewLinkageIndicator.jsx

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLink, FaUnlink } from 'react-icons/fa';

export default function ViewLinkageIndicator({ 
  isActive, 
  syncMode = 'selection',
  position = 'center', // 'center', 'top', 'bottom'
  onToggle
}) {
  const [visible, setVisible] = useState(false);
  const [recentActivity, setRecentActivity] = useState(false);
  
  // Show briefly when sync occurs
  useEffect(() => {
    if (isActive) {
      setVisible(true);
      setRecentActivity(true);
      
      const timer = setTimeout(() => {
        setRecentActivity(false);
        
        // If not hovered, hide after activity ends
        const hideTimer = setTimeout(() => {
          setVisible(false);
        }, 1500);
        
        return () => clearTimeout(hideTimer);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isActive]);
  
  // Get position styles based on position prop
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { top: '20px', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
      case 'center':
      default:
        return { 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)' 
        };
    }
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: recentActivity ? 1 : 0.7, 
            scale: recentActivity ? 1.1 : 1
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="view-sync-indicator"
          style={getPositionStyles()}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => !recentActivity && setVisible(false)}
        >
          <div className="view-sync-indicator-inner">
            <button
              onClick={onToggle}
              className="view-sync-button"
            >
              <div className={`view-sync-button-bg ${syncMode} ${recentActivity ? 'pulse' : ''}`}></div>
              
              <div className="view-sync-button-icon">
                {syncMode === 'none' ? <FaUnlink /> : <FaLink />}
              </div>
            </button>
            
            {recentActivity && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="view-sync-activity-indicator"
              />
            )}
          </div>
          
          <div className="view-sync-tooltip">
            {syncMode === 'none' ? 'Sync: Off' : 
             syncMode === 'selection' ? 'Sync: Selection' : 
             'Sync: Full'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}