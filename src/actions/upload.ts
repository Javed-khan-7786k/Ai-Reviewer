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

    // 1. Check Authentication requirement from Admin Config
    if (config.requireLogin && !user) {
      return {
        success: false,
        error: "Authentication required. Please sign in before uploading documents.",
      };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file was uploaded." };
    }

    // 2. Validate file size against Admin Rate Limits
    const maxBytes = config.rateLimits.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        success: false,
        error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size configured by admin is ${config.rateLimits.maxFileSizeMB}MB.`,
      };
    }

    // 3. Validate file extension and MIME type
    const lowerName = file.name.toLowerCase();
    const isAllowedExt =
      lowerName.endsWith(".pdf") ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".doc") ||
      lowerName.endsWith(".txt");

    if (!isAllowedExt && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Unsupported file format. Please upload a PDF, DOCX, or TXT file.",
      };
    }

    // 4. Validate schema with Zod
    const validation = documentUploadSchema.safeParse({
      fileName: file.name,
      mimeType: file.type || (lowerName.endsWith(".pdf") ? "application/pdf" : "text/plain"),
      fileSize: file.size,
      documentType: lowerName.includes("resume") || lowerName.includes("cv") ? "resume" : "general",
    });

    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Document validation failed.",
      };
    }

    // 5. Check Rate Limiting and Quota (Bypassed if Admin Enabled Full App Free Mode)
    if (!config.fullAppFree) {
      const usage = await db.getUserUsageToday(user.id);
      const isPro = user.plan === "pro";
      const maxAllowed = isPro
        ? config.rateLimits.maxDailyUploadsPro
        : config.rateLimits.maxDailyUploadsFree;

      if (usage.documentsProcessed >= maxAllowed) {
        return {
          success: false,
          error: `Daily upload limit reached (${usage.documentsProcessed}/${maxAllowed} documents used today). ${
            !isPro
              ? "Upgrade to Pro for higher daily limits or try again tomorrow."
              : "Daily upload limit reached for your plan."
          }`,
        };
      }
    }

    // 6. Generate safe key and upload file to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const storageKey = storage.generateStorageKey(user.id, file.name);
    await storage.upload(fileBuffer, storageKey, file.type || "application/octet-stream");

    // 7. Detect document type hint
    const isResumeHint =
      lowerName.includes("resume") ||
      lowerName.includes("cv") ||
      lowerName.includes("curriculum");

    // 8. Create database record
    const document = await db.createDocument({
      userId: user.id,
      fileName: file.name,
      storageKey,
      mimeType: file.type || (lowerName.endsWith(".pdf") ? "application/pdf" : "text/plain"),
      fileSize: file.size,
      documentType: isResumeHint ? "resume" : "general",
    });

    // 9. Trigger Background Processing
    if (process.env.INNGEST_EVENT_KEY) {
      try {
        await inngest.send({
          name: "document/process",
          data: {
            documentId: document.id,
            userId: user.id,
          },
        });
      } catch (inngestErr) {
        console.warn("Inngest send event warning:", inngestErr);
      }
    }

    // Asynchronous background extraction & analysis
    setTimeout(() => {
      processDocumentJob(document.id, user.id).catch((err) =>
        console.error("Async worker error:", err)
      );
    }, 100);

    return {
      success: true,
      documentId: document.id,
    };
  } catch (err: any) {
    console.error("Upload server action error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during upload.",
    };
  }
}
