import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export default {
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // bcrypt cannot run in edge runtime — real authorize logic is in auth.ts
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;