import React from 'react';

interface CodeViewerProps {
  code: string;
  className?: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code, className }) => {
  return (
    <div className={`font-mono text-sm overflow-auto bg-stone-900 p-4 rounded-lg border border-stone-800 ${className}`}>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeViewer;