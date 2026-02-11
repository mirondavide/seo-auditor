import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createCustomerPortalSession } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/subscription";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getUserSubscription(session.user.id);
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 404 }
    );
  }

  const portalSession = await createCustomerPortalSession(
    subscription.stripeCustomerId
  );

  return NextResponse.json({ url: portalSession.url });
}
