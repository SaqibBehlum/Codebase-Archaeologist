import React from 'react';

interface MarkdownViewProps {
  content: string;
}

const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  // Simple parser for inline formatting (bold, italics, code)
  const parseInline = (text: string) => {
    // Regex matches: `code`, **bold**, *italic*
    // We use a capture group to keep the delimiters in the split result so we can process them
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-200 font-mono text-xs mx-0.5">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-amber-400 font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="text-stone-300 italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="prose prose-invert prose-stone max-w-none text-stone-300">
        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {content.split('\n').map((line, i) => {
                const trimmed = line.trim();
                
                if (trimmed.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-amber-500 mt-6 mb-4">{parseInline(trimmed.replace('# ', ''))}</h1>;
                if (trimmed.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-stone-100 mt-5 mb-3">{parseInline(trimmed.replace('## ', ''))}</h2>;
                if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-medium text-stone-200 mt-4 mb-2">{parseInline(trimmed.replace('### ', ''))}</h3>;
                
                // Bullet points: match "- " or "* " at the start of the line
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                     return <li key={i} className="ml-4 text-stone-300 list-disc">{parseInline(trimmed.substring(2))}</li>;
                }
                
                if (trimmed.startsWith('```')) return <div key={i} className="my-2 border-t border-b border-stone-700 h-1 w-full opacity-50"></div>;
                
                // Empty lines
                if (!trimmed) return <div key={i} className="h-4"></div>;
                
                return <p key={i} className="min-h-[1em] mb-1">{parseInline(line)}</p>;
            })}
        </div>
    </div>
  );
};

export default MarkdownView;