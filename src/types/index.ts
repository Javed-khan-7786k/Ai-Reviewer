export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DocumentType = 'resume' | 'general';
export type Plan = 'free' | 'pro';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  documentType: DocumentType;
  readabilityScore: number | null;
  aiScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResult {
  id: string;
  documentId: string;
  aiScore: number | null;
  readabilityScore: number | null;
  keywords: string[];
  summary: string;
  paragraphs: AnalysisParagraph[];
  suggestions: string[];
  resumeSections?: ResumeSection[];
}

export interface AnalysisParagraph {
  id: string;
  paragraphIndex: number;
  text: string;
  aiScore: number | null;
  explanation: string | null;
  rewriteSuggestion: string | null;
}

export interface ResumeSection {
  name: string;
  completeness: 'complete' | 'partial' | 'missing';
  feedback: string;
}

export interface UsageStats {
  documentsProcessed: number;
  dailyLimit: number;
  totalDocuments: number;
  completedAnalyses: number;
  processingDocuments: number;
}
