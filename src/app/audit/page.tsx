import type { Metadata } from "next";
import { PublicAuditClient } from "./client";

export const metadata: Metadata = {
  title: "Free SEO Audit Tool | SEO Auditor",
  description:
    "Get an instant SEO health check for any website. Analyze performance, meta tags, and on-page SEO — free, no sign-up required.",
  openGraph: {
    title: "Free SEO Audit Tool | SEO Auditor",
    description:
      "Get an instant SEO health check for any website. Analyze performance, meta tags, and on-page SEO — free, no sign-up required.",
    type: "website",
  },
};

export default function PublicAuditPage() {
  return <PublicAuditClient />;
}
