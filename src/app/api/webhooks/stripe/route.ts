import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getUserByStripeCustomerId, setUserProStatus } from "@/lib/db/billing";

function customerIdOf(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Async payment methods (e.g. Klarna) can complete checkout before the money arrives
      if (session.payment_status !== "paid") return;
      const userId = session.client_reference_id;
      const customerId = customerIdOf(session.customer);
      if (!userId || !customerId) return;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      await setUserProStatus(userId, {
        isPro: true,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId ?? null,
      });
      return;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = customerIdOf(subscription.customer);
      if (!customerId) return;
      const user = await getUserByStripeCustomerId(customerId);
      if (!user) return;
      await setUserProStatus(user.id, {
        isPro: subscription.status === "active" || subscription.status === "trialing",
      });
      return;
    }
    case "customer.subscription.deleted": {
      const customerId = customerIdOf(event.data.object.customer);
      if (!customerId) return;
      const user = await getUserByStripeCustomerId(customerId);
      if (!user) return;
      await setUserProStatus(user.id, { isPro: false, stripeSubscriptionId: null });
      return;
    }
  }
}

export async function POST(req: Request) {
  // Raw body is required for signature verification — never call req.json() first
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleEvent(event);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
