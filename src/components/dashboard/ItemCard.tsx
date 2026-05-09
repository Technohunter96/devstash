"use client";

import { useState } from "react";
import { Star, Pin, Copy, Check, File } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { ICON_MAP } from "@/lib/icon-map";

// TODO: replace with useItemDrawer() context when drawer is implemented

interface Item {
  id: string;
  title: string;
  description?: string | null;
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

export default function ItemCard({ item }: { item: Item }) {
  const [copied, setCopied] = useState(false);
  const Icon = ICON_MAP[item.itemType.icon] ?? File;
  const copyableContent = item.content ?? item.url;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyableContent) return;
    try {
      await navigator.clipboard.writeText(copyableContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <Card
      className="group relative cursor-pointer hover:border-muted-foreground/50 transition-colors border-l-[3px]"
      style={{ borderLeftColor: item.itemType.color }}
      onClick={() => {
        // TODO: openDrawer(item.id)
      }}
    >
      <CardContent className="flex items-start gap-3 px-4 py-3">
        <div className="flex flex-col items-center gap-1 shrink-0 w-12">
          <div
            className="rounded-md p-1.5"
            style={{ backgroundColor: item.itemType.color + "20" }}
          >
            <Icon className="w-4 h-4" style={{ color: item.itemType.color }} />
          </div>
          <span
            className="text-[9px] font-medium leading-none"
            style={{ color: item.itemType.color }}
          >
            {item.itemType.name}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {item.isPinned && (
              <Pin className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            <span className="font-medium text-sm truncate">{item.title}</span>
            {item.isFavorite && (
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
            )}
            {item.lastUsedAt && (
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                {timeAgo(item.lastUsedAt)}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </CardContent>
      {copyableContent && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </Button>
      )}
    </Card>
  );
}
