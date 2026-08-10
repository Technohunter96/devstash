import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Flattens a server action error union into a single displayable string
export function extractActionError(error: string | Record<string, string[]>): string {
  return typeof error === "string"
    ? error
    : Object.values(error).flat().join(", ");
}

// Parses a ?page= search param into a valid page number, defaulting to 1 — guards Prisma's skip from going negative
export function parsePage(value: string | undefined): number {
  return Math.max(1, Math.floor(Number(value)) || 1);
}
