import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  audits,
  sites,
  reports,
  metricsSnapshots,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { put } from "@vercel/blob";
import { AuditReport } from "@/lib/pdf/templates/audit-report";
import { getUserPlanLimits } from "@/lib/subscription";
import type { MetricsData, AuditIssue, AuditRecommendation, ChecklistItem } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId } = await params;

  // Check plan
  const limits = await getUserPlanLimits(session.user.id);
  if (!limits.pdfReports) {
    return NextResponse.json(
      { error: "PDF reports require a Pro subscription" },
      { status: 403 }
    );
  }

  // Verify site ownership
  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
  });

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Get latest completed audit
  const audit = await db.query.audits.findFirst({
    where: and(eq(audits.siteId, siteId), eq(audits.status, "completed")),
    orderBy: [desc(audits.createdAt)],
  });

  if (!audit) {
    return NextResponse.json(
      { error: "No completed audit found. Run an audit first." },
      { status: 404 }
    );
  }

  // Get latest metrics
  const snapshot = await db.query.metricsSnapshots.findFirst({
    where: eq(metricsSnapshots.siteId, siteId),
    orderBy: [desc(metricsSnapshots.snapshotDate)],
  });

  const metrics: MetricsData = {
    sessions: snapshot?.sessions ?? 0,
    mobilePercent: snapshot?.mobilePercent ?? 0,
    bounceRate: snapshot?.bounceRate ?? 0,
    clicks: snapshot?.clicks ?? 0,
    impressions: snapshot?.impressions ?? 0,
    ctr: snapshot?.ctr ?? 0,
    avgPosition: snapshot?.avgPosition ?? 0,
    indexedPages: snapshot?.indexedPages ?? null,
    lcp: snapshot?.lcp ?? null,
    cls: snapshot?.cls ?? null,
    fid: snapshot?.fid ?? null,
    topQueries: (snapshot?.topQueries as MetricsData["topQueries"]) ?? [],
  };

  const reportMonth = new Date().toISOString().slice(0, 7);

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    <AuditReport
      siteName={site.name}
      siteUrl={site.url}
      reportDate={new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      overallScore={audit.overallScore ?? 0}
      scores={(audit.scores as { performance: number; content: number; technical: number; local: number }) ?? {
        performance: 0,
        content: 0,
        technical: 0,
        local: 0,
      }}
      metrics={metrics}
      issues={(audit.issues as AuditIssue[]) ?? []}
      recommendations={(audit.recommendations as AuditRecommendation[]) ?? []}
      checklist={(audit.checklist as ChecklistItem[]) ?? []}
    />
  );

  // Upload to Vercel Blob
  const blob = await put(
    `reports/${siteId}/${reportMonth}.pdf`,
    pdfBuffer,
    {
      access: "public",
      contentType: "application/pdf",
    }
  );

  // Save report record
  const [report] = await db
    .insert(reports)
    .values({
      siteId,
      auditId: audit.id,
      pdfUrl: blob.url,
      reportMonth,
    })
    .returning();

  return NextResponse.json({ report });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId } = await params;

  const siteReports = await db.query.reports.findMany({
    where: eq(reports.siteId, siteId),
    orderBy: (reports, { desc }) => [desc(reports.createdAt)],
    limit: 12,
  });

  return NextResponse.json({ reports: siteReports });
}
