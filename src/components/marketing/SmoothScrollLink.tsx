"use client";

import type { AnchorHTMLAttributes } from "react";
import { smoothScrollToId } from "@/lib/scroll";

interface SmoothScrollLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId: string;
}

// Animated same-page navigation for #anchor links (Features/Pricing) — used in both the navbar and the hero CTA
export function SmoothScrollLink({ targetId, onClick, ...props }: SmoothScrollLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      onClick={(e) => {
        e.preventDefault();
        smoothScrollToId(targetId);
        onClick?.(e);
      }}
      {...props}
    />
  );
}