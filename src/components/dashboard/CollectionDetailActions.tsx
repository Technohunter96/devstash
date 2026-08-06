"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import CollectionEditDialog from "@/components/dashboard/CollectionEditDialog";
import CollectionDeleteDialog from "@/components/dashboard/CollectionDeleteDialog";

interface CollectionDetailActionsProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
  };
}

export default function CollectionDetailActions({ collection }: CollectionDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Favorite — placeholder, not yet functional */}
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          title="Favorite (coming soon)"
          disabled
        >
          <Star
            className="w-4 h-4"
            style={collection.isFavorite ? { color: "#facc15", fill: "#facc15" } : undefined}
          />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </div>

      <CollectionEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />
      <CollectionDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
        onDeleted={() => router.push("/collections")}
      />
    </>
  );
}
