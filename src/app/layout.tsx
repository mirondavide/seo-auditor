import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEO Auditor — Local SEO Monitoring for Small Businesses",
  description:
    "Monitor your local SEO performance with automated audits, PDF reports, and monthly alerts. Connect GA4 & Search Console. Starting at 7 EUR/month.",
  openGraph: {
    title: "SEO Auditor — Local SEO Monitoring for Small Businesses",
    description:
      "Monitor your local SEO performance with automated audits, PDF reports, and monthly alerts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
