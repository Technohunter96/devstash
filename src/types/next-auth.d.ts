import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified: Date | null;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}
