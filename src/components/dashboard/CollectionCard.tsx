"use client";

import { useRouter } from "next/navigation";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link2,
  File,
  Image,
  Star,
  FolderOpen,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: Link2,
  File,
  Image,
};

interface ItemType {
  name: string;
  icon: string;
  color: string;
}

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
    itemCount: number;
    itemTypes: ItemType[];
    dominantColor?: string | null;
  };
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter();

  return (
    <Card
      className="group cursor-pointer hover:border-muted-foreground/50 transition-colors border-l-[3px]"
      style={collection.dominantColor ? { borderLeftColor: collection.dominantColor } : undefined}
      onClick={() => router.push(`/collections/${collection.id}`)}
    >
      <CardContent className="px-5 py-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{collection.name}</span>
          </div>
          {collection.isFavorite && (
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0 mt-0.5" />
          )}
        </div>
        {collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            {collection.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {collection.itemTypes.map((type) => {
              const Icon = ICON_MAP[type.icon] ?? File;
              return (
                <div
                  key={type.name}
                  className="rounded p-1"
                  style={{ backgroundColor: type.color + "20" }}
                  title={type.name}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: type.color }} />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
