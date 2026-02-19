"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Search,
  TrendingUp,
  Bell,
  Lock,
} from "lucide-react";
import type { PublicAuditResult } from "@/lib/audit/public-audit";

type TabId = "performance" | "onpage" | "recommendations";

export function PublicAuditClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("performance");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    let auditUrl = url.trim();
    if (!auditUrl) return;

    if (!auditUrl.startsWith("http://") && !auditUrl.startsWith("https://")) {
      auditUrl = "https://" + auditUrl;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/audit/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: auditUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setResult(data);
      setActiveTab("performance");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setUrl("");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">SEO Auditor</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Hero / Form */}
        {!result && !loading && (
          <section className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Free SEO Audit
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
              Enter any URL to get an instant SEO health check. Analyze
              performance, meta tags, and on-page SEO.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
            >
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 rounded-lg border px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Search className="mr-2 h-4 w-4" />
                Analyze
              </button>
            </form>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}
          </section>
        )}

        {/* Loading */}
        {loading && (
          <section className="flex flex-col items-center py-20 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              Analyzing your website...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This usually takes 10-20 seconds
            </p>
          </section>
        )}

        {/* Results */}
        {result && !loading && (
          <section>
            {/* Score Header */}
            <div className="text-center">
              <p className="text-sm text-gray-500">SEO Score for</p>
              <p className="mt-1 text-lg font-medium text-gray-900 break-all">
                {result.url}
              </p>
              <div className="mt-4 inline-flex items-center gap-3">
                <span
                  className={`inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white ${
                    result.score >= 80
                      ? "bg-green-500"
                      : result.score >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                >
                  {result.score}
                </span>
                <span
                  className={`text-sm font-medium ${
                    result.score >= 80
                      ? "text-green-700"
                      : result.score >= 50
                        ? "text-yellow-700"
                        : "text-red-700"
                  }`}
                >
                  {result.score >= 80
                    ? "Good"
                    : result.score >= 50
                      ? "Needs Work"
                      : "Poor"}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 border-b">
              <div className="flex gap-6">
                {(
                  [
                    { id: "performance", label: "Performance" },
                    { id: "onpage", label: "On-Page SEO" },
                    { id: "recommendations", label: "Recommendations" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === "performance" && (
                <PerformanceTab result={result} />
              )}
              {activeTab === "onpage" && <OnPageTab result={result} />}
              {activeTab === "recommendations" && (
                <RecommendationsTab result={result} />
              )}
            </div>

            {/* CTA Section */}
            <div className="mt-12 rounded-xl bg-blue-50 p-8 text-center">
              <h2 className="text-xl font-bold text-gray-900">
                Want the full picture?
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Connect Google Analytics & Search Console for traffic data,
                keyword rankings, and monthly alerts.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: TrendingUp, title: "Traffic Data", desc: "Sessions, bounce rate, mobile %" },
                  { icon: Search, title: "Search Rankings", desc: "Keywords, CTR, positions" },
                  { icon: Bell, title: "Monthly Alerts", desc: "Regression detection, email reports" },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="relative rounded-lg border border-blue-200 bg-white/50 p-4 opacity-75"
                  >
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-blue-400" />
                    <card.icon className="h-6 w-6 text-blue-400" />
                    <p className="mt-2 text-sm font-medium text-gray-700">
                      {card.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{card.desc}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sign Up Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* Analyze Another */}
            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Analyze Another URL
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">SEO Auditor</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SEO Auditor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

function PerformanceTab({ result }: { result: PublicAuditResult }) {
  const { performanceMetrics, issues } = result;
  const perfIssues = issues.filter((i) =>
    ["slow-lcp", "poor-cls", "slow-fid"].includes(i.ruleId)
  );

  const metrics = [
    {
      label: "LCP",
      value: performanceMetrics.lcp,
      format: (v: number) => `${(v / 1000).toFixed(1)}s`,
      good: 2500,
      desc: "Largest Contentful Paint",
    },
    {
      label: "CLS",
      value: performanceMetrics.cls,
      format: (v: number) => v.toFixed(2),
      good: 0.1,
      desc: "Cumulative Layout Shift",
    },
    {
      label: "FID",
      value: performanceMetrics.fid,
      format: (v: number) => `${v}ms`,
      good: 100,
      desc: "First Input Delay",
    },
    {
      label: "Lighthouse",
      value: performanceMetrics.lighthouseScore,
      format: (v: number) => `${Math.round(v)}`,
      good: 90,
      desc: "Performance Score",
    },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const hasValue = m.value != null;
          const isGood =
            hasValue &&
            (m.label === "Lighthouse"
              ? m.value! >= m.good
              : m.value! <= m.good);

          return (
            <div key={m.label} className="rounded-lg border p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                {m.label}
              </p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  !hasValue
                    ? "text-gray-300"
                    : isGood
                      ? "text-green-600"
                      : "text-red-600"
                }`}
              >
                {hasValue ? m.format(m.value!) : "N/A"}
              </p>
              <p className="mt-1 text-xs text-gray-400">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {perfIssues.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900">Issues Found</h3>
          <div className="mt-3 space-y-3">
            {perfIssues.map((issue) => (
              <IssueCard key={issue.ruleId} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {perfIssues.length === 0 && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <CheckCircle2 className="mx-auto h-6 w-6 text-green-500" />
          <p className="mt-2 text-sm font-medium text-green-800">
            No performance issues detected
          </p>
        </div>
      )}
    </div>
  );
}

const ON_PAGE_CHECKS = [
  { ruleId: "missing-title", label: "Page Title", key: "title" },
  { ruleId: "missing-meta-description", label: "Meta Description", key: "metaDescription" },
  { ruleId: "missing-h1", label: "H1 Heading", key: "h1" },
  { ruleId: "images-without-alt", label: "Image Alt Text", key: "images" },
  { ruleId: "no-viewport-meta", label: "Viewport Meta", key: "viewport" },
  { ruleId: "no-canonical", label: "Canonical Tag", key: "canonical" },
  { ruleId: "no-structured-data", label: "Structured Data", key: "structuredData" },
  { ruleId: "not-https", label: "HTTPS", key: "https" },
] as const;

function OnPageTab({ result }: { result: PublicAuditResult }) {
  const { issues, htmlMetadata } = result;
  const issueRuleIds = new Set(issues.map((i) => i.ruleId));
  const onPageIssues = issues.filter(
    (i) => !["slow-lcp", "poor-cls", "slow-fid"].includes(i.ruleId)
  );

  function getDetail(key: string): string {
    switch (key) {
      case "title":
        return htmlMetadata.title
          ? `"${htmlMetadata.title}" (${htmlMetadata.titleLength} chars)`
          : "Not found";
      case "metaDescription":
        return htmlMetadata.metaDescription
          ? `${htmlMetadata.metaDescriptionLength} characters`
          : "Not found";
      case "h1":
        return htmlMetadata.h1Count > 0
          ? `${htmlMetadata.h1Count} found: "${htmlMetadata.firstH1}"`
          : "Not found";
      case "images":
        return htmlMetadata.imgCount > 0
          ? `${htmlMetadata.imgCount} images, ${htmlMetadata.imgsMissingAlt} missing alt`
          : "No images found";
      case "viewport":
        return htmlMetadata.hasViewport ? "Present" : "Missing";
      case "canonical":
        return htmlMetadata.hasCanonical ? "Present" : "Missing";
      case "structuredData":
        return htmlMetadata.hasStructuredData ? "JSON-LD found" : "Not found";
      case "https":
        return htmlMetadata.isHttps ? "Secure" : "Not secure";
      default:
        return "";
    }
  }

  return (
    <div>
      {/* Checklist */}
      <div className="space-y-3">
        {ON_PAGE_CHECKS.map((check) => {
          const hasFail = issueRuleIds.has(check.ruleId);
          // Also check for related warnings (e.g. title-too-long)
          const relatedIssue = onPageIssues.find(
            (i) => i.ruleId === check.ruleId || i.ruleId.startsWith(check.key)
          );

          return (
            <div
              key={check.ruleId}
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                hasFail
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              {hasFail ? (
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    hasFail ? "text-red-800" : "text-green-800"
                  }`}
                >
                  {check.label}
                </p>
                <p
                  className={`mt-0.5 text-xs ${
                    hasFail ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {getDetail(check.key)}
                </p>
                {relatedIssue && (
                  <p className="mt-1 text-xs text-red-600">
                    {relatedIssue.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional on-page issues not in checklist */}
      {onPageIssues.filter(
        (i) => !ON_PAGE_CHECKS.some((c) => c.ruleId === i.ruleId)
      ).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900">
            Additional Issues
          </h3>
          <div className="mt-3 space-y-3">
            {onPageIssues
              .filter(
                (i) => !ON_PAGE_CHECKS.some((c) => c.ruleId === i.ruleId)
              )
              .map((issue) => (
                <IssueCard key={issue.ruleId} issue={issue} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecommendationsTab({ result }: { result: PublicAuditResult }) {
  const { recommendations } = result;

  if (recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
        <p className="mt-2 font-medium text-green-800">
          Great job! No critical recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div key={rec.priority} className="rounded-lg border p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {rec.priority}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {rec.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
              <ul className="mt-3 space-y-1.5">
                {rec.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-gray-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function IssueCard({
  issue,
}: {
  issue: PublicAuditResult["issues"][number];
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      {issue.severity === "critical" ? (
        <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
      ) : issue.severity === "warning" ? (
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
      ) : (
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
      )}
      <div>
        <p className="text-sm font-medium text-gray-900">{issue.title}</p>
        <p className="mt-0.5 text-xs text-gray-600">{issue.description}</p>
      </div>
    </div>
  );
}
