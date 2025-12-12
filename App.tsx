import React, { useState, useRef, useEffect } from 'react';
import { analyzeCode, createChatSession } from './services/geminiService';
import { AnalysisResult, ViewMode, SampleType, AnalysisHistoryItem } from './types';
import { SAMPLE_CODE, APP_USER_GUIDE } from './constants';
import AnalysisTabs from './components/AnalysisTabs';
import CodeViewer from './components/CodeViewer';
import SecurityPanel from './components/SecurityPanel';
import RefactorPanel from './components/RefactorPanel';
import MarkdownView from './components/MarkdownView';
import ChatInterface from './components/ChatInterface';
import HistoryPanel from './components/HistoryPanel';
import { Chat } from '@google/genai';

const App: React.FC = () => {
  const [code, setCode] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DOCS);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('archaeologist_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (newResult: AnalysisResult) => {
    const newItem: AnalysisHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      summary: newResult.summary,
      detectedLanguage: newResult.detectedLanguage,
      result: newResult
    };
    const updated = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(updated);
    localStorage.setItem('archaeologist_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('archaeologist_history');
  };

  const startNewSession = () => {
      // Clears workspace but keeps history
      setCode("");
      setImageSrc(null);
      setImageFile(null);
      setResult(null);
      setChatSession(null);
      setViewMode(ViewMode.DOCS);
  };

  const restoreHistoryItem = (item: AnalysisHistoryItem) => {
    setResult(item.result);
    
    // Prioritize sourceCode from result, fallback to empty string if missing
    const codeToRestore = item.result.sourceCode || "";
    setCode(codeToRestore);
    
    // Clear image when restoring (unless we support image history visualization later)
    setImageSrc(null);
    setImageFile(null);

    setChatSession(createChatSession(codeToRestore));
    setShowHistory(false);
  };

  const handleAnalyze = async () => {
    if (!code.trim() && !imageSrc) return;
    setIsAnalyzing(true);
    setResult(null);
    setChatSession(null);
    
    try {
      const data = await analyzeCode(
          code, 
          imageSrc || undefined, 
          imageFile?.type
      );
      
      // Ensure sourceCode is populated in the result object before saving.
      // If the API didn't return transcribed code (e.g. text input), use the input code.
      // If image was used, data.sourceCode should be populated by the API schema.
      if (!data.sourceCode && code.trim() && !imageSrc) {
        data.sourceCode = code;
      }

      setResult(data);
      if (data.sourceCode && imageSrc) {
        // If we analyzed an image, replace the "context instructions" with the transcribed code
        setCode(data.sourceCode);
      }
      
      saveToHistory(data);
      setChatSession(createChatSession(data.sourceCode || code));
    } catch (err: any) {
      console.error(err);
      if (err.toString().includes('403') || err.toString().toLowerCase().includes('permission denied')) {
          alert("API Access Denied (403). If you are using a shared link, you must Fork this project to use your own API Key.");
      } else {
          alert("Analysis failed. Please check your API Key, internet connection, or try a smaller file.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const loadSample = (value: string) => {
    if (value === "AUTO") {
        startNewSession();
        return;
    }
    const type = value as SampleType;
    setCode(SAMPLE_CODE[type]);
    setImageSrc(null);
    setImageFile(null);
    setResult(null);
    setChatSession(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
                setImageSrc(event.target.result);
                setImageFile(file);
                setCode(''); // Clear code so user can type context for the image
                setResult(null);
            }
        };
        reader.readAsDataURL(file);
    } else {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
                setCode(event.target.result);
                setImageSrc(null);
                setImageFile(null);
                setResult(null);
            }
        };
        reader.readAsText(file);
    }
  };

  const clearImage = () => {
      setImageSrc(null);
      setImageFile(null);
  };

  const downloadDocs = () => {
    if (!result) return;
    const blob = new Blob([result.readme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-stone-950 text-stone-200 overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-3 sm:px-6 bg-stone-900 border-b border-stone-800 z-30 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl sm:text-2xl">🏺</span>
            {/* Optimized Title for Mobile */}
            <h1 className="text-sm sm:text-lg font-bold tracking-wider text-amber-500 uppercase truncate">
              Codebase Archaeologist
            </h1>
          </div>
          <button 
            onClick={startNewSession}
            className="ml-1 sm:ml-4 px-2 sm:px-3 py-1 bg-amber-700/20 hover:bg-amber-700/40 text-amber-500 border border-amber-800/50 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap shrink-0"
          >
            + New
          </button>
        </div>
        <div className="flex gap-3 sm:gap-4 items-center text-xs sm:text-sm shrink-0">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1 transition-colors ${showHistory ? 'text-amber-500' : 'text-stone-400 hover:text-stone-200'}`}
          >
            <span>📜</span> <span>History</span>
          </button>
          <div className="h-4 w-px bg-stone-800 hidden sm:block"></div>
           <button 
            onClick={() => setShowDocumentation(true)}
            className="text-stone-400 hover:text-stone-200 transition-colors flex items-center gap-1 hidden sm:flex"
          >
            <span>📖</span> <span>Docs</span>
          </button>
          <div className="h-4 w-px bg-stone-800 hidden sm:block"></div>
          <button 
            type="button"
            onClick={() => setShowAbout(true)}
            className="text-stone-400 hover:text-stone-200 transition-colors hidden sm:block"
          >
            About
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* History Panel (Overlay) */}
        {showHistory && (
            <HistoryPanel 
                history={history}
                onSelect={restoreHistoryItem}
                onClose={() => setShowHistory(false)}
                onClear={clearHistory}
            />
        )}

        {/* Left: Input Panel */}
        {/* Mobile Logic: If no result, take full height (hide results). If result, take 40%. Desktop always 1/3. */}
        <div className={`
            w-full md:w-1/3 md:min-w-[320px] flex flex-col border-b md:border-b-0 md:border-r border-stone-800 bg-stone-925 z-10 relative transition-all duration-300
            ${result ? 'h-[40%] md:h-full' : 'h-full md:h-full'}
        `}>
          <div className="p-3 border-b border-stone-800 space-y-3 shrink-0">
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                title="Supported: .js, .py, .java, .cpp, .php, .go, .sql, .sh, .xml, .json, .md, .png, .jpg..."
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-sm transition-colors border border-stone-700 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>📂</span> Upload
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".txt,.js,.py,.java,.c,.cpp,.h,.cs,.php,.go,.rb,.rs,.ts,.tsx,.jsx,.html,.css,.md,.json,.sql,.sh,.bat,.xml,.yaml,.yml,.ini,.conf,.properties,image/png,image/jpeg,image/webp"
                className="hidden" 
              />
            </div>
            <select 
                onChange={(e) => loadSample(e.target.value)} 
                className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-sm border border-stone-700 focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>Load Sample Code</option>
                <option value="AUTO">Clear / Reset</option>
                {Object.values(SampleType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
          </div>
          
          <div className="flex-1 p-3 flex flex-col min-h-0">
            <label className="text-xs font-bold text-stone-500 uppercase mb-2 flex justify-between shrink-0">
                <span>{imageSrc ? 'Context / Instructions' : 'Source Code'}</span>
                {!imageSrc && <span className="hidden sm:inline text-stone-600 font-normal normal-case">Ctrl+Enter to Run</span>}
            </label>
            
            <div className="flex-1 relative min-h-0 bg-stone-900 rounded-lg border border-stone-800 overflow-hidden flex flex-col">
                {imageSrc && (
                    <div className="shrink-0 p-3 bg-stone-950/50 border-b border-stone-800 flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="relative group border border-stone-700 rounded overflow-hidden shadow-sm">
                             <img src={imageSrc} alt="Preview" className="h-16 md:h-24 w-auto object-contain bg-stone-900" />
                             <button 
                                onClick={clearImage}
                                className="absolute top-1 right-1 bg-black/70 hover:bg-rose-900/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove Image"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                             </button>
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                            <p className="text-xs text-stone-300 font-bold truncate">{imageFile?.name}</p>
                            <p className="text-[10px] text-stone-500 mt-1">Image loaded. The AI will extract code.</p>
                        </div>
                    </div>
                )}
                
                <textarea
                    className="flex-1 w-full h-full bg-stone-900 text-stone-300 p-4 font-mono text-sm resize-none focus:outline-none focus:border-amber-600/50"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={imageSrc ? "Optional: Add context about the image..." : "Paste legacy code here..."}
                    spellCheck={false}
                />
            </div>
          </div>

          <div className="p-4 bg-stone-900 border-t border-stone-800 shrink-0">
             <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!code.trim() && !imageSrc)}
                className={`w-full py-3 rounded font-bold text-sm tracking-wide uppercase transition-all
                  ${isAnalyzing 
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed' 
                    : 'bg-amber-600 hover:bg-amber-500 text-black shadow-lg shadow-amber-900/20'
                  }`}
             >
               {isAnalyzing ? (
                 <span className="flex items-center justify-center gap-2">
                   <svg className="animate-spin h-4 w-4 text-stone-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   {imageSrc ? 'Scanning...' : 'Processing...'}
                 </span>
               ) : (imageSrc ? 'Analyze Image' : 'Analyze Code')}
             </button>
          </div>
        </div>

        {/* Right: Results Panel */}
        {/* Mobile Logic: Hide if no result to allow input to take full screen. */}
        <div className={`
            w-full md:flex-1 flex flex-col bg-stone-950 overflow-hidden relative z-0
            ${result ? 'h-[60%] md:h-full' : 'hidden md:flex h-0 md:h-full'}
        `}>
          {!result && !isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-600 pointer-events-none p-4 text-center">
              <span className="text-6xl mb-4 opacity-20">📜</span>
              <p className="text-lg">Upload an image or paste code to begin excavation.</p>
              <p className="text-sm mt-2 opacity-50">Supported: Code (JS, Py, Java, SQL, C++...), Configs & Images</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 z-10 bg-stone-950/80 backdrop-blur-sm transition-all duration-500">
               <div className="relative">
                  <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                  <svg className="animate-spin h-16 w-16 text-amber-500 relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
               </div>
               <p className="mt-6 text-lg font-mono text-amber-500 font-bold tracking-widest uppercase animate-pulse">
                  {imageSrc ? 'Deciphering Artifact...' : 'Analyzing Relic...'}
               </p>
               <p className="text-xs text-stone-500 mt-2">Consulting Gemini 3 Pro...</p>
            </div>
          )}

          {result && !isAnalyzing && (
            <>
              <div className="shrink-0">
                  <AnalysisTabs 
                    currentMode={viewMode} 
                    onModeChange={setViewMode} 
                    securityCount={result.securityIssues.length}
                  />
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {viewMode === ViewMode.DOCS && (
                  <div className="max-w-3xl mx-auto space-y-8 pb-10">
                    <div className="flex flex-wrap gap-2 justify-between items-center">
                      <div className="bg-stone-900 text-stone-400 px-3 py-1 rounded text-xs border border-stone-800 flex items-center gap-2">
                         <span>Detected:</span>
                         <span className="text-amber-500 font-bold">{result.detectedLanguage}</span>
                      </div>
                      <button onClick={downloadDocs} className="text-xs bg-stone-800 hover:bg-stone-700 text-amber-500 px-3 py-1 rounded border border-stone-700">
                        Download README
                      </button>
                    </div>
                    <div>
                      <h2 className="text-amber-500 text-sm font-bold uppercase mb-2 tracking-wide">Summary</h2>
                      <p className="text-lg text-stone-300 leading-relaxed border-l-4 border-amber-600/50 pl-4">{result.summary}</p>
                    </div>
                    {/* If source code was extracted from image, show it here lightly */}
                    {imageSrc && result.sourceCode && (
                        <div className="bg-stone-900 p-4 rounded border border-stone-800">
                            <h3 className="text-xs font-bold text-stone-500 uppercase mb-2">Transcribed Source</h3>
                            <CodeViewer code={result.sourceCode} className="max-h-40" />
                        </div>
                    )}
                    <div className="h-px bg-stone-800 w-full" />
                    <div>
                      <h2 className="text-stone-500 text-sm font-bold uppercase mb-4 tracking-wide">Generated Documentation</h2>
                      <MarkdownView content={result.readme} />
                    </div>
                  </div>
                )}

                {viewMode === ViewMode.EXPLAIN && (
                   <div className="max-w-3xl mx-auto space-y-8 pb-10">
                     <div className="bg-stone-900 p-6 rounded-lg border border-stone-800">
                        <h2 className="text-amber-500 text-lg font-bold mb-4">High-Level Overview</h2>
                        <ul className="space-y-3">
                          {result.highLevelBullets.map((bullet, i) => (
                            <li key={i} className="flex gap-3 text-stone-300">
                              <span className="text-amber-600 font-bold">•</span>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                     </div>
                     <div>
                       <h2 className="text-stone-400 font-bold mb-4 uppercase text-sm">Detailed Breakdown</h2>
                       <MarkdownView content={result.detailedExplanation} />
                     </div>
                   </div>
                )}

                {viewMode === ViewMode.SECURITY && (
                  <div className="max-w-4xl mx-auto pb-10">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-stone-200">Security & Robustness Scan</h2>
                      <p className="text-stone-500">Analysis of potential vulnerabilities, race conditions, and bad patterns.</p>
                    </div>
                    <SecurityPanel issues={result.securityIssues} />
                  </div>
                )}

                {viewMode === ViewMode.REFACTOR && (
                  <div className="max-w-4xl mx-auto pb-10">
                     <div className="mb-6">
                      <h2 className="text-2xl font-bold text-stone-200">Refactoring Suggestions</h2>
                      <p className="text-stone-500">Modernization and code quality improvements.</p>
                    </div>
                    <RefactorPanel suggestions={result.refactorSuggestions} />
                  </div>
                )}

                {viewMode === ViewMode.CHAT && (
                  <div className="h-full flex flex-col pb-2">
                     <ChatInterface chatSession={chatSession} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-lg w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-200"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-amber-500 mb-4">About Codebase Archaeologist</h2>
            <div className="space-y-3 text-stone-300 text-sm">
              <p>
                This tool uses <strong>Gemini 3 Pro</strong> to analyze legacy code snippets and images.
              </p>
              <h3 className="font-bold text-stone-100 mt-4">Capabilities:</h3>
              <ul className="list-disc ml-4 space-y-1">
                <li><strong>Image Analysis:</strong> Upload screenshots of code for OCR and analysis.</li>
                <li><strong>History:</strong> Resume your previous investigations.</li>
                <li><strong>Security Scan:</strong> Detect vulnerabilities and bad patterns.</li>
                <li><strong>Refactoring:</strong> Get modern code suggestions.</li>
              </ul>
              <div className="mt-4 p-3 bg-stone-950 rounded border border-stone-800 text-xs text-stone-500">
                <p><strong>Note on Navigation:</strong> Use the "New Session" button to start fresh without losing history.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowAbout(false)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2 rounded text-sm border border-stone-700"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Documentation Modal */}
      {showDocumentation && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-4xl w-full h-[80vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-stone-800">
                <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                    <span>📖</span> Documentation & User Guide
                </h2>
                <button 
                  onClick={() => setShowDocumentation(false)}
                  className="text-stone-500 hover:text-stone-200"
                >
                  ✕
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {/* Use MarkdownView to render the User Guide */}
                 <MarkdownView content={APP_USER_GUIDE} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;