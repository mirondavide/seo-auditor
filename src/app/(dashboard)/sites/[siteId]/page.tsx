"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MetricsChart } from "@/components/dashboard/metrics-chart";
import { TopQueriesTable } from "@/components/dashboard/top-queries-table";
import { ScoreBadge } from "@/components/dashboard/score-badge";
import {
  Users,
  Smartphone,
  MousePointerClick,
  Eye,
  Target,
  Gauge,
  FileText,
  Play,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteData {
  site: {
    id: string;
    name: string;
    url: string;
    lastSyncAt: string | null;
  };
  snapshots: {
    id: string;
    snapshotDate: string;
    sessions: number | null;
    mobilePercent: number | null;
    bounceRate: number | null;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    avgPosition: number | null;
    lcp: number | null;
    cls: number | null;
    fid: number | null;
    topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[] | null;
  }[];
  audits: {
    id: string;
    status: string;
    overallScore: number | null;
    scores: { performance: number; content: number; technical: number; local: number } | null;
    issues: { ruleId: string; severity: string; title: string; description: string }[] | null;
    recommendations: { priority: number; title: string; description: string; actionItems: string[] }[] | null;
    createdAt: string;
  }[];
  alerts: {
    id: string;
    alertType: string;
    metric: string;
    message: string;
    changePercent: number;
    createdAt: string;
  }[];
}

export default function SiteDetailPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [siteId]);

  async function loadData() {
    try {
      const res = await fetch(`/api/sites/${siteId}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to load site data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function runAudit() {
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/audit/${siteId}`, { method: "POST" });
      if (res.ok) {
        loadData();
      } else {
        const json = await res.json();
        alert(json.error || "Audit failed");
      }
    } catch (e) {
      console.error("Audit error:", e);
    } finally {
      setAuditLoading(false);
    }
  }

  async function generateReport() {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/reports/${siteId}`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        window.open(json.report.pdfUrl, "_blank");
      } else {
        const json = await res.json();
        alert(json.error || "Report generation failed");
      }
    } catch (e) {
      console.error("Report error:", e);
    } finally {
      setReportLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const latestSnapshot = data.snapshots[0];
  const latestAudit = data.audits.find((a) => a.status === "completed");

  // Build chart data from snapshots
  const sessionsChart = data.snapshots
    .map((s) => ({
      date: new Date(s.snapshotDate).toLocaleDateString("en", { month: "short", day: "numeric" }),
      value: s.sessions ?? 0,
    }))
    .reverse();

  const clicksChart = data.snapshots
    .map((s) => ({
      date: new Date(s.snapshotDate).toLocaleDateString("en", { month: "short", day: "numeric" }),
      value: s.clicks ?? 0,
    }))
    .reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.site.name}</h1>
          <p className="text-sm text-muted-foreground">{data.site.url}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runAudit} disabled={auditLoading}>
            <Play className="mr-2 h-4 w-4" />
            {auditLoading ? "Running..." : "Run Audit"}
          </Button>
          <Button variant="outline" onClick={generateReport} disabled={reportLoading}>
            <Download className="mr-2 h-4 w-4" />
            {reportLoading ? "Generating..." : "PDF Report"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {latestSnapshot ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Sessions (28d)" value={latestSnapshot.sessions ?? 0} icon={Users} />
                <MetricCard title="Mobile Traffic" value={`${latestSnapshot.mobilePercent ?? 0}%`} icon={Smartphone} />
                <MetricCard title="Search Clicks" value={latestSnapshot.clicks ?? 0} icon={MousePointerClick} />
                <MetricCard title="Avg Position" value={latestSnapshot.avgPosition ?? "-"} icon={Target} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Impressions" value={(latestSnapshot.impressions ?? 0).toLocaleString()} icon={Eye} />
                <MetricCard title="CTR" value={`${latestSnapshot.ctr ?? 0}%`} icon={MousePointerClick} />
                <MetricCard title="Bounce Rate" value={`${latestSnapshot.bounceRate ?? 0}%`} icon={Gauge} />
                <MetricCard
                  title="LCP"
                  value={latestSnapshot.lcp != null ? `${(latestSnapshot.lcp / 1000).toFixed(1)}s` : "N/A"}
                  icon={Gauge}
                />
              </div>

              {sessionsChart.length > 1 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <MetricsChart title="Sessions Trend" data={sessionsChart} />
                  <MetricsChart title="Search Clicks Trend" data={clicksChart} color="#22c55e" />
                </div>
              )}

              {latestSnapshot.topQueries && (
                <TopQueriesTable queries={latestSnapshot.topQueries} />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No metrics data yet. Data will appear after the daily sync runs, or you can trigger a manual sync.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AUDIT TAB */}
        <TabsContent value="audit" className="space-y-6">
          {latestAudit ? (
            <>
              <div className="flex items-center gap-6">
                <ScoreBadge score={latestAudit.overallScore ?? 0} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold">
                    Overall Score: {latestAudit.overallScore ?? 0}/100
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Last audit: {new Date(latestAudit.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {latestAudit.scores && (
                <div className="grid gap-4 sm:grid-cols-4">
                  {Object.entries(latestAudit.scores).map(([key, value]) => (
                    <Card key={key}>
                      <CardContent className="flex items-center gap-3 pt-6">
                        <ScoreBadge score={value} size="sm" />
                        <span className="text-sm font-medium capitalize">{key}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {latestAudit.recommendations && latestAudit.recommendations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Top Priority Fixes</h3>
                  {latestAudit.recommendations.map((rec, i) => (
                    <Card key={i} className={cn(i === 0 && "border-red-200 bg-red-50/50")}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          #{rec.priority} — {rec.title}
                        </CardTitle>
                        <CardDescription>{rec.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {rec.actionItems.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {latestAudit.issues && latestAudit.issues.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">All Issues</h3>
                  {latestAudit.issues.map((issue, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4",
                        issue.severity === "critical" && "border-red-200 bg-red-50/50",
                        issue.severity === "warning" && "border-yellow-200 bg-yellow-50/50"
                      )}
                    >
                      {issue.severity === "critical" ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      ) : issue.severity === "warning" ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                      ) : (
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium">{issue.title}</p>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-lg font-medium">No audits yet</p>
                <Button onClick={runAudit} disabled={auditLoading}>
                  <Play className="mr-2 h-4 w-4" />
                  Run First Audit
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ALERTS TAB */}
        <TabsContent value="alerts" className="space-y-4">
          {data.alerts.length > 0 ? (
            data.alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="flex items-center gap-3 pt-6">
                  <AlertTriangle
                    className={cn(
                      "h-5 w-5 shrink-0",
                      alert.changePercent < -20
                        ? "text-red-500"
                        : "text-yellow-500"
                    )}
                  />
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No alerts yet. Alerts are generated monthly when metrics change significantly.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
