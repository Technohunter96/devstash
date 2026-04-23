export const dynamic = "force-dynamic";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { getSidebarItemTypes, getSidebarCollections } from "@/lib/db/sidebar";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    select: { id: true, name: true, email: true },
  });

  const [itemTypes, collections] = user
    ? await Promise.all([
        getSidebarItemTypes(user.id),
        getSidebarCollections(user.id),
      ])
    : [[], []];

  return (
    <DashboardShell
      itemTypes={itemTypes}
      collections={collections}
      user={{ name: user?.name ?? "User", email: user?.email ?? "" }}
    >
      {children}
    </DashboardShell>
  );
}
