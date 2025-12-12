import React from 'react';
import { AnalysisHistoryItem } from '../types';

interface HistoryPanelProps {
  history: AnalysisHistoryItem[];
  onSelect: (item: AnalysisHistoryItem) => void;
  onClose: () => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onClose, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-stone-900 border-l border-stone-800 w-80 shadow-2xl absolute right-0 top-0 z-40 transition-transform">
      <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-900">
        <h2 className="font-bold text-amber-500 uppercase tracking-wide text-sm">Excavation History</h2>
        <button onClick={onClose} className="text-stone-500 hover:text-stone-300">✕</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.length === 0 ? (
          <div className="text-center p-8 text-stone-600 text-sm">
            <p>No previous excavations found.</p>
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full text-left p-3 rounded bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-all group"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-amber-500/80 text-xs font-bold font-mono">
                  {item.detectedLanguage}
                </span>
                <span className="text-stone-500 text-[10px]">
                  {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-stone-300 text-xs line-clamp-2 leading-relaxed">
                {item.summary}
              </p>
            </button>
          ))
        )}
      </div>

      {history.length > 0 && (
        <div className="p-4 border-t border-stone-800">
            <button 
                onClick={onClear}
                className="w-full text-xs text-stone-500 hover:text-rose-500 transition-colors"
            >
                Clear History
            </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;