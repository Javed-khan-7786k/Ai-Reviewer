import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { db } from "@/lib/db";
import { getCurrentUserAction } from "@/actions/auth";
import {
  FileText,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Force dynamic rendering so newly uploaded documents show immediately
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUserAction();
  const stats = await db.getDashboardStats(user.id);
  const documents = await db.listDocuments(user.id);

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user.name?.split(" ")[0] || "there"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Upload documents, review automated AI probability scores, and
              refine writing quality.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/documents">
              <Button variant="outline" size="sm">
                <span>View All Documents</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <Card className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Total Documents
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {stats.total}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Completed Analyses
                </span>
                <span className="text-2xl font-bold text-emerald-600">
                  {stats.completed}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Active Processing
                </span>
                <span className="text-2xl font-bold text-amber-600">
                  {stats.processing}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="hover:border-slate-300 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Daily Upload Quota
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {stats.dailyUsed}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {stats.isUnlimited ? "/ Unlimited" : `/ ${stats.dailyLimit} today`}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Zone Card */}
        <div id="upload">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Upload New Document</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <UploadDropzone />
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Recent Documents
            </h3>
            <Link
              href="/documents"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              See all ({documents.length})
            </Link>
          </div>

          <DocumentTable documents={documents.slice(0, 5)} />
        </div>
      </div>
    </DashboardShell>
  );
}
