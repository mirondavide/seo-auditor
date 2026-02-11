import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getAuthUrl } from "@/lib/google/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authUrl = getAuthUrl(session.user.id);
  return NextResponse.redirect(authUrl);
}
