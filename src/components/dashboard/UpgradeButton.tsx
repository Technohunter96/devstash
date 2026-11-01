"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useIsPro } from "@/hooks/useIsPro";

// Shown to free users only; null while loading so Pro users never see it flash
export default function UpgradeButton() {
  const isPro = useIsPro();
  if (isPro !== false) return null;

  return (
    <Link
      href="/upgrade"
      aria-label="Upgrade to Pro"
      title="Upgrade to Pro"
      className="flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-md border border-purple-500/50 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-sm font-medium text-foreground hover:from-blue-500/20 hover:to-purple-500/20 transition-colors cursor-pointer"
    >
      <Sparkles className="size-4 text-purple-400" />
      <span className="hidden sm:inline">Upgrade</span>
    </Link>
  );
}