export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getRecentCollections, getCollectionStats } from "@/lib/db/collections";
import { getPinnedItems, getRecentItems, getItemStats } from "@/lib/db/items";
import StatsCards from "@/components/dashboard/StatsCards";
import Collections from "@/components/dashboard/Collections";
import PinnedItems from "@/components/dashboard/PinnedItems";
import Items from "@/components/dashboard/Items";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [recentCollections, pinnedItems, recentItems, itemStats, collectionStats] = userId
    ? await Promise.all([
        getRecentCollections(userId),
        getPinnedItems(userId),
        getRecentItems(userId),
        getItemStats(userId),
        getCollectionStats(userId),
      ])
    : [[], [], [], { totalItems: 0, favoriteItems: 0 }, { totalCollections: 0, favoriteCollections: 0 }];

  const { totalCollections, favoriteCollections } = collectionStats;

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
