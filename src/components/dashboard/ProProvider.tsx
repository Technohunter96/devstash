"use client";

import { createContext, useContext } from "react";

// isPro comes from the server layout (session), so there is no client fetch or loading flash.
// null = rendered outside the dashboard shell; UI treats that as "unknown", never as locked.
const ProContext = createContext<boolean | null>(null);

export default function ProProvider({
  isPro,
  children,
}: {
  isPro: boolean;
  children: React.ReactNode;
}) {
  return <ProContext.Provider value={isPro}>{children}</ProContext.Provider>;
}

// UI hint only for greying out Pro features — real gating is enforced server-side in each action
export function useIsPro(): boolean | null {
  return useContext(ProContext);
}
