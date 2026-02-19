import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { getUserPlanLimits } from "@/lib/subscription";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limits = await getUserPlanLimits(session.user.id);
  if (!limits.whiteLabelPdf) {
    return NextResponse.json(
      { error: "White-label PDF requires an Agency subscription." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("logo") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 2 MB" }, { status: 400 });
  }

  // Delete old logo if exists
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { brandLogoUrl: true },
  });

  if (user?.brandLogoUrl) {
    try {
      await del(user.brandLogoUrl);
    } catch {
      // Ignore deletion errors for old blobs
    }
  }

  const blob = await put(`logos/${session.user.id}/${file.name}`, file, {
    access: "public",
    contentType: file.type,
  });

  await db
    .update(users)
    .set({ brandLogoUrl: blob.url, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ url: blob.url });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { brandLogoUrl: true },
  });

  if (user?.brandLogoUrl) {
    try {
      await del(user.brandLogoUrl);
    } catch {
      // Ignore deletion errors
    }
  }

  await db
    .update(users)
    .set({ brandLogoUrl: null, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
