import React from 'react';
import { RefactorSuggestion } from '../types';

interface RefactorPanelProps {
  suggestions: RefactorSuggestion[];
}

const RefactorPanel: React.FC<RefactorPanelProps> = ({ suggestions }) => {
  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-stone-500">
        <span className="text-4xl mb-4">🔧</span>
        <p>No specific refactoring suggestions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {suggestions.map((item, idx) => (
        <div key={idx} className="bg-stone-900 border border-stone-700 rounded-lg overflow-hidden">
          <div className="bg-stone-800 px-4 py-3 border-b border-stone-700">
            <h3 className="font-semibold text-stone-100">{item.title}</h3>
          </div>
          <div className="p-4">
            <p className="text-stone-400 mb-4 text-sm">{item.description}</p>
            <div className="relative group">
              <div className="absolute top-0 right-0 bg-stone-700 text-stone-300 text-xs px-2 py-1 rounded-bl">
                Diff
              </div>
              <pre className="bg-black p-4 rounded text-sm font-mono text-green-400 overflow-x-auto">
                {item.diffCode}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RefactorPanel;