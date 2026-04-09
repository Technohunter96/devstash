"use client";

import { useEffect, useRef } from "react";
import { Search, Plus, Archive, Menu, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-4 shrink-0">
      <div className="flex items-center gap-2 w-48 shrink-0">
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center size-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="size-5" />
        </button>
        <Archive className="size-5 text-primary" />
        <span className="font-semibold text-base tracking-tight">DevStash</span>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input ref={searchRef} placeholder="Search..." className="pl-9 pr-16" />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end shrink-0">
        <Button variant="outline" size="sm">
          <FolderPlus className="size-4" />
          <span className="hidden sm:inline">New Collection</span>
        </Button>
        <Button size="sm">
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Item</span>
        </Button>
      </div>
    </header>
  );
}
