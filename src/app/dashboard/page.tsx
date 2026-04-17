import { mockItems, mockItemTypeCounts } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { getRecentCollections } from "@/lib/db/collections";
import StatsCards from "@/components/dashboard/StatsCards";
import Collections from "@/components/dashboard/Collections";
import PinnedItems from "@/components/dashboard/PinnedItems";
import Items from "@/components/dashboard/Items";

// TODO: replace with session user once auth is implemented
const DEMO_USER_EMAIL = "demo@devstash.io";

export default async function DashboardPage() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  const recentCollections = user
    ? await getRecentCollections(user.id)
    : [];

  const totalItems = Object.values(mockItemTypeCounts).reduce((a, b) => a + b, 0);
  const totalCollections = recentCollections.length;
  const favoriteItems = mockItems.filter((i) => i.isFavorite).length;
  const favoriteCollections = recentCollections.filter((c) => c.isFavorite).length;

  const pinnedItems = mockItems.filter((i) => i.isPinned);

  const recentItems = [...mockItems]
    .sort((a, b) => {
      const aTime = a.lastUsedAt?.getTime() ?? 0;
      const bTime = b.lastUsedAt?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, 10);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back! Here&apos;s your developer stash.</p>
      </div>

      <StatsCards
        totalItems={totalItems}
        totalCollections={totalCollections}
        favoriteItems={favoriteItems}
        favoriteCollections={favoriteCollections}
      />

      <Collections collections={recentCollections} />

      <PinnedItems items={pinnedItems} />

      <Items items={recentItems} />
    </div>
  );
}
