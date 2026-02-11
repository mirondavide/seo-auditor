import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, metricsSnapshots, alerts, subscriptions } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAuthenticatedClient } from "@/lib/google/client";
import { fetchGA4Metrics } from "@/lib/google/analytics";
import {
  fetchGSCMetrics,
  fetchTopQueries,
} from "@/lib/google/search-console";
import { fetchPageSpeedMetrics } from "@/lib/google/pagespeed";
import { detectRegressions } from "@/lib/analysis/regression-detector";
import { sendMonthlyAlert } from "@/lib/email";
import type { MetricsData } from "@/types";

// Vercel Cron: runs daily
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allSites = await db.query.sites.findMany({
    with: { googleConnection: true, user: true },
  });

  const results: { siteId: string; status: string; error?: string }[] = [];

  for (const site of allSites) {
    try {
      if (!site.googleConnection || !site.ga4PropertyId || !site.gscSiteUrl) {
        results.push({ siteId: site.id, status: "skipped", error: "incomplete setup" });
        continue;
      }

      const auth = await getAuthenticatedClient(site.googleConnection.id);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 27);

      const dateStr = (d: Date) => d.toISOString().split("T")[0];

      // Fetch all metrics in parallel
      const [ga4, gsc, topQueries, pageSpeed] = await Promise.all([
        fetchGA4Metrics(auth, site.ga4PropertyId, dateStr(startDate), dateStr(endDate)),
        fetchGSCMetrics(auth, site.gscSiteUrl, dateStr(startDate), dateStr(endDate)),
        fetchTopQueries(auth, site.gscSiteUrl, dateStr(startDate), dateStr(endDate)),
        fetchPageSpeedMetrics(site.url),
      ]);

      // Store snapshot
      await db.insert(metricsSnapshots).values({
        siteId: site.id,
        snapshotDate: new Date(),
        sessions: ga4.sessions,
        mobilePercent: ga4.mobilePercent,
        bounceRate: ga4.bounceRate,
        clicks: gsc.clicks,
        impressions: gsc.impressions,
        ctr: gsc.ctr,
        avgPosition: gsc.avgPosition,
        lcp: pageSpeed.lcp,
        cls: pageSpeed.cls,
        fid: pageSpeed.fid,
        topQueries,
      });

      // Update site lastSyncAt
      await db
        .update(sites)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(sites.id, site.id));

      // Monthly alerts (check if 1st of month)
      const today = new Date();
      if (today.getDate() === 1) {
        await runMonthlyAlertForSite(site, {
          ...ga4,
          ...gsc,
          topQueries,
          indexedPages: null,
          lcp: pageSpeed.lcp,
          cls: pageSpeed.cls,
          fid: pageSpeed.fid,
        });
      }

      results.push({ siteId: site.id, status: "synced" });
    } catch (error) {
      console.error(`Sync failed for site ${site.id}:`, error);
      results.push({ siteId: site.id, status: "error", error: String(error) });
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() });
}

async function runMonthlyAlertForSite(
  site: {
    id: string;
    name: string;
    url: string;
    userId: string;
    user: { email: string; name: string | null } | null;
  },
  currentMetrics: MetricsData
) {
  // Check if user has pro subscription (alerts are pro-only)
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, site.userId),
      eq(subscriptions.status, "active")
    ),
  });

  if (!subscription) return;

  // Get previous month's snapshot
  const prevSnapshot = await db.query.metricsSnapshots.findFirst({
    where: eq(metricsSnapshots.siteId, site.id),
    orderBy: [desc(metricsSnapshots.snapshotDate)],
    offset: 28, // ~1 month back in daily snapshots
  });

  if (!prevSnapshot) return;

  const previousMetrics: MetricsData = {
    sessions: prevSnapshot.sessions ?? 0,
    mobilePercent: prevSnapshot.mobilePercent ?? 0,
    bounceRate: prevSnapshot.bounceRate ?? 0,
    clicks: prevSnapshot.clicks ?? 0,
    impressions: prevSnapshot.impressions ?? 0,
    ctr: prevSnapshot.ctr ?? 0,
    avgPosition: prevSnapshot.avgPosition ?? 0,
    indexedPages: prevSnapshot.indexedPages,
    lcp: prevSnapshot.lcp,
    cls: prevSnapshot.cls,
    fid: prevSnapshot.fid,
    topQueries: (prevSnapshot.topQueries as MetricsData["topQueries"]) ?? [],
  };

  const regressions = detectRegressions(currentMetrics, previousMetrics);
  const significantRegressions = regressions.filter(
    (r) => r.type === "regression" && (r.severity === "critical" || r.severity === "warning")
  );

  if (significantRegressions.length === 0) return;

  // Store alerts
  for (const reg of significantRegressions) {
    await db.insert(alerts).values({
      siteId: site.id,
      alertType: "regression",
      metric: reg.metric,
      previousValue: reg.previousValue,
      currentValue: reg.currentValue,
      changePercent: reg.changePercent,
      message: reg.message,
      emailSent: true,
    });
  }

  // Send email
  if (site.user?.email) {
    await sendMonthlyAlert(
      site.user.email,
      site.name,
      site.url,
      site.id,
      significantRegressions
    );
  }
}
