export interface SecurityIssue {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  type: string;
  description: string;
  suggestedFix: string;
}

export interface RefactorSuggestion {
  title: string;
  description: string;
  diffCode: string;
}

export interface AnalysisResult {
  detectedLanguage: string;
  summary: string;
  sourceCode: string; // Extracted code (from image) or original code
  readme: string; // Markdown
  highLevelBullets: string[];
  detailedExplanation: string; // Markdown
  securityIssues: SecurityIssue[];
  refactorSuggestions: RefactorSuggestion[];
  usageExamples: string; // Markdown
  integrationGuide: string; // Markdown
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  summary: string;
  detectedLanguage: string;
  result: AnalysisResult;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum ViewMode {
  DOCS = 'DOCS',
  EXPLAIN = 'EXPLAIN',
  SECURITY = 'SECURITY',
  REFACTOR = 'REFACTOR',
  CHAT = 'CHAT'
}

export enum SampleType {
  LEGACY_JS = 'Legacy jQuery/JS',
  VULNERABLE_SQL = 'Vulnerable Python SQL',
  SPAGHETTI_JAVA = 'Complex Java Logic',
  CPP_MEMORY = 'C++ Memory Issues',
  PHP_LEGACY = 'Legacy PHP Script',
  GO_RACE = 'Go Race Condition'
}