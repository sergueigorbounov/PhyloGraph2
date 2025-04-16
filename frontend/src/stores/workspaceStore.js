// stores/workspaceStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useWorkspaceStore = create(
  persist(
    (set) => ({
      // Layout
      layout: null, // Will be initialized with default layout
      setLayout: (layout) => set({ layout }),
      
      // Selected node for highlighting across components
      selectedNode: null,
      setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
      
      // Tree layout
      selectedLayout: 'radial',
      setSelectedLayout: (layoutType) => set({ selectedLayout: layoutType }),
      
      // User preferences
      preferences: {
        theme: 'dark',
        autoExpandNodes: true,
        showTooltips: true,
        animationSpeed: 'normal',
      },
      updatePreference: (key, value) => 
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        })),
        
      // Recently used projects/files
      recentFiles: [],
      addRecentFile: (file) =>
        set((state) => ({
          recentFiles: [file, ...state.recentFiles.filter(f => f.id !== file.id)].slice(0, 10),
        })),
    }),
    {
      name: 'phylograph-workspace',
      getStorage: () => localStorage,
    }
  )
);

export default useWorkspaceStore;