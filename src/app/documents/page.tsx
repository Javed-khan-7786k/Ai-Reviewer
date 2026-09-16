"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent } from "@/components/ui/Card";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { Button } from "@/components/ui/Button";
import { Document } from "@/types";
import { getDocumentsAction } from "@/actions/documents";
import { Search, Filter, UploadCloud, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadDocuments = async () => {
    setIsLoading(true);
    const docs = await getDocumentsAction({
      search: search.trim() || undefined,
      status: statusFilter,
      type: typeFilter,
    });
    setDocuments(docs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              All Documents
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your uploaded resumes, essays, and reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDocuments()}
              disabled={isLoading}
              title="Refresh document list"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            <Link href="/dashboard#upload">
              <Button size="sm">
                <UploadCloud className="w-4 h-4 mr-1.5" />
                <span>Upload New Document</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search input */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex-1 max-w-md"
              >
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search documents by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </form>

              {/* Status and Type filter dropdowns */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters:</span>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Queued</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="resume">Resumes</option>
                  <option value="general">General Documents</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <DocumentTable
          documents={documents}
          onDocumentDeleted={() => loadDocuments()}
          onDocumentRetried={() => loadDocuments()}
        />
      </div>
    </DashboardShell>
  );
}
