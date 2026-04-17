import Link from "next/link";
import { Clock } from "lucide-react";
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
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent
          </h2>
        </div>
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
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
