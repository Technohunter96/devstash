import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emailFromPasswordResetIdentifier, isPasswordResetToken } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || !isPasswordResetToken(record.identifier) || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token } });
    }
    return NextResponse.json({ error: "Reset link is invalid or has expired." }, { status: 400 });
  }

  const email = emailFromPasswordResetIdentifier(record.identifier);
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}
