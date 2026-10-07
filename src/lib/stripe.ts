import Stripe from "stripe";

let stripe: Stripe | null = null;

// Lazy singleton — never instantiate at module load time (breaks edge/test imports without the env var set)
export function getStripe(): Stripe {
  if (stripe) return stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  stripe = new Stripe(secretKey);
  return stripe;
}

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,
};