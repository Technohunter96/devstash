"use client";

import { useRouter } from "next/navigation";
import { FolderOpen, Loader2 } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { ICON_MAP } from "@/lib/constants/icon-map";
import { useSearch } from "./SearchProvider";
import { useItemDrawer } from "./ItemDrawerProvider";

export default function CommandPalette() {
  const { open, setOpen, items, collections, isLoading } = useSearch();
  const { open: openDrawer } = useItemDrawer();
  const router = useRouter();

  function handleItemSelect(itemId: string) {
    setOpen(false);
    openDrawer(itemId);
  }

  function handleCollectionSelect(collectionId: string) {
    setOpen(false);
    router.push(`/collections/${collectionId}`);
  }

  return (
    // top-[15%] overrides shadcn default top-1/3 — palette sits in the upper area (Linear/VS Code style)
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search items and collections" className="top-[15%]">
      <Command>
        <CommandInput placeholder="Search items and collections..." />
        <CommandList>
          {isLoading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>

              {items.length > 0 && (
                <CommandGroup heading="Items">
                  {items.map((item) => {
                    const Icon = ICON_MAP[item.typeIcon];
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        keywords={item.description ? [item.description] : undefined}
                        onSelect={() => handleItemSelect(item.id)}
                        className="cursor-pointer"
                      >
                        {Icon ? (
                          <Icon className="size-4 shrink-0 mt-0.5" style={{ color: item.typeColor }} />
                        ) : (
                          <span className="size-4 shrink-0 mt-0.5 rounded-sm" style={{ background: item.typeColor }} />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{item.title}</span>
                          {item.description && (
                            <span className="truncate text-xs text-muted-foreground">{item.description}</span>
                          )}
                        </div>
                        {/* CommandShortcut suppresses the CheckIcon that CommandItem appends, fixing alignment */}
                        <CommandShortcut>{item.typeName}</CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {items.length > 0 && collections.length > 0 && <CommandSeparator />}

              {collections.length > 0 && (
                <CommandGroup heading="Collections">
                  {collections.map((collection) => (
                    <CommandItem
                      key={collection.id}
                      value={collection.name}
                      onSelect={() => handleCollectionSelect(collection.id)}
                      className="cursor-pointer"
                    >
                      {collection.dominantColor ? (
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ background: collection.dominantColor }}
                        />
                      ) : (
                        <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{collection.name}</span>
                      <CommandShortcut>
                        {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
