import React from 'react';

export default function ActionAlerts({ requiredClasses }) {
  return (
    <div className="flex items-start space-x-3 text-rose-300 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 mt-4">
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <span className="text-sm">
        Critical: Attend the next <strong>{requiredClasses}</strong> classes to safely reach 75%.
      </span>
    </div>
  );
}