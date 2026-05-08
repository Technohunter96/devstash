import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_PREFIX = "password-reset:";

async function createToken(identifier: string, ttlMs: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + ttlMs);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  return token;
}

export function createVerificationToken(email: string): Promise<string> {
  return createToken(email, 24 * 60 * 60 * 1000);
}

export function createPasswordResetToken(email: string): Promise<string> {
  return createToken(`${PASSWORD_RESET_PREFIX}${email}`, 60 * 60 * 1000);
}

export function isPasswordResetToken(identifier: string): boolean {
  return identifier.startsWith(PASSWORD_RESET_PREFIX);
}

export function emailFromPasswordResetIdentifier(identifier: string): string {
  return identifier.slice(PASSWORD_RESET_PREFIX.length);
}
