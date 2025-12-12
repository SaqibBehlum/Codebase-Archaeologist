import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Chat } from '@google/genai';
import MarkdownView from './MarkdownView';

interface ChatInterfaceProps {
  chatSession: Chat | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatSession }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'I have analyzed the code. Ask me anything about its function, **security**, or how to test it.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg });
      const responseText = result.text || "I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Error: Failed to get response from Gemini." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 rounded-lg overflow-hidden border border-stone-700">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-amber-900/40 text-stone-100 border border-amber-800' 
                  : 'bg-stone-800 text-stone-300 border border-stone-700'
              }`}
            >
              {/* Use MarkdownView to render bold/code properly */}
              <MarkdownView content={msg.text} />
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-stone-800 text-stone-400 rounded-lg p-3 text-sm border border-stone-700 flex items-center gap-3">
               <svg className="animate-spin h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <span className="italic">Analyzing query...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 bg-stone-800 border-t border-stone-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about the code..."
          className="flex-1 bg-stone-950 text-stone-200 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
          disabled={isLoading || !chatSession}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !chatSession}
          className="bg-stone-700 hover:bg-stone-600 text-stone-200 px-4 py-2 rounded text-sm disabled:opacity-50 flex items-center justify-center min-w-[80px]"
        >
          {isLoading ? (
             <svg className="animate-spin h-4 w-4 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;