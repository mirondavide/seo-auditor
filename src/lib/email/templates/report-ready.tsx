import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface ReportReadyEmailProps {
  siteName: string;
  reportMonth: string;
  overallScore: number;
  downloadUrl: string;
}

export function ReportReadyEmail({
  siteName,
  reportMonth,
  overallScore,
  downloadUrl,
}: ReportReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Your SEO report for ${siteName} is ready — Score: ${overallScore}/100`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Your SEO Report is Ready</Heading>
          <Text style={paragraph}>
            The {reportMonth} SEO audit report for <strong>{siteName}</strong>{" "}
            has been generated.
          </Text>
          <Text style={scoreText}>
            Overall Score: <strong>{overallScore}/100</strong>
          </Text>
          <Link href={downloadUrl} style={button}>
            Download PDF Report
          </Link>
          <Text style={footer}>
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
const scoreText = { fontSize: "20px", color: "#1a1a1a", textAlign: "center" as const, margin: "24px 0" };
const button = { backgroundColor: "#2563eb", borderRadius: "6px", color: "#fff", display: "inline-block", fontSize: "16px", fontWeight: "600" as const, padding: "12px 24px", textDecoration: "none" };
const footer = { fontSize: "12px", color: "#8898aa", marginTop: "32px" };
