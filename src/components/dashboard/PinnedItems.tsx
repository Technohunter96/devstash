import { Pin } from "lucide-react";
import ItemCard from "./ItemCard";
import type { DashboardItem } from "@/lib/db/items";

interface PinnedItemsProps {
  items: DashboardItem[];
}

export default function PinnedItems({ items }: PinnedItemsProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Pin className="w-3.5 h-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Pinned
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
