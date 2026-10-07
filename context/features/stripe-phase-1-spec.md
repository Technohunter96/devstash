# Stripe Integration — Phase 1: Core Infrastructure

## Overview

Foundational plumbing for Stripe billing: the Stripe client, billing DB helpers, `isPro` synced into the NextAuth session, and a pure `usage-limits` module with full unit test coverage. Nothing here makes a real Stripe API call, handles a webhook, or touches UI — every piece is verifiable with `npm test` alone. Checkout, the webhook, gating enforcement, and UI land in Phase 2.

Reference: `docs/stripe-integration-plan.md` §§1–4 for full code samples and rationale.

## Requirements

- Install the `stripe` npm package
- Lazy Stripe client singleton, following the same pattern as `getRedis()` in `src/lib/rate-limit.ts`
- Billing constants in `src/lib/constants/billing.ts` (per `feedback_constants_directory` convention)
- A pure `usage-limits` module — no `prisma`/`auth()` imports — that Phase 2's server actions will call
- DB helper functions for reading/writing a user's Stripe fields
- `isPro` synced onto the session the same way `emailVerified` already is

## Files to Create

1. `src/lib/stripe.ts` — `getStripe()` lazy singleton; throws if `STRIPE_SECRET_KEY` is missing. Also exports `STRIPE_PRICE_IDS = { monthly, yearly }` read from `STRIPE_PRICE_ID_MONTHLY`/`STRIPE_PRICE_ID_YEARLY`.
2. `src/lib/constants/billing.ts` — `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3`, plus `PRO_MONTHLY_PRICE`/`PRO_YEARLY_PRICE`/`PRO_YEARLY_PRICE_AT_MONTHLY_RATE`/`PRO_YEARLY_SAVINGS_PERCENT` (moved here from where they're currently hardcoded in `PricingSection.tsx`, which Phase 2 will update to import from here).
3. `src/lib/usage-limits.ts` — pure gating logic (see contract below).
4. `src/lib/usage-limits.test.ts` — unit tests for the above.
5. `src/lib/db/billing.ts`:
   ```typescript
   export async function getUserByStripeCustomerId(customerId: string) { ... }
   export async function setUserProStatus(
     userId: string,
     data: { isPro: boolean; stripeCustomerId?: string; stripeSubscriptionId?: string | null }
   ) { ... }
   ```

## Files to Modify

1. `package.json` — add `stripe` dependency.
2. `prisma/schema.prisma` (optional, recommended) — add `stripePriceId String? @map("stripe_price_id")` and `currentPeriodEnd DateTime? @map("current_period_end")` to `User`, so the Phase 2 billing UI can show plan interval / renewal date without an extra Stripe API call. Requires `prisma migrate dev --name add_stripe_billing_fields` — never `db push`.
3. `src/auth.ts` — extend the existing `jwt` callback's `prisma.user.findUnique` to also `select: { isPro: true }` (piggybacks on the query already run for `emailVerified` — no new DB round trip), and copy it onto `token.isPro`; `session` callback copies `token.isPro` → `session.user.isPro`.
4. `src/types/next-auth.d.ts` — add `isPro: boolean` to the `Session.user` interface.

## `usage-limits.ts` Contract

Pure functions — no side effects, no imports beyond the constants file. Server actions in Phase 2 pass in a count they've already fetched from the DB plus `session.user.isPro`; this module just decides yes/no and supplies the user-facing message.

```typescript
import { FREE_ITEM_LIMIT, FREE_COLLECTION_LIMIT } from "@/lib/constants/billing";

export type LimitCheck = { allowed: true } | { allowed: false; reason: string };

export function canCreateItem(currentItemCount: number, isPro: boolean): LimitCheck {
  if (isPro || currentItemCount < FREE_ITEM_LIMIT) return { allowed: true };
  return {
    allowed: false,
    reason: `Free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`,
  };
}

export function canCreateCollection(currentCollectionCount: number, isPro: boolean): LimitCheck {
  if (isPro || currentCollectionCount < FREE_COLLECTION_LIMIT) return { allowed: true };
  return {
    allowed: false,
    reason: `Free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
  };
}

export function canUploadFileType(typeName: string, isPro: boolean): LimitCheck {
  if (isPro || (typeName !== "File" && typeName !== "Image")) return { allowed: true };
  return {
    allowed: false,
    reason: "File and image uploads are a Pro feature. Upgrade to Pro to enable them.",
  };
}
```

## Unit Tests (`src/lib/usage-limits.test.ts`)

- `canCreateItem`
  - allows when `currentItemCount < FREE_ITEM_LIMIT` and not Pro
  - blocks when `currentItemCount === FREE_ITEM_LIMIT` and not Pro
  - blocks when `currentItemCount > FREE_ITEM_LIMIT` and not Pro
  - allows regardless of count when `isPro === true`
  - returns a `reason` string on the blocked case
- `canCreateCollection` — same four cases, against `FREE_COLLECTION_LIMIT`
- `canUploadFileType`
  - blocks `"File"` and `"Image"` when not Pro
  - allows `"File"` and `"Image"` when Pro
  - allows any other type name (`"Snippet"`, `"Link"`, etc.) regardless of Pro status
- `getStripe()` (`src/lib/stripe.test.ts`)
  - throws when `STRIPE_SECRET_KEY` is unset
  - returns the same cached instance on a second call (mock `Stripe` constructor, assert called once)

No mocking of `prisma`/`auth()` needed for the `usage-limits` tests — that's the point of keeping the module pure.

## Testing Checklist

- [ ] `npm run build && npm run lint && npm test` all pass
- [ ] No Stripe CLI or live API calls required for this phase — everything is verified by the automated suite

## Key Gotchas

- Keep `usage-limits.ts` free of any `prisma` or `auth()` import — Phase 2 wires it into server actions, but the module itself must stay a pure function set for the unit tests to work without mocking.
- `src/auth.config.ts` is the edge-compatible config used by `proxy.ts` and must **never** import `src/lib/stripe.ts` — the Stripe SDK and secret key have no business running on the edge, and pulling it in would bloat/break that bundle.
- `getStripe()` must not instantiate the `Stripe` client at module load time (breaks any test or edge context that imports the module without the env var set) — lazy singleton only, same shape as `getRedis()`.