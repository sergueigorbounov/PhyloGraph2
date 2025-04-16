
/**

 * @file usePhyloGraphLayout.js

 * @description Comprehensive custom hook for PhyloGraph layout management

 * This combines all the layout functionality in one place

 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { LAYOUTS } from '../components/LayoutManager';


export function usePhyloGraphLayout() {

  // Load saved preferences

  const loadSavedPreferences = () => {

    try {

      const saved = localStorage.getItem('phylograph_layout_prefs');

      return saved ? JSON.parse(saved) : null;

    } catch (e) {

      console.error('Error loading layout preferences:', e);

      return null;

    }

  };

  

  const savedPrefs = loadSavedPreferences();

  

  // Layout state

  const [layout, setLayout] = useState(savedPrefs?.layout || LAYOUTS.SPLIT_HORIZONTAL);

  const [splitRatio, setSplitRatio] = useState(savedPrefs?.splitRatio || 50);

  const [syncMode, setSyncMode] = useState(savedPrefs?.syncMode || 'selection');

  const [pipPosition, setPipPosition] = useState(savedPrefs?.pipPosition || { x: 20, y: 20 });

  const [pipSize, setPipSize] = useState(savedPrefs?.pipSize || { width: 300, height: 250 });

  const [activeFocus, setActiveFocus] = useState(savedPrefs?.activeFocus || 'left');

  const [previousLayout, setPreviousLayout] = useState(null);

  

  // Layout history for undo/redo

  const [layoutHistory, setLayoutHistory] = useState([layout]);

  const [historyIndex, setHistoryIndex] = useState(0);

  

  // User layout presets

  const [userPresets, setUserPresets] = useState(() => {

    try {

      const saved = localStorage.getItem('phylograph_layout_presets');

      return saved ? JSON.parse(saved) : [];

    } catch (e) {

      return [];

    }

  });

  

  // UI state

  const [showPreferencesPanel, setShowPreferencesPanel] = useState(false);

  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);

  const [showPresetsManager, setShowPresetsManager] = useState(false);

  

  // Refs

  const containerRef = useRef(null);

  

  // Save current layout config

  const getCurrentConfig = useCallback(() => {

    return {

      layout,

      splitRatio,

      syncMode,

      pipPosition,

      pipSize,

      activeFocus,

    };

  }, [layout, splitRatio, syncMode, pipPosition, pipSize, activeFocus]);

  

  // Save a preset

  const savePreset = useCallback((preset) => {

    const newPreset = {

      id: `preset-${Date.now()}`,

      name: preset.name,

      config: preset.config || getCurrentConfig(),

      createdAt: new Date().toISOString()

    };

    

    setUserPresets(prev => {

      const updated = [...prev, newPreset];

      try {

        localStorage.setItem('phylograph_layout_presets', JSON.stringify(updated));

      } catch (e) {

        console.error('Error saving layout presets:', e);

      }

      return updated;

    });

  }, [getCurrentConfig]);

  

  // Delete a preset

  const deletePreset = useCallback((presetId) => {

    setUserPresets(prev => {

      const updated = prev.filter(p => p.id !== presetId);

      try {

        localStorage.setItem('phylograph_layout_presets', JSON.stringify(updated));

      } catch (e) {

        console.error('Error saving layout presets:', e);

      }

      return updated;

    });

  }, []);

  

  // Apply a preset

  const applyPreset = useCallback((preset) => {

    if (!preset || !preset.config) return;

    

    const { config } = preset;

    

    setLayout(config.layout || LAYOUTS.SPLIT_HORIZONTAL);

    setSplitRatio(config.splitRatio || 50);

    setSyncMode(config.syncMode || 'selection');

    
    if (config.pipPosition) setPipPosition(config.pipPosition);

    if (config.pipSize) setPipSize(config.pipSize);

    if (config.activeFocus) setActiveFocus(config.activeFocus);

    

    // Add to history

    setLayoutHistory(prev => [...prev.slice(0, historyIndex + 1), config.layout]);

    setHistoryIndex(prev => prev + 1);

  }, [historyIndex]);

  

  // Change layout with history tracking

  const changeLayout = useCallback((newLayout, configOverrides = {}) => {

    if (newLayout === LAYOUTS.FULLSCREEN_LEFT || newLayout === LAYOUTS.FULLSCREEN_RIGHT) {

      setPreviousLayout(layout);

    }

    

    setLayout(newLayout);

    

    // Apply any config overrides

    if (configOverrides.splitRatio) setSplitRatio(configOverrides.splitRatio);

    if (configOverrides.syncMode) setSyncMode(configOverrides.syncMode);

    if (configOverrides.pipPosition) setPipPosition(configOverrides.pipPosition);

    if (configOverrides.pipSize) setPipSize(configOverrides.pipSize);

    if (configOverrides.activeFocus) setActiveFocus(configOverrides.activeFocus);

    

    // Add to history (not for fullscreen toggle if returning to previous)

    if (!(newLayout === previousLayout && 

         (layout === LAYOUTS.FULLSCREEN_LEFT || layout === LAYOUTS.FULLSCREEN_RIGHT))) {

      setLayoutHistory(prev => [...prev.slice(0, historyIndex + 1), newLayout]);

      setHistoryIndex(prev => prev + 1);

    }

  }, [layout, previousLayout, historyIndex]);

  

  // Undo layout change

  const undoLayoutChange = useCallback(() => {

    if (historyIndex > 0) {

      setHistoryIndex(prev => prev - 1);

      setLayout(layoutHistory[historyIndex - 1]);

    }

  }, [historyIndex, layoutHistory]);

  

  // Redo layout change

  const redoLayoutChange = useCallback(() => {

    if (historyIndex < layoutHistory.length - 1) {

      setHistoryIndex(prev => prev + 1);

      setLayout(layoutHistory[historyIndex + 1]);

    }

  }, [historyIndex, layoutHistory]);

  

  // Save preferences to localStorage

  useEffect(() => {

    try {

      localStorage.setItem('phylograph_layout_prefs', JSON.stringify({

        layout,

        splitRatio,

        syncMode,

        pipPosition,

        pipSize,

        activeFocus

      }));

    } catch (e) {

      console.error('Error saving layout preferences:', e);

    }

  }, [layout, splitRatio, syncMode, pipPosition, pipSize, activeFocus]);

  

  return {

    // Current layout state

    layout,

    splitRatio,

    syncMode,

    pipPosition,

    pipSize,

    activeFocus,

    previousLayout,

    

    // Methods

    setLayout: changeLayout,

    setSplitRatio,

    setSyncMode,

    setPipPosition,

    setPipSize,

    setActiveFocus,

    undoLayoutChange,

    redoLayoutChange,

    

    // Current config

    getCurrentConfig,

    

    // Presets management

    userPresets,

    savePreset,

    deletePreset,

    applyPreset,

    

    // UI state

    showPreferencesPanel,

    setShowPreferencesPanel,

    showSavePresetDialog,

    setShowSavePresetDialog,

    showPresetsManager,

    setShowPresetsManager,

    

    // History state

    canUndo: historyIndex > 0,

    canRedo: historyIndex < layoutHistory.length - 1,

    

    // Refs

    containerRef

  };

}