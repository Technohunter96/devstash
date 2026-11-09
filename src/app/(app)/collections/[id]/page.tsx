export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { getCollectionDetail } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import ItemCard from "@/components/dashboard/ItemCard";
import ImageCard from "@/components/dashboard/ImageCard";
import FileListItem from "@/components/dashboard/FileListItem";
import CollectionDetailActions from "@/components/dashboard/CollectionDetailActions";
import Pagination from "@/components/dashboard/Pagination";
import { ITEMS_PER_PAGE } from "@/lib/constants/pagination";
import { parsePage } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CollectionDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const page = parsePage((await searchParams).page);

  const session = await auth();
  const userId = session!.user!.id;

  const collection = await getCollectionDetail(userId, id);
  if (!collection) notFound();

  const { data: items, totalCount } = await getItemsByCollection(userId, id, page);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const imageItems = items.filter((item) => item.itemType.name === "Image");
  const fileItems = items.filter((item) => item.itemType.name === "File");
  const otherItems = items.filter(
    (item) => item.itemType.name !== "Image" && item.itemType.name !== "File"
  );
  const sectionCount = [imageItems, fileItems, otherItems].filter((s) => s.length > 0).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen
              className="w-5 h-5 shrink-0"
              style={collection.dominantColor ? { color: collection.dominantColor } : undefined}
            />
            <h1 className="text-2xl font-semibold truncate">{collection.name}</h1>
          </div>
          <CollectionDetailActions collection={collection} />
        </div>
        {collection.description && (
          <p className="text-muted-foreground text-sm mb-1">{collection.description}</p>
        )}
        <p className="text-muted-foreground text-sm">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No items in this collection yet.</p>
      ) : (
        <div className="space-y-6">
          {otherItems.length > 0 && (
            <div className="space-y-3">
              {sectionCount > 1 && (
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Items
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {imageItems.length > 0 && (
            <div className="space-y-3">
              {sectionCount > 1 && (
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Images
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {imageItems.map((item) => (
                  <ImageCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {fileItems.length > 0 && (
            <div className="space-y-3">
              {sectionCount > 1 && (
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Files
                </h2>
              )}
              <div className="flex flex-col gap-2">
                {fileItems.map((item) => (
                  <FileListItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/collections/${id}`} />
    </div>
  );
}