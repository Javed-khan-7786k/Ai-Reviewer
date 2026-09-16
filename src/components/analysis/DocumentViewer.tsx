"use client";

import React, { useState, useRef } from "react";
import {
  Search,
  Sparkles,
  Copy,
  Check,
  X,
  FileText,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { AnalysisParagraph, RewriteTone, RewriteResponse } from "@/types";
import { getAiScoreTier } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { rewriteParagraphAction } from "@/actions/rewrite";
import { useToast } from "@/components/ui/Toast";

interface DocumentViewerProps {
  paragraphs: AnalysisParagraph[];
  fileName: string;
}

export function DocumentViewer({ paragraphs, fileName }: DocumentViewerProps) {
  const toast = useToast();
  const resultRef = useRef<HTMLDivElement>(null);

  // Allow local in-memory text updates when user applies rewrites
  const [localParagraphs, setLocalParagraphs] = useState<AnalysisParagraph[]>(paragraphs);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeParagraph, setActiveParagraph] =
    useState<AnalysisParagraph | null>(null);
  const [rewriteTone, setRewriteTone] = useState<RewriteTone>("professional");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<RewriteResponse | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const handleSelectParagraph = (p: AnalysisParagraph) => {
    setActiveParagraph(p);
    setRewriteResult(null);
    setRewriteError(null);
    setCopied(false);
    setApplied(false);
  };

  const handleRewrite = async (tone: RewriteTone) => {
    if (!activeParagraph) return;
    setRewriteTone(tone);
    setIsRewriting(true);
    setRewriteError(null);
    setCopied(false);
    setApplied(false);

    try {
      const res = await rewriteParagraphAction(activeParagraph.text, tone);
      setIsRewriting(false);

      if (res.success && res.result) {
        setRewriteResult(res.result);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
      } else {
        const err = res.error || "Failed to generate rewrite.";
        setRewriteError(err);
        toast.error(err, "Rewrite Error");
      }
    } catch (err: any) {
      setIsRewriting(false);
      const msg = err.message || "Network error during rewrite.";
      setRewriteError(msg);
      toast.error(msg, "Rewrite Error");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Rewritten text copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleApplyRewrite = () => {
    if (!activeParagraph || !rewriteResult) return;

    setLocalParagraphs((prev) =>
      prev.map((p) =>
        p.id === activeParagraph.id
          ? {
              ...p,
              text: rewriteResult.rewrittenText,
              // lower AI score to human range when rewritten
              aiScore: Math.max(8, Math.round((p.aiScore ?? 50) * 0.3)),
            }
          : p
      )
    );

    setActiveParagraph((prev) =>
      prev
        ? {
            ...prev,
            text: rewriteResult.rewrittenText,
            aiScore: Math.max(8, Math.round((prev.aiScore ?? 50) * 0.3)),
          }
        : null
    );

    setApplied(true);
    toast.success("Rewrite applied to document preview!");
  };

  const filteredParagraphs = localParagraphs.filter((p) =>
    searchTerm
      ? p.text.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Document Reader Container */}
      <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        {/* Document Viewer Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-800">
              Extracted Document Text ({localParagraphs.length} paragraphs)
            </span>
          </div>

          {/* Search bar inside document */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Highlight legend banner */}
        <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>Click any paragraph to view linguistic insights & AI rewrites</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Human (0-20%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Mixed (21-50%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" /> High AI (51-80%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Very Likely AI (81%+)
            </span>
          </div>
        </div>

        {/* Document Pages Flow */}
        <div className="p-6 sm:p-10 space-y-4 max-h-[750px] overflow-y-auto font-serif text-[15px] leading-relaxed text-slate-800 selection:bg-blue-100">
          {filteredParagraphs.length === 0 ? (
            <p className="text-sm font-sans text-slate-400 text-center py-10">
              No paragraphs matched &ldquo;{searchTerm}&rdquo;.
            </p>
          ) : (
            filteredParagraphs.map((p) => {
              const tier = getAiScoreTier(p.aiScore);
              const isSelected = activeParagraph?.id === p.id;

              let highlightClass = "highlight-human";
              if ((p.aiScore ?? 0) > 80) highlightClass = "highlight-very-likely-ai";
              else if ((p.aiScore ?? 0) > 50) highlightClass = "highlight-high-ai";
              else if ((p.aiScore ?? 0) > 20) highlightClass = "highlight-mixed";

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectParagraph(p)}
                  className={`p-3.5 rounded-lg transition-all cursor-pointer font-sans text-sm leading-relaxed relative ${highlightClass} ${
                    isSelected
                      ? "ring-2 ring-blue-600 ring-offset-2 bg-white shadow-xs"
                      : "hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-400">
                      Paragraph #{p.paragraphIndex + 1}
                    </span>
                    {typeof p.aiScore === "number" && (
                      <span
                        className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${tier.color}18`,
                          color: tier.color,
                        }}
                      >
                        {p.aiScore}% AI Likelihood
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 whitespace-pre-wrap">{p.text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Paragraph Inspector & Rewriter Side Panel */}
      {activeParagraph && (
        <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col shrink-0 sticky top-20 animate-in fade-in slide-in-from-right-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-slate-900">
                Paragraph Insights
              </h4>
            </div>
            <button
              onClick={() => setActiveParagraph(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Paragraph Score & Linguistic Assessment */}
          <div className="mb-4 bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 font-medium">
                AI Pattern Likelihood
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  color: getAiScoreTier(activeParagraph.aiScore).color,
                  backgroundColor: `${getAiScoreTier(activeParagraph.aiScore).color}15`,
                }}
              >
                {activeParagraph.aiScore}% • {getAiScoreTier(activeParagraph.aiScore).label}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {activeParagraph.explanation ||
                "Syntactic cadence evaluated across burstiness and vocabulary variation."}
            </p>
          </div>

          {/* Rewrite Actions */}
          <div className="mb-4">
            <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Instant AI Rewriting
            </h5>
            <p className="text-[11px] text-slate-500 mb-3">
              Select a tone below to instantly humanize and refine this paragraph:
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {(
                [
                  ["professional", "Professional"],
                  ["natural", "Natural / Human"],
                  ["clearer", "Clearer"],
                  ["concise", "Concise"],
                  ["grammar", "Fix Grammar"],
                ] as const
              ).map(([tone, label]) => {
                const isCurrent = rewriteTone === tone;
                return (
                  <button
                    key={tone}
                    type="button"
                    disabled={isRewriting}
                    onClick={() => handleRewrite(tone)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{label}</span>
                    {isRewriting && isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 opacity-70" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rewrite Results View */}
          {rewriteError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{rewriteError}</span>
            </div>
          )}

          {rewriteResult && (
            <div
              ref={resultRef}
              className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 flex flex-col animate-in fade-in duration-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-700 capitalize flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  {rewriteResult.tone} Suggestion
                </span>
                <span className="text-[10px] text-blue-500 font-medium">
                  Ready to apply
                </span>
              </div>

              {/* Rewritten preview */}
              <div className="bg-white p-3 rounded-lg border border-blue-100 text-xs text-slate-800 leading-relaxed font-sans shadow-2xs">
                {rewriteResult.rewrittenText}
              </div>

              {/* Action Buttons: Apply to Document & Copy */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 text-xs h-8"
                  onClick={handleApplyRewrite}
                >
                  {applied ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                      <span>Applied!</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      <span>Apply to Document</span>
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-2.5"
                  onClick={() => handleCopy(rewriteResult.rewrittenText)}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>

              <span className="text-[10px] text-slate-400 block pt-1">
                {rewriteResult.explanation}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
