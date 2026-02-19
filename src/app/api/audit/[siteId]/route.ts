import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { audits, sites } from "@/lib/db/schema";
import { eq, and, count, gte } from "drizzle-orm";
import { runAudit } from "@/lib/analysis/engine";
import { getUserPlanLimits } from "@/lib/subscription";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId } = await params;

  // Verify site ownership
  const site = await db.query.sites.findFirst({
    where: and(eq(sites.id, siteId), eq(sites.userId, session.user.id)),
  });

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Check plan limits
  const limits = await getUserPlanLimits(session.user.id);
  if (limits.maxAuditsPerMonth > 0) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [auditCount] = await db
      .select({ count: count() })
      .from(audits)
      .where(
        and(eq(audits.siteId, siteId), gte(audits.createdAt, monthStart))
      );

    if (auditCount.count >= limits.maxAuditsPerMonth) {
      return NextResponse.json(
        { error: "Monthly audit limit reached. Upgrade to Pro or Agency for unlimited audits." },
        { status: 403 }
      );
    }
  }

  // Create audit record
  const [audit] = await db
    .insert(audits)
    .values({
      siteId,
      status: "pending",
    })
    .returning();

  // Run audit (synchronous for now since it's fast)
  try {
    const result = await runAudit(siteId, audit.id);
    return NextResponse.json({ audit: { ...audit, ...result } });
  } catch (error) {
    console.error("Audit error:", error);
    return NextResponse.json(
      { error: "Audit failed" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { siteId } = await params;

  const siteAudits = await db.query.audits.findMany({
    where: eq(audits.siteId, siteId),
    orderBy: (audits, { desc }) => [desc(audits.createdAt)],
    limit: 10,
  });

  return NextResponse.json({ audits: siteAudits });
}
