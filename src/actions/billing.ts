"use server";

import { auth } from "@/auth";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { getStripeCustomerIdByUserId } from "@/lib/db/billing";

type BillingUrlResult = { success: true; url: string } | { success: false; error: string };

export async function createCheckoutSession(
  interval: "monthly" | "yearly"
): Promise<BillingUrlResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Prevents a second subscription; Pro users manage their plan via the billing portal
  if (session.user.isPro) {
    return { success: false, error: "You already have an active Pro plan" };
  }

  const priceId = STRIPE_PRICE_IDS[interval];
  if (!priceId) {
    return { success: false, error: "Price not configured" };
  }

  try {
    const customerId = await getStripeCustomerIdByUserId(session.user.id);
    const checkout = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // client_reference_id is the only link back to the DevStash user in the webhook
      client_reference_id: session.user.id,
      ...(customerId ? { customer: customerId } : { customer_email: session.user.email ?? undefined }),
      success_url: `${process.env.APP_URL}/settings?checkout=success`,
      cancel_url: `${process.env.APP_URL}/settings?checkout=cancelled`,
    });

    if (!checkout.url) {
      return { success: false, error: "Could not create checkout session" };
    }
    return { success: true, url: checkout.url };
  } catch {
    return { success: false, error: "Could not create checkout session" };
  }
}

export async function createBillingPortalSession(): Promise<BillingUrlResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const customerId = await getStripeCustomerIdByUserId(session.user.id);
    if (!customerId) {
      return { success: false, error: "No billing account found" };
    }

    const portal = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL}/settings`,
    });
    return { success: true, url: portal.url };
  } catch {
    return { success: false, error: "Could not open billing portal" };
  }
}

// UI hint only for greying out Pro features — real gating is enforced server-side in each action
export async function getIsPro(): Promise<boolean> {
  const session = await auth();
  return session?.user?.isPro ?? false;
}
