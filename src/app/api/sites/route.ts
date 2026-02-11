import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { z } from "zod";
import { getUserPlanLimits } from "@/lib/subscription";

const createSiteSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  googleConnectionId: z.string().uuid().optional(),
  ga4PropertyId: z.string().optional(),
  gscSiteUrl: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userSites = await db.query.sites.findMany({
    where: eq(sites.userId, session.user.id),
    with: { googleConnection: true },
    orderBy: (sites, { desc }) => [desc(sites.createdAt)],
  });

  return NextResponse.json({ sites: userSites });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  // Check site limits
  const limits = await getUserPlanLimits(session.user.id);
  const [siteCount] = await db
    .select({ count: count() })
    .from(sites)
    .where(eq(sites.userId, session.user.id));

  if (siteCount.count >= limits.maxSites) {
    return NextResponse.json(
      { error: `Site limit reached (${limits.maxSites}). Upgrade to add more sites.` },
      { status: 403 }
    );
  }

  const [site] = await db
    .insert(sites)
    .values({
      userId: session.user.id,
      url: parsed.data.url,
      name: parsed.data.name,
      googleConnectionId: parsed.data.googleConnectionId,
      ga4PropertyId: parsed.data.ga4PropertyId,
      gscSiteUrl: parsed.data.gscSiteUrl,
    })
    .returning();

  return NextResponse.json({ site }, { status: 201 });
}
