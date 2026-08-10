export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getItemsByType, SLUG_TO_TYPE_NAME } from "@/lib/db/items";
import ItemCard from "@/components/dashboard/ItemCard";
import ImageCard from "@/components/dashboard/ImageCard";
import FileListItem from "@/components/dashboard/FileListItem";
import AddTypeItemButton from "@/components/dashboard/AddTypeItemButton";
import Pagination from "@/components/dashboard/Pagination";
import { ITEM_TYPE_COLORS } from "@/lib/constants/icon-map";
import { ITEMS_PER_PAGE } from "@/lib/constants/pagination";
import { parsePage } from "@/lib/utils";

interface Props {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function ItemsTypePage({ params, searchParams }: Props) {
  const { type } = await params;
  const typeName = SLUG_TO_TYPE_NAME[type];

  if (!typeName) notFound();

  const page = parsePage((await searchParams).page);

  // auth() is request-cached — layout already verified the session
  const session = await auth();
  const { data: items, totalCount } = await getItemsByType(session!.user!.id, typeName, page);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const typeColor = ITEM_TYPE_COLORS[typeName] ?? null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{typeName}s</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </p>
        </div>
        {typeColor && <AddTypeItemButton typeName={typeName} color={typeColor} />}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No {typeName.toLowerCase()}s yet.</p>
      ) : typeName === "Image" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ImageCard key={item.id} item={item} />
          ))}
        </div>
      ) : typeName === "File" ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <FileListItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/items/${type}`} />
    </div>
  );
}