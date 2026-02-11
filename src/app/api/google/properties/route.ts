import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getAuthenticatedClient } from "@/lib/google/client";
import { listGA4Properties } from "@/lib/google/analytics";
import { listGSCSites } from "@/lib/google/search-console";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const connectionId = url.searchParams.get("connectionId");

  if (!connectionId) {
    return NextResponse.json(
      { error: "connectionId is required" },
      { status: 400 }
    );
  }

  try {
    const client = await getAuthenticatedClient(connectionId);

    const [properties, gscSites] = await Promise.all([
      listGA4Properties(client),
      listGSCSites(client),
    ]);

    return NextResponse.json({ properties, gscSites });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch Google properties" },
      { status: 500 }
    );
  }
}
