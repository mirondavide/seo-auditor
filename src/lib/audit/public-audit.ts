import { fetchPageSpeedMetrics } from "@/lib/google/pagespeed";
import { rules } from "@/lib/analysis/rules";
import { generateRecommendations } from "@/lib/analysis/recommendations";
import type { AuditIssue, AuditRecommendation, MetricsData } from "@/types";

// --- Types ---

export interface HtmlMetadata {
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Count: number;
  firstH1: string | null;
  imgCount: number;
  imgsMissingAlt: number;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasStructuredData: boolean;
  isHttps: boolean;
  hasRobotsMeta: boolean;
}

export interface PublicAuditResult {
  url: string;
  score: number;
  performanceMetrics: {
    lcp: number | null;
    cls: number | null;
    fid: number | null;
    lighthouseScore: number | null;
  };
  htmlMetadata: HtmlMetadata;
  issues: AuditIssue[];
  recommendations: AuditRecommendation[];
  auditedAt: string;
}

// --- HTML Scraper ---

export async function scrapeMetaTags(url: string): Promise<HtmlMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEOAuditorBot/1.0; +https://seoauditor.app)",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Read up to 500KB
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    const MAX_SIZE = 500 * 1024;

    while (totalSize < MAX_SIZE) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalSize += value.length;
    }
    reader.cancel();

    const html = new TextDecoder().decode(
      chunks.length === 1
        ? chunks[0]
        : new Uint8Array(
            chunks.reduce((acc, c) => {
              const merged = new Uint8Array(acc.length + c.length);
              merged.set(acc);
              merged.set(c, acc.length);
              return merged;
            }, new Uint8Array(0))
          )
    );

    return extractMetadata(html, url);
  } finally {
    clearTimeout(timeout);
  }
}

function extractMetadata(html: string, url: string): HtmlMetadata {
  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Meta description
  const metaDescMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
  ) ?? html.match(
    /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i
  );
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : null;

  // H1 tags
  const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
  const firstH1Match = h1Matches[0]?.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const firstH1 = firstH1Match ? firstH1Match[1].replace(/<[^>]*>/g, "").trim() : null;

  // Images
  const imgMatches = html.match(/<img[^>]*>/gi) ?? [];
  const imgsMissingAlt = imgMatches.filter(
    (img) => !img.match(/alt=["'][^"']+["']/i)
  ).length;

  // Viewport
  const hasViewport = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);

  // Canonical
  const hasCanonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);

  // Structured data (JSON-LD)
  const hasStructuredData = /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(html);

  // HTTPS
  const isHttps = url.startsWith("https://");

  // Robots meta
  const hasRobotsMeta = /<meta[^>]+name=["']robots["'][^>]*>/i.test(html);

  return {
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    h1Count: h1Matches.length,
    firstH1,
    imgCount: imgMatches.length,
    imgsMissingAlt,
    hasViewport,
    hasCanonical,
    hasStructuredData,
    isHttps,
    hasRobotsMeta,
  };
}

// --- On-Page SEO Rules ---

interface OnPageRule {
  id: string;
  severity: "critical" | "warning" | "info";
  evaluate: (meta: HtmlMetadata) => AuditIssue | null;
}

const onPageRules: OnPageRule[] = [
  {
    id: "missing-title",
    severity: "critical",
    evaluate: (m) =>
      !m.title
        ? {
            ruleId: "missing-title",
            severity: "critical",
            title: "Missing Page Title",
            description: "Your page has no <title> tag. This is critical for SEO and user experience.",
            metric: "titleLength",
            currentValue: 0,
            threshold: 1,
          }
        : null,
  },
  {
    id: "title-too-long",
    severity: "warning",
    evaluate: (m) =>
      m.title && m.titleLength > 60
        ? {
            ruleId: "title-too-long",
            severity: "warning",
            title: "Title Tag Too Long",
            description: `Your title is ${m.titleLength} characters. Google typically displays 50-60 characters.`,
            metric: "titleLength",
            currentValue: m.titleLength,
            threshold: 60,
          }
        : null,
  },
  {
    id: "title-too-short",
    severity: "warning",
    evaluate: (m) =>
      m.title && m.titleLength < 20
        ? {
            ruleId: "title-too-short",
            severity: "warning",
            title: "Title Tag Too Short",
            description: `Your title is only ${m.titleLength} characters. Aim for 20-60 characters for best results.`,
            metric: "titleLength",
            currentValue: m.titleLength,
            threshold: 20,
          }
        : null,
  },
  {
    id: "missing-meta-description",
    severity: "critical",
    evaluate: (m) =>
      !m.metaDescription
        ? {
            ruleId: "missing-meta-description",
            severity: "critical",
            title: "Missing Meta Description",
            description: "Your page has no meta description. This tag helps Google understand your page and improves CTR.",
            metric: "metaDescriptionLength",
            currentValue: 0,
            threshold: 1,
          }
        : null,
  },
  {
    id: "meta-description-too-long",
    severity: "warning",
    evaluate: (m) =>
      m.metaDescription && m.metaDescriptionLength > 160
        ? {
            ruleId: "meta-description-too-long",
            severity: "warning",
            title: "Meta Description Too Long",
            description: `Your meta description is ${m.metaDescriptionLength} characters. Google truncates at ~160 characters.`,
            metric: "metaDescriptionLength",
            currentValue: m.metaDescriptionLength,
            threshold: 160,
          }
        : null,
  },
  {
    id: "meta-description-too-short",
    severity: "warning",
    evaluate: (m) =>
      m.metaDescription && m.metaDescriptionLength < 70
        ? {
            ruleId: "meta-description-too-short",
            severity: "warning",
            title: "Meta Description Too Short",
            description: `Your meta description is only ${m.metaDescriptionLength} characters. Aim for 70-160 characters.`,
            metric: "metaDescriptionLength",
            currentValue: m.metaDescriptionLength,
            threshold: 70,
          }
        : null,
  },
  {
    id: "missing-h1",
    severity: "critical",
    evaluate: (m) =>
      m.h1Count === 0
        ? {
            ruleId: "missing-h1",
            severity: "critical",
            title: "Missing H1 Heading",
            description: "Your page has no H1 heading. Every page should have exactly one H1 for SEO.",
            metric: "h1Count",
            currentValue: 0,
            threshold: 1,
          }
        : null,
  },
  {
    id: "multiple-h1",
    severity: "warning",
    evaluate: (m) =>
      m.h1Count > 1
        ? {
            ruleId: "multiple-h1",
            severity: "warning",
            title: "Multiple H1 Headings",
            description: `Your page has ${m.h1Count} H1 tags. Best practice is to have exactly one H1.`,
            metric: "h1Count",
            currentValue: m.h1Count,
            threshold: 1,
          }
        : null,
  },
  {
    id: "images-without-alt",
    severity: "warning",
    evaluate: (m) =>
      m.imgsMissingAlt > 0
        ? {
            ruleId: "images-without-alt",
            severity: "warning",
            title: "Images Missing Alt Text",
            description: `${m.imgsMissingAlt} of ${m.imgCount} images are missing alt text. Alt text helps SEO and accessibility.`,
            metric: "imgsMissingAlt",
            currentValue: m.imgsMissingAlt,
            threshold: 0,
          }
        : null,
  },
  {
    id: "no-viewport-meta",
    severity: "critical",
    evaluate: (m) =>
      !m.hasViewport
        ? {
            ruleId: "no-viewport-meta",
            severity: "critical",
            title: "Missing Viewport Meta Tag",
            description: "Your page has no viewport meta tag. This is essential for mobile-friendly design.",
            metric: "hasViewport",
            currentValue: 0,
            threshold: 1,
          }
        : null,
  },
  {
    id: "no-canonical",
    severity: "warning",
    evaluate: (m) =>
      !m.hasCanonical
        ? {
            ruleId: "no-canonical",
            severity: "warning",
            title: "Missing Canonical Link",
            description: "Your page has no canonical tag. This can lead to duplicate content issues.",
            metric: "hasCanonical",
            currentValue: 0,
            threshold: 1,
          }
        : null,
  },
  {
    id: "no-structured-data",
    severity: "info",
    evaluate: (m) =>
      !m.hasStructuredData
        ? {
            ruleId: "no-structured-data",
            severity: "info",
            title: "No Structured Data Found",
            description: "No JSON-LD structured data detected. Adding schema markup can improve rich snippets.",
            metric: "hasStructuredData",
            currentValue: 0,
            threshold: 1,
          }
        : null,
  },
  {
    id: "not-https",
    severity: "critical",
    evaluate: (m) =>
      !m.isHttps
        ? {
            ruleId: "not-https",
            severity: "critical",
            title: "Not Using HTTPS",
            description: "Your site is not using HTTPS. This is a Google ranking signal and essential for security.",
            metric: "isHttps",
            currentValue: 0,
            threshold: 1,
          }
        : null,
  },
];

// --- On-Page Recommendations ---

const onPageRecommendationMap: Record<
  string,
  Omit<AuditRecommendation, "priority" | "relatedIssues">
> = {
  "missing-title": {
    title: "Add a Page Title",
    description: "Every page needs a unique, descriptive title tag. It's the most important on-page SEO element.",
    actionItems: [
      "Add a <title> tag in your page's <head> section",
      "Include your primary keyword near the beginning",
      "Keep it between 20-60 characters",
      "Make it compelling to encourage clicks from search results",
    ],
  },
  "title-too-long": {
    title: "Shorten Your Title Tag",
    description: "Your title is too long and will be truncated in search results, reducing its effectiveness.",
    actionItems: [
      "Trim your title to 60 characters or fewer",
      "Keep the most important keywords at the beginning",
      "Remove filler words and unnecessary branding",
      "Test how it appears with a SERP preview tool",
    ],
  },
  "title-too-short": {
    title: "Expand Your Title Tag",
    description: "Your title is too short to be effective. You're missing an opportunity to include relevant keywords.",
    actionItems: [
      "Expand your title to at least 20 characters",
      "Include your primary keyword and location",
      "Add a compelling value proposition",
      "Consider the format: Primary Keyword - Brand Name",
    ],
  },
  "missing-meta-description": {
    title: "Add a Meta Description",
    description: "Without a meta description, Google generates one automatically — which may not represent your page well.",
    actionItems: [
      "Add a <meta name='description'> tag in your <head>",
      "Write 70-160 characters summarizing the page",
      "Include your target keyword naturally",
      "Add a call to action (e.g., 'Learn more', 'Get a quote')",
      "Make it unique for every page",
    ],
  },
  "meta-description-too-long": {
    title: "Shorten Your Meta Description",
    description: "Your meta description is too long and will be cut off in search results.",
    actionItems: [
      "Trim it to 160 characters or fewer",
      "Put the most important information first",
      "Include your primary keyword early on",
      "End with a clear call to action",
    ],
  },
  "meta-description-too-short": {
    title: "Expand Your Meta Description",
    description: "Your meta description is too short to be compelling in search results.",
    actionItems: [
      "Expand it to at least 70 characters",
      "Describe what the user will find on the page",
      "Include relevant keywords naturally",
      "Add a compelling reason to click",
    ],
  },
  "missing-h1": {
    title: "Add an H1 Heading",
    description: "Your page is missing an H1 heading, which tells search engines the main topic of the page.",
    actionItems: [
      "Add exactly one <h1> tag to your page",
      "Include your primary keyword in the H1",
      "Make it descriptive and match user search intent",
      "Ensure it's visible and prominent on the page",
    ],
  },
  "multiple-h1": {
    title: "Use Only One H1 Heading",
    description: "Multiple H1 tags can confuse search engines about the page's main topic.",
    actionItems: [
      "Keep only the most relevant H1 tag",
      "Change other H1 tags to H2 or H3",
      "Ensure heading hierarchy is logical (H1 → H2 → H3)",
      "Each H1 should clearly describe the page topic",
    ],
  },
  "images-without-alt": {
    title: "Add Alt Text to Images",
    description: "Images without alt text miss SEO opportunities and hurt accessibility.",
    actionItems: [
      "Add descriptive alt text to every image",
      "Include relevant keywords where natural",
      "Describe what the image shows, not just 'image of...'",
      "Keep alt text under 125 characters",
      "Use empty alt='' only for decorative images",
    ],
  },
  "no-viewport-meta": {
    title: "Add Viewport Meta Tag",
    description: "Without a viewport tag, your page won't display correctly on mobile devices.",
    actionItems: [
      "Add <meta name='viewport' content='width=device-width, initial-scale=1'>",
      "Place it in the <head> section of every page",
      "Test your pages on mobile devices after adding it",
      "Ensure your CSS is responsive",
    ],
  },
  "no-canonical": {
    title: "Add a Canonical Tag",
    description: "A canonical tag prevents duplicate content issues and tells Google which URL is the preferred version.",
    actionItems: [
      "Add <link rel='canonical' href='...'> in the <head>",
      "Point it to the preferred URL for each page",
      "Use absolute URLs (not relative)",
      "Ensure it's consistent with your sitemap",
    ],
  },
  "no-structured-data": {
    title: "Add Structured Data",
    description: "Structured data (JSON-LD) helps Google understand your content and can enable rich search results.",
    actionItems: [
      "Add LocalBusiness schema for local businesses",
      "Include name, address, phone, opening hours",
      "Add FAQ schema if you have a FAQ section",
      "Test with Google's Rich Results Test tool",
      "Use JSON-LD format (recommended by Google)",
    ],
  },
  "not-https": {
    title: "Switch to HTTPS",
    description: "HTTPS is a confirmed Google ranking factor. Without it, browsers also show 'Not Secure' warnings.",
    actionItems: [
      "Obtain an SSL certificate (free via Let's Encrypt)",
      "Install the certificate on your server",
      "Redirect all HTTP URLs to HTTPS",
      "Update internal links and canonical tags to HTTPS",
      "Update your sitemap and Google Search Console",
    ],
  },
};

// --- Main Audit Function ---

// Performance rules we want to reuse from the existing rule set
const PERF_RULE_IDS = new Set(["slow-lcp", "poor-cls", "slow-fid"]);

export async function runPublicAudit(url: string): Promise<PublicAuditResult> {
  const [pageSpeed, htmlMeta] = await Promise.all([
    fetchPageSpeedMetrics(url),
    scrapeMetaTags(url),
  ]);

  // Build MetricsData with safe defaults so only performance rules fire
  const metricsForPerfRules: MetricsData = {
    sessions: 1000,
    mobilePercent: 60,
    bounceRate: 30,
    clicks: 100,
    impressions: 1000,
    ctr: 5,
    avgPosition: 5,
    indexedPages: 50,
    lcp: pageSpeed.lcp,
    cls: pageSpeed.cls,
    fid: pageSpeed.fid,
    topQueries: Array.from({ length: 10 }, (_, i) => ({
      query: `query-${i}`,
      clicks: 10,
      impressions: 100,
      ctr: 10,
      position: 5,
    })),
  };

  // Run existing performance rules
  const perfIssues: AuditIssue[] = [];
  for (const rule of rules) {
    if (!PERF_RULE_IDS.has(rule.id)) continue;
    const issue = rule.evaluate(metricsForPerfRules);
    if (issue) perfIssues.push(issue);
  }

  // Run on-page rules
  const onPageIssues: AuditIssue[] = [];
  for (const rule of onPageRules) {
    const issue = rule.evaluate(htmlMeta);
    if (issue) onPageIssues.push(issue);
  }

  const allIssues = [...perfIssues, ...onPageIssues];

  // Generate recommendations
  const perfRecs = generateRecommendations(perfIssues);
  const onPageRecs = generateOnPageRecommendations(onPageIssues);
  const allRecs = [...perfRecs, ...onPageRecs].map((r, i) => ({
    ...r,
    priority: i + 1,
  }));

  // Score calculation
  const perfPenalty = perfIssues.reduce((sum, i) => {
    return sum + (i.severity === "critical" ? 30 : i.severity === "warning" ? 15 : 5);
  }, 0);
  const rawPerfScore = Math.max(0, 100 - perfPenalty);
  const performanceScore =
    pageSpeed.performanceScore != null
      ? Math.round((rawPerfScore + pageSpeed.performanceScore) / 2)
      : rawPerfScore;

  const onPagePenalty = onPageIssues.reduce((sum, i) => {
    return sum + (i.severity === "critical" ? 15 : i.severity === "warning" ? 8 : 3);
  }, 0);
  const onPageScore = Math.max(0, 100 - onPagePenalty);

  const score = Math.round((performanceScore + onPageScore) / 2);

  return {
    url,
    score,
    performanceMetrics: {
      lcp: pageSpeed.lcp,
      cls: pageSpeed.cls,
      fid: pageSpeed.fid,
      lighthouseScore: pageSpeed.performanceScore,
    },
    htmlMetadata: htmlMeta,
    issues: allIssues,
    recommendations: allRecs,
    auditedAt: new Date().toISOString(),
  };
}

function generateOnPageRecommendations(
  issues: AuditIssue[]
): AuditRecommendation[] {
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sorted = [...issues].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const recommendations: AuditRecommendation[] = [];
  const seen = new Set<string>();

  for (const issue of sorted) {
    if (seen.has(issue.ruleId)) continue;
    seen.add(issue.ruleId);

    const rec = onPageRecommendationMap[issue.ruleId];
    if (!rec) continue;

    recommendations.push({
      ...rec,
      priority: recommendations.length + 1,
      relatedIssues: [issue.ruleId],
    });
  }

  return recommendations;
}
