import type { AuditIssue, MetricsData } from "@/types";

export interface Rule {
  id: string;
  name: string;
  category: "performance" | "content" | "technical" | "local";
  severity: "critical" | "warning" | "info";
  evaluate: (metrics: MetricsData) => AuditIssue | null;
}

export const rules: Rule[] = [
  {
    id: "mobile-traffic-low",
    name: "Low Mobile Traffic",
    category: "performance",
    severity: "critical",
    evaluate: (m) =>
      m.mobilePercent < 50
        ? {
            ruleId: "mobile-traffic-low",
            severity: "critical",
            title: "Low Mobile Traffic",
            description:
              "Less than 50% of your traffic comes from mobile devices. In 2026, Google prioritizes mobile-first indexing.",
            metric: "mobilePercent",
            currentValue: m.mobilePercent,
            threshold: 50,
          }
        : null,
  },
  {
    id: "slow-lcp",
    name: "Slow Largest Contentful Paint",
    category: "performance",
    severity: "critical",
    evaluate: (m) =>
      m.lcp != null && m.lcp > 2500
        ? {
            ruleId: "slow-lcp",
            severity: "critical",
            title: "Slow Page Load (LCP)",
            description: `Your LCP is ${(m.lcp / 1000).toFixed(1)}s. Google recommends under 2.5s for good user experience.`,
            metric: "lcp",
            currentValue: m.lcp,
            threshold: 2500,
          }
        : null,
  },
  {
    id: "poor-cls",
    name: "High Layout Shift",
    category: "performance",
    severity: "warning",
    evaluate: (m) =>
      m.cls != null && m.cls > 0.1
        ? {
            ruleId: "poor-cls",
            severity: "warning",
            title: "High Cumulative Layout Shift",
            description: `Your CLS is ${m.cls.toFixed(2)}. Google recommends under 0.1 for a stable visual experience.`,
            metric: "cls",
            currentValue: m.cls,
            threshold: 0.1,
          }
        : null,
  },
  {
    id: "slow-fid",
    name: "Slow First Input Delay",
    category: "performance",
    severity: "warning",
    evaluate: (m) =>
      m.fid != null && m.fid > 100
        ? {
            ruleId: "slow-fid",
            severity: "warning",
            title: "Slow Interactivity (FID)",
            description: `Your FID is ${m.fid}ms. Google recommends under 100ms for responsive interactions.`,
            metric: "fid",
            currentValue: m.fid,
            threshold: 100,
          }
        : null,
  },
  {
    id: "low-ctr",
    name: "Low Click-Through Rate",
    category: "content",
    severity: "critical",
    evaluate: (m) =>
      m.ctr < 2
        ? {
            ruleId: "low-ctr",
            severity: "critical",
            title: "Low Click-Through Rate",
            description: `Your average CTR is ${m.ctr.toFixed(1)}%. Aim for at least 2% to maximize search visibility.`,
            metric: "ctr",
            currentValue: m.ctr,
            threshold: 2,
          }
        : null,
  },
  {
    id: "high-bounce-rate",
    name: "High Bounce Rate",
    category: "content",
    severity: "warning",
    evaluate: (m) =>
      m.bounceRate > 70
        ? {
            ruleId: "high-bounce-rate",
            severity: "warning",
            title: "High Bounce Rate",
            description: `Your bounce rate is ${m.bounceRate.toFixed(0)}%. This suggests visitors aren't finding what they need.`,
            metric: "bounceRate",
            currentValue: m.bounceRate,
            threshold: 70,
          }
        : null,
  },
  {
    id: "poor-position",
    name: "Low Average Position",
    category: "content",
    severity: "warning",
    evaluate: (m) =>
      m.avgPosition > 20
        ? {
            ruleId: "poor-position",
            severity: "warning",
            title: "Low Average Search Position",
            description: `Your average position is ${m.avgPosition.toFixed(1)}. Most clicks go to top 10 results.`,
            metric: "avgPosition",
            currentValue: m.avgPosition,
            threshold: 20,
          }
        : null,
  },
  {
    id: "low-sessions",
    name: "Low Traffic Volume",
    category: "local",
    severity: "info",
    evaluate: (m) =>
      m.sessions < 100
        ? {
            ruleId: "low-sessions",
            severity: "info",
            title: "Low Traffic Volume",
            description: `Only ${m.sessions} sessions in the last 28 days. Local businesses typically need 500+ monthly sessions.`,
            metric: "sessions",
            currentValue: m.sessions,
            threshold: 100,
          }
        : null,
  },
  {
    id: "low-impressions",
    name: "Low Search Impressions",
    category: "local",
    severity: "warning",
    evaluate: (m) =>
      m.impressions < 500
        ? {
            ruleId: "low-impressions",
            severity: "warning",
            title: "Low Search Impressions",
            description: `Your site appeared only ${m.impressions} times in search. You may need more local content.`,
            metric: "impressions",
            currentValue: m.impressions,
            threshold: 500,
          }
        : null,
  },
  {
    id: "indexing-low",
    name: "Low Indexed Pages",
    category: "technical",
    severity: "info",
    evaluate: (m) =>
      m.indexedPages != null && m.indexedPages < 10
        ? {
            ruleId: "indexing-low",
            severity: "info",
            title: "Few Indexed Pages",
            description: `Only ${m.indexedPages} pages are being indexed. Consider adding more content pages.`,
            metric: "indexedPages",
            currentValue: m.indexedPages,
            threshold: 10,
          }
        : null,
  },
  {
    id: "no-clicks",
    name: "Zero Clicks",
    category: "technical",
    severity: "critical",
    evaluate: (m) =>
      m.clicks === 0
        ? {
            ruleId: "no-clicks",
            severity: "critical",
            title: "No Search Clicks",
            description:
              "Your site received zero clicks from search in the last 28 days. This is a critical issue.",
            metric: "clicks",
            currentValue: 0,
            threshold: 1,
          }
        : null,
  },
  {
    id: "few-queries",
    name: "Few Ranking Queries",
    category: "content",
    severity: "info",
    evaluate: (m) =>
      m.topQueries.length < 5
        ? {
            ruleId: "few-queries",
            severity: "info",
            title: "Few Ranking Keywords",
            description: `Your site ranks for only ${m.topQueries.length} queries. Expanding content can improve visibility.`,
            metric: "topQueries",
            currentValue: m.topQueries.length,
            threshold: 5,
          }
        : null,
  },
];
