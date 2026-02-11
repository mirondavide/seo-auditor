import type { AuditIssue, AuditRecommendation } from "@/types";

const recommendationMap: Record<
  string,
  Omit<AuditRecommendation, "priority" | "relatedIssues">
> = {
  "mobile-traffic-low": {
    title: "Optimize for Mobile",
    description:
      "Your mobile traffic is below average. Google uses mobile-first indexing, meaning mobile performance directly impacts rankings.",
    actionItems: [
      "Test your site with Google's Mobile-Friendly Test tool",
      "Ensure all pages use responsive design",
      "Optimize tap targets (buttons, links) for mobile screens",
      "Reduce page weight for faster mobile loading",
      "Submit a mobile sitemap to Google Search Console",
    ],
  },
  "slow-lcp": {
    title: "Improve Page Load Speed",
    description:
      "Your page takes too long to display its main content. This hurts both rankings and user experience.",
    actionItems: [
      "Compress and serve images in WebP/AVIF format",
      "Enable server-side caching and CDN",
      "Minimize render-blocking CSS and JavaScript",
      "Preload critical resources (fonts, hero images)",
      "Consider lazy loading for below-the-fold images",
    ],
  },
  "poor-cls": {
    title: "Fix Layout Shifts",
    description:
      "Your page layout moves while loading, which frustrates users and hurts Core Web Vitals scores.",
    actionItems: [
      "Set explicit width/height on all images and videos",
      "Avoid dynamically injected content above the fold",
      "Use CSS font-display: swap for web fonts",
      "Reserve space for ads and embeds with CSS aspect-ratio",
    ],
  },
  "slow-fid": {
    title: "Improve Interactivity",
    description:
      "Your page is slow to respond to user input. This can increase bounce rates.",
    actionItems: [
      "Break up long JavaScript tasks into smaller chunks",
      "Defer non-critical third-party scripts",
      "Use web workers for heavy computations",
      "Minimize main thread work during page load",
    ],
  },
  "low-ctr": {
    title: "Improve Click-Through Rate",
    description:
      "Users see your site in search results but don't click. Better titles and descriptions can fix this.",
    actionItems: [
      "Rewrite page titles to include local keywords (city, neighborhood)",
      "Write compelling meta descriptions with calls to action",
      "Add structured data (LocalBusiness schema) for rich snippets",
      "Use numbers and power words in titles (e.g., 'Top 5', 'Best')",
      "Ensure your Google Business Profile is complete and up-to-date",
    ],
  },
  "high-bounce-rate": {
    title: "Reduce Bounce Rate",
    description:
      "Visitors are leaving your site quickly. Improve content relevance and user experience.",
    actionItems: [
      "Ensure page content matches the search query intent",
      "Add clear calls to action above the fold",
      "Improve internal linking to guide users to related content",
      "Speed up page loading (high load time increases bounces)",
      "Add contact information prominently on every page",
    ],
  },
  "poor-position": {
    title: "Improve Search Rankings",
    description:
      "Your average search position is too low for meaningful traffic. Focus on local SEO signals.",
    actionItems: [
      "Create location-specific landing pages",
      "Build local citations (directories, chamber of commerce)",
      "Get reviews on Google Business Profile",
      "Add internal links between related content",
      "Update and expand existing content regularly",
    ],
  },
  "low-sessions": {
    title: "Increase Website Traffic",
    description:
      "Your site has very few visitors. A combination of SEO and local marketing can help.",
    actionItems: [
      "Claim and optimize your Google Business Profile",
      "Create a blog with locally relevant content",
      "Add your business to local directories",
      "Share content on social media consistently",
      "Consider Google Ads for immediate local visibility",
    ],
  },
  "low-impressions": {
    title: "Increase Search Visibility",
    description:
      "Your site appears in very few searches. You need to target more keywords.",
    actionItems: [
      "Research local keywords with Google Keyword Planner",
      "Create content targeting local service queries",
      "Submit a complete XML sitemap to Search Console",
      "Ensure all pages have unique, descriptive title tags",
      "Add location-specific content to your main pages",
    ],
  },
  "indexing-low": {
    title: "Get More Pages Indexed",
    description:
      "Google has indexed very few of your pages. More indexed pages means more potential search traffic.",
    actionItems: [
      "Submit an XML sitemap via Google Search Console",
      "Check robots.txt for accidental blocking",
      "Ensure all important pages are linked from your main navigation",
      "Add a blog or resource section with regular content",
      "Fix any crawl errors shown in Search Console",
    ],
  },
  "no-clicks": {
    title: "Fix Zero-Click Issue",
    description:
      "Your site is getting no clicks from Google Search. This needs immediate attention.",
    actionItems: [
      "Verify your site is properly indexed in Google Search Console",
      "Check for manual actions or penalties in Search Console",
      "Ensure your robots.txt isn't blocking Googlebot",
      "Submit your sitemap and request indexing for key pages",
      "Review and fix any critical crawl errors",
    ],
  },
  "few-queries": {
    title: "Expand Keyword Coverage",
    description:
      "Your site ranks for very few search queries. Broader keyword coverage drives more traffic.",
    actionItems: [
      "Research competitor keywords with free tools (Ubersuggest, AnswerThePublic)",
      "Create FAQ pages targeting common customer questions",
      "Add service-specific pages for each offering",
      "Write blog posts targeting long-tail local keywords",
      "Use variations and synonyms of your main keywords",
    ],
  },
};

export function generateRecommendations(
  issues: AuditIssue[]
): AuditRecommendation[] {
  // Sort by severity: critical > warning > info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const sorted = [...issues].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const recommendations: AuditRecommendation[] = [];
  const seen = new Set<string>();

  for (const issue of sorted) {
    if (seen.has(issue.ruleId)) continue;
    seen.add(issue.ruleId);

    const rec = recommendationMap[issue.ruleId];
    if (!rec) continue;

    recommendations.push({
      ...rec,
      priority: recommendations.length + 1,
      relatedIssues: [issue.ruleId],
    });
  }

  return recommendations;
}
