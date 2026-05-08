import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const ip = await getClientIP();
  const rl = await checkRateLimit("resendVerification", `${ip}:${email}`);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  const user = await prisma.user.findUnique({ where: { email } });

  // Return 200 even if user not found — don't leak whether an account exists
  if (!user || user.emailVerified) {
    return NextResponse.json({ success: true });
  }

  const token = await createVerificationToken(email);

  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error("Resend verification email failed:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}