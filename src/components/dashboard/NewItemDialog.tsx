"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, File } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ICON_MAP } from "@/lib/icon-map";
import { createItem } from "@/actions/items";
import CodeEditor from "./CodeEditor";

const CREATABLE_TYPES = [
  { name: "Snippet" as const, icon: "Code", color: "#3b82f6" },
  { name: "Prompt" as const, icon: "Sparkles", color: "#8b5cf6" },
  { name: "Command" as const, icon: "Terminal", color: "#f97316" },
  { name: "Note" as const, icon: "StickyNote", color: "#fde047" },
  { name: "Link" as const, icon: "Link", color: "#10b981" },
] as const;

export type TypeName = (typeof CREATABLE_TYPES)[number]["name"];

const CONTENT_TYPES: TypeName[] = ["Snippet", "Prompt", "Command", "Note"];
const LANGUAGE_TYPES: TypeName[] = ["Snippet", "Command"];
const CODE_TYPES: TypeName[] = ["Snippet", "Command"];

interface FormState {
  typeName: TypeName;
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
}

const DEFAULT_STATE: FormState = {
  typeName: "Snippet",
  title: "",
  description: "",
  content: "",
  url: "",
  language: "",
  tags: "",
};

// ─── Shared dialog content (controlled) ──────────────────────────────────────

interface NewItemDialogContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTypeName?: TypeName;
}

export function NewItemDialogContent({ open, onOpenChange, defaultTypeName }: NewItemDialogContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => ({
    ...DEFAULT_STATE,
    typeName: defaultTypeName ?? DEFAULT_STATE.typeName,
  }));
  const [isSaving, setIsSaving] = useState(false);

  const selectedType = CREATABLE_TYPES.find((t) => t.name === form.typeName)!;
  const showContent = CONTENT_TYPES.includes(form.typeName);
  const showLanguage = LANGUAGE_TYPES.includes(form.typeName);
  const showUrl = form.typeName === "Link";
  const isCodeType = CODE_TYPES.includes(form.typeName);
  const canSave = form.title.trim().length > 0 && (!showUrl || form.url.trim().length > 0);

  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value })),
  });

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setForm({ ...DEFAULT_STATE, typeName: defaultTypeName ?? DEFAULT_STATE.typeName });
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const result = await createItem({
        typeName: form.typeName,
        title: form.title,
        description: form.description || null,
        content: form.content || null,
        url: form.url || null,
        language: form.language || null,
        tags,
      });

      if (!result.success) {
        const msg =
          typeof result.error === "string"
            ? result.error
            : Object.values(result.error).flat().join(", ");
        toast.error(msg);
        return;
      }

      toast.success("Item created");
      handleOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Failed to create item");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-5 gap-1.5">
            {CREATABLE_TYPES.map((type) => {
              const Icon = ICON_MAP[type.icon] ?? File;
              const isSelected = form.typeName === type.name;
              return (
                <button
                  key={type.name}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, typeName: type.name }))}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-md border p-2.5 text-xs font-medium transition-colors cursor-pointer",
                    isSelected
                      ? "border-transparent"
                      : "border-border text-muted-foreground hover:bg-muted/50",
                  )}
                  style={
                    isSelected
                      ? { backgroundColor: type.color + "20", color: type.color, borderColor: type.color + "40" }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4" style={isSelected ? { color: type.color } : undefined} />
                  {type.name}
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              className="w-full bg-transparent text-sm outline-none border border-border rounded-md px-3 py-2 focus:border-primary"
              placeholder={`${selectedType.name} title`}
              {...field("title")}
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

          {/* Content */}
          {showContent && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Content</label>
              {isCodeType ? (
                <CodeEditor
                  value={form.content}
                  language={form.language || undefined}
                  onChange={(val) => setForm((s) => ({ ...s, content: val }))}
                />
              ) : (
                <textarea
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs font-mono leading-relaxed outline-none focus:border-primary resize-none"
                  placeholder="Paste your content here"
                  {...field("content")}
                  rows={5}
                />
              )}
            </div>
          )}

          {/* Language */}
          {showLanguage && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Language</label>
              <input
                className="w-full bg-transparent text-sm outline-none border border-border rounded-md px-3 py-2 focus:border-primary"
                placeholder="e.g. typescript, bash"
                {...field("language")}
              />
            </div>
          )}

          {/* URL */}
          {showUrl && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                URL <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full bg-transparent text-sm outline-none border border-border rounded-md px-3 py-2 focus:border-primary"
                placeholder="https://…"
                type="url"
                {...field("url")}
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <input
              className="w-full bg-transparent text-sm outline-none border border-border rounded-md px-3 py-2 focus:border-primary"
              placeholder="tag1, tag2, tag3"
              {...field("tags")}
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
              <Plus />
              {isSaving ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── TopBar "New Item" button (self-contained) ────────────────────────────────

export default function NewItemDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="cursor-pointer">
        <Plus className="size-4" />
        <span className="hidden sm:inline">New Item</span>
      </Button>
      <NewItemDialogContent open={open} onOpenChange={setOpen} />
    </>
  );
}