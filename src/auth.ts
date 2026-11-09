import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { RATE_LIMITED_CODE_PREFIX } from "@/lib/constants/auth";

// Reaches the client as `result.code`, so the form can show the retry time instead of "Invalid email or password"
class RateLimitedError extends CredentialsSignin {
  constructor(retryAfter: number) {
    super();
    this.code = `${RATE_LIMITED_CODE_PREFIX}${retryAfter}`;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token }) {
      if (token.sub) {
        // Refresh emailVerified/isPro on every token refresh so the session stays accurate
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
      if (token.sub) {
        session.user.id = token.sub;
      }
      session.user.emailVerified = (token.emailVerified as Date | null) ?? null;
      session.user.isPro = (token.isPro as boolean) ?? false;
      return session;
    },
  },
  providers: [
    // Links GitHub accounts to existing email/password accounts with matching email.
    // Only safe when email verification is enforced — ensure EMAIL_VERIFICATION_ENABLED=true before launch.
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Server-side rate limit — fires regardless of client (bypasses pre-flight endpoint)
        const ip = await getClientIP();
        const rl = await checkRateLimit("login", ip);
        if (!rl.success) {
          throw new RateLimitedError(rl.retryAfter);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
});