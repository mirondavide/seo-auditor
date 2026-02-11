import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { Regression } from "@/lib/analysis/regression-detector";

interface MonthlyAlertEmailProps {
  siteName: string;
  siteUrl: string;
  regressions: Regression[];
  siteId: string;
}

export function MonthlyAlertEmail({
  siteName,
  siteUrl,
  regressions,
  siteId,
}: MonthlyAlertEmailProps) {
  const criticalCount = regressions.filter((r) => r.severity === "critical").length;
  const warningCount = regressions.filter((r) => r.severity === "warning").length;

  return (
    <Html>
      <Head />
      <Preview>
        SEO Alert: {criticalCount > 0 ? `${criticalCount} critical issues` : `${warningCount} warnings`} for {siteName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Monthly SEO Alert</Heading>
          <Text style={paragraph}>
            We detected changes in your SEO metrics for{" "}
            <strong>{siteName}</strong> ({siteUrl}):
          </Text>

          {regressions.map((r, i) => (
            <Section
              key={i}
              style={{
                ...alertBox,
                borderLeftColor:
                  r.severity === "critical"
                    ? "#ef4444"
                    : r.severity === "warning"
                      ? "#f59e0b"
                      : "#3b82f6",
              }}
            >
              <Text style={alertTitle}>
                {r.type === "regression" ? "⬇️" : "⬆️"} {r.metricLabel}
              </Text>
              <Text style={alertMessage}>{r.message}</Text>
            </Section>
          ))}

          <Link
            href={`${process.env.NEXT_PUBLIC_APP_URL}/sites/${siteId}`}
            style={button}
          >
            View Full Report
          </Link>

          <Text style={footer}>
            You received this because you have email alerts enabled.
            <br />
            SEO Auditor — Helping local businesses grow their search visibility.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const heading = { fontSize: "24px", fontWeight: "700" as const, color: "#1a1a1a" };
const paragraph = { fontSize: "16px", lineHeight: "26px", color: "#484848" };
const alertBox = { backgroundColor: "#ffffff", borderRadius: "8px", padding: "16px", margin: "12px 0", borderLeft: "4px solid" };
const alertTitle = { fontSize: "16px", fontWeight: "600" as const, color: "#1a1a1a", margin: "0 0 4px 0" };
const alertMessage = { fontSize: "14px", color: "#484848", margin: "0" };
const button = { backgroundColor: "#2563eb", borderRadius: "6px", color: "#fff", display: "inline-block", fontSize: "16px", fontWeight: "600" as const, padding: "12px 24px", textDecoration: "none", marginTop: "16px" };
const footer = { fontSize: "12px", color: "#8898aa", marginTop: "32px" };
