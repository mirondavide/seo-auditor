import { db } from "@/lib/db";
import { audits, metricsSnapshots, sites } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { rules } from "./rules";
import { generateRecommendations } from "./recommendations";
import type {
  AuditIssue,
  AuditRecommendation,
  ChecklistItem,
  MetricsData,
} from "@/types";

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: "gsc-verified",
    label: "Google Search Console verified",
    completed: false,
    category: "technical",
  },
  {
    id: "sitemap-submitted",
    label: "XML Sitemap submitted to GSC",
    completed: false,
    category: "technical",
  },
  {
    id: "robots-txt",
    label: "robots.txt allows Googlebot",
    completed: false,
    category: "technical",
  },
  {
    id: "ssl-https",
    label: "Site uses HTTPS",
    completed: false,
    category: "technical",
  },
  {
    id: "mobile-friendly",
    label: "Mobile-friendly design",
    completed: false,
    category: "performance",
  },
  {
    id: "page-speed",
    label: "Page loads under 3 seconds",
    completed: false,
    category: "performance",
  },
  {
    id: "title-tags",
    label: "Unique title tags on all pages",
    completed: false,
    category: "content",
  },
  {
    id: "meta-descriptions",
    label: "Meta descriptions on all pages",
    completed: false,
    category: "content",
  },
  {
    id: "heading-structure",
    label: "Proper H1-H6 heading structure",
    completed: false,
    category: "content",
  },
  {
    id: "gbp-claimed",
    label: "Google Business Profile claimed and optimized",
    completed: false,
    category: "local",
  },
  {
    id: "nap-consistent",
    label: "NAP (Name, Address, Phone) consistent everywhere",
    completed: false,
    category: "local",
  },
  {
    id: "local-schema",
    label: "LocalBusiness schema markup added",
    completed: false,
    category: "local",
  },
];

export async function runAudit(siteId: string, auditId: string) {
  try {
    // Mark audit as running
    await db
      .update(audits)
      .set({ status: "running" })
      .where(eq(audits.id, auditId));

    // Get the latest metrics snapshot
    const latestSnapshot = await db.query.metricsSnapshots.findFirst({
      where: eq(metricsSnapshots.siteId, siteId),
      orderBy: [desc(metricsSnapshots.snapshotDate)],
    });

    if (!latestSnapshot) {
      await db
        .update(audits)
        .set({
          status: "failed",
          issues: [],
          recommendations: [],
        })
        .where(eq(audits.id, auditId));
      return null;
    }

    const metrics: MetricsData = {
      sessions: latestSnapshot.sessions ?? 0,
      mobilePercent: latestSnapshot.mobilePercent ?? 0,
      bounceRate: latestSnapshot.bounceRate ?? 0,
      clicks: latestSnapshot.clicks ?? 0,
      impressions: latestSnapshot.impressions ?? 0,
      ctr: latestSnapshot.ctr ?? 0,
      avgPosition: latestSnapshot.avgPosition ?? 0,
      indexedPages: latestSnapshot.indexedPages,
      lcp: latestSnapshot.lcp,
      cls: latestSnapshot.cls,
      fid: latestSnapshot.fid,
      topQueries: (latestSnapshot.topQueries as MetricsData["topQueries"]) ?? [],
    };

    // Run all rules
    const issues: AuditIssue[] = [];
    for (const rule of rules) {
      const issue = rule.evaluate(metrics);
      if (issue) {
        issues.push(issue);
      }
    }

    // Generate recommendations (top 3)
    const allRecommendations = generateRecommendations(issues);
    const topRecommendations = allRecommendations.slice(0, 3);

    // Calculate scores
    const categoryScores = calculateCategoryScores(issues);
    const overallScore = Math.round(
      (categoryScores.performance +
        categoryScores.content +
        categoryScores.technical +
        categoryScores.local) /
        4
    );

    // Update audit record
    await db
      .update(audits)
      .set({
        status: "completed",
        overallScore,
        scores: categoryScores,
        issues,
        recommendations: topRecommendations,
        checklist: DEFAULT_CHECKLIST,
        completedAt: new Date(),
      })
      .where(eq(audits.id, auditId));

    return {
      overallScore,
      scores: categoryScores,
      issues,
      recommendations: topRecommendations,
      checklist: DEFAULT_CHECKLIST,
    };
  } catch (error) {
    console.error("Audit failed:", error);
    await db
      .update(audits)
      .set({ status: "failed" })
      .where(eq(audits.id, auditId));
    throw error;
  }
}

function calculateCategoryScores(issues: AuditIssue[]) {
  const categories = ["performance", "content", "technical", "local"] as const;
  const scores: Record<string, number> = {};

  const categoryMap: Record<string, (typeof categories)[number]> = {
    "mobile-traffic-low": "performance",
    "slow-lcp": "performance",
    "poor-cls": "performance",
    "slow-fid": "performance",
    "low-ctr": "content",
    "high-bounce-rate": "content",
    "poor-position": "content",
    "few-queries": "content",
    "indexing-low": "technical",
    "no-clicks": "technical",
    "low-sessions": "local",
    "low-impressions": "local",
  };

  for (const category of categories) {
    const categoryIssues = issues.filter(
      (i) => categoryMap[i.ruleId] === category
    );
    const penalties = categoryIssues.reduce((sum, issue) => {
      switch (issue.severity) {
        case "critical":
          return sum + 30;
        case "warning":
          return sum + 15;
        case "info":
          return sum + 5;
        default:
          return sum;
      }
    }, 0);
    scores[category] = Math.max(0, 100 - penalties);
  }

  return scores as {
    performance: number;
    content: number;
    technical: number;
    local: number;
  };
}
