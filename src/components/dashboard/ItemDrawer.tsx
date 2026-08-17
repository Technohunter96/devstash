"use client";

import { useState, useRef, useEffect } from "react";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { Star, Pin, Copy, Check, Pencil, Trash2, File, Folder, ExternalLink, X, Save, Download, FileIcon, Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ItemDeleteDialog from "./ItemDeleteDialog";
import CodeEditor from "./CodeEditor";
import MarkdownEditor from "./MarkdownEditor";
import FileUpload, { type UploadResult } from "./FileUpload";
import CollectionMultiSelect from "./CollectionMultiSelect";
import CollectionBadge from "./CollectionBadge";
import { cn, formatBytes, extractActionError } from "@/lib/utils";
import { ICON_MAP } from "@/lib/constants/icon-map";
import { CONTENT_TYPES, LANGUAGE_TYPES, CODE_TYPES, MARKDOWN_TYPES, FILE_TYPES } from "@/lib/constants/item-types";
import { updateItem, deleteItem, toggleItemFavorite, toggleItemPin } from "@/actions/items";
import { toast } from "sonner";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerProps {
  isOpen: boolean;
  item: ItemDetail | null;
  isLoading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (item: ItemDetail) => void;
  onItemDeleted: () => void;
}

export default function ItemDrawer({
  isOpen,
  item,
  isLoading,
  error,
  onOpenChange,
  onItemUpdated,
  onItemDeleted,
}: ItemDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {/* data-[side=right]: prefix matches the base class specificity so our width wins */}
      <SheetContent className="data-[side=right]:w-4/5 data-[side=right]:sm:w-1/2 data-[side=right]:lg:w-1/3 data-[side=right]:sm:max-w-none p-0 flex flex-col gap-0">
        {isLoading && <ItemDrawerSkeleton />}
        {!isLoading && error && <ItemDrawerError message={error} />}
        {!isLoading && !error && item && (
          <ItemDrawerBody item={item} onItemUpdated={onItemUpdated} onItemDeleted={onItemDeleted} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium text-muted-foreground mb-2">{children}</h3>;
}

interface EditState {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string; // comma-separated
  collectionIds: string[];
}

function itemToEditState(item: ItemDetail): EditState {
  return {
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    url: item.url ?? "",
    language: item.language ?? "",
    tags: item.tags.map((t) => t.name).join(", "),
    collectionIds: item.collections.map((c) => c.id),
  };
}

function ItemDrawerBody({
  item,
  onItemUpdated,
  onItemDeleted,
}: {
  item: ItemDetail;
  onItemUpdated: (item: ItemDetail) => void;
  onItemDeleted: () => void;
}) {
  const Icon = ICON_MAP[item.itemType.icon] ?? File;
  const copyableContent = item.content ?? item.url;
  const { copied, copy } = useCopyToClipboard();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editState, setEditState] = useState<EditState>(() => itemToEditState(item));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isTogglingPin, setIsTogglingPin] = useState(false);
  // Tracks replacement file in edit mode for File/Image types
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);
  // Fullscreen image preview dialog
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [editState.description, isEditMode]);

  const showContent = CONTENT_TYPES.includes(item.itemType.name);
  const showLanguage = LANGUAGE_TYPES.includes(item.itemType.name);
  const showUrl = item.contentType === "URL";
  const isCodeType = CODE_TYPES.includes(item.itemType.name);
  const isMarkdownType = MARKDOWN_TYPES.includes(item.itemType.name);
  const isFileType = FILE_TYPES.includes(item.itemType.name);
  const isImageType = item.itemType.name === "Image";

  const handleCopy = () => {
    if (copyableContent) copy(copyableContent);
  };

  const handleEdit = () => {
    setEditState(itemToEditState(item));
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tags = editState.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const result = await updateItem(item.id, {
        title: editState.title,
        description: editState.description || null,
        content: editState.content || null,
        url: editState.url || null,
        language: editState.language || null,
        tags,
        collectionIds: editState.collectionIds,
      });

      if (!result.success) {
        toast.error(extractActionError(result.error));
        return;
      }

      toast.success("Item saved");
      setIsEditMode(false);
      onItemUpdated(result.data);
    } catch {
      toast.error("Failed to save item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    setIsTogglingFavorite(true);
    try {
      const result = await toggleItemFavorite(item.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onItemUpdated({ ...item, isFavorite: result.isFavorite });
    } catch {
      toast.error("Failed to update favorite");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleTogglePin = async () => {
    const previousIsPinned = item.isPinned;
    setIsTogglingPin(true);
    // Optimistic update — flip immediately, revert if the request fails
    onItemUpdated({ ...item, isPinned: !previousIsPinned });
    try {
      const result = await toggleItemPin(item.id);
      if (!result.success) {
        onItemUpdated({ ...item, isPinned: previousIsPinned });
        toast.error(result.error);
        return;
      }
      // Re-sync once the write is confirmed — onItemUpdated's router.refresh() fired
      // optimistically above may have already resolved before the DB write landed,
      // so listings need a second refresh guaranteed to happen after the confirmed state
      onItemUpdated({ ...item, isPinned: result.isPinned });
      toast.success(result.isPinned ? "Item pinned" : "Item unpinned");
    } catch {
      onItemUpdated({ ...item, isPinned: previousIsPinned });
      toast.error("Failed to update pin");
    } finally {
      setIsTogglingPin(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteItem(item.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Item deleted");
      onItemDeleted();
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const field = (key: keyof EditState) => ({
    value: editState[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditState((s) => ({ ...s, [key]: e.target.value })),
  });

  return (
    <>
      <SheetHeader className="border-b p-4">
        <div className="flex items-start gap-3 pr-8">
          <div
            className="rounded-md p-2 shrink-0"
            style={{ backgroundColor: item.itemType.color + "20" }}
          >
            <Icon className="w-4 h-4" style={{ color: item.itemType.color }} />
          </div>
          <div className="flex-1 min-w-0">
            {isEditMode ? (
              <input
                className="w-full bg-transparent text-sm font-semibold outline-none border-b border-border focus:border-primary pb-0.5"
                placeholder="Title"
                {...field("title")}
              />
            ) : (
              <SheetTitle className="truncate">{item.title}</SheetTitle>
            )}
            <SheetDescription className="text-xs" style={{ color: item.itemType.color }}>
              {item.itemType.name}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
        {isEditMode ? (
          <>
            <div className="flex items-center gap-1.5">
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !editState.title.trim()}
                className="cursor-pointer"
              >
                <Save />
                {isSaving ? "Saving…" : "Save"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="cursor-pointer"
              >
                <X />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className={cn(
                  "cursor-pointer",
                  item.isFavorite &&
                    "border-yellow-400/40 text-yellow-400 hover:text-yellow-300 dark:bg-yellow-400/10",
                )}
              >
                <Star className={cn(item.isFavorite && "fill-yellow-400 text-yellow-400")} />
                {item.isFavorite ? "Favorited" : "Favorite"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePin}
                disabled={isTogglingPin}
                className={cn(
                  "cursor-pointer",
                  item.isPinned &&
                    "border-blue-400/40 text-blue-400 hover:text-blue-300 dark:bg-blue-400/10",
                )}
              >
                <Pin className={cn(item.isPinned && "fill-blue-400 text-blue-400")} />
                {item.isPinned ? "Pinned" : "Pin"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} disabled={!copyableContent}>
                {copied ? <Check className="text-green-500" /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleEdit} className="cursor-pointer">
                <Pencil />
                Edit
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete item"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 cursor-pointer"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Description */}
        <section>
          <SectionLabel>Description</SectionLabel>
          {isEditMode ? (
            <textarea
              ref={descriptionRef}
              className="w-full bg-transparent text-sm leading-relaxed outline-none border border-border rounded-md p-2 focus:border-primary resize-none overflow-hidden min-h-[36px]"
              placeholder="Description (optional)"
              {...field("description")}
            />
          ) : (
            item.description && (
              <p className="text-sm leading-relaxed">{item.description}</p>
            )
          )}
        </section>

        {/* Content (text types) */}
        {(isEditMode ? showContent : item.contentType === "TEXT" && item.content) && (
          <section>
            <SectionLabel>Content</SectionLabel>
            {isEditMode ? (
              isCodeType ? (
                <CodeEditor
                  value={editState.content}
                  language={editState.language || undefined}
                  onChange={(val) => setEditState((s) => ({ ...s, content: val }))}
                />
              ) : isMarkdownType ? (
                <MarkdownEditor
                  value={editState.content}
                  onChange={(val) => setEditState((s) => ({ ...s, content: val }))}
                />
              ) : null
            ) : (
              isCodeType ? (
                <CodeEditor
                  value={item.content ?? ""}
                  language={item.language ?? undefined}
                  readOnly
                />
              ) : isMarkdownType ? (
                <MarkdownEditor
                  value={item.content ?? ""}
                  readOnly
                />
              ) : null
            )}
          </section>
        )}

        {/* Language (snippet/command only) */}
        {isEditMode && showLanguage && (
          <section>
            <SectionLabel>Language</SectionLabel>
            <input
              className="w-full bg-transparent text-sm outline-none border border-border rounded-md px-2 py-1.5 focus:border-primary"
              placeholder="e.g. typescript, bash"
              {...field("language")}
            />
          </section>
        )}

        {/* URL (link type) */}
        {(isEditMode ? showUrl : item.contentType === "URL" && item.url) && (
          <section>
            <SectionLabel>URL</SectionLabel>
            {isEditMode ? (
              <input
                className="w-full bg-transparent text-sm outline-none border border-border rounded-md px-2 py-1.5 focus:border-primary"
                placeholder="https://…"
                type="url"
                {...field("url")}
              />
            ) : (
              <a
                href={item.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                style={{ borderColor: item.itemType.color + "40" }}
              >
                <div
                  className="rounded p-1.5 shrink-0"
                  style={{ backgroundColor: item.itemType.color + "20" }}
                >
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: item.itemType.color }} />
                </div>
                <span
                  className="text-sm break-all leading-snug group-hover:underline"
                  style={{ color: item.itemType.color }}
                >
                  {item.url}
                </span>
              </a>
            )}
          </section>
        )}

        {/* File/Image preview or info */}
        {isFileType && (
          <section>
            <SectionLabel>{isImageType ? "Image" : "File"}</SectionLabel>
            {isEditMode ? (
              <FileUpload
                typeName={item.itemType.name as "File" | "Image"}
                value={
                  uploadedFile ?? (item.fileUrl
                    ? { fileUrl: item.fileUrl, fileName: item.fileName ?? "file", fileSize: item.fileSize ?? 0 }
                    : null)
                }
                onChange={setUploadedFile}
              />
            ) : item.fileUrl ? (
              isImageType ? (
                // Image preview with click-to-expand and download button
                <div>
                  <div
                    className="overflow-hidden rounded-lg border border-border cursor-pointer"
                    onClick={() => setImagePreviewOpen(true)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      className="w-full object-contain max-h-[400px]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <a
                      href={`/api/files/${item.id}`}
                      download
                      className="inline-flex items-center gap-1.5 mt-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              ) : (
                // File info card with name, size, and download button
                <div className="flex items-center gap-3 rounded-md border border-border p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.fileSize ? formatBytes(item.fileSize) : "Unknown size"}
                    </p>
                  </div>
                  <a
                    href={`/api/files/${item.id}`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">No file attached</p>
            )}
          </section>
        )}

        {/* Tags */}
        <section>
          <SectionLabel>Tags</SectionLabel>
          {isEditMode ? (
            <input
              className="w-full bg-transparent text-sm outline-none border border-border rounded-md px-2 py-1.5 focus:border-primary"
              placeholder="tag1, tag2, tag3"
              {...field("tags")}
            />
          ) : (
            item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )
          )}
        </section>

        {/* Collections */}
        {(isEditMode || item.collections.length > 0) && (
          <section>
            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <Folder className="w-3 h-3" />
                Collections
              </span>
            </SectionLabel>
            {isEditMode ? (
              <CollectionMultiSelect
                selectedIds={editState.collectionIds}
                onChange={(collectionIds) =>
                  setEditState((s) => ({ ...s, collectionIds }))
                }
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {item.collections.map((c) => (
                  <CollectionBadge key={c.id} name={c.name} color={c.color} />
                ))}
              </div>
            )}
          </section>
        )}
        {/* Details — created/updated dates */}
        {!isEditMode && (
          <section>
            <SectionLabel>
              <span className="flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                Details
              </span>
            </SectionLabel>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(item.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(item.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Fullscreen image preview — click image to open, click backdrop to close */}
      {isImageType && item.fileUrl && imagePreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => setImagePreviewOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white cursor-pointer transition-colors"
            onClick={() => setImagePreviewOpen(false)}
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.fileUrl}
            alt={item.title}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <ItemDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemTitle={item.title}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
}

function ItemDrawerSkeleton() {
  return (
    <>
      <div className="border-b p-4">
        <div className="flex items-start gap-3 pr-8">
          <Skeleton className="w-8 h-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-7 w-14" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-14" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </>
  );
}

function ItemDrawerError({ message }: { message: string }) {
  return (
    <>
      <SheetHeader className="border-b p-4">
        <SheetTitle>Error</SheetTitle>
        <SheetDescription>{message}</SheetDescription>
      </SheetHeader>
      <div className="p-4 text-sm text-muted-foreground">
        Please close the drawer and try again.
      </div>
    </>
  );
}