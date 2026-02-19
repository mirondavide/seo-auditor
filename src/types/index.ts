export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "unpaid";
export type AuditStatus = "pending" | "running" | "completed" | "failed";
export type AlertType = "regression" | "improvement" | "warning";
export type PlanTier = "free" | "pro" | "agency";

export interface MetricsData {
  sessions: number;
  mobilePercent: number;
  bounceRate: number;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  indexedPages: number | null;
  lcp: number | null;
  cls: number | null;
  fid: number | null;
  topQueries: TopQuery[];
}

export interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface AuditIssue {
  ruleId: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
}

export interface AuditRecommendation {
  priority: number;
  title: string;
  description: string;
  actionItems: string[];
  relatedIssues: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category: "technical" | "content" | "local" | "performance";
}

export interface SEOScore {
  overall: number;
  performance: number;
  content: number;
  technical: number;
  local: number;
}

export interface PlanLimits {
  maxSites: number;
  maxAuditsPerMonth: number;
  pdfReports: boolean;
  emailAlerts: boolean;
  whiteLabelPdf: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxSites: 1,
    maxAuditsPerMonth: 3,
    pdfReports: false,
    emailAlerts: false,
    whiteLabelPdf: false,
  },
  pro: {
    maxSites: 5,
    maxAuditsPerMonth: -1, // unlimited
    pdfReports: true,
    emailAlerts: true,
    whiteLabelPdf: false,
  },
  agency: {
    maxSites: 20,
    maxAuditsPerMonth: -1, // unlimited
    pdfReports: true,
    emailAlerts: true,
    whiteLabelPdf: true,
  },
};
