import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const genAI = new GoogleGenAI({ apiKey });

const ANALYSIS_SYSTEM_INSTRUCTION = `
You are an expert Senior Software Engineer and "Code Archaeologist". 
Your goal is to analyze legacy code, understand its purpose, document it, find security flaws, and suggest modern refactors.
If an image is provided, you must first transcribe the code from the image accurately into the "sourceCode" field, then analyze that code.
You are meticulous, security-conscious, and clear in your explanations.
`;

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    detectedLanguage: { type: Type.STRING, description: "The programming language of the snippet (e.g., Python, JavaScript, Java)." },
    sourceCode: { type: Type.STRING, description: "The code content. If input was an image, this MUST be the exact transcribed code." },
    summary: { type: Type.STRING, description: "A concise 1-2 sentence summary of what the code does." },
    readme: { type: Type.STRING, description: "A full README.md content in Markdown format, including Title, Description, and Setup." },
    highLevelBullets: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "3 bullet points explaining the core logic at a high level."
    },
    detailedExplanation: { type: Type.STRING, description: "A detailed breakdown of the code logic in Markdown." },
    usageExamples: { type: Type.STRING, description: "Markdown code blocks showing how to use this code." },
    integrationGuide: { type: Type.STRING, description: "Short guide on how to integrate this module." },
    securityIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
          type: { type: Type.STRING },
          description: { type: Type.STRING },
          suggestedFix: { type: Type.STRING, description: "A code snippet or explanation of the fix." }
        },
        required: ['severity', 'type', 'description', 'suggestedFix']
      }
    },
    refactorSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          diffCode: { type: Type.STRING, description: "A code block showing the refactored version or a diff." }
        },
        required: ['title', 'description', 'diffCode']
      }
    }
  },
  required: ['detectedLanguage', 'sourceCode', 'summary', 'readme', 'highLevelBullets', 'detailedExplanation', 'usageExamples', 'integrationGuide', 'securityIssues', 'refactorSuggestions']
};

export const analyzeCode = async (code: string, imageBase64?: string, mimeType?: string): Promise<AnalysisResult> => {
  if (!code.trim() && !imageBase64) throw new Error("No code or image provided");

  try {
    const parts: any[] = [];
    
    if (imageBase64 && mimeType) {
      // Clean base64 string if it contains the header
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanBase64
        }
      });
      parts.push({ text: "Please transcribe the code in this image and then analyze it according to the schema. If the text is partially visible, do your best to reconstruct the logic." });
      
      // If code text is provided alongside image, treat it as context/instructions
      if (code.trim()) {
        parts.push({ text: `Additional User Context/Instructions about the image:\n${code}` });
      }

    } else if (code.trim()) {
      parts.push({ text: `Analyze the following legacy code snippet deeply:\n\n${code}` });
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: { parts },
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("No response generated");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const createChatSession = (code: string) => {
  const chat = genAI.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are a helpful assistant discussing a specific piece of legacy code. 
      Context Code:
      \`\`\`
      ${code.substring(0, 10000)}
      \`\`\`
      Your goal is to answer user questions about this code.
      IMPORTANT: The user might make spelling mistakes or use vague terms. You must robustly infer their intent based on the context of the code. 
      For example, if they ask "how to tst", assume they mean "test". If they ask about "sqL ingection", assume "SQL injection".
      Be concise, technical, and helpful.
      `
    }
  });
  return chat;
};