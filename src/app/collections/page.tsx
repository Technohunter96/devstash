export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { getAllCollections } from "@/lib/db/collections";
import CollectionCard from "@/components/dashboard/CollectionCard";
import Pagination from "@/components/dashboard/Pagination";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants/pagination";
import { parsePage } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function CollectionsPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).page);

  const session = await auth();
  const { data: collections, totalCount } = await getAllCollections(session!.user!.id, page);
  const totalPages = Math.ceil(totalCount / COLLECTIONS_PER_PAGE);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Collections</h1>
        <p className="text-muted-foreground text-sm">
          {totalCount} {totalCount === 1 ? "collection" : "collections"}
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

      <Pagination currentPage={page} totalPages={totalPages} basePath="/collections" />
    </div>
  );
}