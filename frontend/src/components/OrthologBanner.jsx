// src/components/OrthologBanner.jsx
import React from 'react';

/**
 * Displays the current ortholog group URI as a badge/banner in the tree panel.
 * Only shows if a valid group URI is passed.
 *
 * @param {string} group - Detected ortholog group URI
 * @returns JSX element or null
 */
export default function OrthologBanner({ group }) {
  if (!group || typeof group !== 'string') return null;

  const label = group.split('/').pop(); // ✅ Fix: extract final segment

  return (
    <div className="text-xs text-white bg-zinc-800 border border-zinc-600 px-3 py-1 mb-2 rounded inline-block">
      Ortholog group: <span className="font-mono text-green-400">{label}</span>
    </div>
  );
}
