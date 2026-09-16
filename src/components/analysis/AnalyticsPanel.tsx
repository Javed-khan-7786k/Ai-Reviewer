"use client";

import React, { useState } from "react";
import {
  BarChart2,
  FileCheck2,
  KeyRound,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Tag,
} from "lucide-react";
import { AnalysisResult, DocumentType } from "@/types";

interface AnalyticsPanelProps {
  result: AnalysisResult;
  documentType: DocumentType;
}

export function AnalyticsPanel({ result, documentType }: AnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "resume" | "keywords" | "readability"
  >(result.resumeSections ? "resume" : "overview");

  const isResume = Boolean(result.resumeSections);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      {/* Panel Tab Navigation */}
      <div className="border-b border-slate-100 bg-slate-50/70 p-2 flex items-center gap-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "overview"
              ? "bg-white text-blue-600 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        {isResume && (
          <button
            onClick={() => setActiveTab("resume")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "resume"
                ? "bg-white text-blue-600 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Resume</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("keywords")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "keywords"
              ? "bg-white text-blue-600 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Keywords</span>
        </button>

        <button
          onClick={() => setActiveTab("readability")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === "readability"
              ? "bg-white text-blue-600 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Readability</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Executive Assessment
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {result.summary || "Analysis completed across document paragraphs."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium">
                  Total Words
                </span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {result.wordCount.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium">
                  Est. Read Time
                </span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {result.readingTimeMinutes} min
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium">
                  Readability Score
                </span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {result.readabilityScore ?? "N/A"}/100
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium">
                  Detector Provider
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                  {result.detectorProvider}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* RESUME TAB */}
        {activeTab === "resume" && result.resumeSections && (
          <div className="space-y-4">
            {/* Completeness Meter */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-900 block">
                  Resume Completeness
                </span>
                <span className="text-[11px] text-blue-700">
                  Based on structure, sections, and metrics
                </span>
              </div>
              <span className="text-xl font-extrabold text-blue-700">
                {result.resumeSections.completenessScore}%
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-bold text-slate-900 block">
                  {result.resumeSections.actionVerbsFound.length}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Action Verbs
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-bold text-slate-900 block">
                  {result.resumeSections.quantifiableMetricsCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Metrics & Outcomes
                </span>
              </div>
            </div>

            {/* Strengths */}
            <div>
              <h5 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Identified Strengths</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {result.resumeSections.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div>
              <h5 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Recommended Improvements</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {result.resumeSections.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detected Skills */}
            <div>
              <h5 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                Extracted Skills
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {result.resumeSections.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KEYWORDS TAB */}
        {activeTab === "keywords" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-2">
              High-frequency thematic keywords extracted from document text:
            </p>
            <div className="flex flex-wrap gap-2">
              {result.keywords.length === 0 ? (
                <span className="text-xs text-slate-400">No keywords identified.</span>
              ) : (
                result.keywords.map((kw, i) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-100"
                  >
                    <Tag className="w-3 h-3 text-blue-400" />
                    <span>{kw}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {/* READABILITY TAB */}
        {activeTab === "readability" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Flesch Reading Ease
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {result.readabilityScore ?? "N/A"}
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {(result.readabilityScore ?? 70) >= 70
                  ? "Fairly easy to read. Conversational and accessible to general audiences."
                  : (result.readabilityScore ?? 70) >= 50
                  ? "Standard readability. Well suited for professional, collegiate, and business communication."
                  : "Complex vocabulary and sophisticated syntax. Best suited for specialist audiences."}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sentence Flow</span>
                <span className="font-semibold text-slate-800">
                  {result.paragraphs.length} paragraphs analyzed
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Average Word Cadence</span>
                <span className="font-semibold text-slate-800">
                  {Math.round(result.wordCount / Math.max(1, result.paragraphs.length))} words / paragraph
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
