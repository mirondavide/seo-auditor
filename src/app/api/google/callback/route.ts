import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { googleConnections } from "@/lib/db/schema";
import { exchangeCodeForTokens, getOAuth2Client } from "@/lib/google/client";
import { google } from "googleapis";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_denied`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Get user email from Google
    const client = getOAuth2Client();
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const userInfo = await oauth2.userinfo.get();

    await db.insert(googleConnections).values({
      userId: state,
      googleEmail: userInfo.data.email || "unknown",
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      tokenExpiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null,
      scopes: tokens.scope || "",
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=google_connected`
    );
  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_failed`
    );
  }
}
