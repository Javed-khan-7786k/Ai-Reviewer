import { PrismaClient } from "@prisma/client";
import {
  User,
  Document,
  AnalysisResult,
  AnalysisParagraph,
  AnalysisJob,
  UsageRecord,
  DocumentWithAnalysis,
  ResumeSections,
} from "@/types";
import { getAdminConfig } from "./admin";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// MongoDB is REQUIRED for production/Vercel deployment
// No local filesystem fallback — Vercel has read-only fs
export const prisma: PrismaClient = (() => {
  if (global.__prisma) return global.__prisma;
  const client = new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    global.__prisma = client;
  }
  return client;
})();

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function mapUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    plan: u.plan as "free" | "pro",
    role: (u.role || "user") as "user" | "admin",
    passwordHash: u.passwordHash || null,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : u.updatedAt,
  };
}

function mapDocument(d: any): Document {
  return {
    id: d.id,
    userId: d.userId,
    fileName: d.fileName,
    storageKey: d.storageKey,
    mimeType: d.mimeType,
    fileSize: d.fileSize,
    status: d.status as Document["status"],
    documentType: d.documentType as Document["documentType"],
    aiScore: d.aiScore,
    keywords: d.keywords || [],
    readability: d.readability,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : d.updatedAt,
    deletedAt: d.deletedAt ? (d.deletedAt instanceof Date ? d.deletedAt.toISOString() : d.deletedAt) : null,
  };
}

function mapUsageRecord(r: any): UsageRecord {
  return {
    id: r.id,
    userId: r.userId,
    date: r.date,
    documentsProcessed: r.documentsProcessed,
    rewriteRequests: r.rewriteRequests,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
  };
}

export const db = {
  async getDefaultUser(): Promise<User> {
    // Try to find existing admin/demo user, or create one
    let user = await prisma.user.findFirst({
      where: { email: "alex.taylor@example.com" },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "alex.taylor@example.com",
          name: "Alex Taylor",
          plan: "free",
          role: "admin",
        },
      });
    }
    return mapUser(user);
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) return null;
    return mapUser(user);
  },

  async getUser(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      return mapUser(user);
    } catch {
      // If id format is invalid for MongoDB ObjectId, try by email
      const user = await prisma.user.findFirst({
        where: { OR: [{ email: id }] },
      });
      if (!user) return null;
      return mapUser(user);
    }
  },

  async createUser(data: {
    id?: string;
    name: string;
    email: string;
    plan?: "free" | "pro";
    role?: "user" | "admin";
    passwordHash?: string | null;
  }): Promise<User> {
    const cleanEmail = data.email.trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      // Update existing user if needed
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...(data.name ? { name: data.name.trim() } : {}),
          ...(data.plan ? { plan: data.plan } : {}),
          ...(data.role ? { role: data.role } : {}),
          ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
        },
      });
      return mapUser(updated);
    }

    const created = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: cleanEmail,
        plan: data.plan || "free",
        role: data.role || "user",
        passwordHash: data.passwordHash || null,
      },
    });
    return mapUser(created);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.plan ? { plan: updates.plan } : {}),
          ...(updates.role ? { role: updates.role } : {}),
          ...(updates.passwordHash !== undefined ? { passwordHash: updates.passwordHash } : {}),
        },
      });
      return mapUser(updated);
    } catch {
      return null;
    }
  },

  async listUsers(): Promise<User[]> {
    const all = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return all.map(mapUser);
  },

  async getUserUsageToday(userId: string): Promise<UsageRecord> {
    const today = getTodayString();
    const record = await prisma.usageRecord.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (record) {
      return mapUsageRecord(record);
    }
    return {
      id: "temp",
      userId,
      date: today,
      documentsProcessed: 0,
      rewriteRequests: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async incrementUserUsage(
    userId: string,
    type: "document" | "rewrite"
  ): Promise<UsageRecord> {
    const today = getTodayString();
    const updated = await prisma.usageRecord.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        documentsProcessed: type === "document" ? { increment: 1 } : undefined,
        rewriteRequests: type === "rewrite" ? { increment: 1 } : undefined,
      },
      create: {
        userId,
        date: today,
        documentsProcessed: type === "document" ? 1 : 0,
        rewriteRequests: type === "rewrite" ? 1 : 0,
      },
    });
    return mapUsageRecord(updated);
  },

  async createDocument(data: {
    userId: string;
    fileName: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    documentType: "resume" | "general";
  }): Promise<Document> {
    const created = await prisma.document.create({
      data: {
        userId: data.userId,
        fileName: data.fileName,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        documentType: data.documentType,
        status: "pending",
        keywords: [],
      },
    });

    // Create initial analysis job
    await prisma.analysisJob.create({
      data: {
        documentId: created.id,
        status: "pending",
      },
    });

    return mapDocument(created);
  },

  async getDocument(id: string): Promise<DocumentWithAnalysis | null> {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        analysisJob: true,
        analysisResult: {
          include: {
            paragraphs: {
              orderBy: { paragraphIndex: "asc" },
            },
          },
        },
      },
    });
    if (!doc || doc.deletedAt) return null;

    return {
      ...mapDocument(doc),
      analysisJob: doc.analysisJob
        ? {
            id: doc.analysisJob.id,
            documentId: doc.analysisJob.documentId,
            status: doc.analysisJob.status as Document["status"],
            attempts: doc.analysisJob.attempts,
            errorMessage: doc.analysisJob.errorMessage,
            startedAt: doc.analysisJob.startedAt?.toISOString() || null,
            completedAt: doc.analysisJob.completedAt?.toISOString() || null,
            createdAt: doc.analysisJob.createdAt.toISOString(),
            updatedAt: doc.analysisJob.updatedAt.toISOString(),
          }
        : null,
      analysisResult: doc.analysisResult
        ? {
            id: doc.analysisResult.id,
            documentId: doc.analysisResult.documentId,
            analysisVersion: doc.analysisResult.analysisVersion,
            detectorProvider: doc.analysisResult.detectorProvider,
            detectorVersion: doc.analysisResult.detectorVersion,
            aiScore: doc.analysisResult.aiScore,
            readabilityScore: doc.analysisResult.readabilityScore,
            keywords: doc.analysisResult.keywords,
            resumeSections: doc.analysisResult.resumeSections as ResumeSections | null,
            summary: doc.analysisResult.summary,
            wordCount: doc.analysisResult.paragraphs.reduce(
              (sum, p) => sum + p.text.split(/\s+/).filter(Boolean).length, 0
            ),
            readingTimeMinutes: Math.max(1, Math.round(
              doc.analysisResult.paragraphs.reduce(
                (sum, p) => sum + p.text.split(/\s+/).filter(Boolean).length, 0
              ) / 200
            )),
            paragraphs: doc.analysisResult.paragraphs.map((p) => ({
              id: p.id,
              resultId: p.resultId,
              paragraphIndex: p.paragraphIndex,
              text: p.text,
              aiScore: p.aiScore,
              explanation: p.explanation,
              rewriteSuggestion: p.rewriteSuggestion,
            })),
            createdAt: doc.analysisResult.createdAt.toISOString(),
            updatedAt: doc.analysisResult.updatedAt.toISOString(),
          }
        : null,
    };
  },

  async listDocuments(
    userId: string,
    options?: { search?: string; status?: string; type?: string }
  ): Promise<Document[]> {
    const where: Record<string, unknown> = { userId, deletedAt: null };
    if (options?.status && options.status !== "all") {
      where.status = options.status;
    }
    if (options?.type && options.type !== "all") {
      where.documentType = options.type;
    }
    if (options?.search) {
      where.fileName = { contains: options.search, mode: "insensitive" };
    }

    const docs = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return docs.map(mapDocument);
  },

  async updateDocument(id: string, data: Partial<Document>): Promise<Document | null> {
    try {
      const updated = await prisma.document.update({
        where: { id },
        data: {
          ...(data.status ? { status: data.status } : {}),
          ...(data.documentType ? { documentType: data.documentType } : {}),
          ...(data.aiScore !== undefined ? { aiScore: data.aiScore } : {}),
          ...(data.readability !== undefined ? { readability: data.readability } : {}),
          ...(data.keywords ? { keywords: data.keywords } : {}),
        },
      });
      return mapDocument(updated);
    } catch {
      return null;
    }
  },

  async deleteDocument(id: string): Promise<boolean> {
    try {
      await prisma.document.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  },

  async saveAnalysisResult(params: {
    documentId: string;
    aiScore: number | null;
    readabilityScore: number | null;
    keywords: string[];
    summary: string | null;
    resumeSections: ResumeSections | null;
    detectorProvider?: string;
    detectorVersion?: string;
    paragraphs: Array<{
      paragraphIndex: number;
      text: string;
      aiScore: number | null;
      explanation: string | null;
      rewriteSuggestion: string | null;
    }>;
  }): Promise<AnalysisResult> {
    const totalWords = params.paragraphs.reduce(
      (acc, p) => acc + p.text.split(/\s+/).filter(Boolean).length, 0
    );
    const readingTime = Math.max(1, Math.round(totalWords / 200));

    // Delete existing result if any (idempotent)
    const existing = await prisma.analysisResult.findUnique({
      where: { documentId: params.documentId },
    });
    if (existing) {
      await prisma.analysisParagraph.deleteMany({ where: { resultId: existing.id } });
      await prisma.analysisResult.delete({ where: { id: existing.id } });
    }

    const created = await prisma.analysisResult.create({
      data: {
        documentId: params.documentId,
        aiScore: params.aiScore,
        readabilityScore: params.readabilityScore,
        keywords: params.keywords,
        summary: params.summary,
        resumeSections: params.resumeSections as unknown as object,
        detectorProvider: params.detectorProvider || "linguistic-heuristics",
        detectorVersion: params.detectorVersion || "1.0",
        paragraphs: {
          create: params.paragraphs.map((p) => ({
            paragraphIndex: p.paragraphIndex,
            text: p.text,
            aiScore: p.aiScore,
            explanation: p.explanation,
            rewriteSuggestion: p.rewriteSuggestion,
          })),
        },
      },
      include: { paragraphs: true },
    });

    // Update document status and scores
    await prisma.document.update({
      where: { id: params.documentId },
      data: {
        status: "completed",
        aiScore: params.aiScore,
        readability: params.readabilityScore,
        keywords: params.keywords,
      },
    });

    return {
      id: created.id,
      documentId: created.documentId,
      analysisVersion: created.analysisVersion,
      detectorProvider: created.detectorProvider,
      detectorVersion: created.detectorVersion,
      aiScore: created.aiScore,
      readabilityScore: created.readabilityScore,
      keywords: created.keywords,
      resumeSections: created.resumeSections as ResumeSections | null,
      summary: created.summary,
      wordCount: totalWords,
      readingTimeMinutes: readingTime,
      paragraphs: created.paragraphs.map((p) => ({
        id: p.id,
        resultId: p.resultId,
        paragraphIndex: p.paragraphIndex,
        text: p.text,
        aiScore: p.aiScore,
        explanation: p.explanation,
        rewriteSuggestion: p.rewriteSuggestion,
      })),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  },

  async markDocumentFailed(documentId: string, errorMessage: string): Promise<void> {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "failed" },
    });
    try {
      await prisma.analysisJob.update({
        where: { documentId },
        data: { status: "failed", errorMessage, completedAt: new Date() },
      });
    } catch {
      // Job may not exist
    }
  },

  async getDashboardStats(userId: string) {
    const docs = await this.listDocuments(userId);
    const usage = await this.getUserUsageToday(userId);
    const user = await this.getUser(userId);

    const total = docs.length;
    const completed = docs.filter((d) => d.status === "completed").length;
    const processing = docs.filter(
      (d) => d.status === "processing" || d.status === "pending"
    ).length;

    const completedScores = docs
      .filter((d) => d.status === "completed" && typeof d.aiScore === "number")
      .map((d) => d.aiScore as number);

    const avgAiScore =
      completedScores.length > 0
        ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
        : null;

    const config = getAdminConfig();
    const isPro = user?.plan === "pro";
    const isUnlimited = config.fullAppFree;
    const dailyLimit = isUnlimited ? 9999 : isPro
      ? config.rateLimits.maxDailyUploadsPro
      : config.rateLimits.maxDailyUploadsFree;
    const dailyRewritesLimit = isUnlimited ? 9999 : isPro
      ? config.rateLimits.maxDailyRewritesPro
      : config.rateLimits.maxDailyRewritesFree;

    return {
      total,
      completed,
      processing,
      dailyUsed: usage.documentsProcessed,
      dailyLimit,
      dailyRewritesUsed: usage.rewriteRequests,
      dailyRewritesLimit,
      isUnlimited,
      maxFileSizeMB: config.rateLimits.maxFileSizeMB,
      avgAiScore,
      recentDocuments: docs.slice(0, 5),
    };
  },
};
