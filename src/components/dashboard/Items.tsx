import Link from "next/link";
import ItemCard from "./ItemCard";

interface Item {
  id: string;
  title: string;
  contentType: "TEXT" | "URL" | "FILE";
  content?: string | null;
  url?: string | null;
  language?: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  itemType: {
    name: string;
    icon: string;
    color: string;
  };
}

interface ItemsProps {
  items: Item[];
}

export default function Items({ items }: ItemsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Items
        </h2>
        <Link
          href="/items"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
