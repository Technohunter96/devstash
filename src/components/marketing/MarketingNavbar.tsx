"use client";

import { useState } from "react";
import Link from "next/link";
import { Code, Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmoothScrollLink } from "./SmoothScrollLink";

interface MarketingNavbarProps {
  isAuthenticated: boolean;
}

export function MarketingNavbar({ isAuthenticated }: MarketingNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    // Floats over content (blur + opacity) instead of toggling opaque/transparent on scroll — that
    // transition was invisible anyway since the page background is pure black
    <nav className="fixed inset-x-0 top-0 z-50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Code className="size-5 text-blue-500" />
          DevStash
        </Link>

        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <SmoothScrollLink targetId="features" className="hover:text-foreground">
            Features
          </SmoothScrollLink>
          <SmoothScrollLink targetId="pricing" className="hover:text-foreground">
            Pricing
          </SmoothScrollLink>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link href="/dashboard" className={buttonVariants({ variant: "default" })}>
              Dashboard
            </Link>
          ) : (
            <Link href="/sign-in" className={cn(buttonVariants({ variant: "default" }), "px-6")}>
              Sign In
            </Link>
          )}
        </div>

        <button
          className="flex size-7 cursor-pointer items-center justify-center text-foreground md:hidden"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full right-4 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-lg md:hidden">
          <div className="flex flex-col divide-y divide-border">
            <SmoothScrollLink
              targetId="features"
              onClick={closeMobileMenu}
              className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Features
            </SmoothScrollLink>
            <SmoothScrollLink
              targetId="pricing"
              onClick={closeMobileMenu}
              className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </SmoothScrollLink>
          </div>

          <div className="flex flex-col gap-2 border-t border-border p-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full justify-center")}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/sign-in"
                onClick={closeMobileMenu}
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full justify-center")}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
