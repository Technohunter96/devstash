import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

// Edge-compatible — uses authConfig without Prisma/bcrypt
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const isAuthenticated = !!req.auth;

  if (!isAuthenticated) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/profile"],
};
