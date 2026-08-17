"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageIcon, Star, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useItemDrawer } from "./ItemDrawerProvider";
import { toggleItemFavorite } from "@/actions/items";

interface ImageItem {
  id: string;
  title: string;
  fileUrl: string | null;
  isFavorite: boolean;
  isPinned: boolean;
}

export default function ImageCard({ item }: { item: ImageItem }) {
  const router = useRouter();
  const { open } = useItemDrawer();
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await toggleItemFavorite(item.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setIsFavorite(result.isFavorite);
    router.refresh();
  };

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-border cursor-pointer aspect-video bg-muted"
      onClick={() => open(item.id)}
    >
      {item.fileUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.fileUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}

      {/* Badges top-right */}
      <div className="absolute top-2 right-2 flex gap-1">
        {item.isPinned && (
          <div className="bg-black/50 rounded p-1">
            <Pin className="w-3 h-3 text-white" />
          </div>
        )}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={cn(
            "bg-black/50 rounded p-1 cursor-pointer transition-opacity",
            isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <Star className={cn("w-3 h-3", isFavorite ? "text-yellow-400 fill-yellow-400" : "text-white")} />
        </button>
      </div>

      {/* Title overlay — always visible at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/75 px-3 py-2.5">
        <p className="text-white text-base font-bold truncate">{item.title}</p>
      </div>
    </div>
  );
}
