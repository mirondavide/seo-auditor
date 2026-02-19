import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createCheckoutSession } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/subscription";
import { z } from "zod";

const checkoutSchema = z.object({
  tier: z.enum(["pro", "agency"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid tier", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const subscription = await getUserSubscription(session.user.id);

  const checkoutSession = await createCheckoutSession(
    session.user.id,
    session.user.email,
    parsed.data.tier,
    subscription?.stripeCustomerId
  );

  return NextResponse.json({ url: checkoutSession.url });
}
