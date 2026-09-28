import React from 'react';

export default function SafeBunkBadge({ safeBunks }) {
  if (safeBunks === 0) {
    return (
      <div className="flex items-center space-x-3 text-amber-300 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 mt-4">
        <span className="text-sm">⚠️ You have <strong>0</strong> safe bunks. Do not skip.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 text-emerald-300 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 mt-4">
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <span className="text-sm">
        You can safely skip <strong>{safeBunks}</strong> classes.
      </span>
    </div>
  );
}