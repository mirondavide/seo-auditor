import { Resend } from "resend";
import { WelcomeEmail } from "./templates/welcome";
import { MonthlyAlertEmail } from "./templates/monthly-alert";
import { ReportReadyEmail } from "./templates/report-ready";
import type { Regression } from "@/lib/analysis/regression-detector";
import { createElement } from "react";

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@seoauditor.com";

export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome to SEO Auditor",
    react: createElement(WelcomeEmail, { name }),
  });
}

export async function sendMonthlyAlert(
  to: string,
  siteName: string,
  siteUrl: string,
  siteId: string,
  regressions: Regression[]
) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `SEO Alert: Changes detected for ${siteName}`,
    react: createElement(MonthlyAlertEmail, {
      siteName,
      siteUrl,
      regressions,
      siteId,
    }),
  });
}

export async function sendReportReadyEmail(
  to: string,
  siteName: string,
  reportMonth: string,
  overallScore: number,
  downloadUrl: string
) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your SEO Report for ${siteName} is Ready`,
    react: createElement(ReportReadyEmail, {
      siteName,
      reportMonth,
      overallScore,
      downloadUrl,
    }),
  });
}
