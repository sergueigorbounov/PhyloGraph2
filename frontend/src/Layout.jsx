import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Layout({ children, darkMode, toggleDark, showBadge, toggleBadge, rightPanelContent }) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between p-4 bg-black/80 border-b border-gray-800 shadow-sm">
        <div className="text-xl font-bold text-white">PhyloGraph</div>
        <div className="flex gap-2">
          <button onClick={toggleBadge} className="px-2 py-1 text-xs border border-gray-600 rounded hover:bg-gray-800 transition">
            {showBadge ? '❌ Badge' : '✅ Badge'}
          </button>
          <button onClick={toggleDark} className="px-2 py-1 text-xs border border-gray-600 rounded hover:bg-gray-800 transition">
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </nav>

      {/* Federation Badge */}
      {showBadge && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xs mt-3 ml-6 text-gray-400 italic flex items-center gap-2"
        >
          <span className="text-green-400">🌐 SPARQL Federation:</span>
          <span>SyntenyViewer</span>•
          <span>FAIDARE</span>•
          <span>AgroLD</span>•
          <span>Wikidata</span>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
        <div className="flex-1 overflow-auto p-4">{children}</div>
        <aside className="w-full lg:w-[420px] border-l border-gray-700 dark:border-gray-800 overflow-y-auto p-4 bg-neutral-900">
          {rightPanelContent}
        </aside>
      </main>

      {/* Modal + Footer */}
      <div id="modal-root" className="fixed top-0 left-0 w-full h-full z-[9999] pointer-events-none" />
      <footer className="text-center text-xs text-gray-600 py-3 border-t border-neutral-800">
        © 2025 <strong>PhyloGraph</strong> • FAIR Semantic Graph Explorer
      </footer>
    </div>
  );
}
