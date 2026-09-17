"use server";

import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { inngest } from "@/inngest/client";
import { processDocumentJob } from "@/lib/processing/worker";
import { getCurrentUserAction } from "@/actions/auth";
import { getAdminConfig } from "@/lib/admin";
import { documentUploadSchema } from "@/lib/validation";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

export interface UploadActionResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export async function uploadDocumentAction(
  formData: FormData
): Promise<UploadActionResult> {
  try {
    const config = getAdminConfig();
    const user = await getCurrentUserAction();

    if (config.requireLogin && !user) {
      return { success: false, error: "Authentication required. Please sign in." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file was uploaded." };
    }

    const maxBytes = config.rateLimits.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        success: false,
        error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum: ${config.rateLimits.maxFileSizeMB}MB.`,
      };
    }

    const lowerName = file.name.toLowerCase();
    const isAllowedExt =
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".doc") ||
      lowerName.endsWith(".txt");

    if (!isAllowedExt && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return { success: false, error: "Unsupported file format. Please upload a PDF, DOCX, or TXT file." };
    }

    const validation = documentUploadSchema.safeParse({
      fileName: file.name,
      mimeType: file.type || (lowerName.endsWith(".pdf") ? "application/pdf" : "text/plain"),
      fileSize: file.size,
      documentType: lowerName.includes("resume") || lowerName.includes("cv") ? "resume" : "general",
    });

    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Validation failed." };
    }

    // Check rate limits
    if (!config.fullAppFree) {
      const usage = await db.getUserUsageToday(user.id);
      const isPro = user.plan === "pro";
      const maxAllowed = isPro
        ? config.rateLimits.maxDailyUploadsPro
        : config.rateLimits.maxDailyUploadsFree;

      if (usage.documentsProcessed >= maxAllowed) {
        return {
          success: false,
          error: `Daily upload limit reached (${usage.documentsProcessed}/${maxAllowed}). ${
            !isPro ? "Upgrade to Pro for more." : "Try again tomorrow."
          }`,
        };
      }
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const storageKey = storage.generateStorageKey(user.id, file.name);
    await storage.upload(fileBuffer, storageKey, file.type || "application/octet-stream");

    const isResumeHint =
      lowerName.includes("resume") ||
      lowerName.includes("cv") ||
      lowerName.includes("curriculum");

    const document = await db.createDocument({
      userId: user.id,
      fileName: file.name,
      storageKey,
      mimeType: file.type || (lowerName.endsWith(".pdf") ? "application/pdf" : "text/plain"),
      fileSize: file.size,
      documentType: isResumeHint ? "resume" : "general",
    });

    // Use Inngest for background processing if configured
    if (process.env.INNGEST_EVENT_KEY) {
      try {
        await inngest.send({
          name: "document/process",
          data: { documentId: document.id, userId: user.id },
        });
      } catch (inngestErr) {
        console.warn("Inngest event failed, processing inline:", inngestErr);
        // Fallback to direct processing
        processDocumentJob(document.id, user.id).catch((err) =>
          console.error("Inline worker error:", err)
        );
      }
    } else {
      // Direct async processing (works on Vercel serverless)
      processDocumentJob(document.id, user.id).catch((err) =>
        console.error("Worker error:", err)
      );
    }

    return { success: true, documentId: document.id };
  } catch (err: any) {
    console.error("Upload error:", err);
    return { success: false, error: err.message || "Upload failed." };
  }
}
