export const dynamic = "force-dynamic";

import { Star } from "lucide-react";
import { auth } from "@/auth";
import { getFavoriteItems } from "@/lib/db/items";
import { getFavoriteCollections } from "@/lib/db/collections";
import FavoritesList from "@/components/dashboard/FavoritesList";

export default async function FavoritesPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [items, collections] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
  ]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        Favorites
      </h1>
      <FavoritesList items={items} collections={collections} />
    </div>
  );
}
