import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { db } from "@/lib/db";
import { getCurrentUserAction } from "@/actions/auth";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  FileCheck2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { getAiScoreTier } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUserAction();
  const docs = await db.listDocuments(user.id);
  const completedDocs = docs.filter((d) => d.status === "completed");

  const completedAiScores = completedDocs
    .map((d) => d.aiScore)
    .filter((s): s is number => typeof s === "number");

  const avgAiScore =
    completedAiScores.length > 0
      ? Math.round(
          completedAiScores.reduce((a, b) => a + b, 0) / completedAiScores.length
        )
      : 0;

  const readabilityScores = completedDocs
    .map((d) => d.readability)
    .filter((s): s is number => typeof s === "number");

  const avgReadability =
    readabilityScores.length > 0
      ? Math.round(
          readabilityScores.reduce((a, b) => a + b, 0) / readabilityScores.length
        )
      : 0;

  // AI Score tier distributions
  const tierCounts = {
    human: completedAiScores.filter((s) => s <= 20).length,
    mixed: completedAiScores.filter((s) => s > 20 && s <= 50).length,
    highAi: completedAiScores.filter((s) => s > 50 && s <= 80).length,
    veryLikelyAi: completedAiScores.filter((s) => s > 80).length,
  };

  const resumeCount = docs.filter((d) => d.documentType === "resume").length;
  const generalCount = docs.filter((d) => d.documentType === "general").length;

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Writing & Content Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregated metrics and distribution patterns across all reviewed documents.
          </p>
        </div>

        {/* Top summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Average AI Likelihood
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {avgAiScore}%
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Average Readability
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {avgReadability}/100
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Resumes Analyzed
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {resumeCount}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Total Reviews Run
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {completedDocs.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Likelihood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                AI Likelihood Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {completedAiScores.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Upload completed documents to visualize score distributions.
                </p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Human Likelihood (0 - 20%)
                      </span>
                      <span>{tierCounts.human} docs</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{
                          width: `${(tierCounts.human / completedAiScores.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Mixed Wording (21 - 50%)
                      </span>
                      <span>{tierCounts.mixed} docs</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{
                          width: `${(tierCounts.mixed / completedAiScores.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        High AI Markers (51 - 80%)
                      </span>
                      <span>{tierCounts.highAi} docs</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full transition-all"
                        style={{
                          width: `${(tierCounts.highAi / completedAiScores.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        Very Likely AI (81%+)
                      </span>
                      <span>{tierCounts.veryLikelyAi} docs</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all"
                        style={{
                          width: `${(tierCounts.veryLikelyAi / completedAiScores.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Document Composition</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">
                        Resumes & CVs
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Includes completeness checks & action verb analysis
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {resumeCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">
                        General Documents
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Essays, memos, articles, and proposals
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    {generalCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
