import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createCheckoutSession } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/subscription";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getUserSubscription(session.user.id);

  const checkoutSession = await createCheckoutSession(
    session.user.id,
    session.user.email,
    subscription?.stripeCustomerId
  );

  return NextResponse.json({ url: checkoutSession.url });
}
