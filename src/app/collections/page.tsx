export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getAllCollections } from "@/lib/db/collections";
import CollectionCard from "@/components/dashboard/CollectionCard";

export default async function CollectionsPage() {
  const session = await auth();
  const collections = await getAllCollections(session!.user!.id);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Collections</h1>
        <p className="text-muted-foreground text-sm">
          {collections.length} {collections.length === 1 ? "collection" : "collections"}
        </p>
      </div>

      {collections.length === 0 ? (
        <p className="text-muted-foreground text-sm">No collections yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
    </div>
  );
}