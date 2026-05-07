export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSidebarItemTypes, getSidebarCollections } from "@/lib/db/sidebar";
import { isEmailVerificationEnabled } from "@/lib/feature-flags";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Redirect unverified users only when verification is enabled
  if (isEmailVerificationEnabled() && !session.user.emailVerified) {
    const email = session.user.email ?? "";
    redirect(`/verify-email-sent?email=${encodeURIComponent(email)}`);
  }

  const userId = session.user.id;

  const [itemTypes, collections] = await Promise.all([
    getSidebarItemTypes(userId),
    getSidebarCollections(userId),
  ]);

  return (
    <DashboardShell
      itemTypes={itemTypes}
      collections={collections}
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        image: session.user.image,
      }}
    >
      {children}
    </DashboardShell>
  );
}