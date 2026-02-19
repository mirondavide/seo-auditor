import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { AuditIssue, AuditRecommendation, ChecklistItem, MetricsData } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a" },
  header: { marginBottom: 30 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1e40af", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#6b7280" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginTop: 24, marginBottom: 12, color: "#1e40af", borderBottom: "2px solid #1e40af", paddingBottom: 4 },
  row: { flexDirection: "row", marginBottom: 8 },
  col: { flex: 1 },
  metricCard: { backgroundColor: "#f0f4ff", borderRadius: 6, padding: 12, marginBottom: 8, marginRight: 8, flex: 1 },
  metricLabel: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  metricValue: { fontSize: 18, fontWeight: "bold", color: "#1a1a1a" },
  metricUnit: { fontSize: 9, color: "#6b7280" },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#1e40af", justifyContent: "center", alignItems: "center", marginRight: 20 },
  scoreValue: { fontSize: 28, fontWeight: "bold", color: "#ffffff" },
  scoreLabel: { fontSize: 8, color: "#ffffff", marginTop: 2 },
  scoreRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  scoreBarContainer: { flex: 1 },
  scoreBarRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  scoreBarLabel: { width: 80, fontSize: 9, color: "#6b7280" },
  scoreBarBg: { flex: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4 },
  scoreBarFill: { height: 8, borderRadius: 4 },
  recCard: { backgroundColor: "#fffbeb", borderRadius: 6, padding: 16, marginBottom: 12, borderLeft: "4px solid #f59e0b" },
  recTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  recDescription: { fontSize: 10, color: "#484848", marginBottom: 8 },
  recAction: { fontSize: 9, color: "#484848", marginBottom: 3, paddingLeft: 12 },
  criticalRec: { backgroundColor: "#fef2f2", borderLeftColor: "#ef4444" },
  checklistCategory: { fontSize: 11, fontWeight: "bold", marginTop: 12, marginBottom: 6, color: "#374151" },
  checklistItem: { flexDirection: "row", marginBottom: 4, paddingLeft: 8 },
  checkbox: { width: 12, height: 12, border: "1.5px solid #9ca3af", borderRadius: 2, marginRight: 8 },
  checklistLabel: { fontSize: 10, color: "#484848", flex: 1 },
  queryRow: { flexDirection: "row", paddingVertical: 4, borderBottom: "0.5px solid #e5e7eb" },
  queryHeader: { flexDirection: "row", paddingVertical: 4, borderBottom: "1.5px solid #1e40af", marginBottom: 4 },
  queryCell: { flex: 1, fontSize: 9 },
  queryHeaderCell: { flex: 1, fontSize: 9, fontWeight: "bold", color: "#1e40af" },
  queryCellWide: { flex: 2, fontSize: 9 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#9ca3af" },
  pageNumber: { position: "absolute", bottom: 20, right: 40, fontSize: 8, color: "#9ca3af" },
  brandLogo: { width: 120, height: 40, objectFit: "contain" as const, marginBottom: 8 },
});

interface AuditReportProps {
  siteName: string;
  siteUrl: string;
  reportDate: string;
  overallScore: number;
  scores: { performance: number; content: number; technical: number; local: number };
  metrics: MetricsData;
  issues: AuditIssue[];
  recommendations: AuditRecommendation[];
  checklist: ChecklistItem[];
  whiteLabel?: {
    logoUrl: string;
  };
}

function getScoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export function AuditReport({
  siteName,
  siteUrl,
  reportDate,
  overallScore,
  scores,
  metrics,
  recommendations,
  checklist,
  whiteLabel,
}: AuditReportProps) {
  const categoryLabels = {
    performance: "Performance",
    content: "Content",
    technical: "Technical",
    local: "Local SEO",
  };

  return (
    <Document>
      {/* Page 1: Overview + Metrics */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {whiteLabel?.logoUrl ? (
            <Image src={whiteLabel.logoUrl} style={styles.brandLogo} />
          ) : null}
          <Text style={styles.title}>SEO Audit Report</Text>
          <Text style={styles.subtitle}>
            {siteName} — {siteUrl} — {reportDate}
          </Text>
        </View>

        {/* Overall Score */}
        <View style={styles.scoreRow}>
          <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(overallScore) }]}>
            <Text style={styles.scoreValue}>{overallScore}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <View style={styles.scoreBarContainer}>
            {(Object.entries(scores) as [keyof typeof categoryLabels, number][]).map(
              ([key, score]) => (
                <View key={key} style={styles.scoreBarRow}>
                  <Text style={styles.scoreBarLabel}>{categoryLabels[key]}</Text>
                  <View style={styles.scoreBarBg}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        { width: `${score}%`, backgroundColor: getScoreColor(score) },
                      ]}
                    />
                  </View>
                  <Text style={{ width: 30, textAlign: "right", fontSize: 9 }}>{score}</Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* Key Metrics */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.row}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Sessions (28d)</Text>
            <Text style={styles.metricValue}>{metrics.sessions.toLocaleString()}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Mobile Traffic</Text>
            <Text style={styles.metricValue}>{metrics.mobilePercent}%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Bounce Rate</Text>
            <Text style={styles.metricValue}>{metrics.bounceRate}%</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Search Clicks</Text>
            <Text style={styles.metricValue}>{metrics.clicks.toLocaleString()}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Impressions</Text>
            <Text style={styles.metricValue}>{metrics.impressions.toLocaleString()}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg CTR</Text>
            <Text style={styles.metricValue}>{metrics.ctr}%</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg Position</Text>
            <Text style={styles.metricValue}>{metrics.avgPosition}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>LCP</Text>
            <Text style={styles.metricValue}>
              {metrics.lcp != null ? `${(metrics.lcp / 1000).toFixed(1)}s` : "N/A"}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>CLS</Text>
            <Text style={styles.metricValue}>
              {metrics.cls != null ? metrics.cls.toFixed(2) : "N/A"}
            </Text>
          </View>
        </View>

        {/* Top Queries */}
        {metrics.topQueries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Search Queries</Text>
            <View style={styles.queryHeader}>
              <Text style={styles.queryCellWide}>Query</Text>
              <Text style={styles.queryHeaderCell}>Clicks</Text>
              <Text style={styles.queryHeaderCell}>Impressions</Text>
              <Text style={styles.queryHeaderCell}>CTR</Text>
              <Text style={styles.queryHeaderCell}>Position</Text>
            </View>
            {metrics.topQueries.slice(0, 10).map((q, i) => (
              <View key={i} style={styles.queryRow}>
                <Text style={styles.queryCellWide}>{q.query}</Text>
                <Text style={styles.queryCell}>{q.clicks}</Text>
                <Text style={styles.queryCell}>{q.impressions}</Text>
                <Text style={styles.queryCell}>{q.ctr}%</Text>
                <Text style={styles.queryCell}>{q.position}</Text>
              </View>
            ))}
          </>
        )}

        {!whiteLabel && (
          <Text style={styles.footer}>Generated by SEO Auditor — seoauditor.com</Text>
        )}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>

      {/* Page 2: Recommendations + Checklist */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Top 3 Priority Fixes</Text>
        {recommendations.map((rec, i) => (
          <View
            key={i}
            style={[styles.recCard, i === 0 ? styles.criticalRec : {}]}
          >
            <Text style={styles.recTitle}>
              #{rec.priority} — {rec.title}
            </Text>
            <Text style={styles.recDescription}>{rec.description}</Text>
            {rec.actionItems.map((action, j) => (
              <Text key={j} style={styles.recAction}>
                • {action}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.sectionTitle}>SEO Checklist</Text>
        {(["technical", "performance", "content", "local"] as const).map(
          (category) => {
            const items = checklist.filter((c) => c.category === category);
            if (items.length === 0) return null;
            return (
              <View key={category}>
                <Text style={styles.checklistCategory}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.checklistItem}>
                    <View style={styles.checkbox} />
                    <Text style={styles.checklistLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            );
          }
        )}

        {!whiteLabel && (
          <Text style={styles.footer}>Generated by SEO Auditor — seoauditor.com</Text>
        )}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </Page>
    </Document>
  );
}
