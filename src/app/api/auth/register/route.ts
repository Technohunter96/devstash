import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail, sendDuplicateRegistrationEmail } from "@/lib/email";
import { isEmailVerificationEnabled } from "@/lib/feature-flags";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = await getClientIP();
  const rl = await checkRateLimit("register", ip);
  if (!rl.success) return rateLimitResponse(rl.retryAfter);

  const body = await req.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Notify the real owner; silently return 200 so the attacker learns nothing
    if (isEmailVerificationEnabled()) {
      sendDuplicateRegistrationEmail(email).catch((err) =>
        console.error("Duplicate registration email failed:", err)
      );
    }
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Hash the password before storing — never store plaintext
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      // Skip email verification in dev — set EMAIL_VERIFICATION_ENABLED=true in prod
      ...(!isEmailVerificationEnabled() && { emailVerified: new Date() }),
    },
  });

  if (isEmailVerificationEnabled()) {
    const token = await createVerificationToken(email);
    try {
      await sendVerificationEmail(email, token);
    } catch (err) {
      // Account created but email failed — user can resend from verify-email-sent page
      console.error("Verification email failed:", err);
    }
  }

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}
