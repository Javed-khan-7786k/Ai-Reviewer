import { PrismaClient } from "@prisma/client";
import { storage } from "@/lib/storage";

declare global {
  // eslint-disable-next-line no-var
  var __cleanupPrisma: PrismaClient | undefined;
}

function getCleanupPrisma(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || (!dbUrl.startsWith("mongodb://") && !dbUrl.startsWith("mongodb+srv://"))) {
    return null;
  }
  if (!global.__cleanupPrisma) {
    global.__cleanupPrisma = new PrismaClient();
  }
  return global.__cleanupPrisma;
}

export interface CleanupResult {
  success: boolean;
  deletedUsersCount: number;
  deletedDocumentsCount: number;
  deletedStorageFilesCount: number;
  cutoffDate: string;
  error?: string;
}

/**
 * Purges dummy/guest users and their uploaded documents older than `days` (default: 7 days)
 * Deletes from both MongoDB and Vercel Blob / R2 storage to maintain speed and minimize costs.
 */
export async function cleanupExpiredGuestData(days = 7): Promise<CleanupResult> {
  const prisma = getCleanupPrisma();
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  if (!prisma) {
    return {
      success: false,
      deletedUsersCount: 0,
      deletedDocumentsCount: 0,
      deletedStorageFilesCount: 0,
      cutoffDate: cutoffDate.toISOString(),
      error: "Database is not configured.",
    };
  }

  try {
    // 1. Find all guest/dummy users created before cutoff date (never touch admin accounts!)
    const expiredGuests = await prisma.user.findMany({
      where: {
        AND: [
          { createdAt: { lt: cutoffDate } },
          { role: { not: "admin" } },
          {
            OR: [
              { email: { endsWith: "@aireviewer.local" } },
              { name: { startsWith: "Guest User #" } },
              { name: { startsWith: "Demo User #" } },
            ],
          },
        ],
      },
      select: { id: true, email: true },
    });

    if (expiredGuests.length === 0) {
      return {
        success: true,
        deletedUsersCount: 0,
        deletedDocumentsCount: 0,
        deletedStorageFilesCount: 0,
        cutoffDate: cutoffDate.toISOString(),
      };
    }

    const guestIds = expiredGuests.map((g) => g.id);

    // 2. Find all documents associated with these guest users
    const documents = await prisma.document.findMany({
      where: { userId: { in: guestIds } },
      select: { id: true, storageKey: true },
    });

    // 3. Delete files from object storage (Vercel Blob / R2)
    let deletedStorageFilesCount = 0;
    for (const doc of documents) {
      try {
        if (doc.storageKey) {
          const deleted = await storage.delete(doc.storageKey);
          if (deleted) deletedStorageFilesCount++;
        }
      } catch (storageErr) {
        console.warn(`Failed to delete storage file for doc ${doc.id}:`, storageErr);
      }
    }

    const docIds = documents.map((d) => d.id);

    // 4. Delete analysis results, jobs, paragraphs for these documents
    if (docIds.length > 0) {
      try {
        await prisma.analysisParagraph.deleteMany({
          where: { analysisResult: { documentId: { in: docIds } } },
        });
      } catch {}

      try {
        await prisma.analysisResult.deleteMany({
          where: { documentId: { in: docIds } },
        });
      } catch {}

      try {
        await prisma.analysisJob.deleteMany({
          where: { documentId: { in: docIds } },
        });
      } catch {}

      // Delete document records
      await prisma.document.deleteMany({
        where: { id: { in: docIds } },
      });
    }

    // 5. Delete usage records for these guest users
    try {
      await prisma.usageRecord.deleteMany({
        where: { userId: { in: guestIds } },
      });
    } catch {}

    // 6. Delete the guest users themselves from MongoDB
    const deleteUsersResult = await prisma.user.deleteMany({
      where: { id: { in: guestIds } },
    });

    return {
      success: true,
      deletedUsersCount: deleteUsersResult.count,
      deletedDocumentsCount: documents.length,
      deletedStorageFilesCount,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (err: any) {
    console.error("Cleanup expired guests error:", err);
    return {
      success: false,
      deletedUsersCount: 0,
      deletedDocumentsCount: 0,
      deletedStorageFilesCount: 0,
      cutoffDate: cutoffDate.toISOString(),
      error: err.message || "Failed to cleanup expired guest data.",
    };
  }
}
