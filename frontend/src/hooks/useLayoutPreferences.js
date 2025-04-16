/**

 * @file useLayoutPreferences.js

 * @description Hook for managing and persisting user layout preferences

 */

import { useState, useEffect } from 'react';


// Default preferences

const DEFAULT_PREFERENCES = {

  layout: 'split-horizontal',

  splitRatio: 50,

  syncMode: 'selection',

  theme: 'dark',

  toolbarPosition: 'top',

  showMetricsPanels: true,

  fontSize: 'medium',

  highlightColor: '#22c55e',

  autoSuggestLayout: true,

  scientificNotation: false,

  rememberLastLayout: true,

  panelVisibility: {

    search: true,

    metrics: true,

    minimap: true,

    toolbar: true

  }

};


export function useLayoutPreferences(storageKey = 'phylograph_layout_prefs') {

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  const [loaded, setLoaded] = useState(false);


  // Load preferences from localStorage on mount

  useEffect(() => {

    try {

      const savedPrefs = localStorage.getItem(storageKey);

      if (savedPrefs) {

        setPreferences(JSON.parse(savedPrefs));

      }

      setLoaded(true);

    } catch (err) {

      console.error('Error loading layout preferences:', err);

      setLoaded(true);

    }

  }, [storageKey]);


  // Save preferences to localStorage whenever they change

  useEffect(() => {

    if (!loaded) return;

    try {

      localStorage.setItem(storageKey, JSON.stringify(preferences));

    } catch (err) {

      console.error('Error saving layout preferences:', err);

    }

  }, [preferences, storageKey, loaded]);


  // Update a single preference

  const updatePreference = (key, value) => {

    setPreferences(prev => ({

      ...prev,

      [key]: value

    }));

  };


  // Update a nested preference

  const updateNestedPreference = (parentKey, childKey, value) => {

    setPreferences(prev => ({

      ...prev,

      [parentKey]: {

        ...prev[parentKey],

        [childKey]: value

      }

    }));

  };


  // Reset preferences to defaults

  const resetPreferences = () => {

    setPreferences(DEFAULT_PREFERENCES);

  };


  return {

    preferences,

    updatePreference,

    updateNestedPreference,

    resetPreferences,

    loaded

  };

}