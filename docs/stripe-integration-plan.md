# Stripe Integration Plan — DevStash Pro

Subscription billing for DevStash Pro: **$8/month** or **$69/year** (see note under Pricing below on the discrepancy with `project-overview.md`'s $72/year).

---

## 1. Current State Analysis

### User model (`prisma/schema.prisma`)

Already has everything needed for Stripe, unused so far:

```prisma
isPro                Boolean   @default(false) @map("is_pro")
stripeCustomerId     String?   @unique @map("stripe_customer_id")
stripeSubscriptionId String?   @unique @map("stripe_subscription_id")
```

No migration needed to start. Will need one additional field (see §2) to track plan interval and period end for the billing UI.

### NextAuth v5 (`src/auth.ts`, `src/auth.config.ts`, `src/types/next-auth.d.ts`)

- JWT session strategy. `src/auth.ts`'s `jwt` callback already re-queries the DB on every token refresh to sync `emailVerified` onto `token`:

```typescript
async jwt({ token }) {
  if (token.sub) {
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { emailVerified: true },
    });
    token.emailVerified = user?.emailVerified ?? null;
  }
  return token;
},
```

  `isPro` should be synced the same way (see the workaround already spec'd in `context/research/stripe-integration-research.md` — extend this callback rather than relying on `trigger === "update"`, which doesn't reliably reflect webhook-driven DB changes).
- `session` callback copies `token.sub` → `session.user.id` and `emailVerified` → `session.user.emailVerified`. `isPro` needs the same treatment.
- `src/types/next-auth.d.ts` extends `Session.user` with `id` and `emailVerified` — needs `isPro: boolean` added.
- `src/auth.config.ts` is the edge-compatible config (no DB access) used by `proxy.ts` for route protection. It does **not** run the `jwt`/`session` callbacks with DB access — those live only in `src/auth.ts`. No change needed there for Stripe.

### How user data reaches components/actions

- Server components call `auth()` directly (e.g. `src/app/settings/page.tsx`, `src/app/settings/layout.tsx`) and read `session.user.id`.
- Client components read `useSession()` from `next-auth/react` (e.g. `AccountActionsCard.tsx` uses `signOut` from there).
- Server actions (`src/actions/*.ts`) call `auth()` at the top of every exported function, return `{ success: false, error: "Unauthorized" }` if no session.
- `isPro` will be available anywhere `session.user.isPro` is read once the callbacks above are updated — no new data-fetching layer needed for gating checks inside actions/components.

### Existing subscription/payment code

None. `.env.example` already reserves the Stripe env vars (unused, no `STRIPE_SECRET_KEY` etc. referenced anywhere in `src/`):

```
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY=""
STRIPE_PRICE_ID_YEARLY=""
```

The `stripe` npm package is **not installed** (checked `package.json`).

---

## 2. Feature Gating Analysis

### Free tier limits (per `context/project-overview.md`)

- 50 items, 3 collections
- All system types except File & Image
- No AI features, no export

### Where counts are already computed (reuse, don't duplicate)

- `getItemStats(userId)` in `src/lib/db/items.ts` → `{ totalItems, favoriteItems }`. Add a `totalItems` check here or add a lightweight `prisma.item.count({ where: { userId } })` call inside `createItem`/`createItemInDb`.
- `getCollectionStats(userId)` in `src/lib/db/collections.ts` → `{ totalCollections, favoriteCollections }`. Same pattern for collection creation.
- Enforcement point: `createItem` (`src/actions/items.ts`) and `createCollection` (`src/actions/collections.ts`) — both already do `auth()` → Zod parse → DB call. Add a limit check between auth and the DB call, returning the existing `{ success: false, error: string }` shape (e.g. `"Free plan is limited to 50 items. Upgrade to Pro for unlimited items."`).
- **Currently no limit is enforced anywhere** — `project-overview.md` explicitly notes "During development all users have full access. Limits enforced before launch," which matches what's in the code.

### Pro-only features and current gating state

| Feature | Current state | Gating needed |
|---|---|---|
| File/Image upload | `CREATABLE_TYPE_NAMES` in `src/actions/items.ts` includes `"File", "Image"` with a comment: `// Pro-only but enabled during development` | Add `isPro` check before allowing `typeName === "File" \| "Image"` in `createItem` |
| AI features (auto-tag, summarize, explain, optimize) | Not built yet — no AI code exists anywhere in `src/` | Out of scope for this plan; gate at the point they're built |
| Custom item types | Not built yet — `ItemType.userId` field exists in schema for this but no UI/actions create user-owned types | Out of scope; gate at the point they're built |
| Export (JSON/ZIP) | Not built | Out of scope |
| Item/collection limits (50/3) | Not enforced | New — see above |

### Settings page structure (`src/app/settings/`)

- `page.tsx` — server component, calls `auth()` + `getProfileUser`, renders `<EditorPreferencesCard />` then `<AccountActionsCard hasPassword={...} />`.
- `layout.tsx` — auth + email-verification guard + `DashboardShell`, identical pattern to `/profile`, `/favorites`, `/items/[type]`.
- `AccountActionsCard.tsx` (`src/components/settings/`) — `"use client"`, a `Card` with a `divide-y` list of action rows (label + description on the left, button on the right), each wired to its own `Dialog`/`AlertDialog`. This is the established pattern for a "Billing" section — a new `BillingCard.tsx` in the same directory should mirror it (see §3).

---

## 3. API & Webhook Patterns to Follow

### API routes (`src/app/api/**/route.ts`)

Two established shapes:

1. **Simple, no try/catch** (`delete-account/route.ts`): `auth()` guard → direct Prisma call → `NextResponse.json(...)`. Used when failure would legitimately be a 500 and there's nothing graceful to do.
2. **try/catch with a generic 500 fallback** (`upload/route.ts`): validate inputs first (400s), then wrap the actual external-service call in try/catch, catching and returning a generic error rather than leaking internals.

The Stripe webhook and checkout routes should use pattern 2 — external service calls (Stripe API) need explicit error handling, and webhook signature failures must return a specific 400, not throw.

Per `context/coding-standards.md`, webhooks are one of the explicit reasons to use an API route instead of a Server Action — this applies directly to `POST /api/webhooks/stripe`.

### Server action error pattern

Every action in `src/actions/*.ts` follows:

```typescript
export async function actionName(...): Promise<Result> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = SomeSchema.safeParse(formData);
  if (!parsed.success) return { success: false, error: parsed.error.flatten().fieldErrors };

  const result = await someDbFunction(session.user.id, parsed.data);
  if (!result) return { success: false, error: "Not found" };

  return { success: true, data: result };
}
```

`createCheckoutSession` and `createBillingPortalSession` actions should follow this exactly, returning `{ success: true, url: string } | { success: false, error: string }`.

### Environment variable pattern

Every external service reads env vars lazily inside a getter function, throws if missing, and no fallback/localhost defaults are used (per `src/lib/r2.ts`'s `getR2Client()`/`getBucket()`/`getPublicUrl()` and `src/lib/rate-limit.ts`'s `getRedis()`). `src/lib/stripe.ts` should follow the same lazy-singleton pattern as `getRedis()` (cache the client, warn/throw clearly if the key is missing) rather than instantiating `Stripe` at module load time — this also keeps `stripe` out of the edge bundle (`auth.config.ts`/`proxy.ts` run on the edge and must never import it).

### Constants pattern

Per memory (`feedback_constants_directory`), new constants go in `src/lib/constants/<feature>.ts`. Create `src/lib/constants/billing.ts` for `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3`, and price display constants shared between `PricingSection.tsx` and the new settings billing card (today `PRO_MONTHLY_PRICE`/`PRO_YEARLY_PRICE` are hardcoded locally inside `PricingSection.tsx` — pull them out here as the single source of truth).

### Testing pattern

Per `context/coding-standards.md` and `context/ai-interaction.md`: Vitest, `*.test.ts` beside the source file, scope limited to **utilities and server actions** (no component tests). Mock `prisma`, `next/headers`, and third-party SDKs with `vi.mock()` at module level — the Stripe SDK client should be mocked the same way `@upstash/redis`/`resend` presumably are (check existing `*.test.ts` files for the exact mock shape before writing new ones).

---

## 4. Files to Create

### `src/lib/stripe.ts`

Lazy Stripe client singleton, mirrors `getRedis()` in `src/lib/rate-limit.ts`:

```typescript
import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripe) return stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");

  stripe = new Stripe(secretKey);
  return stripe;
}

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,
} as const;
```

### `src/lib/constants/billing.ts`

```typescript
export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

export const PRO_MONTHLY_PRICE = 8;
export const PRO_YEARLY_PRICE = 69;
export const PRO_YEARLY_PRICE_AT_MONTHLY_RATE = PRO_MONTHLY_PRICE * 12;
export const PRO_YEARLY_SAVINGS_PERCENT = Math.round(
  (1 - PRO_YEARLY_PRICE / PRO_YEARLY_PRICE_AT_MONTHLY_RATE) * 100,
);
```

### `src/lib/db/billing.ts`

DB-layer functions, matching the existing `src/lib/db/<feature>.ts` convention:

```typescript
import { prisma } from "@/lib/prisma";

export async function getUserByStripeCustomerId(customerId: string) {
  return prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
}

export async function setUserProStatus(
  userId: string,
  data: { isPro: boolean; stripeCustomerId?: string; stripeSubscriptionId?: string | null }
) {
  return prisma.user.update({ where: { id: userId }, data });
}
```

### `src/actions/billing.ts`

Server actions for the two things the client needs to trigger:

```typescript
"use server";

import { auth } from "@/auth";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

type CheckoutResult = { success: true; url: string } | { success: false; error: string };

export async function createCheckoutSession(interval: "monthly" | "yearly"): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { success: false, error: "Unauthorized" };
  }

  const priceId = STRIPE_PRICE_IDS[interval];
  if (!priceId) return { success: false, error: "Pricing not configured" };

  const stripe = getStripe();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user?.stripeCustomerId ?? undefined,
    customer_email: user?.stripeCustomerId ? undefined : session.user.email,
    client_reference_id: session.user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/settings?checkout=success`,
    cancel_url: `${process.env.APP_URL}/settings?checkout=cancelled`,
  });

  if (!checkoutSession.url) return { success: false, error: "Failed to create checkout session" };
  return { success: true, url: checkoutSession.url };
}

type PortalResult = { success: true; url: string } | { success: false; error: string };

export async function createBillingPortalSession(): Promise<PortalResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const stripe = getStripe();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) return { success: false, error: "No billing account found" };

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.APP_URL}/settings`,
  });

  return { success: true, url: portalSession.url };
}
```

### `src/app/api/webhooks/stripe/route.ts`

Follows the try/catch API route pattern (`upload/route.ts`), but webhooks need the **raw request body** for signature verification — this is one of the documented reasons in `context/coding-standards.md` for using an API route over a Server Action:

```typescript
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { setUserProStatus, getUserByStripeCustomerId } from "@/lib/db/billing";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.client_reference_id;
        const customerId = checkoutSession.customer as string;
        const subscriptionId = checkoutSession.subscription as string;
        if (userId) {
          await setUserProStatus(userId, {
            isPro: true,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await getUserByStripeCustomerId(subscription.customer as string);
        if (user) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          await setUserProStatus(user.id, { isPro: isActive, stripeSubscriptionId: subscription.id });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await getUserByStripeCustomerId(subscription.customer as string);
        if (user) {
          await setUserProStatus(user.id, { isPro: false, stripeSubscriptionId: null });
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] handler failed:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

Note: this route must be excluded from body parsing / kept as a raw text read (Next.js App Router route handlers read the raw body via `req.text()` by default, which is compatible — no special config needed, unlike the Pages Router).

### `src/components/settings/BillingCard.tsx`

Mirrors `AccountActionsCard.tsx`'s structure (`"use client"`, `Card`, action rows). Shows current plan (Free/Pro + interval), an "Upgrade to Pro" button (opens the same monthly/yearly choice as `PricingSection.tsx`, calls `createCheckoutSession`) when free, or a "Manage Billing" button (calls `createBillingPortalSession`, redirects to the returned Stripe portal URL) when Pro.

---

## 5. Files to Modify

### `prisma/schema.prisma`

Optional but recommended — add plan interval and period end so the settings UI can show "Renews on [date]" / "Yearly plan" without an extra Stripe API call:

```prisma
model User {
  // ...existing fields...
  stripePriceId        String?   @map("stripe_price_id")
  currentPeriodEnd      DateTime? @map("current_period_end")
}
```

Requires `prisma migrate dev --name add_stripe_billing_fields` per `context/coding-standards.md` (never `db push`).

### `src/auth.ts`

Extend the existing `jwt` callback's DB query to also select `isPro`, and the `session` callback to copy it onto `session.user.isPro` — exactly the workaround already specified in `context/research/stripe-integration-research.md`:

```typescript
async jwt({ token }) {
  if (token.sub) {
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { emailVerified: true, isPro: true },
    });
    token.emailVerified = user?.emailVerified ?? null;
    token.isPro = user?.isPro ?? false;
  }
  return token;
},
session({ session, token }) {
  if (token.sub) session.user.id = token.sub;
  session.user.emailVerified = (token.emailVerified as Date | null) ?? null;
  session.user.isPro = (token.isPro as boolean) ?? false;
  return session;
},
```

This is one DB query per session validation (already happening for `emailVerified` — no new query, just one more selected field), guaranteeing the client picks up webhook-driven `isPro` changes on next navigation/reload, no client-side polling needed.

### `src/types/next-auth.d.ts`

```typescript
interface Session {
  user: {
    id: string;
    emailVerified: Date | null;
    isPro: boolean;
  } & DefaultSession["user"];
}
```

### `src/actions/items.ts`

- `createItem`: after the `auth()` check, before the Zod parse or right after — reject `typeName === "File" | "Image"` when `!session.user.isPro`; reject creation past `FREE_ITEM_LIMIT` when `!session.user.isPro` (count via a new lightweight check, e.g. exporting a `getItemCount(userId)` from `src/lib/db/items.ts` rather than reusing `getItemStats`, which also computes `favoriteItems` unnecessarily).
- Remove the `// Pro-only but enabled during development` comment once gating is live (per memory `project_file_image_pro`).

### `src/actions/collections.ts`

- `createCollection`: same shape — reject past `FREE_COLLECTION_LIMIT` when `!session.user.isPro`.

### `src/components/marketing/PricingSection.tsx`

- Remove the `// Stripe checkout isn't built yet...` comment and hardcoded `ctaHref = isAuthenticated ? "/dashboard" : "/register"` for the Pro card specifically:
  - Unauthenticated: Pro CTA still goes to `/register` (must create an account before checkout) — unchanged.
  - Authenticated + free: Pro CTA calls `createCheckoutSession(isYearly ? "yearly" : "monthly")` and redirects to the returned URL (requires converting the Pro CTA `<Link>` into a client-side handler; the component is already `"use client"`).
  - Authenticated + already Pro: Pro CTA could link to `/settings` instead (nothing to check out).
- Import `PRO_MONTHLY_PRICE`/`PRO_YEARLY_PRICE`/etc. from the new `src/lib/constants/billing.ts` instead of the locally-defined constants at the top of the file.

### `src/app/settings/page.tsx`

Add `<BillingCard isPro={session.user.isPro} />` — needs `session` (currently only `session.user.id` is used; the page already calls `auth()` so `session.user.isPro` is available for free).

### `.env.example` / `.env`

Already has the five `STRIPE_*` vars — no change needed, just populate real values. Add one more:

```
APP_URL="http://localhost:3000"
```

(already present, reused for `success_url`/`cancel_url`/portal `return_url` — confirmed no separate `NEXT_PUBLIC_APP_URL` needed since these redirects only happen server-side inside actions/webhook).

### `package.json`

```
npm install stripe
```

(`@stripe/stripe-js` is **not** needed — this plan uses Stripe Checkout's hosted page via redirect, not Stripe Elements embedded in-app, so no client-side Stripe SDK is required.)

### `context/project-overview.md`

Reconcile the `$72/year` figure with the `$69/year` actually shown in `PricingSection.tsx` (flagged as an open discrepancy in the 2026-08-21 homepage history entry, still unresolved) — pick one number before wiring real Stripe Price IDs, since `STRIPE_PRICE_ID_YEARLY` must point at a Stripe Price object created with that exact amount.

---

## 6. Stripe Dashboard Setup Steps

**Status: mostly done.** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID_MONTHLY`, and `STRIPE_PRICE_ID_YEARLY` are already populated in `.env` — steps 1–3 below are complete. Only step 4 (webhook secret) remains before local development can proceed.

1. ~~Create a Stripe account (or use existing) — use **test mode** for development.~~ Done.
2. ~~**Products & Prices**: create one Product ("DevStash Pro") with two recurring Prices (Monthly $8.00 USD / Yearly $69.00 USD — pending the reconciliation above) and copy each Price ID into `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`.~~ Done.
3. ~~**API keys**: Developers → API keys → copy the test **Secret key** into `STRIPE_SECRET_KEY` and the **Publishable key** into `STRIPE_PUBLISHABLE_KEY`.~~ Done. (Publishable key is unused by this plan's redirect-based Checkout flow, but harmless to keep for future Elements use.)
4. **Webhook endpoint — remaining step**:
   - Local dev: use the Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`), copy the printed webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
   - Production: Developers → Webhooks → Add endpoint → `https://<domain>/api/webhooks/stripe`, subscribe to at minimum: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy that endpoint's signing secret into the production env.
5. **Customer portal**: Settings → Billing → Customer portal — enable it and configure allowed actions (cancel subscription, update payment method); required for `createBillingPortalSession` to work.
6. Switch all of the above to **live mode** keys/webhook/prices before launch (test and live Price IDs differ).

---

## 7. Testing Checklist

### Automated (Vitest — utilities/server actions only, per project convention)

- `src/lib/stripe.test.ts`: `getStripe()` throws when `STRIPE_SECRET_KEY` unset; returns a cached singleton on repeat calls.
- `src/actions/billing.test.ts`: `createCheckoutSession` — unauthorized, missing price config, success (mock `getStripe()`); `createBillingPortalSession` — unauthorized, no `stripeCustomerId`, success.
- `src/actions/items.test.ts` (extend existing): `createItem` rejects File/Image for non-Pro users; rejects item creation past `FREE_ITEM_LIMIT` for non-Pro; both allowed for Pro users.
- `src/actions/collections.test.ts` (extend existing): `createCollection` rejects past `FREE_COLLECTION_LIMIT` for non-Pro; allowed for Pro.
- Webhook route: since it's an API route (not a server action), per-project convention doesn't cover it with unit tests — verify manually via Stripe CLI test events instead (see below).

### Manual / Stripe CLI

- [ ] `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running during dev
- [ ] Checkout flow: free user → clicks Upgrade → redirected to Stripe Checkout → completes with [Stripe test card `4242 4242 4242 4242`] → redirected back to `/settings?checkout=success` → `isPro` reflects `true` after a reload (validates the `jwt` callback sync)
- [ ] `stripe trigger checkout.session.completed` — confirm `users.is_pro`, `stripe_customer_id`, `stripe_subscription_id` update in Neon
- [ ] `stripe trigger customer.subscription.updated` with a `status: past_due`/`canceled` payload — confirm `isPro` flips to `false`
- [ ] `stripe trigger customer.subscription.deleted` — confirm `isPro` flips to `false`, `stripeSubscriptionId` cleared
- [ ] Billing portal: Pro user → "Manage Billing" → redirected to Stripe portal → cancel subscription there → webhook fires → `isPro` flips within one page reload
- [ ] Free-tier gating: attempt to create a 51st item as a free user → rejected with the limit message; same for a 4th collection
- [ ] File/Image type creation blocked for free users, allowed for Pro
- [ ] Invalid webhook signature (e.g. `curl` with a garbage `stripe-signature` header) → 400, no DB write
- [ ] `npm run build && npm run lint && npm test` all pass

---

## 8. Implementation Order

1. `npm install stripe`
2. `src/lib/stripe.ts` + `src/lib/constants/billing.ts`
3. Prisma migration for `stripePriceId`/`currentPeriodEnd` (if adopting §5's optional fields) — `prisma migrate dev`
4. `src/lib/db/billing.ts`
5. `src/auth.ts` + `src/types/next-auth.d.ts` — sync `isPro` into the session (do this early so gating checks below can rely on `session.user.isPro`)
6. `src/actions/billing.ts` (checkout + portal session creation)
7. `src/app/api/webhooks/stripe/route.ts`
8. Stripe Dashboard setup (§6) — Price IDs and API keys already in `.env`; only the webhook secret (`stripe listen`) is still needed for local testing of steps 6–7
9. `src/components/settings/BillingCard.tsx` + wire into `src/app/settings/page.tsx`
10. Free-tier gating in `src/actions/items.ts` (File/Image + 50-item limit) and `src/actions/collections.ts` (3-collection limit)
11. Wire `PricingSection.tsx`'s Pro CTA to `createCheckoutSession`
12. Reconcile `$69` vs `$72` yearly price (§5) before creating live-mode Stripe Prices
13. Tests (§7 automated section) alongside each of steps 6, 7, 10
14. Manual Stripe CLI testing (§7) end-to-end
15. Switch to live-mode keys/prices/webhook before launch
