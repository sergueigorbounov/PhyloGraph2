// ✅ Toggleable Light/Dark Mode, Tailwind-optimized, Modal-ready base layout

import { useState, useEffect } from 'react';
import './index.css';

export default function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-white text-black dark:bg-black dark:text-white">
      <nav className="sticky top-0 z-50 flex items-center justify-between p-4 backdrop-blur bg-black/80 border-b border-gray-800 shadow-md">
        <div className="text-xl font-bold">PhyloGraph</div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-800 transition"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </nav>

      <main className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        <div className="flex-1 overflow-auto p-4 bg-neutral-900 dark:bg-neutral-950">
          {children}
        </div>

        <aside className="w-full lg:w-[420px] border-l border-gray-700 dark:border-gray-800 overflow-y-auto p-4 bg-neutral-800 dark:bg-neutral-900">
          {/* Placeholder for Right Panel Tabs */}
          <div className="text-sm text-gray-400 mb-2">Right Panel</div>
        </aside>
      </main>

      {/* ✅ Modal Root for Transitions */}
      <div id="modal-root" className="fixed top-0 left-0 w-full h-full z-[9999] pointer-events-none"></div>
    </div>
  );
}