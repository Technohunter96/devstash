# Auth Security Review

**Last audited:** 2026-05-08  
**Audited by:** auth-auditor agent  
**Scope:** NextAuth v5 — Credentials, GitHub OAuth, Email Verification, Password Reset, Profile Page

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 3 |
| MEDIUM   | 3 |
| LOW      | 1 |

---

## Findings

### [HIGH] No Rate Limiting on Any Auth Endpoint

**File:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/auth/resend-verification/route.ts`, `src/app/api/auth/change-password/route.ts`  
**Issue:** None of the auth API routes implement rate limiting. There is no rate limiting library present anywhere in the codebase (`upstash`, `redis`, any custom limiter).  
**Risk:**
- `/api/auth/forgot-password` — attacker can flood with arbitrary emails, triggering unlimited password reset emails (spam/abuse of Resend quota, and email bombing a target user).
- `/api/auth/resend-verification` — same: unlimited verification emails sent to any address.
- `/api/auth/register` — unlimited account creation; bcrypt at 12 rounds costs ~300ms per call, so ~3 req/s per core can saturate CPU.
- `/api/auth/reset-password` — token brute-force is impractical given 256-bit entropy, but the endpoint still has no protection.
- NextAuth's built-in Credentials `signIn` (handled by `src/app/api/auth/[...nextauth]/route.ts`) is also unprotected against password brute-force.

**Fix:** Add rate limiting at the middleware or route level. Upstash Rate Limit is the standard choice for Vercel/edge deployments:

```ts
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "rl:auth",
});

// Usage in a route handler:
const ip = req.headers.get("x-forwarded-for") ?? "unknown";
const { success } = await authRateLimit.limit(ip);
if (!success) {
  return NextResponse.json({ error: "Too many requests." }, { status: 429 });
}
```

Apply limits:
- `forgot-password`, `resend-verification`: 5 requests / 15 min per IP
- `register`: 10 requests / hour per IP
- Credentials sign-in: 10 attempts / 15 min per IP (apply in `proxy.ts` or a wrapper)

---

### [HIGH] Account Enumeration on Register Endpoint

**File:** `src/app/api/auth/register/route.ts` (line 18–20)  
**Issue:** When a user attempts to register with an email that already exists, the endpoint returns HTTP 409 with the message `"User already exists"`. This allows an unauthenticated attacker to enumerate which email addresses have accounts by probing the register endpoint.  
**Risk:** An attacker can build a list of registered email addresses. Combined with credential stuffing or phishing, this reduces the cost of targeted attacks against known users.  
**Fix:** Return a generic 200 response and send a "someone tried to register with your email" notification to the existing account, or return a 400 with a non-disclosing message:

```ts
// Option A — non-disclosing 400 (simpler, acceptable for most apps)
if (existing) {
  return NextResponse.json(
    { error: "Unable to create account with that email address." },
    { status: 400 }
  );
}

// Option B — silent 200 + notify existing user (stronger)
if (existing) {
  // Optionally: send "someone tried to register with your email" email
  return NextResponse.json({ success: true }, { status: 200 });
}
```

---

### [HIGH] Open Redirect via Unvalidated `callbackUrl`

**File:** `src/components/auth/sign-in-form.tsx` (line 16, 56)  
**Issue:** The sign-in form reads `callbackUrl` from the query string and passes it directly to `router.push(callbackUrl)` after successful authentication. There is no check that the URL is relative (same origin).

```ts
const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"; // line 16
// ...
router.push(callbackUrl); // line 56 — attacker-controlled destination
```

An attacker can craft a link like `/sign-in?callbackUrl=https://evil.com` and send it to a user. After the user authenticates, they are silently redirected to the attacker's site. This enables phishing for session tokens or credentials.  
**Risk:** Post-authentication open redirect usable for credential phishing and session hijacking.  
**Fix:** Validate that `callbackUrl` is a relative path before using it:

```ts
function isSafeCallbackUrl(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

const raw = searchParams.get("callbackUrl") ?? "/dashboard";
const callbackUrl = isSafeCallbackUrl(raw) ? raw : "/dashboard";
```

Note: NextAuth itself validates `callbackUrl` for its own OAuth redirects, but the manual `router.push` in this client component bypasses that protection entirely.

---

### [MEDIUM] No Input Validation (Zod) on API Routes

**File:** All routes in `src/app/api/auth/`  
**Issue:** No route uses Zod (or any schema validation library) to validate request bodies. Validation is done with manual `if (!field)` checks that only test for presence — not type, format, or length.

Examples of what is not validated:
- `register`: `name` and `email` are not validated for format or maximum length. A 10 MB string sent as `name` will be stored in the database.
- `change-password`: `currentPassword` and `newPassword` have no maximum length check. An extremely long string (e.g., 100,000 characters) forces bcrypt to process it, causing a CPU spike (bcrypt DoS — see LOW finding below for the direct bcrypt angle).
- `forgot-password`: `email` is checked for presence and `typeof` but not validated as a properly formatted email address.
- `reset-password`: `password` minimum length checked (8 chars) but no maximum.

**Risk:** Malformed input reaching business logic; potential for DoS via large payloads; inconsistent state in the database.  
**Fix:** Add Zod schemas at the top of each route handler:

```ts
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(72), // 72 is bcrypt's effective max
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  // ...
}
```

---

### [MEDIUM] Verification Tokens Stored in Plaintext

**File:** `src/lib/tokens.ts` (lines 6–13)  
**Issue:** Verification tokens (both email verification and password reset) are generated with `randomBytes(32).toString("hex")` — giving strong 256-bit entropy — and then stored verbatim in the `verificationToken` table. The token value is also the Prisma lookup key (`findUnique({ where: { token } })`).

If an attacker gains read access to the database (SQL injection elsewhere, backup exposure, misconfigured Neon branch permissions), they obtain valid, unexpired tokens that can be immediately used to take over accounts via the password reset flow.  
**Risk:** Database read access translates directly to account takeover for any user with a pending password reset token.  
**Fix:** Store a SHA-256 hash of the token in the database; send the raw token in the email. On redemption, hash the incoming token and compare:

```ts
import { randomBytes, createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function createToken(identifier: string, ttlMs: number): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);
  const expires = new Date(Date.now() + ttlMs);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: hashedToken, expires },
  });

  return rawToken; // send this in the email
}

// In reset-password route:
const hashedIncoming = hashToken(token);
const record = await prisma.verificationToken.findUnique({
  where: { token: hashedIncoming },
});
```

---

### [MEDIUM] `resend-verification` Leaks Internal Error Details to Client

**File:** `src/app/api/auth/resend-verification/route.ts` (lines 25–28)  
**Issue:** When `sendVerificationEmail` throws, the route returns a 500 response with `{ error: "Failed to send email" }`. Unlike the `register` and `forgot-password` routes (which silently absorb send failures), this endpoint surfaces a 500 that tells the caller exactly what failed.

More specifically: the endpoint correctly returns 200 for "user not found" and "already verified" cases (no enumeration there), but a send failure on a valid unverified account will return 500. An attacker making sequential requests to this endpoint can distinguish "valid unverified account" (500 on send failure) from "no account / already verified" (200), partially undermining the enumeration protection.  
**Risk:** Partial account enumeration when email sending is broken; reveals internal service failure mode.  
**Fix:** Absorb the error the same way the register route does:

```ts
try {
  await sendVerificationEmail(email, token);
} catch (err) {
  console.error("Resend verification email failed:", err);
  // Fall through — return 200 so the caller cannot distinguish failure modes
}

return NextResponse.json({ success: true });
```

---

### [LOW] No Maximum Password Length (bcrypt DoS Vector)

**File:** `src/app/api/auth/register/route.ts` (line 23), `src/app/api/auth/change-password/route.ts` (line 48), `src/app/api/auth/reset-password/route.ts` (line 26)  
**Issue:** Passwords are validated for a minimum length (8 characters) but have no maximum length. bcrypt truncates input at 72 bytes, so passwords longer than 72 bytes provide no additional security — but the CPU cost of running `bcrypt.hash` is the same regardless. An attacker who can call these endpoints (unauthenticated for register/reset-password) can send arbitrarily large strings, causing a CPU spike per request.

This is low severity because: (a) the lack of rate limiting is the primary concern (HIGH finding above), and (b) bcrypt itself does not scale with input length beyond 72 bytes.  
**Risk:** CPU exhaustion on the server if combined with concurrent requests; requires rate limiting to be fully mitigated.  
**Fix:** Add a maximum password length of 72 in all Zod schemas (per the bcrypt effective maximum) or independently:

```ts
if (password.length > 72) {
  return NextResponse.json({ error: "Password is too long." }, { status: 400 });
}
```

This is best handled by adding `z.string().min(8).max(72)` in the Zod schemas from the [MEDIUM] finding above — one fix addresses both issues.

---

## Passed Checks

- **Password hashing** (`src/app/api/auth/register/route.ts`, `change-password/route.ts`, `reset-password/route.ts`) — bcrypt with 12 rounds used consistently across all three locations where passwords are hashed. bcryptjs is used correctly with `bcrypt.compare` for verification.

- **Token entropy** (`src/lib/tokens.ts`) — `randomBytes(32).toString("hex")` produces 256-bit cryptographically secure tokens. `crypto.randomBytes` is Node's CSPRNG, not `Math.random`.

- **Token expiration** (`src/lib/tokens.ts`, `src/app/(auth)/verify-email/page.tsx`, `src/app/api/auth/reset-password/route.ts`) — both token types are checked against `expires < new Date()` before use and expired tokens are deleted from the database.

- **Token single-use enforcement** (`src/app/(auth)/verify-email/page.tsx` line 31, `src/app/api/auth/reset-password/route.ts` line 33) — tokens are deleted immediately after successful use. Expired tokens found during a redemption attempt are also deleted.

- **Password reset: no account enumeration** (`src/app/api/auth/forgot-password/route.ts`) — always returns HTTP 200 regardless of whether the email exists. Error from `sendPasswordResetEmail` is silently swallowed. The success UI message is correctly worded with "if an account exists...".

- **Password reset: Credentials-only guard** (`src/app/api/auth/forgot-password/route.ts` line 16) — checks `user?.password` before issuing a reset token. GitHub OAuth accounts without a password are silently skipped, preventing reset tokens being issued for accounts that have no password to reset.

- **Password reset token prefix isolation** (`src/lib/tokens.ts`) — the `password-reset:` identifier prefix prevents a verification token from being redeemed as a password reset token and vice versa, enforced in `isPasswordResetToken()` and checked in `reset-password/route.ts` line 18.

- **Session verification on protected API routes** (`src/app/api/auth/change-password/route.ts` line 7–10, `src/app/api/auth/delete-account/route.ts` line 7–10) — both routes call `auth()` and return 401 if `session.user.id` is absent before performing any action.

- **Session verification on profile page** (`src/app/profile/layout.tsx` line 16–18, `src/app/profile/page.tsx` line 11–13) — auth check is performed at both layout and page levels. Middleware (`src/proxy.ts`) also covers `/profile` and `/profile/:path*`.

- **Middleware route protection** (`src/proxy.ts`) — all protected routes (`/dashboard/:path*`, `/profile`, `/profile/:path*`) are covered. The middleware uses the edge-compatible `authConfig` correctly, without exposing Prisma or bcrypt to the edge runtime.

- **Email verification enforcement** (`src/app/dashboard/layout.tsx` via `isEmailVerificationEnabled()`, `src/app/profile/layout.tsx`) — when the feature flag is on, unverified users are redirected before they can access any protected page.

- **Verify-email page: token validated before DB write** (`src/app/(auth)/verify-email/page.tsx`) — token existence and expiry are checked before `user.update` is called. The user lookup uses `record.identifier` (the stored email) rather than a client-supplied value.

- **Old tokens replaced on re-issue** (`src/lib/tokens.ts` line 10) — `deleteMany({ where: { identifier } })` runs before creating a new token, ensuring only one active token exists per identifier at any time.

- **Generic credential error message** (`src/components/auth/sign-in-form.tsx` line 54) — sign-in displays `"Invalid email or password."` for any auth failure, not distinguishing between unknown email and wrong password.

- **`hasPassword` flag computed server-side** (`src/lib/db/profile.ts`) — the raw `password` hash is never sent to the client; only a boolean `hasPassword` is exposed.

---

## Out of Scope

The following are handled automatically by NextAuth v5 and were not audited:

- **CSRF protection** — NextAuth built-in for all `signIn`/`signOut` actions
- **Secure/HttpOnly cookie flags** — NextAuth sets these on session cookies automatically
- **OAuth state parameter** — NextAuth generates and validates the state param for the GitHub OAuth flow
- **Session cookie rotation** — NextAuth handles this internally
- **JWT signing and verification** — NextAuth signs JWTs with `AUTH_SECRET`; tampering is detected automatically
