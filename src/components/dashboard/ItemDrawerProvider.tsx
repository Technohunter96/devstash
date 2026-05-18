"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import ItemDrawer from "./ItemDrawer";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerContextValue {
  open: (itemId: string) => void;
  close: () => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer() {
  const ctx = useContext(ItemDrawerContext);
  if (!ctx) {
    throw new Error("useItemDrawer must be used within ItemDrawerProvider");
  }
  return ctx;
}

interface State {
  isOpen: boolean;
  item: ItemDetail | null;
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: State = {
  isOpen: false,
  item: null,
  isLoading: false,
  error: null,
};

export default function ItemDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>(INITIAL_STATE);
  // Track latest request to ignore stale responses if a newer fetch (or close) overtakes it
  const requestIdRef = useRef(0);

  const open = useCallback(async (itemId: string) => {
    const requestId = ++requestIdRef.current;
    setState({ isOpen: true, item: null, isLoading: true, error: null });

    try {
      const res = await fetch(`/api/items/${itemId}`);
      if (requestId !== requestIdRef.current) return;

      if (!res.ok) {
        setState({
          isOpen: true,
          item: null,
          isLoading: false,
          error: res.status === 404 ? "Item not found" : "Failed to load item",
        });
        return;
      }

      const data = (await res.json()) as { item: ItemDetail };
      if (requestId !== requestIdRef.current) return;

      setState({ isOpen: true, item: data.item, isLoading: false, error: null });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setState({
        isOpen: true,
        item: null,
        isLoading: false,
        error: "Failed to load item",
      });
    }
  }, []);

  const close = useCallback(() => {
    // Invalidate any in-flight fetch so it does not reopen the drawer
    requestIdRef.current++;
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  return (
    <ItemDrawerContext.Provider value={{ open, close }}>
      {children}
      <ItemDrawer
        isOpen={state.isOpen}
        item={state.item}
        isLoading={state.isLoading}
        error={state.error}
        onOpenChange={(o) => {
          if (!o) close();
        }}
      />
    </ItemDrawerContext.Provider>
  );
}