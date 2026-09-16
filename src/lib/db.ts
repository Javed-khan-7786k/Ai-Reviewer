import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
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

const hasMongoUrl =
  typeof process.env.DATABASE_URL === "string" &&
  (process.env.DATABASE_URL.startsWith("mongodb://") ||
    process.env.DATABASE_URL.startsWith("mongodb+srv://"));

export const prisma: PrismaClient | null = hasMongoUrl
  ? global.__prisma || new PrismaClient()
  : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  global.__prisma = prisma;
}

// Local File-based Persistence for zero-config offline dev
const STORAGE_DIR = path.join(process.cwd(), ".storage");
const DB_FILE = path.join(STORAGE_DIR, "db.json");

interface LocalDbSchema {
  users: User[];
  documents: Document[];
  analysisJobs: AnalysisJob[];
  analysisResults: AnalysisResult[];
  analysisParagraphs: AnalysisParagraph[];
  usageRecords: UsageRecord[];
}

function ensureLocalDb(): LocalDbSchema {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const defaultUser: User = {
    id: "usr_demo_default",
    email: "alex.taylor@example.com",
    name: "Alex Taylor",
    plan: "free",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!fs.existsSync(DB_FILE)) {
    const initial: LocalDbSchema = {
      users: [defaultUser],
      documents: [],
      analysisJobs: [],
      analysisResults: [],
      analysisParagraphs: [],
      usageRecords: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = [defaultUser];
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }
    return parsed;
  } catch {
    const fallback: LocalDbSchema = {
      users: [defaultUser],
      documents: [],
      analysisJobs: [],
      analysisResults: [],
      analysisParagraphs: [],
      usageRecords: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), "utf-8");
    return fallback;
  }
}

function saveLocalDb(data: LocalDbSchema) {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export const db = {
  async getDefaultUser(): Promise<User> {
    if (prisma) {
      const existing = await prisma.user.findFirst();
      if (existing) {
        return {
          id: existing.id,
          email: existing.email,
          name: existing.name,
          plan: existing.plan as "free" | "pro",
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt.toISOString(),
        };
      }
      const created = await prisma.user.create({
        data: {
          email: "alex.taylor@example.com",
          name: "Alex Taylor",
          plan: "free",
        },
      });
      return {
        id: created.id,
        email: created.email,
        name: created.name,
        plan: created.plan as "free" | "pro",
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }

    const local = ensureLocalDb();
    return local.users[0];
  },

  async getUser(id: string): Promise<User | null> {
    if (prisma) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan as "free" | "pro",
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    }
    const local = ensureLocalDb();
    return local.users.find((u) => u.id === id) || null;
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (prisma) {
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan as "free" | "pro",
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    }
    const local = ensureLocalDb();
    return local.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  async createUser(data: {
    id?: string;
    name: string;
    email: string;
    plan?: "free" | "pro";
  }): Promise<User> {
    const cleanEmail = data.email.trim().toLowerCase();
    if (prisma) {
      const created = await prisma.user.create({
        data: {
          ...(data.id ? { id: data.id } : {}),
          name: data.name.trim(),
          email: cleanEmail,
          plan: data.plan || "free",
        },
      });
      return {
        id: created.id,
        name: created.name,
        email: created.email,
        plan: created.plan as "free" | "pro",
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }
    const local = ensureLocalDb();
    const existing = local.users.find(
      (u) => (data.id && u.id === data.id) || u.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      if (data.name && existing.name !== data.name) existing.name = data.name.trim();
      if (data.plan && existing.plan !== data.plan) existing.plan = data.plan;
      saveLocalDb(local);
      return existing;
    }

    const newUser: User = {
      id: data.id || "usr_" + Math.random().toString(36).substring(2, 9),
      name: data.name.trim(),
      email: cleanEmail,
      plan: data.plan || "free",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    local.users.push(newUser);
    saveLocalDb(local);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (prisma) {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.plan ? { plan: updates.plan } : {}),
        },
      });
      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        plan: updated.plan as "free" | "pro",
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }
    const local = ensureLocalDb();
    const user = local.users.find((u) => u.id === id);
    if (!user) return null;
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.plan !== undefined) user.plan = updates.plan;
    user.updatedAt = new Date().toISOString();
    saveLocalDb(local);
    return user;
  },

  async listUsers(): Promise<User[]> {
    if (prisma) {
      const all = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
      return all.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        plan: u.plan as "free" | "pro",
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      }));
    }
    const local = ensureLocalDb();
    return [...local.users];
  },

  async getUserUsageToday(userId: string): Promise<UsageRecord> {
    const today = getTodayString();
    if (prisma) {
      const record = await prisma.usageRecord.findUnique({
        where: { userId_date: { userId, date: today } },
      });
      if (record) {
        return {
          id: record.id,
          userId: record.userId,
          date: record.date,
          documentsProcessed: record.documentsProcessed,
          rewriteRequests: record.rewriteRequests,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        };
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
    }

    const local = ensureLocalDb();
    let record = local.usageRecords.find(
      (r) => r.userId === userId && r.date === today
    );
    if (!record) {
      record = {
        id: "usg_" + Math.random().toString(36).substring(2, 9),
        userId,
        date: today,
        documentsProcessed: 0,
        rewriteRequests: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      local.usageRecords.push(record);
      saveLocalDb(local);
    }
    return record;
  },

  async incrementUserUsage(
    userId: string,
    type: "document" | "rewrite"
  ): Promise<UsageRecord> {
    const today = getTodayString();
    if (prisma) {
      const updated = await prisma.usageRecord.upsert({
        where: { userId_date: { userId, date: today } },
        update: {
          documentsProcessed:
            type === "document" ? { increment: 1 } : undefined,
          rewriteRequests: type === "rewrite" ? { increment: 1 } : undefined,
        },
        create: {
          userId,
          date: today,
          documentsProcessed: type === "document" ? 1 : 0,
          rewriteRequests: type === "rewrite" ? 1 : 0,
        },
      });
      return {
        id: updated.id,
        userId: updated.userId,
        date: updated.date,
        documentsProcessed: updated.documentsProcessed,
        rewriteRequests: updated.rewriteRequests,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }

    const local = ensureLocalDb();
    let record = local.usageRecords.find(
      (r) => r.userId === userId && r.date === today
    );
    if (!record) {
      record = {
        id: "usg_" + Math.random().toString(36).substring(2, 9),
        userId,
        date: today,
        documentsProcessed: type === "document" ? 1 : 0,
        rewriteRequests: type === "rewrite" ? 1 : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      local.usageRecords.push(record);
    } else {
      if (type === "document") record.documentsProcessed += 1;
      if (type === "rewrite") record.rewriteRequests += 1;
      record.updatedAt = new Date().toISOString();
    }
    saveLocalDb(local);
    return record;
  },

  async createDocument(data: {
    userId: string;
    fileName: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    documentType: "resume" | "general";
  }): Promise<Document> {
    const now = new Date().toISOString();
    const docId = "doc_" + Math.random().toString(36).substring(2, 11);

    if (prisma) {
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
      // also create initial analysis job
      await prisma.analysisJob.create({
        data: {
          documentId: created.id,
          status: "pending",
        },
      });

      return {
        id: created.id,
        userId: created.userId,
        fileName: created.fileName,
        storageKey: created.storageKey,
        mimeType: created.mimeType,
        fileSize: created.fileSize,
        status: "pending",
        documentType: created.documentType as "resume" | "general",
        aiScore: null,
        keywords: [],
        readability: null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        deletedAt: null,
      };
    }

    const local = ensureLocalDb();
    const newDoc: Document = {
      id: docId,
      userId: data.userId,
      fileName: data.fileName,
      storageKey: data.storageKey,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      status: "pending",
      documentType: data.documentType,
      aiScore: null,
      keywords: [],
      readability: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    local.documents.unshift(newDoc);

    const newJob: AnalysisJob = {
      id: "job_" + Math.random().toString(36).substring(2, 11),
      documentId: docId,
      status: "pending",
      attempts: 0,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    local.analysisJobs.push(newJob);

    saveLocalDb(local);
    return newDoc;
  },

  async getDocument(id: string): Promise<DocumentWithAnalysis | null> {
    if (prisma) {
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
        id: doc.id,
        userId: doc.userId,
        fileName: doc.fileName,
        storageKey: doc.storageKey,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        status: doc.status as Document["status"],
        documentType: doc.documentType as Document["documentType"],
        aiScore: doc.aiScore,
        keywords: doc.keywords,
        readability: doc.readability,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        deletedAt: null,
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
                (sum, p) => sum + p.text.split(/\s+/).filter(Boolean).length,
                0
              ),
              readingTimeMinutes: Math.max(
                1,
                Math.round(
                  doc.analysisResult.paragraphs.reduce(
                    (sum, p) =>
                      sum + p.text.split(/\s+/).filter(Boolean).length,
                    0
                  ) / 200
                )
              ),
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
    }

    const local = ensureLocalDb();
    const doc = local.documents.find((d) => d.id === id && !d.deletedAt);
    if (!doc) return null;

    const job = local.analysisJobs.find((j) => j.documentId === id) || null;
    const result = local.analysisResults.find((r) => r.documentId === id);
    const paragraphs = result
      ? local.analysisParagraphs
          .filter((p) => p.resultId === result.id)
          .sort((a, b) => a.paragraphIndex - b.paragraphIndex)
      : [];

    return {
      ...doc,
      analysisJob: job,
      analysisResult: result
        ? {
            ...result,
            paragraphs,
          }
        : null,
    };
  },

  async listDocuments(
    userId: string,
    options?: {
      search?: string;
      status?: string;
      type?: string;
    }
  ): Promise<Document[]> {
    if (prisma) {
      const where: Record<string, unknown> = {
        userId,
        deletedAt: null,
      };
      if (options?.status && options.status !== "all") {
        where.status = options.status;
      }
      if (options?.type && options.type !== "all") {
        where.documentType = options.type;
      }
      if (options?.search) {
        where.fileName = {
          contains: options.search,
          mode: "insensitive",
        };
      }

      const docs = await prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      return docs.map((d) => ({
        id: d.id,
        userId: d.userId,
        fileName: d.fileName,
        storageKey: d.storageKey,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        status: d.status as Document["status"],
        documentType: d.documentType as Document["documentType"],
        aiScore: d.aiScore,
        keywords: d.keywords,
        readability: d.readability,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        deletedAt: null,
      }));
    }

    const local = ensureLocalDb();
    let docs = local.documents.filter(
      (d) => d.userId === userId && !d.deletedAt
    );

    if (options?.status && options.status !== "all") {
      docs = docs.filter((d) => d.status === options.status);
    }
    if (options?.type && options.type !== "all") {
      docs = docs.filter((d) => d.documentType === options.type);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      docs = docs.filter((d) => d.fileName.toLowerCase().includes(q));
    }

    return docs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async updateDocument(
    id: string,
    data: Partial<Document>
  ): Promise<Document | null> {
    const now = new Date().toISOString();
    if (prisma) {
      const updated = await prisma.document.update({
        where: { id },
        data: {
          status: data.status,
          aiScore: data.aiScore,
          readability: data.readability,
          keywords: data.keywords,
          updatedAt: new Date(),
        },
      });
      return {
        id: updated.id,
        userId: updated.userId,
        fileName: updated.fileName,
        storageKey: updated.storageKey,
        mimeType: updated.mimeType,
        fileSize: updated.fileSize,
        status: updated.status as Document["status"],
        documentType: updated.documentType as Document["documentType"],
        aiScore: updated.aiScore,
        keywords: updated.keywords,
        readability: updated.readability,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        deletedAt: updated.deletedAt?.toISOString() || null,
      };
    }

    const local = ensureLocalDb();
    const idx = local.documents.findIndex((d) => d.id === id);
    if (idx === -1) return null;

    local.documents[idx] = {
      ...local.documents[idx],
      ...data,
      updatedAt: now,
    };
    saveLocalDb(local);
    return local.documents[idx];
  },

  async deleteDocument(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (prisma) {
      await prisma.document.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    }

    const local = ensureLocalDb();
    const doc = local.documents.find((d) => d.id === id);
    if (!doc) return false;
    doc.deletedAt = now;
    saveLocalDb(local);
    return true;
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
    const now = new Date().toISOString();
    const resultId = "res_" + Math.random().toString(36).substring(2, 11);

    const totalWords = params.paragraphs.reduce(
      (acc, p) => acc + p.text.split(/\s+/).filter(Boolean).length,
      0
    );
    const readingTime = Math.max(1, Math.round(totalWords / 200));

    if (prisma) {
      // delete existing result if any to ensure idempotency
      const existing = await prisma.analysisResult.findUnique({
        where: { documentId: params.documentId },
      });
      if (existing) {
        await prisma.analysisParagraph.deleteMany({
          where: { resultId: existing.id },
        });
        await prisma.analysisResult.delete({
          where: { id: existing.id },
        });
      }

      const created = await prisma.analysisResult.create({
        data: {
          documentId: params.documentId,
          aiScore: params.aiScore,
          readabilityScore: params.readabilityScore,
          keywords: params.keywords,
          summary: params.summary,
          resumeSections: params.resumeSections as unknown as object,
          detectorProvider:
            params.detectorProvider || "linguistic-heuristics",
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
        include: {
          paragraphs: true,
        },
      });

      // Update Document status and top scores
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
    }

    const local = ensureLocalDb();
    // remove previous results if any
    const prevResIndex = local.analysisResults.findIndex(
      (r) => r.documentId === params.documentId
    );
    if (prevResIndex !== -1) {
      const oldResId = local.analysisResults[prevResIndex].id;
      local.analysisParagraphs = local.analysisParagraphs.filter(
        (p) => p.resultId !== oldResId
      );
      local.analysisResults.splice(prevResIndex, 1);
    }

    const createdParagraphs: AnalysisParagraph[] = params.paragraphs.map(
      (p) => ({
        id: "par_" + Math.random().toString(36).substring(2, 9),
        resultId,
        paragraphIndex: p.paragraphIndex,
        text: p.text,
        aiScore: p.aiScore,
        explanation: p.explanation,
        rewriteSuggestion: p.rewriteSuggestion,
      })
    );

    const newResult: AnalysisResult = {
      id: resultId,
      documentId: params.documentId,
      analysisVersion: "1.0",
      detectorProvider: params.detectorProvider || "linguistic-heuristics",
      detectorVersion: params.detectorVersion || "1.0",
      aiScore: params.aiScore,
      readabilityScore: params.readabilityScore,
      keywords: params.keywords,
      resumeSections: params.resumeSections,
      summary: params.summary,
      wordCount: totalWords,
      readingTimeMinutes: readingTime,
      paragraphs: createdParagraphs,
      createdAt: now,
      updatedAt: now,
    };

    local.analysisResults.push(newResult);
    local.analysisParagraphs.push(...createdParagraphs);

    // update document status
    const doc = local.documents.find((d) => d.id === params.documentId);
    if (doc) {
      doc.status = "completed";
      doc.aiScore = params.aiScore;
      doc.readability = params.readabilityScore;
      doc.keywords = params.keywords;
      doc.updatedAt = now;
    }

    saveLocalDb(local);
    return newResult;
  },

  async markDocumentFailed(
    documentId: string,
    errorMessage: string
  ): Promise<void> {
    const now = new Date().toISOString();
    if (prisma) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "failed" },
      });
      await prisma.analysisJob.update({
        where: { documentId },
        data: {
          status: "failed",
          errorMessage,
          completedAt: new Date(),
        },
      });
      return;
    }

    const local = ensureLocalDb();
    const doc = local.documents.find((d) => d.id === documentId);
    if (doc) {
      doc.status = "failed";
      doc.updatedAt = now;
    }
    const job = local.analysisJobs.find((j) => j.documentId === documentId);
    if (job) {
      job.status = "failed";
      job.errorMessage = errorMessage;
      job.completedAt = now;
      job.updatedAt = now;
    }
    saveLocalDb(local);
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
        ? Math.round(
            completedScores.reduce((a, b) => a + b, 0) / completedScores.length
          )
        : null;

    const config = getAdminConfig();
    const isPro = user?.plan === "pro";
    const isUnlimited = config.fullAppFree;
    const dailyLimit = isUnlimited
      ? 9999
      : isPro
      ? config.rateLimits.maxDailyUploadsPro
      : config.rateLimits.maxDailyUploadsFree;

    const dailyRewritesLimit = isUnlimited
      ? 9999
      : isPro
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
