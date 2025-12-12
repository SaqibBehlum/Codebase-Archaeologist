import React from 'react';
import { ViewMode } from '../types';

interface AnalysisTabsProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  securityCount: number;
}

const AnalysisTabs: React.FC<AnalysisTabsProps> = ({ currentMode, onModeChange, securityCount }) => {
  const tabs = [
    { mode: ViewMode.DOCS, label: 'Documentation', icon: '📄' },
    { mode: ViewMode.EXPLAIN, label: 'Explanation', icon: '💡' },
    { mode: ViewMode.SECURITY, label: 'Security', icon: '🛡️', badge: securityCount > 0 ? securityCount : undefined },
    { mode: ViewMode.REFACTOR, label: 'Refactor', icon: '🔧' },
    { mode: ViewMode.CHAT, label: 'Assistant', icon: '💬' },
  ];

  return (
    <div className="flex border-b border-stone-800 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.mode}
          onClick={() => onModeChange(tab.mode)}
          className={`
            flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap
            ${currentMode === tab.mode 
              ? 'bg-stone-800 text-amber-500 border-b-2 border-amber-500' 
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'}
          `}
        >
          <span>{tab.icon}</span>
          {tab.label}
          {tab.badge !== undefined && (
            <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-rose-900 text-rose-200 rounded-full">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default AnalysisTabs;