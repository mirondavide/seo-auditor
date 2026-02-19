import { NextResponse } from "next/server";
import { getStripe, tierFromPriceId } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;
      const tier = (session.metadata?.tier as "pro" | "agency") || "pro";

      await db.insert(subscriptions).values({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        planTier: tier,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const subId = subscription.id;
      const subData = subscription as unknown as Record<string, unknown>;

      // Detect tier from the current price
      const items = subData.items as { data?: { price?: { id?: string } }[] } | undefined;
      const priceId = items?.data?.[0]?.price?.id;
      const detectedTier = priceId ? tierFromPriceId(priceId) : null;

      await db
        .update(subscriptions)
        .set({
          status: subscription.status as "active" | "canceled" | "past_due" | "trialing" | "unpaid" | "incomplete",
          ...(detectedTier && { planTier: detectedTier }),
          currentPeriodStart: typeof subData.current_period_start === "number"
            ? new Date(subData.current_period_start * 1000)
            : new Date(),
          currentPeriodEnd: typeof subData.current_period_end === "number"
            ? new Date(subData.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: Boolean(subData.cancel_at_period_end),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subId));
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceData = invoice as unknown as Record<string, unknown>;
      const subId = invoiceData.subscription as string;
      if (subId) {
        await db
          .update(subscriptions)
          .set({
            status: "past_due",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subId));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
