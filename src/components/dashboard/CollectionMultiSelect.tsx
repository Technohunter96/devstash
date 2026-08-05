"use client";

import { useEffect, useState } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CollectionBadge from "./CollectionBadge";
import { cn } from "@/lib/utils";

interface CollectionOption {
  id: string;
  name: string;
  color: string | null;
}

interface CollectionMultiSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function CollectionMultiSelect({
  selectedIds,
  onChange,
}: CollectionMultiSelectProps) {
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => setCollections(data.collections ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((existing) => existing !== id)
        : [...selectedIds, id],
    );
  };

  const selected = collections.filter((c) => selectedIds.includes(c.id));

  return (
    <Popover>
      <PopoverTrigger className="flex w-full min-h-9 items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary cursor-pointer">
        {selected.length > 0 ? (
          <span className="flex flex-1 flex-wrap gap-1">
            {selected.map((c) => (
              <CollectionBadge key={c.id} name={c.name} color={c.color} />
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">Select collections…</span>
        )}
        <ChevronsUpDown className="w-4 h-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 max-h-60 overflow-y-auto p-1.5">
        {isLoading && <p className="px-2 py-1.5 text-xs text-muted-foreground">Loading…</p>}
        {!isLoading && collections.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">No collections yet</p>
        )}
        {!isLoading &&
          collections.map((collection) => {
            const isSelected = selectedIds.includes(collection.id);
            return (
              <button
                key={collection.id}
                type="button"
                onClick={() => toggle(collection.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50",
                  isSelected && "bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    !collection.color && "bg-muted-foreground/50",
                  )}
                  style={collection.color ? { backgroundColor: collection.color } : undefined}
                />
                <span className="flex-1 truncate text-left">{collection.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
      </PopoverContent>
    </Popover>
  );
}