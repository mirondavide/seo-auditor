import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { PlanTier, PlanLimits } from "@/types";
import { PLAN_LIMITS } from "@/types";

export async function getUserPlan(userId: string): Promise<PlanTier> {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing")
  ) {
    return "pro";
  }

  return "free";
}

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const plan = await getUserPlan(userId);
  return PLAN_LIMITS[plan];
}

export async function getUserSubscription(userId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
}
