export type UserPlan = "free" | "pro";

export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export type DocumentType = "resume" | "general";

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string | null;
  plan: UserPlan;
  role: UserRole;
  passwordHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  userId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  documentType: DocumentType;
  aiScore: number | null; // 0 to 100
  keywords: string[];
  readability: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AnalysisJob {
  id: string;
  documentId: string;
  status: DocumentStatus;
  attempts: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeSections {
  summary?: string;
  skills: string[];
  experience: {
    company?: string;
    role?: string;
    period?: string;
    bullets: string[];
  }[];
  education: {
    institution?: string;
    degree?: string;
    year?: string;
  }[];
  strengths: string[];
  improvements: string[];
  actionVerbsFound: string[];
  quantifiableMetricsCount: number;
  completenessScore: number; // 0 - 100
}

export interface AnalysisParagraph {
  id: string;
  resultId: string;
  paragraphIndex: number;
  text: string;
  aiScore: number | null; // 0 to 100
  explanation: string | null;
  rewriteSuggestion: string | null;
}

export interface AnalysisResult {
  id: string;
  documentId: string;
  analysisVersion: string;
  detectorProvider: string;
  detectorVersion: string;
  aiScore: number | null;
  readabilityScore: number | null;
  keywords: string[];
  resumeSections: ResumeSections | null;
  summary: string | null;
  paragraphs: AnalysisParagraph[];
  wordCount: number;
  readingTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentWithAnalysis extends Document {
  analysisResult?: AnalysisResult | null;
  analysisJob?: AnalysisJob | null;
}

export interface UsageRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  documentsProcessed: number;
  rewriteRequests: number;
  createdAt: string;
  updatedAt: string;
}

export type RewriteTone =
  | "clearer"
  | "concise"
  | "professional"
  | "natural"
  | "grammar";

export interface RewriteResponse {
  originalText: string;
  rewrittenText: string;
  tone: RewriteTone;
  explanation: string;
}
