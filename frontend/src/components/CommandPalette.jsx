// src/components/CommandPalette.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommandPalette({ isOpen, onClose, commands = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  
  // Filter commands based on search query
  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cmd.category && cmd.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    } else {
      setSearchQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[activeIndex]) {
          executeCommand(filteredCommands[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };
  
  const executeCommand = (command) => {
    if (command.action) {
      command.action();
    }
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          
          {/* Command palette */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="command-palette"
          >
            {/* Search input */}
            <div className="command-palette-search">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                className="command-palette-input"
                autoComplete="off"
              />
            </div>
            
            {/* Command list */}
            <div className="command-palette-list">
              {filteredCommands.length > 0 ? (
                <div>
                  {filteredCommands.map((command, index) => (
                    <div
                      key={command.id}
                      className={`command-palette-item ${
                        index === activeIndex ? 'active' : ''
                      }`}
                      onClick={() => executeCommand(command)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <div className="command-palette-item-left">
                        <span className="command-palette-item-title">{command.title}</span>
                        {command.category && (
                          <span className="command-palette-item-category">
                            {command.category}
                          </span>
                        )}
                      </div>
                      {command.shortcut && (
                        <span className="command-palette-item-shortcut">
                          {command.shortcut}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="command-palette-empty">
                  No commands found for "{searchQuery}"
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}