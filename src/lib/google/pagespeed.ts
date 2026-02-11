interface PageSpeedResult {
  lcp: number | null;
  cls: number | null;
  fid: number | null;
  performanceScore: number | null;
}

export async function fetchPageSpeedMetrics(
  url: string
): Promise<PageSpeedResult> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const apiUrl = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
  );
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("category", "performance");
  apiUrl.searchParams.set("strategy", "mobile");
  if (apiKey) {
    apiUrl.searchParams.set("key", apiKey);
  }

  try {
    const response = await fetch(apiUrl.toString(), {
      next: { revalidate: 86400 }, // cache for 24h
    });

    if (!response.ok) {
      console.error("PageSpeed API error:", response.statusText);
      return { lcp: null, cls: null, fid: null, performanceScore: null };
    }

    const data = await response.json();
    const fieldData = data.loadingExperience?.metrics;
    const lighthouseScore =
      data.lighthouseResult?.categories?.performance?.score;

    return {
      lcp: fieldData?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null,
      cls:
        fieldData?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null
          ? fieldData.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100
          : null,
      fid: fieldData?.FIRST_INPUT_DELAY_MS?.percentile ?? null,
      performanceScore: lighthouseScore != null ? lighthouseScore * 100 : null,
    };
  } catch (error) {
    console.error("PageSpeed fetch error:", error);
    return { lcp: null, cls: null, fid: null, performanceScore: null };
  }
}
