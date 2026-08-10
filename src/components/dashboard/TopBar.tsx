"use client";

import Link from "next/link";
import { Search, Archive, Menu } from "lucide-react";
import NewItemDialog from "./NewItemDialog";
import NewCollectionDialog from "./NewCollectionDialog";
import { useSearch } from "./SearchProvider";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { setOpen } = useSearch();

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-4 shrink-0">
      <div className="flex items-center gap-2 w-48 shrink-0">
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
          <Archive className="size-5 text-primary" />
          <span className="font-semibold text-base tracking-tight">DevStash</span>
        </Link>
      </div>

      <div className="flex-1 flex justify-center">
        {/* Fake search input that opens the command palette on click */}
        <button
          onClick={() => setOpen(true)}
          className="relative w-full max-w-md flex items-center h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-muted-foreground shadow-xs cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <Search className="size-4 mr-2 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none hidden sm:flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 justify-end shrink-0">
        <NewCollectionDialog />
        <NewItemDialog />
      </div>
    </header>
  );
}
