"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, File } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ICON_MAP, ITEM_TYPE_COLORS } from "@/lib/icon-map";
import { createItem } from "@/actions/items";
import CodeEditor from "./CodeEditor";
import MarkdownEditor from "./MarkdownEditor";
import FileUpload, { type UploadResult } from "./FileUpload";

// All creatable item types — File/Image are Pro-only but enabled during development
const CREATABLE_TYPES = [
  { name: "Snippet" as const, icon: "Code", color: ITEM_TYPE_COLORS.Snippet },
  { name: "Prompt" as const, icon: "Sparkles", color: ITEM_TYPE_COLORS.Prompt },
  { name: "Command" as const, icon: "Terminal", color: ITEM_TYPE_COLORS.Command },
  { name: "Note" as const, icon: "StickyNote", color: ITEM_TYPE_COLORS.Note },
  { name: "Link" as const, icon: "Link", color: ITEM_TYPE_COLORS.Link },
  { name: "File" as const, icon: "File", color: ITEM_TYPE_COLORS.File },
  { name: "Image" as const, icon: "Image", color: ITEM_TYPE_COLORS.Image },
] as const;

export type TypeName = (typeof CREATABLE_TYPES)[number]["name"];

const CONTENT_TYPES: TypeName[] = ["Snippet", "Prompt", "Command", "Note"];
const LANGUAGE_TYPES: TypeName[] = ["Snippet", "Command"];
const CODE_TYPES: TypeName[] = ["Snippet", "Command"];
const MARKDOWN_TYPES: TypeName[] = ["Prompt", "Note"];
const FILE_TYPES: TypeName[] = ["File", "Image"];

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

export function NewItemDialogContent({
  open,
  onOpenChange,
  defaultTypeName,
}: NewItemDialogContentProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => ({
    ...DEFAULT_STATE,
    typeName: defaultTypeName ?? DEFAULT_STATE.typeName,
  }));
  const [isSaving, setIsSaving] = useState(false);
  // Tracks uploaded file metadata for File/Image types
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);

  const selectedType = CREATABLE_TYPES.find((t) => t.name === form.typeName)!;
  const showContent = CONTENT_TYPES.includes(form.typeName);
  const showLanguage = LANGUAGE_TYPES.includes(form.typeName);
  const showUrl = form.typeName === "Link";
  const isCodeType = CODE_TYPES.includes(form.typeName);
  const isMarkdownType = MARKDOWN_TYPES.includes(form.typeName);
  const isFileType = FILE_TYPES.includes(form.typeName);
  // File/Image require an uploaded file; Link requires a URL; others just need a title
  const canSave =
    form.title.trim().length > 0 &&
    (!showUrl || form.url.trim().length > 0) &&
    (!isFileType || uploadedFile !== null);

  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value })),
  });

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setForm({ ...DEFAULT_STATE, typeName: defaultTypeName ?? DEFAULT_STATE.typeName });
      setUploadedFile(null);
    }
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
        // Attach R2 file metadata for File/Image types
        fileUrl: uploadedFile?.fileUrl ?? null,
        fileName: uploadedFile?.fileName ?? null,
        fileSize: uploadedFile?.fileSize ?? null,
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
      <DialogContent className="sm:max-w-lg transition-all duration-200">
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Type selector */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
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
                      ? {
                          backgroundColor: type.color + "20",
                          color: type.color,
                          borderColor: type.color + "40",
                        }
                      : undefined
                  }
                >
                  <Icon
                    className="w-4 h-4"
                    style={isSelected ? { color: type.color } : undefined}
                  />
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
              {isCodeType && (
                <CodeEditor
                  value={form.content}
                  language={form.language || undefined}
                  onChange={(val) => setForm((s) => ({ ...s, content: val }))}
                />
              )}
              {isMarkdownType && (
                <MarkdownEditor
                  value={form.content}
                  onChange={(val) => setForm((s) => ({ ...s, content: val }))}
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

          {/* File upload for File/Image types */}
          {isFileType && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {form.typeName === "Image" ? "Image" : "File"}{" "}
                <span className="text-destructive">*</span>
              </label>
              <FileUpload
                typeName={form.typeName as "File" | "Image"}
                value={uploadedFile}
                onChange={setUploadedFile}
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
