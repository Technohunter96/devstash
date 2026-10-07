// Free-tier limits enforced by src/lib/usage-limits.ts
export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

// Pro plan pricing — single source of truth for marketing UI and live Stripe Price amounts
export const PRO_MONTHLY_PRICE = 8;
export const PRO_YEARLY_PRICE = 69;
export const PRO_YEARLY_PRICE_AT_MONTHLY_RATE = PRO_MONTHLY_PRICE * 12;
export const PRO_YEARLY_SAVINGS_PERCENT = Math.round(
  (1 - PRO_YEARLY_PRICE / PRO_YEARLY_PRICE_AT_MONTHLY_RATE) * 100,
);
