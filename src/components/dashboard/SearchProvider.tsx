"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSearchData } from "@/actions/search";
import type { SearchItem, SearchCollection } from "@/lib/db/search";

interface SearchContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  items: SearchItem[];
  collections: SearchCollection[];
  isLoading: boolean;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}

export default function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [collections, setCollections] = useState<SearchCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Track whether we've fetched data yet (lazy — only on first open)
  const hasFetched = useRef(false);

  const openPalette = useCallback((value: boolean) => {
    setOpen(value);
    // Fetch on first open only
    if (value && !hasFetched.current) {
      hasFetched.current = true;
      setIsLoading(true);
      getSearchData()
        .then((data) => {
          setItems(data.items);
          setCollections(data.collections);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openPalette(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openPalette]);

  return (
    <SearchContext.Provider value={{ open, setOpen: openPalette, items, collections, isLoading }}>
      {children}
    </SearchContext.Provider>
  );
}
