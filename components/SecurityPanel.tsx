import React from 'react';
import { SecurityIssue } from '../types';

interface SecurityPanelProps {
  issues: SecurityIssue[];
}

const SecurityPanel: React.FC<SecurityPanelProps> = ({ issues }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-rose-950 border-rose-600 text-rose-200';
      case 'high': return 'bg-orange-950 border-orange-600 text-orange-200';
      case 'medium': return 'bg-yellow-950 border-yellow-600 text-yellow-200';
      default: return 'bg-blue-950 border-blue-600 text-blue-200';
    }
  };

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-stone-500">
        <span className="text-4xl mb-4">🛡️</span>
        <p>No major security issues detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {issues.map((issue, idx) => (
        <div 
          key={idx} 
          className={`p-4 rounded-lg border border-l-4 ${getSeverityColor(issue.severity)}`}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">{issue.type}</h3>
            <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-black/30 rounded">
              {issue.severity}
            </span>
          </div>
          <p className="mb-3 opacity-90">{issue.description}</p>
          
          <div className="bg-black/20 p-3 rounded mt-2">
            <span className="text-xs font-bold uppercase tracking-wide opacity-70 block mb-1">Suggested Fix</span>
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {issue.suggestedFix}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SecurityPanel;