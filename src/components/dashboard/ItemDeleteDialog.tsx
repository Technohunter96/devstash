"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ItemDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
}

export default function ItemDeleteDialog({
  open,
  onOpenChange,
  itemTitle,
  isDeleting,
  onConfirm,
}: ItemDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <AlertDialogHeader className="px-5 pt-5 pb-4">
          <AlertDialogTitle>
            <span className="text-destructive">Delete</span> {itemTitle}?
          </AlertDialogTitle>
          <p className="text-sm text-orange-400/80">
            It will be permanently deleted and it cannot be undone.
          </p>
        </AlertDialogHeader>

        <div className="flex gap-2 border-t px-5 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="cursor-pointer flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="cursor-pointer flex-1"
          >
            {isDeleting && <Loader2 className="animate-spin" />}
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
