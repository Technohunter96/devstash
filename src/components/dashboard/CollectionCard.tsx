"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { File, Star, FolderOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ICON_MAP } from "@/lib/constants/icon-map";
import CollectionEditDialog from "@/components/dashboard/CollectionEditDialog";
import CollectionDeleteDialog from "@/components/dashboard/CollectionDeleteDialog";

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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Card
        className="group cursor-pointer hover:border-muted-foreground/50 transition-colors border-l-[3px]"
        style={collection.dominantColor ? { borderLeftColor: collection.dominantColor } : undefined}
        onClick={() => router.push(`/collections/${collection.id}`)}
      >
        <CardContent className="px-5 py-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-base truncate">{collection.name}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {collection.isFavorite && (
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 mt-0.5" />
              )}
              {/* 3-dot menu — stopPropagation prevents the card click from firing */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-pointer p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity focus-visible:opacity-100"
                  aria-label="Collection options"
                >
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Favorite
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

      <CollectionEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />
      <CollectionDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
        onDeleted={() => router.refresh()}
      />
    </>
  );
}
