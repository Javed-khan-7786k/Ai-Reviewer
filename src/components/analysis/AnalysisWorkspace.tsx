"use client";

import React, { useEffect, useRef } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  RotateCw,
  Trash2,
  CheckCircle2,
  Sparkles,
  Shield,
  Download,
} from "lucide-react";
import { DocumentWithAnalysis } from "@/types";
import { formatDate, formatFileSize, getAiScoreTier } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { AiScoreGauge } from "@/components/ui/AiScoreGauge";
import { DocumentViewer } from "@/components/analysis/DocumentViewer";
import { AnalyticsPanel } from "@/components/analysis/AnalyticsPanel";
import { deleteDocumentAction, retryDocumentAction } from "@/actions/documents";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useToast } from "@/components/ui/Toast";
import confetti from "canvas-confetti";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AnalysisWorkspaceProps {
  initialDocument: DocumentWithAnalysis;
}

export function AnalysisWorkspace({
  initialDocument,
}: AnalysisWorkspaceProps) {
  const router = useRouter();
  const toast = useToast();
  const hasTriggeredConfetti = useRef(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { data: document, mutate, isValidating } = useSWR<DocumentWithAnalysis>(
    `/api/documents/${initialDocument.id}`,
    fetcher,
    {
      fallbackData: initialDocument,
      refreshInterval: (currentDoc) =>
        currentDoc?.status === "pending" || currentDoc?.status === "processing"
          ? 2000
          : 0,
    }
  );

  const current = document || initialDocument;

  useEffect(() => {
    if (
      current.status === "completed" &&
      !hasTriggeredConfetti.current &&
      initialDocument.status !== "completed"
    ) {
      hasTriggeredConfetti.current = true;
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore if not supported
      }
    }
  }, [current.status, initialDocument.status]);

  const confirmDelete = async () => {
    setIsDeleting(true);
    const res = await deleteDocumentAction(current.id);
    setIsDeleting(false);

    if (res.success) {
      toast.success(`"${current.fileName}" was permanently deleted.`);
      setShowDeleteModal(false);
      router.push("/documents");
    } else {
      toast.error(res.error || "Failed to delete document.");
    }
  };

  const handleRetry = async () => {
    await retryDocumentAction(current.id);
    toast.info("Re-running analysis workflow...");
    mutate();
  };

  const aiTier = getAiScoreTier(current.aiScore);

  return (
    <div className="space-y-6">
      {/* Document Workspace Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/documents">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {current.fileName}
              </h2>
              {current.status === "completed" && (
                <Badge variant="success" className="capitalize">
                  {current.documentType}
                </Badge>
              )}
              {current.status === "processing" && (
                <Badge variant="warning" className="gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  <span>Processing</span>
                </Badge>
              )}
              {current.status === "failed" && (
                <Badge variant="danger">Failed</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Uploaded {formatDate(current.createdAt)} • {formatFileSize(current.fileSize)}
            </p>
          </div>
        </div>

        {/* Header Action buttons */}
        <div className="flex items-center gap-2">
          {current.status === "failed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="text-amber-700"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1.5" />
              <span>Retry Analysis</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Delete Document</span>
          </Button>
        </div>
      </div>

      {/* PROCESSING STATE */}
      {(current.status === "pending" || current.status === "processing") && (
        <Card className="border-blue-200 bg-blue-50/20">
          <CardContent className="py-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Analyzing Document Structure...
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our background engine is extracting text, calculating sentence
              burstiness, measuring readability, and checking resume benchmarks.
              This screen will automatically update in real time.
            </p>

            <div className="pt-4 space-y-2 text-left bg-white p-4 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Uploaded to secure object storage</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600 font-medium animate-pulse">
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                <span>Parsing paragraphs and estimating linguistic likelihood...</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-medium">
                <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0">
                  3
                </span>
                <span>Generating actionable resume suggestions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAILED STATE */}
      {current.status === "failed" && (
        <Card className="border-rose-200 bg-rose-50/20">
          <CardContent className="py-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Analysis Encountered An Issue
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {current.analysisJob?.errorMessage ||
                "The file could not be parsed. Please check that the document has a readable text layer and is not password protected."}
            </p>
            <Button size="sm" onClick={handleRetry}>
              <RotateCw className="w-4 h-4 mr-1.5" />
              <span>Retry Analysis</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* COMPLETED RESULTS STATE */}
      {current.status === "completed" && current.analysisResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Top Hero Section: AI Gauge & Quick Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            {/* Left AI Probability Gauge (5 cols) */}
            <div className="lg:col-span-5 flex justify-center py-2">
              <AiScoreGauge
                score={current.analysisResult.aiScore}
                size={190}
                strokeWidth={14}
              />
            </div>

            {/* Right Summary & Highlights (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Analysis Overview
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Document Quality Assessment
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {current.analysisResult.summary}
                </p>
              </div>

              {/* Quick statistics row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Readability
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {current.analysisResult.readabilityScore ?? "N/A"}/100
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Words Analyzed
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {current.analysisResult.wordCount.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Paragraphs
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {current.analysisResult.paragraphs.length} blocks
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Document Workspace */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left 8 cols: Interactive Document Viewer */}
            <div className="xl:col-span-8">
              <DocumentViewer
                paragraphs={current.analysisResult.paragraphs}
                fileName={current.fileName}
              />
            </div>

            {/* Right 4 cols: Tabbed Analytics Panel */}
            <div className="xl:col-span-4">
              <AnalyticsPanel
                result={current.analysisResult}
                documentType={current.documentType}
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        documentTitle={current.fileName}
        isDeleting={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
