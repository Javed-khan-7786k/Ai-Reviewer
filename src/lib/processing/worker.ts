import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { extractAndNormalizeDocument } from "@/lib/parsers";
import { analyzeDocumentWithAi } from "@/lib/ai";

export async function processDocumentJob(
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await db.getDocument(documentId);
    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    // Update status to processing
    await db.updateDocument(documentId, { status: "processing" });

    // 1. Download file from storage (R2 / local fallback)
    const fileBuffer = await storage.download(doc.storageKey);

    // 2. Extract and normalize document content
    const extracted = await extractAndNormalizeDocument(
      fileBuffer,
      doc.mimeType,
      doc.fileName
    );

    // 3. Determine if document is a resume
    const isResume =
      doc.documentType === "resume" || extracted.isResume;
    if (extracted.isResume && doc.documentType !== "resume") {
      await db.updateDocument(documentId, { documentType: "resume" });
    }

    // 4. Run AI detection and section feedback
    const aiAnalysis = await analyzeDocumentWithAi(
      extracted.fullText,
      extracted.paragraphs,
      isResume
    );

    // 5. Save structured analysis results and paragraphs
    await db.saveAnalysisResult({
      documentId,
      aiScore: aiAnalysis.overallAiScore,
      readabilityScore: extracted.readabilityScore,
      keywords: extracted.keywords,
      summary: aiAnalysis.summary,
      resumeSections: aiAnalysis.resumeSections,
      detectorProvider: aiAnalysis.detectorProvider,
      detectorVersion: aiAnalysis.detectorVersion,
      paragraphs: aiAnalysis.paragraphs.map((p) => ({
        paragraphIndex: p.paragraphIndex,
        text: p.text,
        aiScore: p.aiScore,
        explanation: p.explanation,
        rewriteSuggestion: p.rewriteSuggestion,
      })),
    });

    // 6. Track usage
    await db.incrementUserUsage(userId, "document");

    return { success: true };
  } catch (err: any) {
    console.error(`Error processing document ${documentId}:`, err);
    const errorMessage =
      err.message ||
      "An error occurred while parsing and analyzing your document.";
    await db.markDocumentFailed(documentId, errorMessage);
    return { success: false, error: errorMessage };
  }
}
