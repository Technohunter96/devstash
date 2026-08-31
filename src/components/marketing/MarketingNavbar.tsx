"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import { cn } from "@/lib/utils";
import { SmoothScrollLink } from "./SmoothScrollLink";

interface MarketingNavbarProps {
  isAuthenticated: boolean;
}

// Gradient pill for the Get Started CTA — sized to match buttonVariants' default h-8, but hand-built
// since the "default" button variant's `[a]:hover:bg-primary/80` would stomp the gradient on hover
const GET_STARTED_CLASSES =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function MarketingNavbar({ isAuthenticated }: MarketingNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    // Static content — same links and buttons on every page (homepage and auth pages alike), no
    // route-based show/hide; floats over content via `fixed` (blur + opacity), not a scroll-reactive style
    <nav className="fixed inset-x-0 top-0 z-50 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Logo textClassName="text-lg font-bold" />
        </Link>

        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <SectionLink id="features" isHome={isHome} className="hover:text-foreground">
            Features
          </SectionLink>
          <SectionLink id="pricing" isHome={isHome} className="hover:text-foreground">
            Pricing
          </SectionLink>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link href="/dashboard" className={buttonVariants({ variant: "default" })}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className={cn(buttonVariants({ variant: "default" }), "px-6")}>
                Sign In
              </Link>
              <Link href="/register" className={GET_STARTED_CLASSES}>
                Get Started
              </Link>
            </>
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
            <SectionLink
              id="features"
              isHome={isHome}
              onClick={closeMobileMenu}
              className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Features
            </SectionLink>
            <SectionLink
              id="pricing"
              isHome={isHome}
              onClick={closeMobileMenu}
              className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </SectionLink>
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
              <>
                <Link
                  href="/sign-in"
                  onClick={closeMobileMenu}
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full justify-center")}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className={cn(GET_STARTED_CLASSES, "w-full")}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

interface SectionLinkProps {
  id: "features" | "pricing";
  isHome: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

// On the homepage, scrolls to the section; anywhere else (e.g. auth pages), links back to the
// homepage anchor instead of silently no-oping on a section that isn't on the current page
function SectionLink({ id, isHome, onClick, className, children }: SectionLinkProps) {
  if (isHome) {
    return (
      <SmoothScrollLink targetId={id} onClick={onClick} className={className}>
        {children}
      </SmoothScrollLink>
    );
  }

  return (
    <Link href={`/#${id}`} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
