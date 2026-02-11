import { google } from "googleapis";
import type { OAuth2Client } from "googleapis-common";

const searchConsole = google.searchconsole("v1");

export async function listGSCSites(auth: OAuth2Client) {
  const response = await searchConsole.sites.list({ auth });
  return (response.data.siteEntry || []).map((site) => ({
    siteUrl: site.siteUrl!,
    permissionLevel: site.permissionLevel,
  }));
}

export async function fetchGSCMetrics(
  auth: OAuth2Client,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const response = await searchConsole.searchanalytics.query({
    auth,
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: [],
      type: "web",
    },
  });

  const row = response.data.rows?.[0];
  return {
    clicks: Math.round(row?.clicks || 0),
    impressions: Math.round(row?.impressions || 0),
    ctr: Math.round((row?.ctr || 0) * 10000) / 100, // convert to percentage
    avgPosition: Math.round((row?.position || 0) * 100) / 100,
  };
}

export async function fetchTopQueries(
  auth: OAuth2Client,
  siteUrl: string,
  startDate: string,
  endDate: string,
  limit = 20
) {
  const response = await searchConsole.searchanalytics.query({
    auth,
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query"],
      type: "web",
      rowLimit: limit,
    },
  });

  return (response.data.rows || []).map((row) => ({
    query: row.keys?.[0] || "",
    clicks: Math.round(row.clicks || 0),
    impressions: Math.round(row.impressions || 0),
    ctr: Math.round((row.ctr || 0) * 10000) / 100,
    position: Math.round((row.position || 0) * 100) / 100,
  }));
}

export async function fetchIndexedPages(
  auth: OAuth2Client,
  siteUrl: string
) {
  try {
    const response = await searchConsole.searchanalytics.query({
      auth,
      siteUrl,
      requestBody: {
        startDate: getDateString(-28),
        endDate: getDateString(-1),
        dimensions: ["page"],
        type: "web",
        rowLimit: 1,
      },
    });
    // The total number of rows (without rowLimit) approximates indexed pages
    return response.data.rows?.length || 0;
  } catch {
    return null;
  }
}

function getDateString(daysOffset: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
}
