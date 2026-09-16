"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Trash2,
  RotateCw,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { Document } from "@/types";
import { formatDate, formatFileSize, getAiScoreTier } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { deleteDocumentAction, retryDocumentAction } from "@/actions/documents";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { useToast } from "@/components/ui/Toast";

interface DocumentTableProps {
  documents: Document[];
  onDocumentDeleted?: (id: string) => void;
  onDocumentRetried?: (id: string) => void;
}

export function DocumentTable({
  documents,
  onDocumentDeleted,
  onDocumentRetried,
}: DocumentTableProps) {
  const toast = useToast();
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    const res = await deleteDocumentAction(deletingDoc.id);
    setIsDeleting(false);

    if (res.success) {
      toast.success(`"${deletingDoc.fileName}" was permanently deleted.`);
      if (onDocumentDeleted) {
        onDocumentDeleted(deletingDoc.id);
      }
      setDeletingDoc(null);
    } else {
      toast.error(res.error || "Failed to delete document.");
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    const res = await retryDocumentAction(id);
    setRetryingId(null);
    if (res.success && onDocumentRetried) {
      onDocumentRetried(id);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200/80">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-900 mb-1">
          No documents reviewed yet
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Upload your first PDF or DOCX file to get an automated AI likelihood
          estimate and structured writing recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4">Document</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Uploaded</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Readability</th>
            <th className="py-3 px-4">AI Likelihood</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
          {documents.map((doc) => {
            const aiTier = getAiScoreTier(doc.aiScore);

            return (
              <tr
                key={doc.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                {/* File Name */}
                <td className="py-3.5 px-4 font-medium text-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate max-w-[220px]">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="hover:text-blue-600 font-semibold truncate block transition-colors"
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Type */}
                <td className="py-3.5 px-4">
                  <span className="capitalize font-medium text-slate-600">
                    {doc.documentType}
                  </span>
                </td>

                {/* Date */}
                <td className="py-3.5 px-4 text-slate-500">
                  {formatDate(doc.createdAt)}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  {doc.status === "completed" && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </Badge>
                  )}
                  {doc.status === "processing" && (
                    <Badge variant="warning" className="gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                      <span>Processing</span>
                    </Badge>
                  )}
                  {doc.status === "pending" && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Queued</span>
                    </Badge>
                  )}
                  {doc.status === "failed" && (
                    <Badge variant="danger" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Failed</span>
                    </Badge>
                  )}
                </td>

                {/* Readability */}
                <td className="py-3.5 px-4">
                  {typeof doc.readability === "number" ? (
                    <span className="font-semibold text-slate-800">
                      {doc.readability}/100
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* AI Score */}
                <td className="py-3.5 px-4">
                  {typeof doc.aiScore === "number" ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: aiTier.color }}
                      />
                      <span className="font-semibold text-slate-900">
                        {Math.round(doc.aiScore)}%
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${aiTier.color}15`,
                          color: aiTier.color,
                        }}
                      >
                        {aiTier.label}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {doc.status === "failed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        title="Retry processing"
                        isLoading={retryingId === doc.id}
                        onClick={() => handleRetry(doc.id)}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    <Link href={`/documents/${doc.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete document"
                      onClick={() => setDeletingDoc(doc)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingDoc)}
        documentTitle={deletingDoc?.fileName || "Document"}
        isDeleting={isDeleting}
        onClose={() => setDeletingDoc(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
