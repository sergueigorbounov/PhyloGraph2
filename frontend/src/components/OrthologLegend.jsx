// src/components/OrthologLegend.jsx
import React from 'react';
import { getGroupColor } from '../utils/colorUtils';

/**
 * Legend for ortholog groups with toggle visibility control.
 * @param {Array} groups - array of group URIs
 * @param {Array} visibleGroups - array of visible group URIs
 * @param {Function} onToggle - callback with groupUri to toggle
 */
export default function OrthologLegend({ groups = [], visibleGroups = [], onToggle }) {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-zinc-900 border border-zinc-700 rounded">
      {groups.map(group => {
        const color = getGroupColor(group);
        const active = visibleGroups.includes(group);
        return (
          <div key={group} className="flex items-center gap-2">
            <button
              onClick={() => onToggle(group)}
              className={`w-4 h-4 rounded-full border-2`}
              style={{
                backgroundColor: color,
                opacity: active ? 1 : 0.3,
                borderColor: active ? '#fff' : '#555'
              }}
              title={group}
            />
            <span className={`text-xs ${active ? 'text-white' : 'text-zinc-500'} truncate max-w-[180px]`}>
              {group.split('/').pop()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
