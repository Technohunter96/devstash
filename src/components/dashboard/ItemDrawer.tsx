"use client";

import { useState } from "react";
import { Star, Pin, Copy, Check, Pencil, Trash2, File, Folder, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ICON_MAP } from "@/lib/icon-map";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerProps {
  isOpen: boolean;
  item: ItemDetail | null;
  isLoading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
}

export default function ItemDrawer({
  isOpen,
  item,
  isLoading,
  error,
  onOpenChange,
}: ItemDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {/* data-[side=right]: prefix matches the base class specificity so our width wins */}
      <SheetContent className="data-[side=right]:w-1/3 data-[side=right]:sm:max-w-none p-0 flex flex-col gap-0">
        {isLoading && <ItemDrawerSkeleton />}
        {!isLoading && error && <ItemDrawerError message={error} />}
        {!isLoading && !error && item && <ItemDrawerBody item={item} />}
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-muted-foreground mb-2">{children}</h3>;
}

function ItemDrawerBody({ item }: { item: ItemDetail }) {
  const Icon = ICON_MAP[item.itemType.icon] ?? File;
  const copyableContent = item.content ?? item.url;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyableContent) return;
    try {
      await navigator.clipboard.writeText(copyableContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <>
      <SheetHeader className="border-b p-4">
        <div className="flex items-start gap-3 pr-8">
          <div
            className="rounded-md p-2 shrink-0"
            style={{ backgroundColor: item.itemType.color + "20" }}
          >
            <Icon className="w-4 h-4" style={{ color: item.itemType.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <SheetTitle className="truncate">{item.title}</SheetTitle>
            <SheetDescription className="text-xs" style={{ color: item.itemType.color }}>
              {item.itemType.name}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              item.isFavorite &&
                "border-yellow-400/40 text-yellow-400 hover:text-yellow-300 dark:bg-yellow-400/10",
            )}
          >
            <Star className={cn(item.isFavorite && "fill-yellow-400 text-yellow-400")} />
            {item.isFavorite ? "Favorited" : "Favorite"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              item.isPinned &&
                "border-blue-400/40 text-blue-400 hover:text-blue-300 dark:bg-blue-400/10",
            )}
          >
            <Pin className={cn(item.isPinned && "fill-blue-400 text-blue-400")} />
            {item.isPinned ? "Pinned" : "Pin"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!copyableContent}>
            {copied ? <Check className="text-green-500" /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" size="sm">
            <Pencil />
            Edit
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete item"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
        >
          <Trash2 />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {item.description && (
          <section>
            <SectionLabel>Description</SectionLabel>
            <p className="text-sm leading-relaxed">{item.description}</p>
          </section>
        )}

        {item.contentType === "TEXT" && item.content && (
          <section>
            <SectionLabel>Content</SectionLabel>
            <pre className="text-xs font-mono bg-background border border-border rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
              {item.content}
            </pre>
          </section>
        )}

        {item.contentType === "URL" && item.url && (
          <section>
            <SectionLabel>URL</SectionLabel>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
              style={{ borderColor: item.itemType.color + "40" }}
            >
              <div
                className="rounded p-1.5 shrink-0"
                style={{ backgroundColor: item.itemType.color + "20" }}
              >
                <ExternalLink className="w-3.5 h-3.5" style={{ color: item.itemType.color }} />
              </div>
              <span className="text-sm break-all leading-snug group-hover:underline" style={{ color: item.itemType.color }}>
                {item.url}
              </span>
            </a>
          </section>
        )}

        {item.tags.length > 0 && (
          <section>
            <SectionLabel>Tags</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {item.collections.length > 0 && (
          <section>
            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <Folder className="w-3 h-3" />
                Collections
              </span>
            </SectionLabel>
            <ul className="flex flex-col">
              {item.collections.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-2 py-1.5 text-sm border-b last:border-b-0"
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      !c.color && "bg-muted-foreground/50",
                    )}
                    style={c.color ? { backgroundColor: c.color } : undefined}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function ItemDrawerSkeleton() {
  return (
    <>
      <div className="border-b p-4">
        <div className="flex items-start gap-3 pr-8">
          <Skeleton className="w-8 h-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-7 w-14" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-14" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </>
  );
}

function ItemDrawerError({ message }: { message: string }) {
  return (
    <>
      <SheetHeader className="border-b p-4">
        <SheetTitle>Error</SheetTitle>
        <SheetDescription>{message}</SheetDescription>
      </SheetHeader>
      <div className="p-4 text-sm text-muted-foreground">
        Please close the drawer and try again.
      </div>
    </>
  );
}
