"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import CollectionEditDialog from "@/components/dashboard/CollectionEditDialog";
import CollectionDeleteDialog from "@/components/dashboard/CollectionDeleteDialog";
import { toggleCollectionFavorite } from "@/actions/collections";

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
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleFavorite = async () => {
    setIsToggling(true);
    try {
      const result = await toggleCollectionFavorite(collection.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setIsFavorite(result.isFavorite);
      router.refresh();
    } catch {
      toast.error("Failed to update favorite");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={handleToggleFavorite}
          disabled={isToggling}
        >
          <Star
            className="w-4 h-4"
            style={isFavorite ? { color: "#facc15", fill: "#facc15" } : undefined}
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
