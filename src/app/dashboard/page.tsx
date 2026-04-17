import { prisma } from "@/lib/prisma";
import { getRecentCollections } from "@/lib/db/collections";
import { getPinnedItems, getRecentItems, getItemStats } from "@/lib/db/items";
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

  const [recentCollections, pinnedItems, recentItems, itemStats] = user
    ? await Promise.all([
        getRecentCollections(user.id),
        getPinnedItems(user.id),
        getRecentItems(user.id),
        getItemStats(user.id),
      ])
    : [[], [], [], { totalItems: 0, favoriteItems: 0 }];

  const totalCollections = recentCollections.length;
  const favoriteCollections = recentCollections.filter((c) => c.isFavorite).length;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back! Here&apos;s your developer stash.</p>
      </div>

      <StatsCards
        totalItems={itemStats.totalItems}
        totalCollections={totalCollections}
        favoriteItems={itemStats.favoriteItems}
        favoriteCollections={favoriteCollections}
      />

      <Collections collections={recentCollections} />

      <PinnedItems items={pinnedItems} />

      <Items items={recentItems} />
    </div>
  );
}
