"use client";

import { useEffect, useState } from "react";
import { getIsPro } from "@/actions/billing";

// Returns null until loaded, so callers only lock UI once the user is known to be non-Pro
export function useIsPro(): boolean | null {
  const [isPro, setIsPro] = useState<boolean | null>(null);

  useEffect(() => {
    getIsPro().then(setIsPro);
  }, []);

  return isPro;
}
