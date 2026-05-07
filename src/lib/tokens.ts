import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Delete any existing token for this email before creating a new one
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return token;
}