"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { File, FolderOpen, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type SortOption = "date" | "name" | "type";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
];

function sortItems(items: DashboardItem[], sortBy: SortOption): DashboardItem[] {
  const sorted = [...items];
  if (sortBy === "name") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "type") {
    sorted.sort((a, b) => a.itemType.name.localeCompare(b.itemType.name));
  } else {
    sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  return sorted;
}

// "type" has no meaning for collections, so it falls back to the default (date) order
function sortCollections(
  collections: DashboardCollection[],
  sortBy: SortOption
): DashboardCollection[] {
  const sorted = [...collections];
  if (sortBy === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  return sorted;
}

export default function FavoritesList({
  items,
  collections,
}: {
  items: DashboardItem[];
  collections: DashboardCollection[];
}) {
  const { open } = useItemDrawer();
  const [sortBy, setSortBy] = useState<SortOption>("date");

  const sortedItems = useMemo(() => sortItems(items, sortBy), [items, sortBy]);
  const sortedCollections = useMemo(
    () => sortCollections(collections, sortBy),
    [collections, sortBy]
  );

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
      <div className="flex items-center justify-end gap-2 text-xs">
        <span className="text-muted-foreground">Sort by</span>
        <Select
          items={SORT_OPTIONS}
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortOption)}
        >
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-1 px-1">
            Items <span className="text-muted-foreground/60">({items.length})</span>
          </h2>
          <div className="border-t border-border">
            {sortedItems.map((item) => {
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
            {sortedCollections.map((collection) => (
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