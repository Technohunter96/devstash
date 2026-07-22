"use client";

import { Download, FileText, FileImage, FileCode, FileArchive, File } from "lucide-react";
import { useItemDrawer } from "./ItemDrawerProvider";

interface FileItem {
  id: string;
  title: string;
  fileName: string | null;
  fileSize: number | null;
  createdAt: Date;
}

// Defined outside render to satisfy react-hooks/static-components rule
function FileTypeIcon({ fileName }: { fileName: string | null }) {
  const ext = fileName?.split(".").pop()?.toLowerCase();

  if (ext && ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) {
    return <FileImage className="w-5 h-5 text-muted-foreground" />;
  }
  if (ext && ["js", "ts", "jsx", "tsx", "py", "go", "rs", "java", "cpp", "c", "html", "css", "json", "xml", "yaml", "yml", "sh", "md"].includes(ext)) {
    return <FileCode className="w-5 h-5 text-muted-foreground" />;
  }
  if (ext && ["zip", "tar", "gz", "rar", "7z"].includes(ext)) {
    return <FileArchive className="w-5 h-5 text-muted-foreground" />;
  }
  if (ext && ["pdf", "doc", "docx", "txt", "csv", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
    return <FileText className="w-5 h-5 text-muted-foreground" />;
  }
  return <File className="w-5 h-5 text-muted-foreground" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FileListItem({ item }: { item: FileItem }) {
  const { open } = useItemDrawer();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => open(item.id)}
    >
      {/* File type icon */}
      <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-muted">
        <FileTypeIcon fileName={item.fileName} />
      </div>

      {/* Title + original filename */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title}</p>
        {item.fileName && (
          <p className="text-xs text-muted-foreground truncate">{item.fileName}</p>
        )}
      </div>

      {/* Size + date — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-6 shrink-0 text-sm text-muted-foreground">
        <span className="w-20 text-right">
          {item.fileSize ? formatBytes(item.fileSize) : "—"}
        </span>
        <span className="w-28 text-right">{formatDate(item.createdAt)}</span>
      </div>

      {/* Download button */}
      <a
        href={`/api/files/${item.id}`}
        download
        aria-label="Download file"
        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        onClick={handleDownload}
      >
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
}