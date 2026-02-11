import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sites, metricsSnapshots, audits, alerts } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const updateSiteSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  googleConnectionId: z.string().uuid().nullable().optional(),
  ga4PropertyId: z.string().nullable().optional(),
  gscSiteUrl: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId } = await params;

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
    with: { googleConnection: true },
  });

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Fetch recent data
  const [recentSnapshots, recentAudits, recentAlerts] = await Promise.all([
    db.query.metricsSnapshots.findMany({
      where: eq(metricsSnapshots.siteId, siteId),
      orderBy: [desc(metricsSnapshots.snapshotDate)],
      limit: 30,
    }),
    db.query.audits.findMany({
      where: eq(audits.siteId, siteId),
      orderBy: [desc(audits.createdAt)],
      limit: 5,
    }),
    db.query.alerts.findMany({
      where: eq(alerts.siteId, siteId),
      orderBy: [desc(alerts.createdAt)],
      limit: 10,
    }),
  ]);

  return NextResponse.json({
    site,
    snapshots: recentSnapshots,
    audits: recentAudits,
    alerts: recentAlerts,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId } = await params;
  const body = await request.json();
  const parsed = updateSiteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
  });

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(sites)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(sites.id, siteId))
    .returning();

  return NextResponse.json({ site: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId } = await params;

  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
  });

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  await db.delete(sites).where(eq(sites.id, siteId));

  return NextResponse.json({ success: true });
}
