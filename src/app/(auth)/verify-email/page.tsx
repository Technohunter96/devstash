import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/sign-in");
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  // Token not found, expired, or wrong type (e.g. a password-reset token submitted here)
  if (!record || record.expires < new Date() || record.identifier.startsWith("password-reset:")) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token } });
    }
    redirect("/sign-in?error=InvalidToken");
  }

  // Mark the user as verified and delete the used token
  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({ where: { token } });

  redirect("/email-verified");
}
