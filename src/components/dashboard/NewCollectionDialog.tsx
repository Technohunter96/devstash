"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { extractActionError } from "@/lib/utils";
import { createCollection } from "@/actions/collections";

interface FormState {
  name: string;
  description: string;
}

const DEFAULT_STATE: FormState = {
  name: "",
  description: "",
};

// ─── Shared dialog content (controlled) ──────────────────────────────────────

interface NewCollectionDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewCollectionDialogContent({
  open,
  onOpenChange,
}: NewCollectionDialogContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = form.name.trim().length > 0;

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value })),
  });

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm(DEFAULT_STATE);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const result = await createCollection({
        name: form.name,
        description: form.description || null,
      });

      if (!result.success) {
        toast.error(extractActionError(result.error));
        return;
      }

      toast.success("Collection created");
      handleOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              className="w-full bg-transparent text-sm outline-none border border-border rounded-md px-3 py-2 focus:border-primary"
              placeholder="Collection name"
              {...field("name")}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              className="w-full bg-transparent text-sm leading-relaxed outline-none border border-border rounded-md px-3 py-2 focus:border-primary resize-none"
              placeholder="Optional description"
              {...field("description")}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSaving || !canSave}
              className="cursor-pointer"
            >
              <FolderPlus />
              {isSaving ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── TopBar "New Collection" button (self-contained) ─────────────────────────

export default function NewCollectionDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="cursor-pointer">
        <FolderPlus className="size-4" />
        <span className="hidden sm:inline">New Collection</span>
      </Button>
      <NewCollectionDialogContent open={open} onOpenChange={setOpen} />
    </>
  );
}