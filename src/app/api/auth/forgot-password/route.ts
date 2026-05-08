import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Always return 200 to avoid leaking whether an account exists
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.password) {
    try {
      const token = await createPasswordResetToken(email);
      await sendPasswordResetEmail(email, token);
    } catch {
      // Silently fail — don't expose internal errors to the client
    }
  }

  return NextResponse.json({ ok: true });
}
