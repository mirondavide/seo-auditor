import type { MetricsData } from "@/types";

export interface Regression {
  metric: string;
  metricLabel: string;
  previousValue: number;
  currentValue: number;
  changePercent: number;
  type: "regression" | "improvement";
  severity: "critical" | "warning" | "info";
  message: string;
}

interface MetricConfig {
  label: string;
  // "higher_better" means a decrease is a regression
  // "lower_better" means an increase is a regression
  direction: "higher_better" | "lower_better";
  thresholds: { warning: number; critical: number };
}

const metricConfigs: Record<string, MetricConfig> = {
  sessions: {
    label: "Sessions",
    direction: "higher_better",
    thresholds: { warning: -15, critical: -30 },
  },
  clicks: {
    label: "Search Clicks",
    direction: "higher_better",
    thresholds: { warning: -15, critical: -30 },
  },
  impressions: {
    label: "Search Impressions",
    direction: "higher_better",
    thresholds: { warning: -20, critical: -40 },
  },
  ctr: {
    label: "Click-Through Rate",
    direction: "higher_better",
    thresholds: { warning: -15, critical: -30 },
  },
  avgPosition: {
    label: "Average Position",
    direction: "lower_better",
    thresholds: { warning: 15, critical: 30 },
  },
  mobilePercent: {
    label: "Mobile Traffic",
    direction: "higher_better",
    thresholds: { warning: -10, critical: -25 },
  },
  bounceRate: {
    label: "Bounce Rate",
    direction: "lower_better",
    thresholds: { warning: 15, critical: 30 },
  },
};

export function detectRegressions(
  current: MetricsData,
  previous: MetricsData
): Regression[] {
  const regressions: Regression[] = [];

  for (const [key, config] of Object.entries(metricConfigs)) {
    const currentVal = current[key as keyof MetricsData] as number;
    const previousVal = previous[key as keyof MetricsData] as number;

    if (
      currentVal == null ||
      previousVal == null ||
      typeof currentVal !== "number" ||
      typeof previousVal !== "number"
    )
      continue;
    if (previousVal === 0) continue;

    const changePercent =
      ((currentVal - previousVal) / Math.abs(previousVal)) * 100;

    const isRegression =
      config.direction === "higher_better"
        ? changePercent < 0
        : changePercent > 0;

    const absChange = Math.abs(changePercent);
    const thresholds = config.thresholds;

    let severity: "critical" | "warning" | "info" | null = null;
    if (config.direction === "higher_better") {
      if (changePercent <= thresholds.critical) severity = "critical";
      else if (changePercent <= thresholds.warning) severity = "warning";
    } else {
      if (changePercent >= thresholds.critical) severity = "critical";
      else if (changePercent >= thresholds.warning) severity = "warning";
    }

    if (severity === null && absChange > 10) {
      severity = "info";
    }

    if (severity === null) continue;

    const direction = isRegression ? "decreased" : "increased";
    const type = isRegression ? "regression" : "improvement";

    regressions.push({
      metric: key,
      metricLabel: config.label,
      previousValue: previousVal,
      currentValue: currentVal,
      changePercent: Math.round(changePercent * 10) / 10,
      type,
      severity,
      message: `${config.label} ${direction} by ${absChange.toFixed(1)}% (${previousVal} → ${currentVal})`,
    });
  }

  // Sort: regressions first, then by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return regressions.sort((a, b) => {
    if (a.type !== b.type) return a.type === "regression" ? -1 : 1;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
