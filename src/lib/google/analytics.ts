import { google } from "googleapis";
import type { OAuth2Client } from "googleapis-common";

const analyticsData = google.analyticsdata("v1beta");
const analyticsAdmin = google.analyticsadmin("v1beta");

export async function listGA4Properties(auth: OAuth2Client) {
  const response = await analyticsAdmin.accountSummaries.list({ auth });
  const properties: { id: string; name: string; account: string }[] = [];

  for (const account of response.data.accountSummaries || []) {
    for (const property of account.propertySummaries || []) {
      if (property.property && property.displayName) {
        properties.push({
          id: property.property.replace("properties/", ""),
          name: property.displayName,
          account: account.displayName || "Unknown",
        });
      }
    }
  }

  return properties;
}

export async function fetchGA4Metrics(
  auth: OAuth2Client,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  const response = await analyticsData.properties.runReport({
    auth,
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "activeUsers" },
      ],
      dimensions: [{ name: "deviceCategory" }],
    },
  });

  let totalSessions = 0;
  let mobileSessions = 0;
  let totalBounceRate = 0;
  let rowCount = 0;

  for (const row of response.data.rows || []) {
    const sessions = parseInt(row.metricValues?.[0]?.value || "0");
    const bounceRate = parseFloat(row.metricValues?.[1]?.value || "0");
    const device = row.dimensionValues?.[0]?.value || "";

    totalSessions += sessions;
    if (device === "mobile") {
      mobileSessions += sessions;
    }
    totalBounceRate += bounceRate * sessions;
    rowCount += sessions;
  }

  return {
    sessions: totalSessions,
    mobilePercent:
      totalSessions > 0
        ? Math.round((mobileSessions / totalSessions) * 100)
        : 0,
    bounceRate:
      rowCount > 0
        ? Math.round((totalBounceRate / rowCount) * 100) / 100
        : 0,
  };
}
