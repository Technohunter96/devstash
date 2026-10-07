# Stripe Integration — Phase 2: Integration & UI

## Overview

Wires the Phase 1 infrastructure into the running app: checkout/billing-portal server actions, the webhook that keeps `isPro` in sync with Stripe, free-tier enforcement in the item/collection creation actions, and the settings/pricing UI. Every requirement in this phase needs the Stripe CLI (`stripe listen` / `stripe trigger`) and/or a browser checkout with a Stripe test card to actually verify — Vitest mocks cover the code paths but not the real round trip to Stripe.

**Depends on Phase 1** (`context/features/stripe-phase-1-spec.md`): `getStripe()`, `STRIPE_PRICE_IDS`, `src/lib/constants/billing.ts`, `src/lib/usage-limits.ts`, `src/lib/db/billing.ts`, and `session.user.isPro` must all exist before starting this phase.

Reference: `docs/stripe-integration-plan.md` §§4–7 for full code samples and rationale.

## Requirements

- Server actions to create a Stripe Checkout session and a Billing Portal session
- `POST /api/webhooks/stripe` — verifies the Stripe signature, updates `isPro`/`stripeCustomerId`/`stripeSubscriptionId` on the relevant subscription lifecycle events
- Free-tier enforcement wired into `createItem` (File/Image gating + 50-item limit) and `createCollection` (3-collection limit), using Phase 1's `usage-limits` module
- Settings UI showing current plan + an upgrade/manage-billing action
- Marketing pricing section's Pro CTA actually starts checkout instead of pointing at `/register`/`/dashboard`

## Files to Create

1. `src/actions/billing.ts`:
   ```typescript
   export async function createCheckoutSession(interval: "monthly" | "yearly"): Promise<
     { success: true; url: string } | { success: false; error: string }
   >
   export async function createBillingPortalSession(): Promise<
     { success: true; url: string } | { success: false; error: string }
   >
   ```
   Both follow the standard action shape: `auth()` guard first, `{ success, data/error }` return. `createCheckoutSession` looks up (or omits) the user's existing `stripeCustomerId`, sets `client_reference_id` to the DevStash user ID (this is what the webhook uses to map the completed checkout back to a user), and redirects success/cancel to `/settings?checkout=success|cancelled`. `createBillingPortalSession` errors with `"No billing account found"` if the user has no `stripeCustomerId` yet.
2. `src/actions/billing.test.ts` — mock the Stripe SDK module-level (`vi.mock`), no live calls:
   - `createCheckoutSession`: unauthorized → error; missing price ID for the given interval → error; success → returns `checkoutSession.url`
   - `createBillingPortalSession`: unauthorized → error; user has no `stripeCustomerId` → error; success → returns `portalSession.url`
3. `src/app/api/webhooks/stripe/route.ts` — `POST` handler:
   - Reads the raw body via `req.text()` (required for signature verification — do not `req.json()` first)
   - Verifies `stripe-signature` header against `STRIPE_WEBHOOK_SECRET` via `getStripe().webhooks.constructEvent(...)`; invalid/missing → `400`
   - `checkout.session.completed` → `setUserProStatus(userId, { isPro: true, stripeCustomerId, stripeSubscriptionId })` using `client_reference_id` for `userId`
   - `customer.subscription.updated` → look up user via `getUserByStripeCustomerId`, set `isPro` based on `status === "active" || status === "trialing"`
   - `customer.subscription.deleted` → set `isPro: false`, `stripeSubscriptionId: null`
   - Handler body wrapped in try/catch → `500` on failure, but the signature-verification step is a separate try/catch → `400` (a bad signature is a client error, not a server error)
4. `src/components/settings/BillingCard.tsx` — `"use client"`, mirrors `AccountActionsCard.tsx`'s `Card` + action-row structure:
   - Free: shows "Free plan" + an "Upgrade to Pro" button offering monthly/yearly, calls `createCheckoutSession(interval)`, then `window.location.href = result.url` on success
   - Pro: shows "Pro plan" + a "Manage Billing" button, calls `createBillingPortalSession()`, redirects the same way

## Files to Modify

1. `src/actions/items.ts` — in `createItem`, after the `auth()` check:
   - Reject `typeName === "File" | "Image"` via `canUploadFileType(typeName, session.user.isPro)` when not allowed
   - Reject creation past the free limit via `canCreateItem(currentCount, session.user.isPro)` — fetch `currentCount` with a lightweight `prisma.item.count({ where: { userId } })` (add this as a small addition to `src/lib/db/items.ts` rather than reusing `getItemStats`, which also computes `favoriteItems` unnecessarily)
   - Remove the `// Pro-only but enabled during development` comment once this is live (per memory `project_file_image_pro`)
2. `src/actions/items.test.ts` — extend: File/Image creation blocked for non-Pro, allowed for Pro; item creation blocked at/over `FREE_ITEM_LIMIT` for non-Pro, allowed for Pro (mock `canCreateItem`/`canUploadFileType` or the underlying count query per existing test conventions in this file)
3. `src/actions/collections.ts` — in `createCollection`, same shape: reject past `FREE_COLLECTION_LIMIT` via `canCreateCollection`
4. `src/actions/collections.test.ts` — extend: collection creation blocked at/over the limit for non-Pro, allowed for Pro
5. `src/components/marketing/PricingSection.tsx`:
   - Import `PRO_MONTHLY_PRICE`/`PRO_YEARLY_PRICE`/etc. from `src/lib/constants/billing.ts` instead of the locally-defined constants at the top of the file
   - Remove the `// Stripe checkout isn't built yet...` comment
   - Pro CTA: unauthenticated → still `/register` (must have an account before checkout); authenticated + free → call `createCheckoutSession(isYearly ? "yearly" : "monthly")` and redirect to the returned URL; authenticated + already Pro → link to `/settings`
6. `src/app/settings/page.tsx` — render `<BillingCard isPro={session.user.isPro} />` (the page already calls `auth()`, so this is free)

## Environment Variables

Only one is still missing (per the `.env` check done during research — the other four `STRIPE_*` vars are already populated):

```
STRIPE_WEBHOOK_SECRET=""
```

- Local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, copy the printed signing secret in.
- Production: Stripe Dashboard → Developers → Webhooks → Add endpoint → `https://<domain>/api/webhooks/stripe`, subscribed to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

Also enable the **Customer Portal** in Stripe Dashboard → Settings → Billing (required for `createBillingPortalSession` to return a working URL).

## Testing Checklist (Stripe CLI / manual — this is the point of Phase 2)

- [ ] `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running during dev
- [ ] Checkout flow: free user → Upgrade → Stripe Checkout → complete with test card `4242 4242 4242 4242` → redirected to `/settings?checkout=success` → `isPro` reflects `true` after a reload (validates the Phase 1 `jwt` callback sync)
- [ ] `stripe trigger checkout.session.completed` → confirm `users.is_pro`, `stripe_customer_id`, `stripe_subscription_id` update in Neon
- [ ] `stripe trigger customer.subscription.updated` with a `past_due`/`canceled` status payload → `isPro` flips to `false`
- [ ] `stripe trigger customer.subscription.deleted` → `isPro` flips to `false`, `stripeSubscriptionId` cleared
- [ ] Billing portal: Pro user → "Manage Billing" → cancel subscription in the Stripe-hosted portal → webhook fires → `isPro` flips within one page reload
- [ ] Free-tier gating: 51st item creation rejected with the limit message; 4th collection rejected
- [ ] File/Image item creation blocked for free users, allowed for Pro
- [ ] Invalid webhook signature (e.g. `curl` with a garbage `stripe-signature` header) → `400`, no DB write
- [ ] `npm run build && npm run lint && npm test` all pass

## Key Gotchas

- The webhook route must read the raw body via `req.text()` **before** any parsing — Next.js App Router route handlers do this by default (no special config needed, unlike the Pages Router `bodyParser: false` requirement), but don't call `req.json()` first or signature verification will fail.
- `client_reference_id` on the checkout session is the only link between a completed Stripe checkout and a DevStash `userId` — don't drop it.
- `setUserProStatus` on `customer.subscription.deleted` must clear `stripeSubscriptionId` to `null`, not leave the old (now-invalid) subscription ID in place.
- Test card `4242 4242 4242 4242` (any future expiry, any CVC) always succeeds in test mode; use Stripe's other documented test cards for declined/3DS scenarios if those paths need coverage later.
- Before creating **live-mode** Stripe Prices, reconcile the `$69/year` shown in `PricingSection.tsx` against the `$72/year` still written in `context/project-overview.md` (flagged, unresolved) — the live Price object's amount must match whatever number ships.

## References

- `docs/stripe-integration-plan.md` — full plan this spec is derived from
- Stripe Checkout: https://docs.stripe.com/checkout
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe Billing Portal: https://docs.stripe.com/customer-management