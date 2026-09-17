import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processDocumentJob } from "@/lib/processing/worker";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let document = await db.getDocument(id);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Self-healing: If document was stuck in pending/processing on serverless without analysisResult,
    // process it right away so the frontend never hangs infinitely.
    if (
      (document.status === "pending" || document.status === "processing") &&
      !document.analysisResult
    ) {
      await processDocumentJob(document.id, document.userId);
      document = await db.getDocument(id);
    }

    return NextResponse.json(document);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch document" },
      { status: 500 }
    );
  }
}
