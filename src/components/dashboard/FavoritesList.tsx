"use client";

import Link from "next/link";
import { File, FolderOpen, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ICON_MAP } from "@/lib/constants/icon-map";
import { useItemDrawer } from "./ItemDrawerProvider";
import type { DashboardItem } from "@/lib/db/items";
import type { DashboardCollection } from "@/lib/db/collections";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FavoritesList({
  items,
  collections,
}: {
  items: DashboardItem[];
  collections: DashboardCollection[];
}) {
  const { open } = useItemDrawer();

  if (items.length === 0 && collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center font-mono">
        <Star className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No favorites yet</p>
        <p className="text-xs text-muted-foreground/70">
          Star an item or collection to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="font-mono text-sm space-y-8">
      {items.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-1 px-1">
            Items <span className="text-muted-foreground/60">({items.length})</span>
          </h2>
          <div className="border-t border-border">
            {items.map((item) => {
              const Icon = ICON_MAP[item.itemType.icon] ?? File;
              return (
                <button
                  key={item.id}
                  onClick={() => open(item.id)}
                  className="w-full flex items-center gap-3 px-1 py-1.5 border-b border-border hover:bg-muted/50 transition-colors text-left cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: item.itemType.color }} />
                  <span className="flex-1 truncate">{item.title}</span>
                  <Badge
                    variant="outline"
                    className="shrink-0"
                    style={{ color: item.itemType.color, borderColor: item.itemType.color }}
                  >
                    {item.itemType.name}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">
                    {formatDate(item.updatedAt)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-1 px-1">
            Collections <span className="text-muted-foreground/60">({collections.length})</span>
          </h2>
          <div className="border-t border-border">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="flex items-center gap-3 px-1 py-1.5 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <FolderOpen
                  className="w-3.5 h-3.5 shrink-0"
                  style={collection.dominantColor ? { color: collection.dominantColor } : undefined}
                />
                <span className="flex-1 truncate">{collection.name}</span>
                <Badge variant="outline" className="shrink-0">
                  Collection
                </Badge>
                <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">
                  {formatDate(collection.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}