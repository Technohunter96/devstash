import { prisma } from "@/lib/prisma";

export async function getUserByStripeCustomerId(customerId: string) {
  return prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });
}

export async function setUserProStatus(
  userId: string,
  data: { isPro: boolean; stripeCustomerId?: string; stripeSubscriptionId?: string | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}