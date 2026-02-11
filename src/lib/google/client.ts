import { google } from "googleapis";
import { db } from "@/lib/db";
import { googleConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const GOOGLE_API_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_API_CLIENT_ID,
    process.env.GOOGLE_API_CLIENT_SECRET,
    process.env.GOOGLE_API_REDIRECT_URI
  );
}

export function getAuthUrl(state: string) {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_API_SCOPES,
    state,
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getAuthenticatedClient(connectionId: string) {
  const connection = await db.query.googleConnections.findFirst({
    where: eq(googleConnections.id, connectionId),
  });

  if (!connection) {
    throw new Error("Google connection not found");
  }

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.tokenExpiresAt?.getTime(),
  });

  // Handle token refresh
  client.on("tokens", async (tokens) => {
    await db
      .update(googleConnections)
      .set({
        accessToken: tokens.access_token ?? connection.accessToken,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : connection.tokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(googleConnections.id, connectionId));
  });

  // Force refresh if token is expired
  if (
    connection.tokenExpiresAt &&
    connection.tokenExpiresAt.getTime() < Date.now()
  ) {
    await client.refreshAccessToken();
  }

  return client;
}
