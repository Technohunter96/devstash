import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

// Always shows first/last page plus a window around the current page, collapsing gaps into an ellipsis
function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];
  const left = Math.max(currentPage - 1, 2);
  const right = Math.min(currentPage + 1, totalPages - 1);

  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("ellipsis");

  pages.push(totalPages);
  return pages;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const iconButton = buttonVariants({ variant: "outline", size: "icon-sm" });
  const disabledIconButton = cn(iconButton, "opacity-40 pointer-events-none");

  return (
    <nav className="flex items-center justify-center gap-1.5 pt-2" aria-label="Pagination">
      {hasPrev ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className={iconButton}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Link>
      ) : (
        <span className={disabledIconButton} aria-disabled="true">
          <ChevronLeft />
        </span>
      )}

      {getPageNumbers(currentPage, totalPages).map((page, index) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={`${basePath}?page=${page}`}
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            {page}
          </Link>
        )
      )}

      {hasNext ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className={iconButton}
          aria-label="Next page"
        >
          <ChevronRight />
        </Link>
      ) : (
        <span className={disabledIconButton} aria-disabled="true">
          <ChevronRight />
        </span>
      )}
    </nav>
  );
}