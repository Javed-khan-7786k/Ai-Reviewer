import React from "react";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AnalysisWorkspace } from "@/components/analysis/AnalysisWorkspace";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await db.getDocument(id);

  if (!document) {
    notFound();
  }

  return (
    <DashboardShell>
      <AnalysisWorkspace initialDocument={document} />
    </DashboardShell>
  );
}
