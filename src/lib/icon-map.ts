import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link2,
  File,
  Image,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon | undefined> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: Link2,
  File,
  Image,
};

export const ITEM_TYPE_COLORS: Record<string, string> = {
  Snippet: "#3b82f6",
  Prompt:  "#8b5cf6",
  Command: "#f97316",
  Note:    "#fde047",
  Link:    "#10b981",
  File:    "#6b7280",
  Image:   "#ec4899",
};
