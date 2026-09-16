"use server";

import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { processDocumentJob } from "@/lib/processing/worker";
import { Document, DocumentWithAnalysis } from "@/types";
import { getCurrentUserAction } from "@/actions/auth";

export async function getDocumentsAction(options?: {
  search?: string;
  status?: string;
  type?: string;
}): Promise<Document[]> {
  const user = await getCurrentUserAction();
  return db.listDocuments(user.id, options);
}

export async function getDocumentDetailsAction(
  id: string
): Promise<DocumentWithAnalysis | null> {
  return db.getDocument(id);
}

export async function deleteDocumentAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await db.getDocument(id);
    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    // Delete from storage
    await storage.delete(doc.storageKey);
    // Soft delete in DB
    await db.deleteDocument(id);

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to delete document",
    };
  }
}

export async function retryDocumentAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await db.getDocument(id);
    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    await db.updateDocument(id, { status: "pending" });

    setTimeout(() => {
      processDocumentJob(doc.id, doc.userId).catch((err) =>
        console.error("Retry processing error:", err)
      );
    }, 100);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to retry document" };
  }
}
