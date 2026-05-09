# Auth Security Review

**Last audited:** 2026-05-09  
**Audited by:** auth-auditor agent  
**Scope:** NextAuth v5 — Credentials, GitHub OAuth, Email Verification, Password Reset, Profile Page

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 1 |
| MEDIUM   | 3 |
| LOW      | 3 |

---

## Findings

### [HIGH] Open Redirect via Unvalidated `callbackUrl`

**File:** `src/components/auth/sign-in-form.tsx` (lines 17, 71)  
**Issue:** The `callbackUrl` query parameter is read from `searchParams` and passed directly to `router.push()` without any origin validation. In Next.js App Router, `router.push('https://evil.com')` performs a full-page navigation to that external URL.

An attacker sends a phishing link such as:
```
https://devstash.app/sign-in?callbackUrl=https://evil.com/steal-session
```
After a legitimate sign-in the user is silently redirected to the attacker's site.

**Risk:** Post-login open redirect; useful for phishing, token theft, or credential harvesting pages that impersonate DevStash.  
**Fix:**
```ts
// In sign-in-form.tsx — validate callbackUrl is same-origin before using it
const raw = searchParams.get("callbackUrl") ?? "/dashboard";
const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
```

---

### [MEDIUM] No Zod Validation on Auth API Routes — Unbounded Inputs

**Files:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/auth/change-password/route.ts`, `src/app/api/auth/resend-verification/route.ts`  
**Issue:** Every auth API route calls `req.json()` and performs manual presence checks only. There is no Zod schema enforcing types, max lengths, or email format server-side. The `register` route passes the raw `name`, `email`, and `password` values directly to `bcrypt.hash()` and `prisma.user.create()` without bounding their length. A request body with a very large `password` string will cause bcrypt to spend time processing it before its internal 72-byte truncation, and an unbounded `name` will reach Prisma without constraint.

**Risk:** Application-layer DoS via oversized bcrypt inputs; unexpected type coercion errors surfacing to the client; bypassing format expectations on email fields.  
**Fix:**
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

### [MEDIUM] Account Enumeration on Registration Endpoint

**File:** `src/app/api/auth/register/route.ts` (lines 22-25)  
**Issue:** When a duplicate email is submitted, the route returns HTTP 409 with the body `{ "error": "User already exists" }`. This allows an attacker to enumerate valid registered email addresses by automating registration requests and inspecting the response code or message.

The `forgot-password` and `resend-verification` routes correctly return 200 in all cases — the register endpoint is the inconsistent one.

**Risk:** An attacker can build a list of valid DevStash accounts by submitting candidate emails to `/api/auth/register`. Enables targeted phishing and credential stuffing against known accounts.  
**Fix:** Return the same success-shaped response regardless of whether the email already exists. Optionally send a "you already have an account" notification email to the existing address out-of-band.
```ts
// Replace the 409 branch with a generic 200
if (existing) {
  // Optionally: await sendAlreadyRegisteredEmail(email);
  return NextResponse.json({ success: true }, { status: 200 });
}
```

---

### [MEDIUM] Login Rate Limit is Client-Bypass-able — Credentials Endpoint Unprotected

**Files:** `src/app/api/auth/login-ratelimit/route.ts`, `src/components/auth/sign-in-form.tsx` (lines 48-59)  
**Issue:** The rate limit for login is implemented as a separate pre-flight API call (`POST /api/auth/login-ratelimit`) that the browser form calls before invoking NextAuth's `signIn()`. This design has two structural weaknesses:

1. An attacker using curl or any HTTP client calls NextAuth's own `POST /api/auth/callback/credentials` directly, completely bypassing the pre-flight check.
2. The `email` field is parsed from the request body in `login-ratelimit/route.ts` (line 4) but is never used — the rate limit key is IP-only, so all users behind a shared IP (e.g., corporate NAT) share one limit bucket.

**Risk:** Brute-force of arbitrary user passwords is possible by any client that targets NextAuth's credential callback endpoint directly rather than going through the app form.  
**Fix:** Move rate limiting into NextAuth's `authorize` callback in `src/auth.ts`, where it cannot be bypassed regardless of which client is used:
```ts
// In src/auth.ts — top of Credentials authorize()
import { headers } from "next/headers";

async authorize(credentials) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";
  const email = (credentials?.email as string | undefined) ?? "";
  const rl = await checkRateLimit("login", `${ip}:${email}`);
  if (!rl.success) throw new Error("TooManyAttempts");

  // ... existing bcrypt validation
}
```
The browser pre-flight endpoint (`/api/auth/login-ratelimit`) can be removed once the authorize callback enforces the limit.

---

### [LOW] `allowDangerousEmailAccountLinking` Enabled on GitHub Provider

**File:** `src/auth.ts` (line 35)  
**Issue:** `GitHub({ allowDangerousEmailAccountLinking: true })` allows an existing credentials account to be silently linked to a GitHub OAuth identity if both share the same email address. While GitHub verifies email addresses before exposing them in the OAuth profile, the option name is a documented warning that the developer accepts the risk. If GitHub were ever to return an unverified email matching an existing DevStash credentials account, the GitHub account holder would gain full access to the credentials account without knowing the password.

**Risk:** Low probability given GitHub's email verification practices, but the impact if triggered is full account takeover with no credentials required.  
**Fix:** Remove the flag and handle the `OAuthAccountNotLinked` error in the sign-in form with a user-friendly message, or add a `signIn` callback guard:
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

### [LOW] Verify-Email Page Does Not Reject Password-Reset Tokens — Unhandled Crash

**File:** `src/app/(auth)/verify-email/page.tsx` (lines 25-31)  
**Issue:** The page accepts any token from the `verificationToken` table without checking whether it belongs to the email-verification flow (plain email identifier) or the password-reset flow (`password-reset:` prefix). If a valid, non-expired password-reset token is submitted to `/verify-email?token=<reset-token>`, the code reaches `prisma.user.update({ where: { email: "password-reset:user@example.com" } })`. Prisma throws `P2025` (record not found) because no user has that string as their email address. The error is unhandled, resulting in a 500 response. The token is also not deleted because the delete statement follows the failed update.

**Risk:** No security bypass — no account gets incorrectly verified. The crash leaks a 500 error and leaves the password-reset token orphaned in the database until it naturally expires.  
**Fix:**
```ts
// In verify-email/page.tsx — add after the record lookup succeeds:
if (record.identifier.startsWith("password-reset:")) {
  await prisma.verificationToken.delete({ where: { token } });
  redirect("/sign-in?error=InvalidToken");
}
```

---

### [LOW] Change-Password Endpoint Has No Rate Limiting

**File:** `src/app/api/auth/change-password/route.ts`  
**Issue:** The endpoint correctly requires a valid session, but there is no limit on the number of `currentPassword` attempts per session. An attacker who gains access to a session token (e.g., via XSS in a future feature) can brute-force the current password at full API throughput.

**Risk:** Low exploitability in isolation — requires prior session theft. Meaningful as a second-stage attack primitive if session compromise occurs.  
**Fix:**
```ts
// Top of change-password/route.ts, after the session check
const ip = await getClientIP();
const rl = await checkRateLimit("resetPassword", `${session.user.id}:change-password`);
if (!rl.success) return rateLimitResponse(rl.retryAfter);
```
The existing `resetPassword` limiter (5 per 15 min) is appropriate, or add a dedicated `changePassword` entry to `rateLimitConfigs` in `rate-limit.ts`.

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
