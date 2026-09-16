"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatFileSize } from "@/lib/utils";
import { uploadDocumentAction } from "@/actions/upload";
import { getAdminPublicLimitsAction } from "@/actions/admin";

export function UploadDropzone({
  onUploadSuccess,
}: {
  onUploadSuccess?: (docId: string) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDocId, setSuccessDocId] = useState<string | null>(null);
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(15);

  React.useEffect(() => {
    getAdminPublicLimitsAction()
      .then((limits) => {
        if (limits?.maxFileSizeMB) {
          setMaxFileSizeMB(limits.maxFileSizeMB);
        }
      })
      .catch(() => {});
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);

    const lower = file.name.toLowerCase();
    const isAllowed =
      lower.endsWith(".pdf") ||
      lower.endsWith(".docx") ||
      lower.endsWith(".doc") ||
      file.type === "application/pdf" ||
      file.type.includes("wordprocessingml");

    if (!isAllowed) {
      setErrorMessage("Unsupported file type. Please upload a PDF or Word document (.docx).");
      return;
    }

    const maxBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(
        `File is too large (${formatFileSize(file.size)}). Max allowed size configured by admin is ${maxFileSizeMB}MB.`
      );
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(20);

    const timer = setInterval(() => {
      setUploadProgress((prev) => (prev < 80 ? prev + 15 : prev));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const result = await uploadDocumentAction(formData);
      clearInterval(timer);

      if (result.success && result.documentId) {
        setUploadProgress(100);
        setSuccessDocId(result.documentId);
        if (onUploadSuccess) {
          onUploadSuccess(result.documentId);
        } else {
          setTimeout(() => {
            router.push(`/documents/${result.documentId}`);
          }, 600);
        }
      } else {
        setErrorMessage(result.error || "Failed to upload document.");
        setIsUploading(false);
      }
    } catch (err: any) {
      clearInterval(timer);
      setIsUploading(false);
      setErrorMessage(err.message || "Network error during document upload.");
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 transition-all duration-200 text-center cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50/50 scale-[1.005]"
            : selectedFile
            ? "border-slate-300 bg-white"
            : "border-slate-200 hover:border-slate-300 bg-white/70 hover:bg-slate-50/60"
        }`}
      >
        {isUploading ? (
          <div className="py-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              Uploading & Initiating Analysis...
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Extracting text and transferring securely to private storage.
            </p>
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">
              {uploadProgress}%
            </span>
          </div>
        ) : successDocId ? (
          <div className="py-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              Upload Successful!
            </h4>
            <p className="text-xs text-slate-500">
              Navigating to live analysis workspace...
            </p>
          </div>
        ) : selectedFile ? (
          <div className="py-2" onClick={(e) => e.stopPropagation()}>
            <div className="inline-flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 max-w-md w-full mb-5 text-left">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(selectedFile.size)} • Ready to analyze
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Choose Different File
              </Button>
              <Button size="sm" onClick={handleUpload}>
                <FileCheck className="w-4 h-4 mr-1.5" />
                Analyze Document Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="text-base font-semibold text-slate-900 mb-1 tracking-tight">
              Drag and drop your document here
            </h4>
            <p className="text-xs text-slate-500 mb-4 max-w-sm">
              Upload resumes, CVs, cover letters, or short essays for instant AI
              likelihood estimation and actionable quality feedback.
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse File
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-4">
              Supported formats: <strong className="text-slate-600">PDF, DOCX</strong> (Up to {maxFileSizeMB}MB)
            </p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
