export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getItemsByType, SLUG_TO_TYPE_NAME } from "@/lib/db/items";
import ItemCard from "@/components/dashboard/ItemCard";

interface Props {
  params: Promise<{ type: string }>;
}

export default async function ItemsTypePage({ params }: Props) {
  const { type } = await params;
  const typeName = SLUG_TO_TYPE_NAME[type];

  if (!typeName) notFound();

  // auth() is request-cached — layout already verified the session
  const session = await auth();
  const items = await getItemsByType(session!.user!.id, typeName);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{typeName}s</h1>
        <p className="text-muted-foreground text-sm">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No {typeName.toLowerCase()}s yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}