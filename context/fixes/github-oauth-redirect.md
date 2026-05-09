# Fix GitHub OAuth Redirect Issue

## Problem

GitHub sign-in required two clicks. First click authenticated the user (session was created) but the redirect to `/dashboard` failed — page refreshed back to `/sign-in`. Second click worked correctly.

Additionally, users who registered with email/password and then tried to sign in with GitHub (same email) got an account linking error.

## Root Cause

Two separate issues:

1. Client-side `signIn("github", { callbackUrl })` from `next-auth/react` has unreliable redirect behavior — the redirect happens on the client after the OAuth callback, which can race with session hydration.
2. GitHub provider did not have `allowDangerousEmailAccountLinking: true`, so accounts with a matching email but no linked GitHub account were rejected.

## Solution

1. Switch GitHub sign-in to a Server Action using `signIn` from `@/auth` (NextAuth v5 server-side). The redirect is handled server-side before the response reaches the browser.
2. Enable `allowDangerousEmailAccountLinking` on the GitHub provider so existing email/password accounts can be linked to GitHub OAuth.

## Changes

### `src/actions/auth.ts` (new file)

```ts
"use server";

import { signIn } from "@/auth";

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" });
}
```

### `src/components/auth/sign-in-form.tsx`

- Replaced `<Button onClick={() => signIn("github", { callbackUrl })}>` with `<form action={signInWithGitHub}>` containing a submit button
- Credentials login unchanged — still uses `signIn("credentials", { redirect: false })` which works fine client-side

### `src/auth.ts`

```ts
GitHub({ allowDangerousEmailAccountLinking: true })
```

## Key Details

- Use `redirectTo` (NextAuth v5) not `callbackUrl` (v4 API)
- No SessionProvider or client-side state needed for the GitHub flow
- Credentials flow stays client-side (`redirect: false`) — this is intentional to show inline errors
