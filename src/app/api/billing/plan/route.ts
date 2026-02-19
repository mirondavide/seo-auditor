import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getUserPlan, getUserSubscription } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(session.user.id);
  const subscription = await getUserSubscription(session.user.id);

  return NextResponse.json({
    plan,
    subscription: subscription
      ? {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
  });
}
