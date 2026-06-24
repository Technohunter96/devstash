// FileUpload — drag-and-drop file upload component with progress, preview, and validation
// Used in NewItemDialog and ItemDrawer edit mode for File/Image item types

"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileIcon, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPLOAD_CONSTRAINTS } from "@/lib/r2";

// File metadata returned after successful upload
export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

interface FileUploadProps {
  typeName: "File" | "Image";
  value: UploadResult | null;
  onChange: (result: UploadResult | null) => void;
}

// Formats bytes into human-readable size (KB/MB)
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  typeName,
  value,
  onChange,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const constraints = UPLOAD_CONSTRAINTS[typeName];
  const maxMB = constraints.maxSize / (1024 * 1024);
  const isImage = typeName === "Image";

  // Client-side validation before uploading
  const validateLocally = useCallback(
    (file: File): string | null => {
      if (file.size > constraints.maxSize) {
        return `File exceeds ${maxMB} MB limit`;
      }
      if (!constraints.mimeTypes.has(file.type)) {
        return `File type "${file.type || "unknown"}" is not allowed`;
      }
      return null;
    },
    [constraints, maxMB]
  );

  // Uploads file to /api/upload and tracks progress via XMLHttpRequest
  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateLocally(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("typeName", typeName);

      try {
        // Use XMLHttpRequest for upload progress tracking
        const result = await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.error || "Upload failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(formData);
        });

        onChange(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [typeName, onChange, validateLocally]
  );

  // --- Drag-and-drop handlers ---
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isUploading) setIsDragging(true);
    },
    [isUploading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [isUploading, uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  // Removes uploaded file and resets state
  const handleRemove = useCallback(() => {
    onChange(null);
    setError(null);
  }, [onChange]);

  // --- Uploaded file preview ---
  if (value) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          {/* Image thumbnail or file icon */}
          {isImage ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value.fileUrl}
                alt={value.fileName}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          {/* File name and size */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(value.fileSize)}
            </p>
          </div>

          {/* Remove button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // --- Drag-and-drop upload zone ---
  return (
    <div>
      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50"
        } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        {isUploading ? (
          // Upload in progress — spinner + progress bar
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Uploading... {progress}%
            </p>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          // Idle state — icon + instructions
          <div className="flex flex-col items-center gap-2">
            {isImage ? (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              Drag & drop or{" "}
              <span className="font-medium text-foreground">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxMB} MB ·{" "}
              {[...constraints.extensions].map((e) => e.slice(1)).join(", ")}
            </p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={constraints.accept}
          onChange={handleFileSelect}
        />
      </div>

      {/* Validation error message */}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}