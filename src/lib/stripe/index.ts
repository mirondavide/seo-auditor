import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_PRICES: Record<"pro" | "agency", string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  agency: process.env.STRIPE_AGENCY_PRICE_ID!,
};

export function tierFromPriceId(priceId: string): "pro" | "agency" | null {
  for (const [tier, id] of Object.entries(STRIPE_PRICES)) {
    if (id === priceId) return tier as "pro" | "agency";
  }
  return null;
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  tier: "pro" | "agency",
  customerId?: string
) {
  const session = await getStripe().checkout.sessions.create({
    customer: customerId || undefined,
    customer_email: customerId ? undefined : email,
    mode: "subscription",
    line_items: [
      {
        price: STRIPE_PRICES[tier],
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    tax_id_collection: { enabled: true },
    payment_method_types: ["card", "sepa_debit"],
    metadata: {
      userId,
      tier,
    },
    subscription_data: {
      metadata: {
        userId,
        tier,
      },
    },
  });

  return session;
}

export async function createCustomerPortalSession(customerId: string) {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return session;
}
