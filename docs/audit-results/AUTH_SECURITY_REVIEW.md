# Auth Security Review

**Last audited:** 2026-05-09  
**Audited by:** auth-auditor agent  
**Scope:** NextAuth v5 — Credentials, GitHub OAuth, Email Verification, Password Reset, Profile Page

---

## Resolution Log

### Commit `e4be8e0` — 2026-05-09

The following findings from the initial audit were addressed:

| Severity | Finding | Resolution |
|----------|---------|------------|
| HIGH | Open Redirect via Unvalidated `callbackUrl` | Fixed — `callbackUrl` validated to same-origin paths only in `sign-in-form.tsx` |
| MEDIUM | Account Enumeration on Registration Endpoint | Fixed — register route returns `{ success: true }` / 200 for duplicate emails; sends out-of-band `sendDuplicateRegistrationEmail` when verification is enabled |
| MEDIUM | Login Rate Limit is Client-Bypass-able | Fixed — rate limiting moved into `authorize` callback in `auth.ts`; fires server-side regardless of client |
| LOW | Verify-Email Page Does Not Reject Password-Reset Tokens | Fixed — added `record.identifier.startsWith("password-reset:")` guard; token deleted and user redirected to `/sign-in?error=InvalidToken` |
| LOW | Change-Password Endpoint Has No Rate Limiting | Fixed — `checkRateLimit("changePassword", session.user.id)` added at top of route handler |

**Remaining open findings:** 2 (see below — `[MEDIUM]` Zod validation planned; `[LOW]` GitHub account linking acknowledged with comment)

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | — |
| HIGH     | 1 | Resolved |
| MEDIUM   | 3 | 2 Resolved, 1 Planned |
| LOW      | 3 | 2 Resolved, 1 Acknowledged |

---

## Findings

### ~~[HIGH] Open Redirect via Unvalidated `callbackUrl`~~ — RESOLVED (`e4be8e0`)

**File:** `src/components/auth/sign-in-form.tsx`  
**Fix applied:** `callbackUrl` is now validated to same-origin paths only:
```ts
const raw = searchParams.get("callbackUrl") ?? "/dashboard";
const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
```

---

### [MEDIUM] No Zod Validation on Auth API Routes — Unbounded Inputs — PLANNED

**Files:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/auth/change-password/route.ts`, `src/app/api/auth/resend-verification/route.ts`  
**Issue:** Every auth API route calls `req.json()` and performs manual presence checks only. There is no Zod schema enforcing types, max lengths, or email format server-side. The `register` route passes the raw `name`, `email`, and `password` values directly to `bcrypt.hash()` and `prisma.user.create()` without bounding their length. A request body with a very large `password` string will cause bcrypt to spend time processing it before its internal 72-byte truncation, and an unbounded `name` will reach Prisma without constraint.

**Risk:** Application-layer DoS via oversized bcrypt inputs; unexpected type coercion errors surfacing to the client; bypassing format expectations on email fields.

**Status:** Not yet fixed. Zod validation will be added to all auth API routes in a future pass — likely together with a broader input validation sweep across the whole API surface, not just auth routes.  
**Planned fix:**
```ts
// Example for register/route.ts — apply the same pattern to all auth routes
import { z } from "zod";

const RegisterSchema = z.object({
  name:     z.string().min(1).max(100),
  email:    z.string().email().max(254),
  password: z.string().min(8).max(72), // bcrypt hard limit
});

const result = RegisterSchema.safeParse(await req.json());
if (!result.success) {
  return NextResponse.json({ error: "Invalid input." }, { status: 400 });
}
const { name, email, password } = result.data;
```

---

### ~~[MEDIUM] Account Enumeration on Registration Endpoint~~ — RESOLVED (`e4be8e0`)

**File:** `src/app/api/auth/register/route.ts`  
**Fix applied:** Duplicate email now returns `{ success: true }` / 200 with no distinguishable response. When `EMAIL_VERIFICATION_ENABLED=true`, `sendDuplicateRegistrationEmail` is fired out-of-band to notify the real account owner.

---

### ~~[MEDIUM] Login Rate Limit is Client-Bypass-able — Credentials Endpoint Unprotected~~ — RESOLVED (`e4be8e0`)

**Files:** `src/auth.ts`, `src/components/auth/sign-in-form.tsx`  
**Fix applied:** Rate limiting moved into `authorize` callback in `auth.ts` — fires server-side for every sign-in attempt regardless of client. The browser pre-flight endpoint (`/api/auth/login-ratelimit`) is kept as an additional early UI guard but is no longer the sole enforcement point.

---

### [LOW] `allowDangerousEmailAccountLinking` Enabled on GitHub Provider — ACKNOWLEDGED

**File:** `src/auth.ts`  
**Issue:** `GitHub({ allowDangerousEmailAccountLinking: true })` allows an existing credentials account to be silently linked to a GitHub OAuth identity if both share the same email address. While GitHub verifies email addresses before exposing them in the OAuth profile, the option name is a documented warning that the developer accepts the risk. If GitHub were ever to return an unverified email matching an existing DevStash credentials account, the GitHub account holder would gain full access to the credentials account without knowing the password.

**Risk:** Low probability given GitHub's email verification practices, but the impact if triggered is full account takeover with no credentials required.

**Status:** Flag left in place intentionally for now — the UX benefit (seamless GitHub↔credentials account linking) outweighs the low risk at this stage. A security comment was added in `auth.ts` noting the assumption that `EMAIL_VERIFICATION_ENABLED=true` is required before launch. To be revisited before production.  
**Fix (if removed later):**
```ts
// Option A: Remove the flag entirely
GitHub, // no allowDangerousEmailAccountLinking

// Option B: Keep automatic linking but verify the profile email is present
callbacks: {
  async signIn({ account, profile }) {
    if (account?.provider === "github" && !profile?.email) return false;
    return true;
  },
}
```

---

### ~~[LOW] Verify-Email Page Does Not Reject Password-Reset Tokens — Unhandled Crash~~ — RESOLVED (`e4be8e0`)

**File:** `src/app/(auth)/verify-email/page.tsx`  
**Fix applied:** `record.identifier.startsWith("password-reset:")` added to the existing expiry guard — token is deleted and user is redirected to `/sign-in?error=InvalidToken`.

---

### ~~[LOW] Change-Password Endpoint Has No Rate Limiting~~ — RESOLVED (`e4be8e0`)

**File:** `src/app/api/auth/change-password/route.ts`  
**Fix applied:** `checkRateLimit("changePassword", session.user.id)` added after the session check; uses the existing `changePassword` limiter entry in `rate-limit.ts`.

---

## Passed Checks

- **Password hashing** (`src/app/api/auth/register/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/auth/change-password/route.ts`) — bcrypt with 12 rounds on every path that stores or updates a password; bcryptjs used consistently; no plaintext passwords stored anywhere.
- **Timing-safe password comparison** (`src/auth.ts`, `src/app/api/auth/change-password/route.ts`) — `bcrypt.compare()` used in all cases; no `===` string comparison of passwords or hashes.
- **Token entropy** (`src/lib/tokens.ts`) — tokens are `crypto.randomBytes(32).toString("hex")` — 256 bits of entropy, unpredictable.
- **Token expiration** (`src/lib/tokens.ts`) — email-verification tokens expire in 24 hours; password-reset tokens expire in 1 hour; both checked at consumption time.
- **Token single-use enforcement** (`src/app/(auth)/verify-email/page.tsx`, `src/app/api/auth/reset-password/route.ts`) — both flows delete the token immediately after successful use; `createToken` also deletes any prior token for the same identifier before inserting a new one.
- **Token namespace separation** (`src/lib/tokens.ts`) — password-reset tokens use the `password-reset:` identifier prefix, distinguishing them from email-verification tokens at the DB level.
- **No account enumeration on forgot-password** (`src/app/api/auth/forgot-password/route.ts`) — always returns `{ ok: true }` with HTTP 200 regardless of whether the email exists; UI shows a generic confirmation.
- **No account enumeration on resend-verification** (`src/app/api/auth/resend-verification/route.ts`) — returns `{ success: true }` for both non-existent users and already-verified accounts.
- **Session validation on protected API routes** (`src/app/api/auth/change-password/route.ts`, `src/app/api/auth/delete-account/route.ts`) — both call `auth()` and check `session?.user?.id` before acting, returning 401 otherwise.
- **Session validation on protected pages** (`src/app/profile/layout.tsx`, `src/app/profile/page.tsx`) — both check session and redirect unauthenticated users.
- **Middleware route protection** (`src/proxy.ts`) — `/dashboard/:path*`, `/profile`, `/profile/:path*`, `/items/:path*` all redirect unauthenticated users to `/sign-in` with a `callbackUrl`.
- **Email verification enforcement** (`src/app/profile/layout.tsx`, dashboard layout) — when `EMAIL_VERIFICATION_ENABLED=true`, unverified users are redirected to `/verify-email-sent` before accessing protected routes.
- **Password reset scoped to credentials accounts** (`src/app/api/auth/forgot-password/route.ts`) — `user?.password` check prevents OAuth-only accounts from receiving a reset link.
- **Same-password prevention on change-password** (`src/app/api/auth/change-password/route.ts`) — `bcrypt.compare(newPassword, user.password)` rejects reuse of the current password.
- **Rate limiting coverage** (`src/lib/rate-limit.ts`) — registration (3/1h), forgot-password (3/1h), reset-password (5/15m), and resend-verification (3/15m per IP+email) all enforced.
- **Rate limit fail-open with logging** (`src/lib/rate-limit.ts`) — Redis unavailability does not block users; errors are logged server-side only.
- **Profile data isolation** (`src/lib/db/profile.ts`) — `getProfileUser` and `getProfileStats` scope all queries by `userId` from the session; no cross-user data access possible.
- **Expired token cleanup** (`src/app/(auth)/verify-email/page.tsx`, `src/app/api/auth/reset-password/route.ts`) — expired tokens are deleted from the database when encountered, preventing indefinite accumulation.

---

## Out of Scope

The following are handled automatically by NextAuth v5 and were not audited:

- CSRF protection (NextAuth built-in for all auth endpoints)
- Secure and HttpOnly cookie flags (NextAuth built-in)
- OAuth state parameter validation (NextAuth built-in)
- Session cookie rotation on sign-in (NextAuth built-in)
- JWT signing and verification (NextAuth built-in via jose)
