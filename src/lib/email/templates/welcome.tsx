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

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to SEO Auditor — your local SEO assistant</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to SEO Auditor</Heading>
          <Text style={paragraph}>Hi {name || "there"},</Text>
          <Text style={paragraph}>
            Thanks for signing up! SEO Auditor helps local businesses monitor
            and improve their search visibility with actionable insights.
          </Text>
          <Section style={section}>
            <Text style={sectionTitle}>Get started in 3 steps:</Text>
            <Text style={listItem}>1. Connect your Google Analytics & Search Console</Text>
            <Text style={listItem}>2. Add your website</Text>
            <Text style={listItem}>3. Run your first SEO audit</Text>
          </Section>
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`} style={button}>
            Go to Dashboard
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
const section = { backgroundColor: "#ffffff", borderRadius: "8px", padding: "24px", margin: "24px 0" };
const sectionTitle = { fontSize: "16px", fontWeight: "600" as const, color: "#1a1a1a", marginBottom: "12px" };
const listItem = { fontSize: "14px", lineHeight: "24px", color: "#484848", marginBottom: "4px" };
const button = { backgroundColor: "#2563eb", borderRadius: "6px", color: "#fff", display: "inline-block", fontSize: "16px", fontWeight: "600" as const, padding: "12px 24px", textDecoration: "none" };
const footer = { fontSize: "12px", color: "#8898aa", marginTop: "32px" };
